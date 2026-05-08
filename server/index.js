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

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    const modifiedResponse = {
      ...response,
      data: response.data,
    };

    Object.keys(response.headers).forEach((header) => {
      if (header === 'content-security-policy' || header === 'strict-transport-security' || header === 'x-frame-options') {
        delete modifiedResponse.headers[header];
      } else if (header === 'location') {
        modifiedResponse.headers[header] = modifiedResponse.headers[header].replace('http:', '').replace('https:', '');
      } else if (header === 'set-cookie') {
        modifiedResponse.headers[header] = modifiedResponse.headers[header].map((cookie) => cookie.replace('Path=/', `Path=/; Domain=${req.headers.host}`));
      }
    });

    res.set(modifiedResponse.headers);
    res.status(response.status);
    res.send(response.data);
  } catch (error) {
    logger.error('Proxy error:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

app.use(cookieScoping);

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws, req) => {
  try {
    const targetUrl = req.url.split('?url=')[1];
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
      ws.close();
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      wsTarget.close();
    });

    ws.on('close', () => {
      wsTarget.close();
    });
  } catch (error) {
    logger.error('WebSocket error:', error);
  }
});

const startServer = async () => {
  try {
    const port = config.server.port;
    const host = config.server.host;

    const httpServer = http.createServer(app);
    httpServer.listen(port, host, () => {
      logger.info(`Server listening on ${host}:${port}`);
    });

    if (config.server.https) {
      const httpsOptions = {
        key: fs.readFileSync(config.server.https.key),
        cert: fs.readFileSync(config.server.https.cert),
      };

      const httpsServer = https.createServer(httpsOptions, app);
      httpsServer.listen(config.server.https.port || 8443, () => {
        logger.info(`HTTPS server listening on ${host}:8443`);
      });

      httpsServer.on('upgrade', (req, socket, head) => {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req);
        });
      });
    } else {
      httpServer.on('upgrade', (req, socket, head) => {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req);
        });
      });
    }
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();