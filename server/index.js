const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
const config = require('./lib/config');
const logger = require('./lib/logger');
const proxyEngine = require('./lib/proxyEngine');
const cookieScoping = require('./lib/cookieScoping');
const authMiddleware = require('./middleware/auth');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieScoping);

const httpsOptions = {
  key: fs.readFileSync(config.server.https.key),
  cert: fs.readFileSync(config.server.https.cert),
};

const httpServer = http.createServer(app);
const httpsServer = https.createServer(httpsOptions, app);
const wss = new WebSocket.Server({ server: httpServer });

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', config.server.cors.origin);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/service/:encodedUrl', authMiddleware.authenticate, proxyEngine);

app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).send({ error: 'Internal Server Error' });
});

httpServer.listen(config.server.port, config.server.host, () => {
  logger.info(`HTTP server listening on ${config.server.host}:${config.server.port}`);
});

httpsServer.listen(config.server.https.port, config.server.host, () => {
  logger.info(`HTTPS server listening on ${config.server.host}:${config.server.https.port}`);
});

wss.on('connection', (ws, req) => {
  const targetUrl = req.url.split('?')[0].slice(1);
  const targetOptions = url.parse(targetUrl);
  const targetSocket = https.request(targetOptions, (res) => {
    ws.send(res.headers['sec-websocket-accept']);
    res.pipe(ws);
  });
  ws.pipe(targetSocket);
});

process.on('SIGINT', () => {
  httpServer.close();
  httpsServer.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  httpServer.close();
  httpsServer.close();
  process.exit(0);
});