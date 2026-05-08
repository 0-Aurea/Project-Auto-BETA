class ProxyEngine {
  /**
   * WebRTC ICE candidate scrubbing to prevent IP leaks.
   */
  async scrubWebRTCIceCandidates(request, response) {
    if (request.headers['content-type'] === 'application/candidate') {
      const candidateBuffer = await this.streamToBuffer(request);
      const candidate = candidateBuffer.toString();
      const candidateObject = this.parseICECandidate(candidate);
      const scrubbedCandidate = this.scrubICECandidate(candidateObject);
      response.writeHead(200, {
        'Content-Type': 'application/candidate',
      });
      response.end(scrubbedCandidate);
    } else {
      await this.proxyRequest(request, response);
    }
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
        const [foundation, component, protocol, priority, ip, port, , , , ,] = candidateInfo.split(' ');
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
    const { EncodingUtils } = await import('../utils/encodingUtils.js');
    const { URL_PREFIX, DEFAULT_ENCODING, API_SERVICE_URL } = await import('../config/constants.js');
    const { http } = await import('http');
    const { URL } = await import('url');

    const targetUrl = new URL(request.url);
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
   * Rewrite the response headers.
   * @param {object} headers - The response headers.
   * @returns {object} The rewritten response headers.
   */
  rewriteResponseHeaders(headers) {
    const rewrittenHeaders = { ...headers };

    delete rewrittenHeaders['content-security-policy'];
    delete rewrittenHeaders['strict-transport-security'];
    delete rewrittenHeaders['x-frame-options'];

    if (rewrittenHeaders['set-cookie']) {
      rewrittenHeaders['set-cookie'] = rewrittenHeaders['set-cookie'].map((cookie) => {
        return cookie.replace(/Domain=[^;]*/, '');
      });
    }

    if (rewrittenHeaders['location']) {
      rewrittenHeaders['location'] = rewrittenHeaders['location'].replace(/^https?:\/\//, '');
    }

    return rewrittenHeaders;
  }

  /**
   * Handle WebSocket requests.
   * @param {object} request - The request object.
   * @param {object} response - The response object.
   */
  async handleWebSocketRequest(request, response) {
    const { WebSocket } = await import('ws');
    const { URL } = await import('url');

    const targetUrl = new URL(request.url);
    const webSocketUrl = `ws://${targetUrl.host}${targetUrl.pathname}`;

    const webSocket = new WebSocket(webSocketUrl);

    request.on('data', (data) => {
      webSocket.send(data);
    });

    webSocket.on('message', (message) => {
      response.write(message);
    });

    webSocket.on('error', (error) => {
      console.error(error);
    });

    webSocket.on('close', () => {
      response.end();
    });
  }
}