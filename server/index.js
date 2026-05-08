const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
const url = require('url');
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

app.get('/service/:encodedUrl', authMiddleware.authenticate, async (req, res, next) => {
  try {
    const encodedUrl = req.params.encodedUrl;
    const targetUrl = Buffer.from(encodedUrl, 'base64').toString('utf8');
    const response = await proxyEngine(targetUrl);
    Object.keys(response.headers).forEach((header) => {
      if (header === 'content-security-policy' || header === 'strict-transport-security' || header === 'x-frame-options') {
        delete response.headers[header];
      } else if (header === 'location' || header === 'set-cookie') {
        response.headers[header] = response.headers[header].replace('http://', 'https://').replace('https://', '');
      }
    });
    res.writeHead(response.statusCode, response.headers);
    res.end(response.body);
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).send({ error: 'Internal Server Error' });
});

httpServer.listen(config.server.port, config.server.host, () => {
  logger.info(`HTTP server listening on ${config.server.host}:${config.server.port}`);
});

httpsServer.listen(443, config.server.host, () => {
  logger.info(`HTTPS server listening on ${config.server.host}:443`);
});

wss.on('connection', (ws, req) => {
  const targetUrl = url.parse(req.url, true);
  const targetOptions = {
    hostname: targetUrl.hostname,
    port: 443,
    path: targetUrl.path,
    method: 'GET',
    headers: req.headers,
  };
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