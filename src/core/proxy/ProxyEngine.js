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

    // Get the current salt
    const salt = EncodingUtils.getSalt();

    // XOR and base64 encode the URL
    const encodedUrl = EncodingUtils.encodeUrl(request.url, salt);

    // Rewrite the request URL
    const rewrittenUrl = `${URL_PREFIX}/${encodedUrl}`;

    // Proxy the request
    const proxiedRequest = {
      ...request,
      url: rewrittenUrl,
    };

    // Forward the request to the target server
    const targetResponse = await this.forwardRequest(proxiedRequest);

    // Rewrite the response headers
    response.writeHead(targetResponse.statusCode, targetResponse.headers);

    // Pipe the response body
    targetResponse.pipe(response);
  }

  /**
   * Forward the request to the target server.
   * @param {object} request - The request object.
   * @returns {object} The response object.
   */
  async forwardRequest(request) {
    const { URL } = await import('url');
    const { http } = await import('http');

    // Parse the target URL
    const targetUrl = new URL(request.url);

    // Create a new request to the target server
    const targetRequest = http.request({
      hostname: targetUrl.hostname,
      port: targetUrl.port,
      path: targetUrl.pathname,
      method: request.method,
      headers: request.headers,
    });

    // Pipe the request body
    request.pipe(targetRequest);

    // Handle the response
    return new Promise((resolve, reject) => {
      targetRequest.on('response', (response) => {
        resolve(response);
      });

      targetRequest.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * XOR and base64 encode a URL.
   * @param {string} url - The URL to encode.
   * @param {Buffer} salt - The salt to use for encoding.
   * @returns {string} The encoded URL.
   */
  async xorBase64EncodeUrl(url, salt) {
    const { EncodingUtils } = await import('../utils/encodingUtils.js');

    // XOR the URL with the salt
    const xorBuffer = EncodingUtils.xorBuffer(Buffer.from(url), salt);

    // Base64 encode the XOR buffer
    const encodedBuffer = Buffer.from(xorBuffer.toString('base64'));

    return encodedBuffer.toString();
  }
}

export default ProxyEngine;