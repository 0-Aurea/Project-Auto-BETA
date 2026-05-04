const express = require('express');
const https = require('https');
const WebSocket = require('ws');
const cookieParser = require('cookie-parser');
const config = require('./lib/config');
const cookieScoping = require('./lib/cookieScoping');
const logger = require('./lib/logger');

const app = express();
const httpsServer = https.createServer({
  key: config.server.https.key,
  cert: config.server.https.cert,
}, app);

const wss = new WebSocket.Server({ server: httpsServer });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(cookieScoping);

app.use((req, res, next) => {
  if (req.headers['x-nexus-proxied-host']) {
    req.headers['host'] = req.headers['x-nexus-proxied-host'];
  }
  next();
});

const handleProxiedRequest = (req, res) => {
  const { hostname: proxiedHost } = req.headers['x-nexus-proxied-host'];
  const { path, query, method, headers } = req;

  const options = {
    hostname: proxiedHost,
    path: `${path}${query}`,
    method,
    headers: { ...headers },
  };

  delete options.headers['x-nexus-proxied-host'];

  const proxiedReq = https.request(options, (proxiedRes) => {
    Object.keys(proxiedRes.headers).forEach((header) => {
      if (header !== 'transfer-encoding') {
        res.set(header, proxiedRes.headers[header]);
      }
    });

    res.statusCode = proxiedRes.statusCode;
    res.statusMessage = proxiedRes.statusMessage;

    proxiedRes.on('data', (chunk) => {
      res.write(chunk);
    });

    proxiedRes.on('end', () => {
      res.end();
    });
  });

  proxiedReq.on('error', (error) => {
    logger.error('Proxied request error:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  });

  req.on('data', (chunk) => {
    proxiedReq.write(chunk);
  });

  req.on('end', () => {
    proxiedReq.end();
  });
};

app.use((req, res) => {
  if (req.url.startsWith('/')) {
    handleProxiedRequest(req, res);
  } else {
    res.status(404).send({ error: 'Not Found' });
  }
});

wss.on('connection', (ws, req) => {
  const { hostname: proxiedHost } = req.headers['x-nexus-proxied-host'];

  if (!proxiedHost) {
    return ws.close(1000, 'Bad Request');
  }

  const wsOptions = {
    hostname: proxiedHost,
    port: 443,
    secure: true,
  };

  const proxiedWs = new WebSocket(`wss://${proxiedHost}`, wsOptions);

  ws.on('message', (message) => {
    proxiedWs.send(message);
  });

  ws.on('close', () => {
    proxiedWs.close();
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
    proxiedWs.close(1000, 'Internal Server Error');
  });

  proxiedWs.on('message', (message) => {
    ws.send(message);
  });

  proxiedWs.on('close', () => {
    ws.close();
  });

  proxiedWs.on('error', (error) => {
    logger.error('Proxied WebSocket error:', error);
    ws.close(1000, 'Internal Server Error');
  });

  // WebRTC ICE candidate scrubbing
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'candidate') {
        const { candidate } = data;
        if (candidate) {
          const scrubbedCandidate = scrubIceCandidate(candidate);
          if (scrubbedCandidate !== candidate) {
            data.candidate = scrubbedCandidate;
            ws.send(JSON.stringify(data));
          }
        }
      }
    } catch (error) {
      logger.error('Error parsing WebSocket message:', error);
    }
  });

  const scrubIceCandidate = (candidate) => {
    const regex = /a=ice-ufrag:([^\s]+)/g;
    const match = candidate.match(regex);
    if (match) {
      return candidate.replace(regex, 'a=ice-ufrag:xxxxxxxx');
    }
    return candidate;
  };
});

httpsServer.listen(config.server.port, config.server.host, () => {
  logger.info(`NEXUS proxy server listening on ${config.server.host}:${config.server.port}`);
});