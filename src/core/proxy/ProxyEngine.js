class ProxyEngine {
  /**
   * WebRTC ICE candidate scrubbing to prevent IP leaks.
   */
  async scrubWebRTCIceCandidates(request, response) {
    if (request.headers['content-type'] === 'application/candidate') {
      try {
        const candidateBuffer = await this.streamToBuffer(request);
        const candidate = candidateBuffer.toString();
        const candidateObject = this.parseICECandidate(candidate);
        if (candidateObject) {
          const scrubbedCandidate = this.scrubICECandidate(candidateObject);
          response.writeHead(200, {
            'Content-Type': 'application/candidate',
          });
          response.end(scrubbedCandidate);
          return;
        }
      } catch (error) {
        console.error('Error scrubbing WebRTC ICE candidate:', error);
      }
    }
    response.writeHead(400, {
      'Content-Type': 'text/plain',
    });
    response.end('Bad Request');
  }

  /**
   * Parse the WebRTC ICE candidate.
   * @param {string} candidate - The ICE candidate string.
   * @returns {object} The parsed ICE candidate.
   */
  parseICECandidate(candidate) {
    const candidateObject = {};
    const candidateLines = candidate.split('\r\n');
    for (const line of candidateLines) {
      if (line.startsWith('candidate:')) {
        const [, candidateInfo] = line.split(':');
        const parts = candidateInfo.split(' ');
        if (parts.length < 12) continue;
        const [
          foundation,
          component,
          protocol,
          priority,
          ip,
          port,
          ,
          ,
          ,
          ,
          ,
        ] = parts;
        candidateObject.foundation = foundation;
        candidateObject.component = component;
        candidateObject.protocol = protocol;
        candidateObject.priority = priority;
        candidateObject.ip = ip;
        candidateObject.port = port;
      }
    }
    return candidateObject;
  }

  /**
   * Scrub the WebRTC ICE candidate to remove IP information.
   * @param {object} candidate - The ICE candidate object.
   * @returns {string} The scrubbed ICE candidate string.
   */
  scrubICECandidate(candidate) {
    if (!candidate) return '';
    candidate.ip = '';
    const scrubbedCandidateLines = [];
    scrubbedCandidateLines.push(`candidate:${candidate.foundation} ${candidate.component} ${candidate.protocol} ${candidate.priority} 0 0 typ host`);
    scrubbedCandidateLines.push(`end-line`);
    return scrubbedCandidateLines.join('\r\n');
  }

  /**
   * Stream the request to a buffer.
   * @param {object} request - The request object.
   * @returns {Buffer} The request buffer.
   */
  async streamToBuffer(request) {
    const buffers = [];
    for await (const chunk of request) {
      buffers.push(chunk);
    }
    return Buffer.concat(buffers);
  }

  /**
   * Proxy the request.
   * @param {object} request - The request object.
   * @param {object} response - The response object.
   */
  async proxyRequest(request, response) {
    try {
      const { EncodingUtils } = require('../utils/encodingUtils');
      const { URL_PREFIX, DEFAULT_ENCODING, API_SERVICE_URL } = require('../config/constants');
      const { http, https } = require('http');
      const { URL } = require('url');
      const { WebSocket } = require('ws');

      const targetUrl = new URL(request.url, 'http://example.com');
      if (!targetUrl.protocol) throw new Error('Invalid target URL');

      const encodedUrl = EncodingUtils.encodeUrl(targetUrl.href, EncodingUtils.getSalt());
      const proxiedRequest = {
        method: request.method,
        headers: request.headers,
        url: `${API_SERVICE_URL}${encodedUrl}`,
      };

      let targetProtocol = targetUrl.protocol;
      if (targetProtocol === 'https:') {
        targetProtocol = 'http:'; // Use HTTP for proxied requests
      }

      const options = {
        method: proxiedRequest.method,
        headers: proxiedRequest.headers,
        hostname: targetUrl.hostname,
        port: targetUrl.port,
        path: targetUrl.pathname + targetUrl.search,
      };

      let targetResponse;
      let targetRequest;

      if (targetProtocol === 'http:') {
        targetRequest = http.request(options, (res) => {
          targetResponse = res;
          response.writeHead(res.statusCode, res.headers);
          res.on('data', (chunk) => {
            response.write(chunk);
          });
          res.on('end', () => {
            response.end();
          });
        });
      } else {
        options.rejectUnauthorized = false;
        targetRequest = https.request(options, (res) => {
          targetResponse = res;
          response.writeHead(res.statusCode, res.headers);
          res.on('data', (chunk) => {
            response.write(chunk);
          });
          res.on('end', () => {
            response.end();
          });
        });
      }

      targetRequest.on('error', (error) => {
        console.error('Error with target request:', error);
        response.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        response.end('Internal Server Error');
      });

      request.on('data', (chunk) => {
        targetRequest.write(chunk);
      });

      request.on('end', () => {
        targetRequest.end();
      });

      if (request.upgrade) {
        const webSocket = new WebSocket(targetUrl.href);
        webSocket.on('open', () => {
          request.socket.on('data', (data) => {
            webSocket.send(data);
          });
          webSocket.on('message', (data) => {
            request.socket.write(data);
          });
        });
      }
    } catch (error) {
      console.error('Error with proxy request:', error);
      response.writeHead(500, {
        'Content-Type': 'text/plain',
      });
      response.end('Internal Server Error');
    }
  }

  /**
   * Handle HTTPS CONNECT tunnel.
   * @param {object} request - The request object.
   * @param {object} response - The response object.
   */
  async handleHttpsConnect(request, response) {
    try {
      const targetUrl = new URL(request.url, 'http://example.com');
      if (!targetUrl.protocol) throw new Error('Invalid target URL');

      const targetHost = targetUrl.hostname;
      const targetPort = targetUrl.port || 443;

      response.writeHead(200, {
        'Content-Type': 'text/plain',
      });
      response.end();

      const socket = require('net').createConnection(targetPort, targetHost, () => {
        request.socket.write(`HTTP/1.1 200 Connection established\r\n\r\n`);
      });

      request.socket.on('data', (chunk) => {
        socket.write(chunk);
      });

      socket.on('data', (chunk) => {
        request.socket.write(chunk);
      });

      socket.on('end', () => {
        request.socket.end();
      });

      request.socket.on('end', () => {
        socket.end();
      });
    } catch (error) {
      console.error('Error with HTTPS CONNECT:', error);
      response.writeHead(500, {
        'Content-Type': 'text/plain',
      });
      response.end('Internal Server Error');
    }
  }
}

module.exports = ProxyEngine;