const express = require('express');
const axios = require('axios');
const url = require('url');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const config = require('./config');
const logger = require('./logger');
const { Transform } = require('stream');

const tls = require('tls');
const crypto = require('crypto');

const proxyEngine = async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).send({ error: 'Bad Request' });
    }

    const parsedTargetUrl = url.parse(targetUrl);
    if (!parsedTargetUrl.protocol || !parsedTargetUrl.host) {
      return res.status(400).send({ error: 'Invalid target URL' });
    }

    if (req.headers['upgrade'] === 'websocket') {
      return handleWebSocketProxy(req, res, targetUrl);
    }

    if (req.method === 'CONNECT') {
      return handleHttpsConnect(req, res, targetUrl);
    }

    const headers = req.headers;
    const options = {
      method: req.method,
      url: targetUrl,
      headers: {
        ...headers,
        'User-Agent': 'NEXUS Proxy',
      },
      responseType: 'stream',
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    };

    if (req.body) {
      options.data = req.body;
    }

    const response = await axios(options);

    const rewriteHeaders = (headers, targetHost) => {
      const rewrittenHeaders = { ...headers };
      delete rewrittenHeaders['content-security-policy'];
      delete rewrittenHeaders['strict-transport-security'];
      delete rewrittenHeaders['x-frame-options'];

      if (rewrittenHeaders['set-cookie']) {
        rewrittenHeaders['set-cookie'] = rewrittenHeaders['set-cookie'].map((cookie) => {
          return cookie.replace(/Domain=[^;]*/, `Domain=${targetHost}`);
        });
      }

      if (rewrittenHeaders['location']) {
        const locationUrl = url.parse(rewrittenHeaders['location']);
        if (locationUrl.host) {
          rewrittenHeaders['location'] = `${req.protocol}://${req.get('host')}${locationUrl.pathname}${locationUrl.search}`;
        } else {
          rewrittenHeaders['location'] = `${req.protocol}://${req.get('host')}${locationUrl.pathname}${locationUrl.search}`;
        }
      }

      // Add CORS headers
      rewrittenHeaders['access-control-allow-origin'] = config.server.cors.origin;
      rewrittenHeaders['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      rewrittenHeaders['access-control-allow-headers'] = 'Content-Type, Authorization';

      return rewrittenHeaders;
    };

    const rewriteResponse = (response, targetHost) => {
      const rewrittenResponse = { ...response };
      if (rewrittenResponse.data) {
        rewrittenResponse.data = rewrittenResponse.data.pipe(
          new Transform({
            transform(chunk, encoding, callback) {
              const rewrittenChunk = chunk.toString().replace(/https?:\/\/[^/]*/g, (match) => {
                return `${req.protocol}://${req.get('host')}`;
              });
              callback(null, rewrittenChunk);
            },
          }),
        );
      }
      return rewrittenResponse;
    };

    const rewrittenResponse = rewriteResponse(response, parsedTargetUrl.host);
    res.writeHead(rewrittenResponse.status, rewriteHeaders(rewrittenResponse.headers, parsedTargetUrl.host));

    rewrittenResponse.data.pipe(res);

  } catch (error) {
    logger.error(`Proxy error: ${error.message}`);
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

const handleWebSocketProxy = (req, res, targetUrl) => {
  const webSocketTarget = new url.URL(targetUrl);
  const webSocketOptions = {
    ...req.headers,
    'User-Agent': 'NEXUS Proxy',
  };

  delete webSocketOptions['upgrade'];
  delete webSocketOptions['connection'];

  const wsProxy = new WebSocket(webSocketTarget.href, webSocketOptions);

  wsProxy.on('open', () => {
    const webSocketResponse = {
      status: 101,
      headers: {
        'Upgrade': 'WebSocket',
        'Connection': 'Upgrade',
      },
    };
    res.writeHead(101, webSocketResponse.headers);
    res.socket.setKeepAlive(true);

    const pipeWebSocketData = (wsProxy, socket) => {
      wsProxy.on('message', (message) => {
        socket.write(message);
      });

      wsProxy.on('close', () => {
        socket.end();
      });

      wsProxy.on('error', (error) => {
        logger.error(`WebSocket proxy error: ${error.message}`);
        socket.end();
      });

      socket.on('message', (message) => {
        wsProxy.send(message);
      });

      socket.on('close', () => {
        wsProxy.close();
      });

      socket.on('error', (error) => {
        logger.error(`WebSocket socket error: ${error.message}`);
        wsProxy.close();
      });
    };

    pipeWebSocketData(wsProxy, res.socket);
  });

  wsProxy.on('error', (error) => {
    logger.error(`WebSocket proxy error: ${error.message}`);
    res.status(500).send({ error: 'Internal Server Error' });
  });
};

const handleHttpsConnect = (req, res, targetUrl) => {
  const targetHost = url.parse(targetUrl).host;
  const options = {
    host: targetHost,
    port: 443,
    rejectUnauthorized: false,
  };

  const tlsSocket = tls.connect(options, () => {
    res.writeHead(200, { 'Connection': 'keep-alive' });
    res.socket.setKeepAlive(true);

    req.socket.on('data', (chunk) => {
      tlsSocket.write(chunk);
    });

    req.socket.on('close', () => {
      tlsSocket.end();
    });

    req.socket.on('error', (error) => {
      logger.error(`HTTPS CONNECT socket error: ${error.message}`);
      tlsSocket.end();
    });

    tlsSocket.on('data', (chunk) => {
      res.socket.write(chunk);
    });

    tlsSocket.on('close', () => {
      req.socket.end();
    });

    tlsSocket.on('error', (error) => {
      logger.error(`HTTPS CONNECT TLS socket error: ${error.message}`);
      req.socket.end();
    });
  });

  tlsSocket.on('error', (error) => {
    logger.error(`HTTPS CONNECT TLS socket error: ${error.message}`);
    res.status(500).send({ error: 'Internal Server Error' });
  });
};

module.exports = proxyEngine;