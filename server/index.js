const express = require('express');
const http = require('http');
const https = require('https');
const url = require('url');
const config = require('./lib/config');
const logger = require('./lib/logger');
const cookieParser = require('cookie-parser');
const { authenticate } = require('./middleware/auth');

const app = express();

app.use(cookieParser());
app.use(express.json());

const server = http.createServer(app);
const httpsServer = https.createServer({
  key: fs.readFileSync(config.server.https.key),
  cert: fs.readFileSync(config.server.https.cert),
}, app);

app.use(async (req, res, next) => {
  try {
    await authenticate(req, res, next);
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

app.get('/service/:encodedUrl', async (req, res) => {
  const { encodedUrl } = req.params;
  const targetUrl = Buffer.from(encodedUrl, 'base64').toString('utf8');
  const parsedUrl = url.parse(targetUrl);

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.path,
    method: req.method,
    headers: req.headers,
  };

  const targetReq = http.request(options, (targetRes) => {
    res.writeHead(targetRes.statusCode, targetRes.headers);
    targetRes.pipe(res);
  });

  req.pipe(targetReq);

  targetReq.on('error', (error) => {
    logger.error('Target request error:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  });
});

app.use((req, res) => {
  res.status(404).send({ error: 'Not Found' });
});

server.listen(config.server.port, config.server.host, () => {
  logger.info(`Server listening on ${config.server.host}:${config.server.port}`);
});

httpsServer.listen(443, () => {
  logger.info('HTTPS server listening on port 443');
});

process.on('SIGINT', () => {
  server.close();
  httpsServer.close();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
  process.exit(1);
});