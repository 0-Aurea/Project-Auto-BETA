import { EncodingUtils } from '../utils/encodingUtils.js';
import { URL_PREFIX, DEFAULT_ENCODING } from '../config/constants.js';
import { createReadStream, createWriteStream, readFileSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import axios from 'axios';

const pipeline = promisify(require('stream').pipeline);

class ProxyEngine {
  /**
   * Creates a new ProxyEngine instance.
   */
  constructor() {
    this.cache = new Map();
  }

  /**
   * Handles an incoming request and returns a response.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   * @returns {Promise<void>} A promise that resolves when the response is sent.
   */
  async handleRequest(req, res) {
    const { url: reqUrl, headers, method } = req;

    // Check if the request is for a proxied resource
    if (!reqUrl.startsWith(URL_PREFIX)) {
      return this.handleDirectRequest(req, res);
    }

    // Decode the URL
    const decodedUrl = this.decodeUrl(reqUrl);

    // Check if the decoded URL is valid
    if (!decodedUrl) {
      return this.handleError(req, res, 400, 'Invalid URL');
    }

    // Get the cached response if available
    const cachedResponse = await this.getCachedResponse(decodedUrl);
    if (cachedResponse) {
      return this.sendResponse(req, res, cachedResponse);
    }

    try {
      // Forward the request to the target server
      const targetResponse = await this.forwardRequest(decodedUrl, req);

      // Cache the response
      await this.cacheResponse(decodedUrl, targetResponse);

      // Send the response
      return this.sendResponse(req, res, targetResponse);
    } catch (error) {
      return this.handleError(req, res, 500, 'Internal Server Error');
    }
  }

  /**
   * Decodes a URL encoded with XOR + base64.
   * @param {string} encodedUrl - The encoded URL.
   * @returns {string} The decoded URL or null if invalid.
   */
  decodeUrl(encodedUrl) {
    const encodedPath = encodedUrl.substring(URL_PREFIX.length);
    const decodedPath = EncodingUtils.decode(encodedPath);

    // Validate the decoded URL
    if (!decodedPath || !decodedPath.startsWith('http')) {
      return null;
    }

    return decodedPath;
  }

  /**
   * Forwards a request to the target server.
   * @param {string} targetUrl - The URL of the target server.
   * @param {object} req - The incoming request object.
   * @returns {Promise<object>} A promise that resolves with the target server's response.
   */
  async forwardRequest(targetUrl, req) {
    const { method, headers, body } = req;

    // Create a new request to the target server
    const targetReq = axios({
      method,
      url: targetUrl,
      headers: this.rewriteHeaders(headers),
      data: body,
    });

    // Handle the response from the target server
    const targetResponse = await targetReq;

    // Rewrite the response headers
    const rewrittenHeaders = this.rewriteHeaders(targetResponse.headers);

    // Return the rewritten response
    return {
      status: targetResponse.status,
      headers: rewrittenHeaders,
      data: targetResponse.data,
    };
  }

  /**
   * Rewrites the headers of a request or response.
   * @param {object} headers - The headers to rewrite.
   * @returns {object} The rewritten headers.
   */
  rewriteHeaders(headers) {
    const rewrittenHeaders = {};

    // Remove sensitive headers
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() !== 'cookie' && key.toLowerCase() !== 'authorization') {
        rewrittenHeaders[key] = value;
      }
    }

    // Add or modify headers as needed
    rewrittenHeaders['Access-Control-Allow-Origin'] = '*';
    rewrittenHeaders['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept';

    return rewrittenHeaders;
  }

  /**
   * Caches a response.
   * @param {string} url - The URL of the response.
   * @param {object} response - The response to cache.
   * @returns {Promise<void>} A promise that resolves when the response is cached.
   */
  async cacheResponse(url, response) {
    const { status, headers, data } = response;

    // Create a cache entry
    const cacheEntry = {
      status,
      headers,
      data,
      ttl: Date.now() + 60 * 60 * 1000, // 1 hour
    };

    // Store the cache entry
    this.cache.set(url, cacheEntry);
  }

  /**
   * Gets a cached response.
   * @param {string} url - The URL of the response.
   * @returns {Promise<object|null>} A promise that resolves with the cached response or null if not found.
   */
  async getCachedResponse(url) {
    const cacheEntry = this.cache.get(url);

    // Check if the cache entry is valid
    if (cacheEntry && cacheEntry.ttl > Date.now()) {
      return cacheEntry;
    }

    return null;
  }

  /**
   * Sends a response to the client.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   * @param {object} response - The response to send.
   * @returns {Promise<void>} A promise that resolves when the response is sent.
   */
  async sendResponse(req, res, response) {
    const { status, headers, data } = response;

    // Set the response status and headers
    res.status(status);
    for (const [key, value] of Object.entries(headers)) {
      res.set(key, value);
    }

    // Send the response data
    res.send(data);
  }

  /**
   * Handles a direct request (not proxied).
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   * @returns {Promise<void>} A promise that resolves when the response is sent.
   */
  async handleDirectRequest(req, res) {
    // Implement direct request handling logic here
  }

  /**
   * Handles an error.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   * @param {number} status - The error status code.
   * @param {string} message - The error message.
   * @returns {Promise<void>} A promise that resolves when the error response is sent.
   */
  async handleError(req, res, status, message) {
    res.status(status).send(message);
  }
}

export { ProxyEngine };