import WebSocket from 'ws';
import Logger from '../../shared/logger/logger';
import type TestService from './test.service';

const logger = new Logger('Server');

interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
}

/**
 * WebSocket server for testing rules with progress (`ws://host:<wsport>/test`).
 * Message: `{ "rule": "<yaml>", "options": { ... } }`
 */
export function listenTestWebSocket(port: number, testService: TestService): WebSocket.Server {
  const wss = new WebSocket.Server({ port, path: '/test' });

  wss.on('connection', (ws: ExtWebSocket) => {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.rule) {
          // TODO: validate options with TestRuleOptionsSchema
          testService.testRule(data.rule, data.options, ws);
        }
      } catch (error) {
        logger.error('Failed to test rule with error:', error);
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
