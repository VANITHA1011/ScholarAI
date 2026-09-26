const http = require('http');
const net = require('net');

const server = http.createServer((req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: 5173,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: '127.0.0.1:5173' }
  };
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy error connecting to 5173: ' + err.message);
  });
  req.pipe(proxyReq);
});

server.on('upgrade', (req, clientSocket, head) => {
  const serverSocket = net.connect(5173, '127.0.0.1', () => {
    clientSocket.write('HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n');
    serverSocket.write(head);
    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });
  serverSocket.on('error', () => clientSocket.destroy());
});

server.listen(5174, '0.0.0.0', () => {
  console.log('Bridge active: http://localhost:5174 -> http://localhost:5173');
});
