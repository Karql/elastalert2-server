import WebSocket from 'ws';

interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
}

export function listen(port: number): WebSocket.Server {
  let wss = new WebSocket.Server({ port, path: '/test' });

  wss.on('connection', (ws: ExtWebSocket) => {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });
  });

  // Keepalive in case clients lose connection during a long rule test.
  // If client doesn't respond in 10s this will close the socket and 
  // therefore stop the elastalert test from continuing to run detached.
  setInterval(() => {
    wss.clients.forEach(ws => {
      let extWs = <ExtWebSocket>ws;

      if (extWs.isAlive === false) {return ws.terminate();
      }
      extWs.isAlive = false;
      extWs.ping(() => {});
    });
  }, 10000);

  return wss;
}