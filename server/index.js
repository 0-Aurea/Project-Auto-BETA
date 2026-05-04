const express = require('express');
const https = require('https');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const config = require('./lib/config');
const logger = require('./lib/logger');
const cookieParser = require('cookie-parser');
const cookieScoping = require('./lib/cookieScoping');
const { URL } = require('url');
const BrotliDecompress = require('brotli-decompress');
const zlib = require('zlib');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const server = https.createServer({
  key: fs.readFileSync(config.server.https.key),
  cert: fs.readFileSync(config.server.https.cert),
}, app);

const wss = new WebSocket.Server({ server });

let connections = {};

wss.on('connection', (ws, req) => {
  try {
    const { hostname: proxiedHost } = req.headers['x-nexus-proxied-host'];
    if (!proxiedHost) {
      ws.close(1000, 'Bad Request');
      return;
    }

    connections[proxiedHost] = ws;

    ws.on('message', (message) => {
      logger.info(`Received message from ${proxiedHost}: ${message}`);
    });

    ws.on('close', () => {
      delete connections[proxiedHost];
    });

    ws.on('error', (error) => {
      logger.error(`Error occurred for ${proxiedHost}: ${error}`);
    });
  } catch (error) {
    logger.error('Error occurred during WebSocket connection:', error);
    ws.close(1000, 'Internal Server Error');
  }
});

app.use(cookieScoping);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const handleProxyRequest = async (req, res) => {
  try {
    const { hostname: proxiedHost } = req.headers['x-nexus-proxied-host'];
    if (!proxiedHost) {
      return res.status(400).send({ error: 'Bad Request' });
    }

    const targetHost = req.headers['x-nexus-target-host'];
    const targetPort = req.headers['x-nexus-target-port'];

    if (!targetHost || !targetPort) {
      return res.status(400).send({ error: 'Bad Request' });
    }

    const targetUrl = `http://${targetHost}:${targetPort}${req.url}`;

    const targetReq = http.request(targetUrl, (targetRes) => {
      const encoding = targetRes.headers['content-encoding'];
      let decompressedResponse;

      if (encoding === 'br') {
        decompressedResponse = new BrotliDecompress();
      } else if (encoding === 'gzip') {
        decompressedResponse = zlib.createGunzip();
      }

      const responseHeaders = { ...targetRes.headers };

      // Remove hop-by-hop headers
      ['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'transfer-encoding', 'upgrade'].forEach((header) => {
        delete responseHeaders[header];
      });

      // Strip CSP, HSTS, X-Frame-Options
      delete responseHeaders['content-security-policy'];
      delete responseHeaders['strict-transport-security'];
      delete responseHeaders['x-frame-options'];

      res.writeHead(targetRes.statusCode, responseHeaders);

      if (decompressedResponse) {
        targetRes.pipe(decompressedResponse).pipe(res);
      } else {
        targetRes.pipe(res);
      }

      targetRes.on('end', () => {
        res.end();
      });
    });

    targetReq.on('error', (error) => {
      logger.error('Error occurred during target request:', error);
      res.status(500).send({ error: 'Internal Server Error' });
    });

    req.pipe(targetReq);
  } catch (error) {
    logger.error('Error occurred during proxy request:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

app.all('*', handleProxyRequest);

server.listen(config.server.port, config.server.host, () => {
  logger.info(`Server listening on ${config.server.host}:${config.server.port}`);
});

process.on('SIGINT', () => {
  logger.info('Server shutting down...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.info('Server shutting down...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
  process.exit(1);
});