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
const { QUIC } = require('quic');

const app = express();
const port = 8080;

const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt'),
  allowHTTP2: true,
  quic: {
    maxPacketSize: 65535,
    maxStreams: 100,
  },
};

const httpsServer = https.createServer(options, app);
const quicServer = new QUIC.Server(options.quic, app);

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

function handleWebSocket(req, res, next) {
  if (req.headers['upgrade'] === 'websocket') {
    const websocketUrl = req.url;
    const websocketReq = {
      ...req,
      url: websocketUrl,
    };
    wss.handleUpgrade(req, res, (ws) => {
      wss.emit('connection', ws, websocketReq);
    });
  } else {
    next();
  }
}

app.use(handleEncodedUrl);
app.use(rewriteHeaders);
app.use(cookieScope);
app.use(decompressBody);
app.use(compressBody);
app.use(handleWebSocket);

const proxy = createProxyMiddleware({
  target: 'http://localhost:8081',
  changeOrigin: true,
  pathRewrite: { '^/': '/' },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.headers['content-length'] = req.body.length;
  },
});

app.use(proxy);

httpsServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

quicServer.listen(port, () => {
  console.log(`QUIC server listening on port ${port}`);
});

wss.on('connection', (ws, req) => {
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

process.on('SIGINT', () => {
  httpsServer.close();
  quicServer.close();
  wss.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  httpsServer.close();
  quicServer.close();
  wss.close();
  process.exit(0);
});