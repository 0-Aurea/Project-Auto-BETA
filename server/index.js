const express = require('express');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const axios = require('axios');
const url = require('url');
const fs = require('fs');
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

const rewriteResponseHeaders = (headers, proxiedHost) => {
  const modifiedHeaders = {};

  Object.keys(headers).forEach((header) => {
    if (header === 'content-security-policy' ||
        header === 'strict-transport-security' ||
        header === 'x-frame-options') {
      return;
    }

    if (header === 'set-cookie') {
      const cookies = headers['set-cookie'];
      const scopedCookies = cookies.map((cookie) => {
        return cookie.replace(/path=\//, `path=/; domain=${proxiedHost}`);
      });
      modifiedHeaders['set-cookie'] = scopedCookies;
    } else if (header === 'location') {
      const location = headers[header];
      const parsedLocation = url.parse(location);
      if (parsedLocation.host) {
        modifiedHeaders[header] = location.replace(parsedLocation.host, proxiedHost);
      } else {
        modifiedHeaders[header] = location;
      }
    } else {
      modifiedHeaders[header] = headers[header];
    }
  });

  modifiedHeaders['access-control-allow-origin'] = '*';
  modifiedHeaders['access-control-allow-headers'] = 'Origin, X-Requested-With, Content-Type, Accept';

  return modifiedHeaders;
};

const rewriteResponseBody = (body, proxiedHost) => {
  const htmlRegex = /<html>.*<\/html>/gs;
  const htmlMatch = body.match(htmlRegex);

  if (htmlMatch) {
    const rewrittenHtml = htmlMatch[0].replace(/href="\//g, `href="http://${proxiedHost}/`);
    return body.replace(htmlMatch[0], rewrittenHtml);
  }

  return body.replace(/url\(([^)]+)\)/g, (match, urlMatch) => {
    if (urlMatch.startsWith('http')) {
      return match;
    }
    return `url(http://${proxiedHost}/${urlMatch})`;
  });
};

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

    const proxiedHost = req.headers['x-nexus-proxied-host'];
    const modifiedResponseHeaders = rewriteResponseHeaders(response.headers, proxiedHost);
    let modifiedResponseBody = response.data;

    if (response.data) {
      modifiedResponseBody = rewriteResponseBody(response.data, proxiedHost);
    }

    res.status(response.status).headers(modifiedResponseHeaders).send(modifiedResponseBody);
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

https.createServer({
  key: fs.readFileSync(config.server.https.key),
  cert: fs.readFileSync(config.server.https.cert),
}, app).listen(443, () => {
  logger.info('HTTPS server listening on port 443');
});

app.use((req, res) => {
  if (req.protocol === 'https') {
    res.redirect(`http://${req.headers.host}${req.url}`);
  } else {
    res.status(400).send({ error: 'Bad Request' });
  }
});

const httpsRedirectServer = http.createServer((req, res) => {
  res.redirect(`https://${req.headers.host}${req.url}`);
});

httpsRedirectServer.listen(80, () => {
  logger.info('HTTP redirect server listening on port 80');
});
```