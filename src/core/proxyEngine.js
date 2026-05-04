const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const LRU = require('lru-cache');
const crypto = require('crypto');
const tls = require('tls');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const cache = new LRU({
  max: 1000,
  maxAge: 1000 * 60 * 60 // 1 hour
});

const rotatingSalt = crypto.randomBytes(16).toString('hex');

function generateEncodedUrl(req) {
  const salt = crypto.randomBytes(16).toString('hex');
  const encodedUrl = Buffer.from(req.url).toString('base64');
  return `/${rotatingSalt}/${salt}/${encodedUrl}`;
}

function decodeUrl(req) {
  const urlParts = req.url.split('/');
  if (urlParts.length !== 4 || urlParts[1] !== rotatingSalt) return null;
  const salt = urlParts[2];
  const encodedUrl = urlParts[3];
  return Buffer.from(encodedUrl, 'base64').toString();
}

function rewriteHeaders(req) {
  const headers = req.headers;
  delete headers['content-security-policy'];
  delete headers['strict-transport-security'];
  delete headers['x-frame-options'];
  return headers;
}

function scrubWebRTCIceCandidates(req) {
  if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
    let data;
    try {
      data = JSON.parse(req.body);
    } catch (e) {
      return req.body;
    }
    if (data && data.candidate) {
      data.candidate = data.candidate.replace(/a=ice-ufrag:.*? /g, 'a=ice-ufrag:XXXX ');
      data.candidate = data.candidate.replace(/a=ice-pwd:.*? /g, 'a=ice-pwd:XXXX ');
    }
    return JSON.stringify(data);
  }
  return req.body;
}

function handleWebSocketUpgrade(req, socket, head) {
  const decodedUrl = decodeUrl(req);
  if (!decodedUrl) return socket.destroy();

  const webSocketUrl = `ws://${decodedUrl}`;
  const options = {
    headers: rewriteHeaders(req)
  };

  const ws = new WebSocket(webSocketUrl, options);

  ws.on('open', () => {
    socket.pipe(ws);
    ws.pipe(socket);
  });

  ws.on('error', (err) => {
    console.error(err);
    socket.destroy();
  });

  socket.on('error', (err) => {
    console.error(err);
    ws.terminate();
  });
}

function handleHttpRequest(req, res) {
  const decodedUrl = decodeUrl(req);
  if (!decodedUrl) return res.status(400).send('Bad Request');

  const options = {
    method: req.method,
    headers: rewriteHeaders(req),
    path: decodedUrl
  };

  const proxyReq = http.request(options, (proxyRes) => {
    const headers = rewriteHeaders(proxyRes.headers);
    res.set(headers);
    res.status(proxyRes.statusCode).on('finish', () => {
      cache.set(req.url, {
        headers: res.getHeaders(),
        statusCode: res.statusCode,
        body: res.body
      });
    });
    proxyRes.on('data', (chunk) => {
      res.write(chunk);
    });
    proxyRes.on('end', () => {
      res.end();
    });
  });

  req.on('data', (chunk) => {
    proxyReq.write(chunk);
  });

  req.on('end', () => {
    proxyReq.end();
  });

  req.on('error', (err) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
  });
}

function handleHttpsRequest(req, res) {
  const decodedUrl = decodeUrl(req);
  if (!decodedUrl) return res.status(400).send('Bad Request');

  const options = {
    method: req.method,
    headers: rewriteHeaders(req),
    path: decodedUrl,
    rejectUnauthorized: false
  };

  const serverName = url.parse(decodedUrl).hostname;
  const tlsOptions = {
    servername: serverName,
    rejectUnauthorized: false
  };

  const tlsSocket = tls.connect(decodedUrl, tlsOptions, () => {
    const proxyReq = http.request(options, (proxyRes) => {
      const headers = rewriteHeaders(proxyRes.headers);
      res.set(headers);
      res.status(proxyRes.statusCode).on('finish', () => {
        cache.set(req.url, {
          headers: res.getHeaders(),
          statusCode: res.statusCode,
          body: res.body
        });
      });
      proxyRes.on('data', (chunk) => {
        res.write(chunk);
      });
      proxyRes.on('end', () => {
        res.end();
      });
    });

    req.on('data', (chunk) => {
      proxyReq.write(chunk);
    });

    req.on('end', () => {
      proxyReq.end();
    });

    req.on('error', (err) => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
  });

  tlsSocket.on('error', (err) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
  });
}

wss.on('connection', (ws, req) => {
  handleWebSocketUpgrade(req, ws._socket, ws._socket.remoteAddress);
});

app.use((req, res, next) => {
  if (req.url.startsWith('/')) {
    handleHttpRequest(req, res);
  } else {
    next();
  }
});

app.use((req, res, next) => {
  req.headers = rewriteHeaders(req);
  req.body = scrubWebRTCIceCandidates(req);
  next();
});

app.get('*', (req, res) => {
  const cacheKey = req.url;
  if (cache.has(cacheKey)) {
    const cachedResponse = cache.get(cacheKey);
    res.set(cachedResponse.headers);
    res.status(cachedResponse.statusCode).send(cachedResponse.body);
  } else {
    handleHttpsRequest(req, res);
  }
});

server.listen(8080, () => {
  console.log('Proxy server listening on port 8080');
});

process.on('SIGINT', () => {
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.close();
  process.exit(0);
});