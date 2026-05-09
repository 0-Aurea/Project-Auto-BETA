const express = require('express');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const url = require('url');
const axios = require('axios');
const tls = require('tls');
const config = require('./lib/config');
const logger = require('./lib/logger');
const proxyEngine = require('./lib/proxyEngine');
const authMiddleware = require('./middleware/auth');
const cookieScoping = require('./lib/cookieScoping');
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authMiddleware.authenticate);
app.use(cookieScoping);

const httpServer = http.createServer(app);
let httpsServer;

if (config.server.https.enabled) {
  httpsServer = https.createServer({
    key: config.server.https.key,
    cert: config.server.https.cert,
  }, app);
}

const wss = new WebSocket.Server({ server: httpServer });

app.get('/service/:encodedUrl', async (req, res) => {
  try {
    const encodedUrl = req.params.encodedUrl;
    const targetUrl = Buffer.from(encodedUrl, 'base64').toString('utf8');
    const parsedTargetUrl = url.parse(targetUrl);

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: req.headers,
      data: req.body,
      responseType: 'arraybuffer',
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const rewrittenResponse = {
      ...response,
      headers: {
        ...response.headers,
        'content-security-policy': '',
        'strict-transport-security': '',
        'x-frame-options': '',
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'Origin, X-Requested-With, Content-Type, Accept',
      },
    };

    if (response.headers['set-cookie']) {
      rewrittenResponse.headers['set-cookie'] = response.headers['set-cookie'].map((cookie) => {
        return cookie.replace(/Secure;/, '');
      });
    }

    if (response.headers.location) {
      rewrittenResponse.headers.location = url.resolve(targetUrl, response.headers.location);
    }

    res.status(response.status).set(rewrittenResponse.headers).send(Buffer.from(response.data));
  } catch (error) {
    logger.error('Proxy error:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

app.use((req, res) => {
  res.status(404).send({ error: 'Not Found' });
});

httpServer.listen(config.server.port, config.server.host, () => {
  logger.info(`HTTP server listening on ${config.server.host}:${config.server.port}`);
});

if (config.server.https.enabled) {
  httpsServer.listen(config.server.https.port || config.server.port, config.server.host, () => {
    logger.info(`HTTPS server listening on ${config.server.host}:${config.server.https.port || config.server.port}`);
  });

  httpsServer.on('connection', (socket) => {
    socket.on('data', (chunk) => {
      const req = chunk.toString();
      if (req.startsWith('CONNECT')) {
        const [, targetHost, targetPort] = req.split(' ');
        const targetSocket = tls.connect(targetPort, targetHost, () => {
          socket.write(`HTTP/1.1 200 Connection Established\r\n\r\n`);
        });

        socket.on('data', (chunk) => {
          targetSocket.write(chunk);
        });

        targetSocket.on('data', (chunk) => {
          socket.write(chunk);
        });

        targetSocket.on('error', (error) => {
          logger.error('Target socket error:', error);
          socket.destroy();
          targetSocket.destroy();
        });

        socket.on('error', (error) => {
          logger.error('Socket error:', error);
          socket.destroy();
          targetSocket.destroy();
        });

        socket.on('close', () => {
          targetSocket.destroy();
        });

        targetSocket.on('close', () => {
          socket.destroy();
        });
      } else {
        const parsedUrl = url.parse(`https://${req.headers.host}${req.url}`);
        axios({
          method: req.method,
          url: `https://${parsedUrl.host}${parsedUrl.path}`,
          headers: req.headers,
          data: req,
          responseType: 'stream',
        })
        .then(response => {
          response.data.pipe(socket);
        })
        .catch(error => {
          logger.error('Proxy error:', error);
          socket.destroy();
        });
      }
    });
  });
}

wss.on('connection', (ws, req) => {
  const targetUrl = req.url;
  const parsedTargetUrl = url.parse(targetUrl);

  const wsTarget = new WebSocket(`ws://${parsedTargetUrl.host}${parsedTargetUrl.path}`);

  ws.on('message', (message) => {
    wsTarget.send(message);
  });

  wsTarget.on('message', (message) => {
    ws.send(message);
  });

  wsTarget.on('error', (error) => {
    logger.error('WebSocket target error:', error);
    ws.terminate();
    wsTarget.terminate();
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
    ws.terminate();
    wsTarget.terminate();
  });

  ws.on('close', () => {
    wsTarget.terminate();
  });

  wsTarget.on('close', () => {
    ws.terminate();
  });
});