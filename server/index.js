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

const app = express();
const serverConfig = config.server;
const port = serverConfig.port;

const options = {
  key: fs.readFileSync(serverConfig.https.key),
  cert: fs.readFileSync(serverConfig.https.cert),
  allowHTTP2: serverConfig.https.allowHTTP2,
};

const httpsServer = https.createServer(options, app);

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
  next();
}

function cookieScope(req, res, next) {
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    const scopedCookies = cookies.map((cookie) => {
      const [key, value] = cookie.trim().split('=');
      return `${key}=${value}; Domain=${req.headers.host}; Path=/`;
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
    } else {
      next();
    }
  } else {
    next();
  }
}

function compressBody(req, res, next) {
  const encoding = req.query.encoding;
  if (encoding === 'gzip') {
    zlib.gzip(req.body, (err, buffer) => {
      if (err) {
        next(err);
      } else {
        res.set("Content-Encoding", "gzip");
        res.set("Content-Length", buffer.length);
        res.send(buffer);
      }
    });
  } else if (encoding === 'br') {
    brotli.compress(req.body, (err, buffer) => {
      if (err) {
        next(err);
      } else {
        res.set("Content-Encoding", "br");
        res.set("Content-Length", buffer.length);
        res.send(buffer);
      }
    });
  } else {
    next();
  }
}

app.use(rewriteHeaders);
app.use(cookieScope);

app.use((req, res, next) => {
  handleEncodedUrl(req, res, () => {
    decompressBody(req, res, next);
  });
});

const proxy = createProxyMiddleware({
  target: 'http://localhost:8081',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.headers['Content-Type'] = req.headers['content-type'];
  },
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.headers['Content-Type'] = req.headers['content-type'];
  },
});

app.use(proxy);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Internal Server Error');
});

httpsServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('Error occurred', error);
  });
});