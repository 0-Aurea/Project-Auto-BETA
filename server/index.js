const express = require('express');
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const url = require('url');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { encodeUrl, decodeUrl: decodeUrlUtil } = require('./utils/encoding');
const zlib = require('zlib');
const brotli = require('iltorb');
const config = require('./lib/config');
const logger = require('./lib/logger');
const TLSHandler = require('./lib/TLSHandler');
const authMiddleware = require('./middleware/auth');
const { URL } = require('url');

const app = express();
const serverConfig = config.server;
const port = serverConfig.port;

const tlsHandler = new TLSHandler({
  key: fs.readFileSync(serverConfig.https.key),
  cert: fs.readFileSync(serverConfig.https.cert),
  allowHTTP2: serverConfig.https.allowHTTP2,
  tls: {
    requestCert: false,
    rejectUnauthorized: false,
  },
});

const httpsServer = https.createServer(tlsHandler.options, app);
const wss = new WebSocket.Server({ server: httpsServer });

let rotatingSalt = Math.random().toString(36).substr(2, 10);

app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

function rewriteHeaders(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cache-Control', 'no-cache');
  res.header('Pragma', 'no-cache');
  res.header('Expires', 0);
  res.header('Content-Security-Policy', "default-src 'self'; script-src 'self' https://cdn.example.com; object-src 'none'");
  res.header('X-Frame-Options', 'DENY');
  res.header('X-Content-Type-Options', 'nosniff');
  next();
}

function cookieScope(req, res, next) {
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    const scopedCookies = cookies.map((cookie) => {
      const [key, value] = cookie.trim().split('=');
      return `${key}=${value}; Domain=${req.headers.host}; Path=/; Secure; HttpOnly`;
    });
    res.header('Set-Cookie', scopedCookies);
  }
  next();
}

function handleEncodedUrl(req, res, next) {
  const encodedUrl = req.path.substring(1);
  try {
    const decodedUrl = decodeUrlUtil(encodedUrl, rotatingSalt);
    req.url = decodedUrl;
    req.path = decodedUrl;
    next();
  } catch (error) {
    logger.error('Error decoding URL:', error);
    res.status(400).send('Invalid encoded URL');
  }
}

function decompressBody(req, res, next) {
  if (req.headers['content-encoding']) {
    if (req.headers['content-encoding'].includes('gzip')) {
      zlib.unzip(req.body, (err, buffer) => {
        if (err) {
          logger.error('Error decompressing body:', err);
          next(err);
        } else {
          req.body = buffer;
          req.headers['content-length'] = req.body.length;
          delete req.headers['content-encoding'];
          next();
        }
      });
    } else if (req.headers['content-encoding'].includes('br')) {
      brotli.decompress(req.body, (err, buffer) => {
        if (err) {
          logger.error('Error decompressing body:', err);
          next(err);
        } else {
          req.body = buffer;
          req.headers['content-length'] = req.body.length;
          delete req.headers['content-encoding'];
          next();
        }
      });
    }
  } else {
    next();
  }
}

function handleWebSocketUpgrade(req, res, next) {
  if (req.headers['upgrade'] === 'websocket') {
    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    next();
  }
}

function handleProxiedRequest(req, res, next) {
  const proxiedRequest = {
    ...req,
    url: req.url,
    headers: req.headers,
    method: req.method,
    body: req.body,
  };

  const parsedUrl = new URL(proxiedRequest.url);
  const protocol = parsedUrl.protocol;
  const host = parsedUrl.host;

  const options = {
    target: `${protocol}//${host}`,
    changeOrigin: true,
    pathRewrite: { '^/': '' },
    onProxyReq: (proxyReq) => {
      proxyReq.headers['content-length'] = proxyReq.body.length;
    },
    onProxyRes: (proxyRes) => {
      res.header('Content-Security-Policy', proxyRes.headers['content-security-policy']);
      res.header('X-Frame-Options', proxyRes.headers['x-frame-options']);
      res.header('X-Content-Type-Options', proxyRes.headers['x-content-type-options']);
    },
  };

  const proxy = createProxyMiddleware(options);
  proxy(proxiedRequest, res, next);
}

app.use(handleEncodedUrl);
app.use(rewriteHeaders);
app.use(cookieScope);
app.use(decompressBody);
app.use(handleWebSocketUpgrade);

app.use((req, res, next) => {
  handleProxiedRequest(req, res, next);
});

httpsServer.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});

wss.on('connection', (ws, req) => {
  logger.info('WebSocket connection established');

  ws.on('message', (message) => {
    logger.info(`Received WebSocket message: ${message}`);
  });

  ws.on('close', () => {
    logger.info('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });
});