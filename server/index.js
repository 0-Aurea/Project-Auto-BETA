const express = require('express');
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const url = require('url');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 8080;

const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
};

const httpsServer = https.createServer(options, app);

const wss = new WebSocket.Server({ server: httpsServer });

let rotatingSalt = Math.random().toString(36).substr(2, 10);

function generateEncodedUrl(url) {
  const encodedUrl = Buffer.from(url).toString('base64');
  return `${rotatingSalt}/${encodedUrl}`;
}

function decodeUrl(encodedUrl) {
  const [salt, encoded] = encodedUrl.split('/');
  if (salt !== rotatingSalt) {
    throw new Error('Invalid salt');
  }
  return Buffer.from(encoded, 'base64').toString();
}

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use('/proxy', createProxyMiddleware({
  target: 'https://example.com',
  changeOrigin: true,
  pathRewrite: { '^/proxy': '' },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.headers['x-forwarded-for'] = req.ip;
  }
}));

app.get('/.well-known/keybase.txt', (req, res) => {
  res.send('https://example.com/.well-known/keybase.txt');
});

wss.on('connection', (ws, req) => {
  const { hostname, pathname } = url.parse(req.url, true);
  const target = `https://${hostname}${pathname}`;

  const wsTarget = new WebSocket(target);

  ws.on('message', (message) => {
    wsTarget.send(message);
  });

  wsTarget.on('message', (message) => {
    ws.send(message);
  });

  ws.on('close', () => {
    wsTarget.close();
  });

  wsTarget.on('close', () => {
    ws.close();
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  wsTarget.on('error', (error) => {
    console.error('WebSocket target error:', error);
  });
});

httpsServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

setInterval(() => {
  rotatingSalt = Math.random().toString(36).substr(2, 10);
}, 60000);