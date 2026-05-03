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

app.use(helmet());
app.use(cookieParser());
app.use(rewriteHeaders);
app.use(cookieScope);

app.use((req, res, next) => {
  if (req.path.startsWith('/proxy/')) {
    handleEncodedUrl(req, res, next);
  } else {
    next();
  }
});

app.use('/proxy', createProxyMiddleware({
  target: 'https://example.com',
  changeOrigin: true,
  pathRewrite: { '^/proxy': '' },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.headers['x-forwarded-for'] = req.ip;
    delete proxyReq.headers['content-security-policy'];
    delete proxyReq.headers['strict-transport-security'];
    delete proxyReq.headers['x-frame-options'];
  },
  onProxyRes: (proxyRes, req, res) => {
    delete proxyRes.headers['content-security-policy'];
    delete proxyRes.headers['strict-transport-security'];
    delete proxyRes.headers['x-frame-options'];
    const contentEncoding = proxyRes.headers['content-encoding'];
    if (contentEncoding) {
      const buffer = [];
      proxyRes.on('data', (chunk) => {
        buffer.push(chunk);
      });
      proxyRes.on('end', () => {
        const body = Buffer.concat(buffer);
        if (contentEncoding.includes('gzip')) {
          zlib.unzip(body, (err, decompressedBody) => {
            if (err) {
              res.status(500).send('Error decompressing body');
            } else {
              req.body = decompressedBody;
              compressBody(req, res, next);
            }
          });
        } else if (contentEncoding.includes('br')) {
          brotli.decompress(body, (err, decompressedBody) => {
            if (err) {
              res.status(500).send('Error decompressing body');
            } else {
              req.body = decompressedBody;
              compressBody(req, res, next);
            }
          });
        } else {
          req.body = body;
          compressBody(req, res, next);
        }
      });
    } else {
      res.set("Content-Type", proxyRes.headers['content-type']);
      res.set("Content-Length", proxyRes.headers['content-length']);
      proxyRes.pipe(res);
    }
  }
}));

app.get('/.well-known/keybase.txt', (req, res) => {
  res.send('https://example.com/.well-known/keybase.txt');
});

wss.on('connection', (ws, req) => {
  const { hostname, pathname } = url.parse(req.url, true);
  const target = `https://${hostname}${pathname}`;

  const encodedUrl = req.path.substring(1);
  try {
    const decodedUrl = decodeUrlUtil(encodedUrl, rotatingSalt);
    const { hostname: targetHostname, pathname: targetPathname } = url.parse(decodedUrl, true);
    const wsTarget = `wss://${targetHostname}${targetPathname}`;
    const wsProxy = new WebSocket(wsTarget);
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
  } catch (error) {
    ws.close();
  }
});

httpsServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});