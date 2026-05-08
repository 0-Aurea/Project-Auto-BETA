const express = require('express');
const http = require('http');
const https = require('https');
const url = require('url');
const config = require('./lib/config');
const logger = require('./lib/logger');
const cookieParser = require('cookie-parser');
const cors = require('cors');

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

    const options = {
      method: req.method,
      headers: req.headers,
      url: targetUrl,
      https: {
        rejectUnauthorized: false,
      },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      const headers = { ...proxyRes.headers };
      delete headers['set-cookie'];
      delete headers['content-security-policy'];
      delete headers['strict-transport-security'];
      delete headers['x-frame-options'];

      res.writeHead(proxyRes.statusCode, headers);

      proxyRes.on('data', (chunk) => {
        res.write(chunk);
      });

      proxyRes.on('end', () => {
        res.end();
      });
    });

    req.pipe(proxyReq);

    proxyReq.on('error', (error) => {
      logger.error('Proxy request error:', error);
      res.status(500).send({ error: 'Internal Server Error' });
    });
  } catch (error) {
    logger.error('Error handling proxy request:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

app.get('/service/*', handleProxyRequest);

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