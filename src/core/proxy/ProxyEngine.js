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

    // Get the URL from the request
    const url = new URL(request.url);

    // Check if the request is for the proxy
    if (url.pathname.startsWith(URL_PREFIX)) {
      // Get the encoded URL
      const encodedUrl = url.pathname.substring(URL_PREFIX.length);

      // Decode the URL
      let decodedUrl;
      switch (DEFAULT_ENCODING) {
        case 'xor_base64':
          decodedUrl = EncodingUtils.decodeXORBase64(encodedUrl);
          break;
        case 'base64':
          decodedUrl = EncodingUtils.decodeBase64(encodedUrl);
          break;
        default:
          throw new Error(`Unsupported encoding: ${DEFAULT_ENCODING}`);
      }

      // Proxy the request
      const proxiedRequest = await this.createProxiedRequest(request, decodedUrl);

      // Pipe the response
      const proxiedResponse = await this.pipeResponse(proxiedRequest);

      // Rewrite the response headers
      await this.rewriteResponseHeaders(response, proxiedResponse);

      // End the response
      response.end(await this.streamToBuffer(proxiedResponse));
    } else {
      // If not a proxy request, proceed with normal handling
      response.writeHead(404);
      response.end('Not Found');
    }
  }

  /**
   * Create a proxied request.
   * @param {object} request - The original request.
   * @param {string} url - The URL to proxy to.
   * @returns {object} The proxied request.
   */
  async createProxiedRequest(request, url) {
    const { URL } = await import('url');
    const { http } = await import('http');

    // Create a new request
    const proxiedRequest = http.request({
      hostname: new URL(url).hostname,
      port: new URL(url).port,
      path: new URL(url).pathname,
      method: request.method,
      headers: request.headers,
    });

    // Pipe the request body
    request.pipe(proxiedRequest);

    return proxiedRequest;
  }

  /**
   * Pipe the response.
   * @param {object} proxiedRequest - The proxied request.
   * @returns {object} The proxied response.
   */
  async pipeResponse(proxiedRequest) {
    return new Promise((resolve, reject) => {
      const proxiedResponse = [];
      proxiedRequest.on('response', (response) => {
        response.on('data', (chunk) => {
          proxiedResponse.push(chunk);
        });
        response.on('end', () => {
          resolve(Buffer.concat(proxiedResponse));
        });
      });
      proxiedRequest.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Rewrite the response headers.
   * @param {object} response - The original response.
   * @param {object} proxiedResponse - The proxied response.
   */
  async rewriteResponseHeaders(response, proxiedResponse) {
    // Get the headers from the proxied response
    const headers = proxiedResponse.headers;

    // Remove headers that should not be proxied
    delete headers['set-cookie'];
    delete headers['content-security-policy'];
    delete headers['strict-transport-security'];
    delete headers['x-frame-options'];

    // Rewrite the headers
    response.writeHead(proxiedResponse.statusCode, headers);
  }

  /**
   * XOR + base64 URL encoding.
   * @param {string} url - The URL to encode.
   * @param {string} salt - The salt to use.
   * @returns {string} The encoded URL.
   */
  xorBase64Encode(url, salt) {
    const encoder = new TextEncoder();
    const urlBuffer = encoder.encode(url);
    const saltBuffer = encoder.encode(salt);

    // XOR the URL with the salt
    const xoredBuffer = Buffer.alloc(urlBuffer.length);
    for (let i = 0; i < urlBuffer.length; i++) {
      xoredBuffer[i] = urlBuffer[i] ^ saltBuffer[i % saltBuffer.length];
    }

    // Base64 encode the XORed buffer
    return Buffer.from(xoredBuffer).toString('base64');
  }

  /**
   * XOR + base64 URL decoding.
   * @param {string} encodedUrl - The encoded URL.
   * @param {string} salt - The salt to use.
   * @returns {string} The decoded URL.
   */
  xorBase64Decode(encodedUrl, salt) {
    const decoder = new TextDecoder();
    const encodedBuffer = Buffer.from(encodedUrl, 'base64');
    const saltBuffer = Buffer.from(salt);

    // XOR the encoded buffer with the salt
    const xoredBuffer = Buffer.alloc(encodedBuffer.length);
    for (let i = 0; i < encodedBuffer.length; i++) {
      xoredBuffer[i] = encodedBuffer[i] ^ saltBuffer[i % saltBuffer.length];
    }

    // Return the decoded URL
    return decoder.decode(xoredBuffer);
  }
}

module.exports = ProxyEngine;