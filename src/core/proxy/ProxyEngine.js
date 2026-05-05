class ProxyEngine {
  /**
   * WebRTC ICE candidate scrubbing to prevent IP leaks.
   */
  async scrubWebRTCIceCandidates(request, response) {
    // Check if the request is a WebRTC ICE candidate
    if (request.headers['content-type'] === 'application/candidate') {
      // Parse the ICE candidate
      const candidate = await this.parseICECandidate(request);

      // Scrub the ICE candidate to remove IP information
      const scrubbedCandidate = this.scrubICECandidate(candidate);

      // Rewrite the ICE candidate
      response.writeHead(200, {
        'Content-Type': 'application/candidate',
      });
      response.end(scrubbedCandidate);
    } else {
      // If not a WebRTC ICE candidate, proceed with normal proxying
      await this.proxyRequest(request, response);
    }
  }

  /**
   * Parse the WebRTC ICE candidate.
   * @param {object} request - The request object.
   * @returns {object} The parsed ICE candidate.
   */
  async parseICECandidate(request) {
    const candidateBuffer = await this.streamToBuffer(request);
    const candidate = candidateBuffer.toString();

    // Parse the candidate string into an object
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
    // Remove IP information
    candidate.ip = '';

    // Reconstruct the candidate string
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
    const { URL_PREFIX, DEFAULT_ENCODING } = await import('../config/constants.js');

    const url = new URL(request.url);
    const encoding = request.headers['x-encoding'] || DEFAULT_ENCODING;

    // Handle WebSocket upgrade
    if (request.headers['upgrade'] === 'websocket') {
      await this.handleWebSocketUpgrade(request, response, encoding);
    } else {
      // Proxy the request
      const proxiedRequest = await this.createProxiedRequest(request, encoding);
      const proxiedResponse = await this.forwardRequest(proxiedRequest);

      // Rewrite the response headers
      response.writeHead(proxiedResponse.statusCode, proxiedResponse.headers);
      response.end(await this.streamToBuffer(proxiedResponse));
    }
  }

  /**
   * Handle WebSocket upgrade.
   * @param {object} request - The request object.
   * @param {object} response - The response object.
   * @param {string} encoding - The encoding to use.
   */
  async handleWebSocketUpgrade(request, response, encoding) {
    const { WebSocket } = await import('ws');
    const wss = new WebSocket.Server({ noServer: true });

    wss.on('connection', (ws) => {
      // Handle WebSocket connection
      ws.on('message', (message) => {
        // Forward the message to the proxied WebSocket
        ws.send(message);
      });

      ws.on('close', () => {
        // Handle WebSocket close
      });
    });

    // Handle WebSocket upgrade request
    response.writeHead(101, {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
    });
    response.end();

    // Create a new WebSocket connection to the proxied server
    const proxiedWebSocket = new WebSocket(`ws://${request.headers['host']}${request.url}`);

    // Forward messages between the client and proxied WebSocket
    request.on('data', (data) => {
      proxiedWebSocket.send(data);
    });

    proxiedWebSocket.on('message', (message) => {
      response.write(message);
    });
  }

  /**
   * Create a proxied request.
   * @param {object} request - The request object.
   * @param {string} encoding - The encoding to use.
   * @returns {object} The proxied request.
   */
  async createProxiedRequest(request, encoding) {
    const { EncodingUtils } = await import('../utils/encodingUtils.js');
    const { URL_PREFIX } = await import('../config/constants.js');

    const url = new URL(request.url);
    const proxiedUrl = `${URL_PREFIX}/${EncodingUtils.encode(url.href, encoding)}`;

    const proxiedRequest = {
      method: request.method,
      headers: request.headers,
      url: proxiedUrl,
    };

    return proxiedRequest;
  }

  /**
   * Forward a request.
   * @param {object} request - The request object.
   * @returns {object} The response object.
   */
  async forwardRequest(request) {
    const { http } = await import('http');

    return new Promise((resolve, reject) => {
      const req = http.request(request, (res) => {
        resolve(res);
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.end();
    });
  }
}

module.exports = ProxyEngine;