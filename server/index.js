const express = require('express');
const http = require('http');
const https = require('https');
const url = require('url');
const config = require('./lib/config');
const logger = require('./lib/logger');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const axios = require('axios');
const cookieScoping = require('./lib/cookieScoping');

const app = express();

app.use(cookieParser());
app.use(cors({
  origin: config.server.cors.origin,
  credentials: true,
}));

const handleProxyRequest = async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).send({ error: 'Bad Request' });
    }

    const parsedTargetUrl = url.parse(targetUrl);
    if (!parsedTargetUrl.protocol || !parsedTargetUrl.host) {
      return res.status(400).send({ error: 'Invalid target URL' });
    }

    const headers = { ...req.headers };
    delete headers['set-cookie'];
    delete headers['content-security-policy'];
    delete headers['strict-transport-security'];
    delete headers['x-frame-options'];

    const axiosConfig = {
      method: req.method,
      url: targetUrl,
      headers,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    };

    if (req.body) {
      axiosConfig.data = req.body;
    }

    const response = await axios(axiosConfig);

    const responseHeaders = { ...response.headers };
    delete responseHeaders['set-cookie'];

    if (responseHeaders['location']) {
      const absoluteUrl = url.parse(responseHeaders['location']);
      if (absoluteUrl.host) {
        responseHeaders['location'] = url.format({
          protocol: req.protocol,
          host: req.get('host'),
          pathname: absoluteUrl.pathname,
          search: absoluteUrl.search,
        });
      }
    }

    res.writeHead(response.status, responseHeaders);

    res.end(response.data);

    cookieScoping(req, res);
  } catch (error) {
    logger.error('Error handling proxy request:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

const handleWebSocketProxyRequest = async (req, socket, head) => {
  try {
    const targetUrl = req.url;
    if (!targetUrl) {
      return socket.destroy();
    }

    const parsedTargetUrl = url.parse(targetUrl);
    if (!parsedTargetUrl.protocol || !parsedTargetUrl.host) {
      return socket.destroy();
    }

    const targetSocket = await new Promise((resolve, reject) => {
      const options = {
        method: 'CONNECT',
        hostname: parsedTargetUrl.hostname,
        port: parsedTargetUrl.port,
        path: '',
      };

      const targetSocket = https.connect(options, (targetSocket) => {
        resolve(targetSocket);
      });

      targetSocket.on('error', (error) => {
        reject(error);
      });
    });

    socket.on('data', (data) => {
      targetSocket.write(data);
    });

    targetSocket.on('data', (data) => {
      socket.write(data);
    });

    socket.on('end', () => {
      targetSocket.end();
    });

    targetSocket.on('end', () => {
      socket.end();
    });
  } catch (error) {
    logger.error('Error handling WebSocket proxy request:', error);
    socket.destroy();
  }
};

app.get('/service/*', handleProxyRequest);
app.post('/service/*', handleProxyRequest);
app.put('/service/*', handleProxyRequest);
app.delete('/service/*', handleProxyRequest);

app.ws('/service/*', handleWebSocketProxyRequest);

const httpServer = http.createServer(app);
const httpsServer = https.createServer({
  key: config.server.https.key,
  cert: config.server.https.cert,
}, app);

httpServer.listen(config.server.port, () => {
  logger.info(`HTTP server listening on port ${config.server.port}`);
});

httpsServer.listen(443, () => {
  logger.info('HTTPS server listening on port 443');
});

process.on('SIGINT', () => {
  httpServer.close(() => {
    httpsServer.close(() => {
      process.exit(0);
    });
  });
});

process.on('SIGTERM', () => {
  httpServer.close(() => {
    httpsServer.close(() => {
      process.exit(0);
    });
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