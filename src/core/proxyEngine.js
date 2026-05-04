const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const LRU = require('lru-cache');
const crypto = require('crypto');

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

wss.on('connection', (ws, req) => {
  handleWebSocketUpgrade(req, ws._socket, ws._socket.remoteAddress);
});

app.use((req, res, next) => {
  const decodedUrl = decodeUrl(req);
  if (!decodedUrl) return res.status(400).send('Bad Request');
  req.url = decodedUrl;
  next();
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
    http.get(req.url, (upstreamRes) => {
      const headers = rewriteHeaders(upstreamRes.headers);
      res.set(headers);
      upstreamRes.on('data', (chunk) => {
        res.write(chunk);
      });
      upstreamRes.on('end', () => {
        res.end();
        cache.set(cacheKey, {
          headers: res.getHeaders(),
          statusCode: res.statusCode,
          body: res.getContent()
        });
      });
    }).on('error', (err) => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
  }
});

app.post('*', (req, res) => {
  const cacheKey = req.url;
  if (cache.has(cacheKey)) {
    const cachedResponse = cache.get(cacheKey);
    res.set(cachedResponse.headers);
    res.status(cachedResponse.statusCode).send(cachedResponse.body);
  } else {
    const options = {
      method: req.method,
      url: req.url,
      headers: req.headers
    };

    const upstreamReq = http.request(options, (upstreamRes) => {
      const headers = rewriteHeaders(upstreamRes.headers);
      res.set(headers);
      upstreamRes.on('data', (chunk) => {
        res.write(chunk);
      });
      upstreamRes.on('end', () => {
        res.end();
        cache.set(cacheKey, {
          headers: res.getHeaders(),
          statusCode: res.statusCode,
          body: res.getContent()
        });
      });
    });

    upstreamReq.on('error', (err) => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });

    req.on('data', (chunk) => {
      upstreamReq.write(chunk);
    });

    req.on('end', () => {
      upstreamReq.end();
    });
  }
});

server.listen(8080, () => {
  console.log('Proxy server listening on port 8080');
});
module.exports = app;