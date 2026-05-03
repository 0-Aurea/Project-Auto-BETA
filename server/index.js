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
    brotli.compress(req.body, { mode: 0 }, (err, buffer) => {
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
  const websocketKey = req.headers['sec-websocket-key'];
  if (websocketKey) {
    const websocketAccept = require('crypto').createHash('sha1').update(websocketKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    res.writeHead(101, {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
      'Sec-WebSocket-Accept': websocketAccept,
      'Sec-WebSocket-Protocol': req.headers['sec-websocket-protocol']
    });

    const targetHost = req.headers['x-target-host'];
    const targetPort = req.headers['x-target-port'];

    const targetSocket = new WebSocket(`ws://${targetHost}:${targetPort}`);

    req.on('close', () => {
      targetSocket.close();
    });

    req.on('error', (err) => {
      targetSocket.close();
      next(err);
    });

    targetSocket.on('message', (message) => {
      res.send(message);
    });

    targetSocket.on('close', () => {
      req.destroy();
    });

    targetSocket.on('error', (err) => {
      req.destroy();
      next(err);
    });

    res.on('data', (data) => {
      targetSocket.send(data);
    });
  } else {
    next();
  }
}

function scrubWebRTCIceCandidates(req, res, next) {
  if (req.headers['content-type'] === 'application/json') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const jsonData = JSON.parse(body);
        if (jsonData.type === 'candidate') {
          delete jsonData.candidate;
          jsonData.sdpMLineIndex = 0;
          jsonData.sdpMid = null;
        }
        res.send(JSON.stringify(jsonData));
      } catch (err) {
        next(err);
      }
    });
  } else {
    next();
  }
}

app.use(handleEncodedUrl);
app.use(rewriteHeaders);
app.use(cookieParser());
app.use(decompressBody);

app.use('/websocket', handleWebSocketUpgrade);

app.use(scrubWebRTCIceCandidates);

app.use((req, res, next) => {
  createProxyMiddleware({
    target: req.url,
    changeOrigin: true,
    pathRewrite: { '^/': '' },
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.headers['x-target-host'] = req.headers.host;
      proxyReq.headers['x-target-port'] = req.headers['x-target-port'];
    }
  })(req, res, next);
});

httpsServer.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (err) => {
    console.error('Error occurred', err);
  });
});