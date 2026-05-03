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

const app = express();
const port = 8080;

const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
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
    res.send(req.body);
  }
}

function handleWebSocketUpgrade(req, res, next) {
  if (req.headers['upgrade'] === 'websocket') {
    const websocketKey = req.headers['sec-websocket-key'];
    const websocketAccept = require('crypto').createHash('sha1').update(websocketKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    res.writeHead(101, {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
      'Sec-WebSocket-Accept': websocketAccept
    });
    const websocket = new WebSocket(req.socket, req.headers['sec-websocket-protocol']);
    websocket.on('message', (message) => {
      console.log(`Received message: ${message}`);
    });
    websocket.on('close', () => {
      console.log('WebSocket connection closed');
    });
    websocket.on('error', (error) => {
      console.log(`WebSocket error: ${error}`);
    });
  } else {
    next();
  }
}

function scrubWebRTCICECandidates(req, res, next) {
  if (req.headers['content-type'] === 'application/json') {
    try {
      const payload = JSON.parse(req.body);
      if (payload.type === 'icecandidate') {
        const candidate = payload.candidate;
        if (candidate) {
          const scrubbedCandidate = candidate.replace(/a=ssrc:(\d+)/g, 'a=ssrc:0');
          payload.candidate = scrubbedCandidate;
          req.body = JSON.stringify(payload);
        }
      }
    } catch (error) {
      console.log(`Error parsing JSON: ${error}`);
    }
  }
  next();
}

app.use(rewriteHeaders);
app.use(cookieScope);
app.use(handleEncodedUrl);
app.use(decompressBody);
app.use(scrubWebRTCICECandidates);

app.use((req, res, next) => {
  if (req.url.startsWith('/websocket')) {
    handleWebSocketUpgrade(req, res, next);
  } else {
    next();
  }
});

app.use(createProxyMiddleware({
  target: 'https://example.com',
  changeOrigin: true,
  pathRewrite: { '^/': '' },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.headers['content-length'] = req.body.length;
  },
  onProxyRes: (proxyRes, req, res) => {
    res.set("Content-Length", proxyRes.headers['content-length']);
  }
}));

httpsServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

wss.on('connection', (ws) => {
  console.log('WebSocket connection established');
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
  });
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
  ws.on('error', (error) => {
    console.log(`WebSocket error: ${error}`);
  });
});