const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');
const config = require('./lib/config');
const logger = require('./lib/logger');
const cookieParser = require('cookie-parser');
const cookieScoping = require('./lib/cookieScoping');
const authMiddleware = require('./middleware/auth');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieScoping);
app.use(authMiddleware);

app.get('/service/:encodedUrl', async (req, res) => {
  try {
    const encodedUrl = req.params.encodedUrl;
    const targetUrl = Buffer.from(encodedUrl, 'base64').toString('utf8');
    const parsedTargetUrl = url.parse(targetUrl);

    const options = {
      method: req.method,
      headers: req.headers,
      path: parsedTargetUrl.path,
      host: parsedTargetUrl.host,
    };

    let targetReq;
    if (parsedTargetUrl.protocol === 'https:') {
      targetReq = https.request(options, (targetRes) => {
        res.writeHead(targetRes.statusCode, targetRes.headers);
        targetRes.pipe(res);
      });
    } else {
      targetReq = http.request(options, (targetRes) => {
        res.writeHead(targetRes.statusCode, targetRes.headers);
        targetRes.pipe(res);
      });
    }

    targetReq.on('error', (err) => {
      logger.error(err);
      res.status(500).send({ error: 'Internal Server Error' });
    });

    req.pipe(targetReq);
  } catch (err) {
    logger.error(err);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

const httpServer = http.createServer(app);
const httpsServer = https.createServer({
  key: fs.readFileSync(config.server.https.key),
  cert: fs.readFileSync(config.server.https.cert),
}, app);

httpServer.listen(config.server.port, config.server.host, () => {
  logger.info(`HTTP server listening on ${config.server.host}:${config.server.port}`);
});

if (config.server.https.enabled) {
  httpsServer.listen(config.server.https.port || 443, config.server.host, () => {
    logger.info(`HTTPS server listening on ${config.server.host}:${config.server.https.port || 443}`);
  });
}

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

process.on('uncaughtException', (err) => {
  logger.error(err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error(err);
  process.exit(1);
});