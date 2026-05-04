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

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let connections = {};

wss.on('connection', (ws, req) => {
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

      if (decompressedResponse) {
        targetRes.pipe(decompressedResponse).pipe(res);
      } else {
        res.writeHead(targetRes.statusCode, targetRes.headers);
        targetRes.pipe(res);
      }

      targetRes.on('end', () => {
        res.end();
      });
    });

    req.pipe(targetReq);

    targetReq.on('error', (error) => {
      logger.error(`Error occurred while proxying request to ${targetUrl}: ${error}`);
      res.status(500).send({ error: 'Internal Server Error' });
    });
  } catch (error) {
    logger.error(`Error occurred while handling proxy request: ${error}`);
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

const handleWebSocketProxyRequest = async (req, res) => {
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

    const targetUrl = `ws://${targetHost}:${targetPort}${req.url}`;

    const targetWs = new WebSocket(targetUrl);

    req.ws = targetWs;

    targetWs.on('open', () => {
      req.pipe(targetWs);
      targetWs.pipe(res);
    });

    targetWs.on('error', (error) => {
      logger.error(`Error occurred while proxying WebSocket request to ${targetUrl}: ${error}`);
      res.status(500).send({ error: 'Internal Server Error' });
    });
  } catch (error) {
    logger.error(`Error occurred while handling WebSocket proxy request: ${error}`);
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

app.all('*', (req, res, next) => {
  if (req.headers['upgrade'] === 'websocket') {
    handleWebSocketProxyRequest(req, res);
  } else {
    handleProxyRequest(req, res);
  }
});

const httpsServer = https.createServer({
  key: fs.readFileSync(config.server.https.key),
  cert: fs.readFileSync(config.server.https.cert),
}, app);

httpsServer.listen(config.server.port, config.server.host, () => {
  logger.info(`Server listening on ${config.server.host}:${config.server.port}`);
});

server.listen(config.server.port + 1, () => {
  logger.info(`Fallback HTTP server listening on ${config.server.host}:${config.server.port + 1}`);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down...');
  httpsServer.close();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down...');
  httpsServer.close();
  server.close();
  process.exit(0);
});