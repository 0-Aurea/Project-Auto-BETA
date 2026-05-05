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

    // Handle WebSocket upgrade
    if (request.headers['upgrade'] === 'websocket') {
      await this.handleWebSocketUpgrade(request, response);
      return;
    }

    // Decode the URL
    let decodedUrl;
    try {
      decodedUrl = EncodingUtils.decodeUrl(request.url);
    } catch (error) {
      response.writeHead(400, { 'Content-Type': 'text/plain' });
      response.end('Invalid URL encoding');
      return;
    }

    // Rewrite the request headers
    const rewrittenRequestHeaders = this.rewriteRequestHeaders(request.headers);

    // Proxy the request
    const targetResponse = await this.fetchTargetResponse(decodedUrl, rewrittenRequestHeaders);

    // Rewrite the response headers
    const rewrittenResponseHeaders = this.rewriteResponseHeaders(targetResponse.headers);

    // Send the response
    response.writeHead(targetResponse.status, rewrittenResponseHeaders);
    response.end(await targetResponse.arrayBuffer());
  }

  /**
   * Handle WebSocket upgrade.
   * @param {object} request - The request object.
   * @param {object} response - The response object.
   */
  async handleWebSocketUpgrade(request, response) {
    const { EncodingUtils } = await import('../utils/encodingUtils.js');
    const { URL_PREFIX, DEFAULT_ENCODING } = await import('../config/constants.js');
    const WebSocket = await import('ws');

    // Decode the URL
    let decodedUrl;
    try {
      decodedUrl = EncodingUtils.decodeUrl(request.url);
    } catch (error) {
      response.writeHead(400, { 'Content-Type': 'text/plain' });
      response.end('Invalid URL encoding');
      return;
    }

    // Establish a WebSocket connection to the target
    const targetWebSocket = new WebSocket(decodedUrl);

    // Handle WebSocket messages
    targetWebSocket.on('message', (message) => {
      response.send(message);
    });

    // Handle WebSocket errors
    targetWebSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Handle WebSocket close
    targetWebSocket.on('close', () => {
      response.close();
    });

    // Handle incoming WebSocket messages
    response.on('message', (message) => {
      targetWebSocket.send(message);
    });

    // Handle incoming WebSocket errors
    response.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Handle incoming WebSocket close
    response.on('close', () => {
      targetWebSocket.close();
    });

    // Send the WebSocket upgrade response
    response.writeHead(101, {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
    });
    response.end();
  }

  /**
   * Rewrite the request headers.
   * @param {object} headers - The request headers.
   * @returns {object} The rewritten request headers.
   */
  rewriteRequestHeaders(headers) {
    const rewrittenHeaders = {};

    // Remove sensitive headers
    for (const header in headers) {
      if (header.toLowerCase() !== 'cookie' && header.toLowerCase() !== 'authorization') {
        rewrittenHeaders[header] = headers[header];
      }
    }

    return rewrittenHeaders;
  }

  /**
   * Fetch the target response.
   * @param {string} url - The target URL.
   * @param {object} headers - The request headers.
   * @returns {object} The target response.
   */
  async fetchTargetResponse(url, headers) {
    const axios = await import('axios');

    try {
      const response = await axios.get(url, { headers });
      return response;
    } catch (error) {
      console.error('Error fetching target response:', error);
      throw error;
    }
  }

  /**
   * Rewrite the response headers.
   * @param {object} headers - The response headers.
   * @returns {object} The rewritten response headers.
   */
  rewriteResponseHeaders(headers) {
    const rewrittenHeaders = {};

    // Remove sensitive headers
    for (const header in headers) {
      if (header.toLowerCase() !== 'set-cookie' && header.toLowerCase() !== 'strict-transport-security') {
        rewrittenHeaders[header] = headers[header];
      }
    }

    return rewrittenHeaders;
  }

  /**
   * XOR + base64 URL encoding.
   * @param {string} url - The URL to encode.
   * @param {Buffer} salt - The rotating salt.
   * @returns {string} The encoded URL.
   */
  xorBase64Encode(url, salt) {
    const encoder = new TextEncoder();
    const urlBuffer = encoder.encode(url);
    const encodedBuffer = Buffer.alloc(urlBuffer.length);

    for (let i = 0; i < urlBuffer.length; i++) {
      encodedBuffer[i] = urlBuffer[i] ^ salt[i % salt.length];
    }

    return Buffer.from(encodedBuffer).toString('base64');
  }

  /**
   * XOR + base64 URL decoding.
   * @param {string} encodedUrl - The encoded URL.
   * @param {Buffer} salt - The rotating salt.
   * @returns {string} The decoded URL.
   */
  xorBase64Decode(encodedUrl, salt) {
    const decoder = new TextDecoder();
    const encodedBuffer = Buffer.from(encodedUrl, 'base64');
    const decodedBuffer = Buffer.alloc(encodedBuffer.length);

    for (let i = 0; i < encodedBuffer.length; i++) {
      decodedBuffer[i] = encodedBuffer[i] ^ salt[i % salt.length];
    }

    return decoder.decode(decodedBuffer);
  }
}

export { ProxyEngine };