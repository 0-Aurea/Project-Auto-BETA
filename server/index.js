const express = require('express');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const axios = require('axios');
const url = require('url');
const fs = require('fs');
const config = require('./lib/config');
const logger = require('./lib/logger');
const cookieParser = require('cookie-parser');
const cookieScoping = require('./lib/cookieScoping');
const proxyEngine = require('./lib/proxyEngine');
const authMiddleware = require('./middleware/auth');

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware.authenticate);

app.get('/service/:encodedUrl', async (req, res) => {
  try {
    const encodedUrl = req.params.encodedUrl;
    const decodedUrl = Buffer.from(encodedUrl, 'base64').toString('utf8');
    const targetUrl = decodedUrl;

    const options = {
      method: req.method,
      headers: req.headers,
      url: targetUrl,
      data: req.body,
    };

    const response = await axios(options);

    // Strip CSP, HSTS, and X-Frame-Options
    response.headers['content-security-policy'] = undefined;
    response.headers['strict-transport-security'] = undefined;
    response.headers['x-frame-options'] = undefined;

    // Rewrite Location header
    if (response.headers.location) {
      const parsedLocation = url.parse(response.headers.location);
      response.headers.location = `${parsedLocation.protocol}://${parsedLocation.host}${parsedLocation.path}`;
    }

    // Rewrite Set-Cookie header
    if (response.headers['set-cookie']) {
      response.headers['set-cookie'] = response.headers['set-cookie'].map((cookie) => cookie.replace('Path=/', `Path=/; Domain=${req.headers.host}`));
    }

    // Rewrite absolute URLs in HTML, JS, and CSS response bodies
    if (response.data && typeof response.data === 'string') {
      response.data = response.data.replace(/https?:\/\/[^/]+/g, (match) => {
        const parsedMatch = url.parse(match);
        return `${parsedMatch.protocol}://${parsedMatch.host}`;
      });
    }

    res.set(response.headers);
    res.status(response.status);
    res.send(response.data);
  } catch (error) {
    logger.error('Proxy error:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

app.use(cookieScoping);

const httpServer = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws, req) => {
  try {
    const targetUrl = req.url.split('?url=')[1];
    if (!targetUrl) {
      return ws.close(1000, 'Bad Request');
    }

    const parsedTargetUrl = url.parse(targetUrl);

    const wsTarget = new WebSocket(parsedTargetUrl.href);

    ws.on('message', (message) => {
      wsTarget.send(message);
    });

    wsTarget.on('message', (message) => {
      ws.send(message);
    });

    wsTarget.on('error', (error) => {
      logger.error('WebSocket target error:', error);
      ws.close(1000, 'Internal Server Error');
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      wsTarget.close(1000, 'Internal Server Error');
    });

    ws.on('close', () => {
      wsTarget.close(1000, 'Client Closed');
    });

    wsTarget.on('close', () => {
      ws.close(1000, 'Target Closed');
    });
  } catch (error) {
    logger.error('WebSocket error:', error);
    ws.close(1000, 'Internal Server Error');
  }
});

httpServer.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

const startServer = async () => {
  try {
    const port = config.server.port;
    const host = config.server.host;

    httpServer.listen(port, host, () => {
      logger.info(`Server listening on ${host}:${port}`);
    });

    if (config.server.https.enabled) {
      const httpsOptions = {
        key: fs.readFileSync(config.server.https.key),
        cert: fs.readFileSync(config.server.https.cert),
      };

      const httpsServer = https.createServer(httpsOptions, app);
      const httpsPort = config.server.https.port || 8443;

      httpsServer.listen(httpsPort, host, () => {
        logger.info(`HTTPS Server listening on ${host}:${httpsPort}`);
      });

      httpsServer.on('upgrade', (req, socket, head) => {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req);
        });
      });
    }
  } catch (error) {
    logger.error('Server error:', error);
    process.exit(1);
  }
};

startServer();