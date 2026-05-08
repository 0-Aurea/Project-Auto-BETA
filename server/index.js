const express = require('express');
const http = require('http');
const https = require('https');
const url = require('url');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const config = require('./lib/config');
const logger = require('./lib/logger');
const cookieScoping = require('./lib/cookieScoping');

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowlist = ['http://localhost:8080', 'http://localhost:8081'];

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const handleProxyRequest = async (req, res) => {
  try {
    const { encodedUrl } = req.params;
    const decodedUrl = Buffer.from(encodedUrl, 'base64').toString('utf8');
    const targetUrl = url.parse(decodedUrl);

    if (!targetUrl.protocol || !targetUrl.host) {
      return res.status(400).send({ error: 'Bad Request' });
    }

    const options = {
      method: req.method,
      headers: req.headers,
      path: targetUrl.path,
      host: targetUrl.host,
    };

    const targetReq = http.request(options, (targetRes) => {
      res.writeHead(targetRes.statusCode, targetRes.headers);

      targetRes.on('data', (chunk) => {
        res.write(chunk);
      });

      targetRes.on('end', () => {
        res.end();
      });
    });

    targetReq.on('error', (error) => {
      logger.error('Proxy error:', error);
      res.status(500).send({ error: 'Internal Server Error' });
    });

    req.on('data', (chunk) => {
      targetReq.write(chunk);
    });

    req.on('end', () => {
      targetReq.end();
    });
  } catch (error) {
    logger.error('Proxy error:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

app.get('/service/:encodedUrl', handleProxyRequest);
app.post('/service/:encodedUrl', handleProxyRequest);

const httpServer = http.createServer(app);
const httpsServer = https.createServer({
  key: fs.readFileSync(config.server.https.key),
  cert: fs.readFileSync(config.server.https.cert),
}, app);

httpServer.listen(config.server.port, () => {
  logger.info(`HTTP server listening on port ${config.server.port}`);
});

httpsServer.listen(config.server.https.port, () => {
  logger.info(`HTTPS server listening on port ${config.server.https.port}`);
});

process.on('SIGINT', () => {
  httpServer.close();
  httpsServer.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  httpServer.close();
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