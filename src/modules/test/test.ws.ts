import WebSocket from 'ws';
import RequestError, { HttpError } from '../../shared/errors/request-error';
import { ValidationError } from '../../shared/errors/validation-error';
import Logger from '../../shared/logger/logger';
import type TestService from './test.service';
import { TestRulePayload } from './test.schemas';

const logger = new Logger('TestWebSocket');
const instance = '/test';

interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
}

/** Sends an error as Problem Details, same as the HTTP API: `{ "event": "error", "data": { "type": ..., "status": ... } }` */
function sendError(ws: WebSocket, error: RequestError) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ event: 'error', data: error.toProblem(instance) }));
  }
}

/**
 * WebSocket server for testing rules with progress (`ws://host:<wsport>/test`).
 * Message: `{ "rule": "<yaml>", "options": { ... } }`, validated like the body of `POST /test`.
 * Progress is sent as `progress` / `result` events, an invalid message or a failed test as an `error` event.
 */
export function listenTestWebSocket(port: number, testService: TestService): WebSocket.Server {
  const wss = new WebSocket.Server({ port, path: '/test' });

  wss.on('connection', (ws: ExtWebSocket) => {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (message) => {
      let data: unknown;

      try {
        data = JSON.parse(message.toString());
      } catch {
        sendError(ws, new HttpError(400, 'The message is not valid JSON.'));
        return;
      }

      const payload = TestRulePayload.safeParse(data);

      if (!payload.success) {
        sendError(ws, new ValidationError('json', payload.error));
        return;
      }

      try {
        await testService.testRule(payload.data.rule, payload.data.options, ws);
      } catch (error) {
        logger.error('Failed to test rule with error:', error);
        sendError(ws, error instanceof RequestError ? error : new HttpError(500, (error as Error).message));
      }
    });
  });

  // Keepalive in case clients lose connection during a long rule test.
  // If client doesn't respond in 10s this will close the socket and
  // therefore stop the elastalert test from continuing to run detached.
  setInterval(() => {
    wss.clients.forEach((ws) => {
      const extWs = <ExtWebSocket>ws;

      if (extWs.isAlive === false) {
        return ws.terminate();
      }
      extWs.isAlive = false;
      extWs.ping(() => {});
    });
  }, 10000);

  return wss;
}
