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
const TLSHandler = require('./lib/TLSHandler');

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

function rewriteHeaders(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cache-Control', 'no-cache');
  res.header('Pragma', 'no-cache');
  res.header('Expires', 0);
  // res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
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
    res.status(400).send('Invalid encoded URL');
  }
}

function decompressBody(req, res, next) {
  if (req.headers['content-encoding']) {
    if (req.headers['content-encoding'].includes('gzip')) {
      zlib.unzip(req.body, (err, buffer) => {
        if (err) {
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

app.use(rewriteHeaders);
app.use(cookieScope);
app.use(handleEncodedUrl);
app.use(decompressBody);

const proxyOptions = {
  target: 'http://localhost:8081',
  changeOrigin: true,
  pathRewrite: { '^/': '' },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.headers['content-encoding'] = req.headers['content-encoding'];
  },
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.headers['content-encoding'] = req.headers['content-encoding'];
  },
};

const proxy = createProxyMiddleware(proxyOptions);

app.use(proxy);

wss.on('connection', (ws, req) => {
  const { hostname, port } = url.parse(req.url, true);
  const target = `${hostname}:${port}`;

  const wsProxy = new WebSocket(target);

  ws.on('message', (message) => {
    wsProxy.send(message);
  });

  wsProxy.on('message', (message) => {
    ws.send(message);
  });

  ws.on('close', () => {
    wsProxy.close();
  });

  wsProxy.on('close', () => {
    ws.close();
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  wsProxy.on('error', (error) => {
    console.error('WebSocket proxy error:', error);
  });
});

httpsServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

process.on('SIGINT', () => {
  httpsServer.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  httpsServer.close();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  httpsServer.close();
  process.exit(1);
});