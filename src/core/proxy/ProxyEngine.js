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
      const { EncodingUtils } = await import('../utils/encodingUtils.js');
      const { URL_PREFIX, DEFAULT_ENCODING, API_SERVICE_URL } = await import('../config/constants.js');
      const { http } = await import('http');
      const { URL } = await import('url');

      const targetUrl = new URL(request.url, 'http://example.com');
      if (!targetUrl.protocol) throw new Error('Invalid target URL');

      const encodedUrl = EncodingUtils.encodeUrl(targetUrl.href, EncodingUtils.getSalt());
      const proxiedRequest = {
        method: request.method,
        headers: request.headers,
        url: `${API_SERVICE_URL}${encodedUrl}`,
      };

      const targetResponse = await this.forwardRequest(proxiedRequest);
      const rewrittenHeaders = this.rewriteResponseHeaders(targetResponse.headers);

      response.writeHead(targetResponse.statusCode, rewrittenHeaders);

      targetResponse.pipe(response);
    } catch (error) {
      console.error('Error proxying request:', error);
      response.writeHead(500, {
        'Content-Type': 'text/plain',
      });
      response.end('Internal Server Error');
    }
  }

  /**
   * Forward the request to the target server.
   * @param {object} request - The request object.
   * @returns {object} The response object.
   */
  async forwardRequest(request) {
    return new Promise((resolve, reject) => {
      const { http } = require('http');
      const options = {
        method: request.method,
        headers: request.headers,
        hostname: 'localhost',
        port: 8080,
        path: request.url,
      };

      const targetRequest = http.request(options, (targetResponse) => {
        resolve(targetResponse);
      });

      targetRequest.on('error', (error) => {
        reject(error);
      });

      targetRequest.end();
    });
  }

  /**
   * Rewrite response headers to remove security headers.
   * @param {object} headers - The response headers.
   * @returns {object} The rewritten response headers.
   */
  rewriteResponseHeaders(headers) {
    const rewrittenHeaders = { ...headers };
    delete rewrittenHeaders['content-security-policy'];
    delete rewrittenHeaders['strict-transport-security'];
    delete rewrittenHeaders['x-frame-options'];
    return rewrittenHeaders;
  }
}

module.exports = ProxyEngine;