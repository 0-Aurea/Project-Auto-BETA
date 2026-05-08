const express = require('express');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const url = require('url');
const querystring = require('querystring');
const fs = require('fs');
const config = require('./lib/config');
const logger = require('./lib/logger');
const cookieParser = require('cookie-parser');
const cookieScoping = require('./middleware/cookieScoping');
const authMiddleware = require('./middleware/auth');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(authMiddleware);
app.use(cookieScoping);

const wss = new WebSocket.Server({ noServer: true });

app.get('/service/:encodedUrl', async (req, res) => {
  try {
    const encodedUrl = req.params.encodedUrl;
    const decodedUrl = Buffer.from(encodedUrl, 'base64').toString('utf8');
    const targetUrl = new url.URL(decodedUrl);

    const options = {
      method: req.method,
      headers: req.headers,
      followRedirect: true,
    };

    const proxyReq = await fetch(decodedUrl, options);

    const responseHeaders = {};
    for (const [key, value] of proxyReq.headers) {
      if (key !== 'set-cookie') {
        responseHeaders[key] = value;
      } else {
        const cookieValue = value;
        const scopedCookieValue = cookieValue.replace(/domain=[^;]*/, '');
        responseHeaders['set-cookie'] = scopedCookieValue;
      }
    }

    if (proxyReq.status === 301 || proxyReq.status === 302) {
      const locationHeader = proxyReq.headers['location'];
      if (locationHeader.startsWith('http')) {
        const absoluteUrl = new url.URL(locationHeader);
        const relativeUrl = `${targetUrl.protocol}://${targetUrl.host}${absoluteUrl.pathname}`;
        responseHeaders['location'] = relativeUrl;
      }
    }

    // Remove security headers
    delete responseHeaders['content-security-policy'];
    delete responseHeaders['strict-transport-security'];
    delete responseHeaders['x-frame-options'];

    res.writeHead(proxyReq.status, responseHeaders);

    const proxyRes = await proxyReq.arrayBuffer();
    res.end(Buffer.from(proxyRes));
  } catch (error) {
    logger.error('Proxy error:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

wss.on('connection', (ws, req) => {
  try {
    const { hostname: proxiedHost } = req.headers['x-nexus-proxied-host'];
    const targetUrl = new url.URL(`ws://${proxiedHost}`);

    const options = {
      method: 'GET',
      headers: req.headers,
    };

    const proxyWs = new WebSocket(targetUrl.href);

    ws.on('message', (message) => {
      proxyWs.send(message);
    });

    ws.on('close', () => {
      proxyWs.close();
    });

    proxyWs.on('message', (message) => {
      ws.send(message);
    });

    proxyWs.on('close', () => {
      ws.close();
    });

    proxyWs.on('error', (error) => {
      logger.error('WebSocket proxy error:', error);
      ws.close();
    });
  } catch (error) {
    logger.error('WebSocket connection error:', error);
    ws.close();
  }
});

const httpsServer = https.createServer({
  key: fs.readFileSync(config.server.https.key),
  cert: fs.readFileSync(config.server.https.cert),
}, app);

httpsServer.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

httpsServer.listen(config.server.port, () => {
  logger.info(`Server listening on ${config.server.host}:${config.server.port}`);
});

process.on('SIGINT', () => {
  httpsServer.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
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