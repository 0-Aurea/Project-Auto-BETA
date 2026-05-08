const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const url = require('url');
const config = require('./lib/config');
const logger = require('./lib/logger');
const cookieScoping = require('./lib/cookieScoping');
const cookieParser = require('cookie-parser');
const authMiddleware = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cookieParser());
app.use(express.json());

app.use('/service', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).send({ error: 'Bad Request' });
    }

    const parsedTargetUrl = url.parse(targetUrl);
    const targetOptions = {
      method: req.method,
      headers: req.headers,
      data: req.body,
    };

    const response = await axios({
      method: targetOptions.method,
      url: targetUrl,
      headers: targetOptions.headers,
      data: targetOptions.data,
    });

    const modifiedResponse = { ...response };
    modifiedResponse.headers = {};

    Object.keys(response.headers).forEach((header) => {
      if (header === 'content-security-policy' ||
          header === 'strict-transport-security' ||
          header === 'x-frame-options') {
        return;
      }

      if (header === 'set-cookie') {
        const cookies = response.headers['set-cookie'];
        const scopedCookies = cookies.map((cookie) => {
          return cookie.replace(/path=\//, `path=/; domain=${req.headers['x-nexus-proxied-host']}`);
        });
        modifiedResponse.headers['set-cookie'] = scopedCookies;
      } else {
        modifiedResponse.headers[header] = response.headers[header];
      }
    });

    if (response.data) {
      const htmlRegex = /<html>.*<\/html>/gs;
      const htmlMatch = response.data.match(htmlRegex);

      if (htmlMatch) {
        const proxiedHost = req.headers['x-nexus-proxied-host'];
        const rewrittenHtml = htmlMatch[0].replace(/href="\//g, `href="http://${proxiedHost}/`);
        modifiedResponse.data = response.data.replace(htmlMatch[0], rewrittenHtml);
      }
    }

    res.status(response.status).headers(modifiedResponse.headers).send(modifiedResponse.data);
  } catch (error) {
    logger.error('Proxy error:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

app.use('/websocket', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send({ error: 'Bad Request' });
  }

  const ws = new WebSocket(targetUrl);

  req.on('close', () => {
    ws.close();
  });

  ws.on('message', (message) => {
    res.send(message);
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });
});

app.use(authMiddleware);

app.use((req, res) => {
  res.status(404).send({ error: 'Not Found' });
});

server.listen(config.server.port, () => {
  logger.info(`Server listening on port ${config.server.port}`);
});

wss.on('connection', (ws, req) => {
  const targetUrl = req.url.split('?url=')[1];
  const targetWsUrl = `ws://${targetUrl}`;

  const targetWs = new WebSocket(targetWsUrl);

  ws.on('message', (message) => {
    targetWs.send(message);
  });

  targetWs.on('message', (message) => {
    ws.send(message);
  });

  targetWs.on('error', (error) => {
    logger.error('Target WebSocket error:', error);
  });

  ws.on('error', (error) => {
    logger.error('Client WebSocket error:', error);
  });

  ws.on('close', () => {
    targetWs.close();
  });

  targetWs.on('close', () => {
    ws.close();
  });
});