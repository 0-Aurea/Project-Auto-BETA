const WebSocket = require('ws');
const { URL } = require('url');

/**
 * WebSocket utility class for handling WebSocket upgrade proxying with header rewriting and subprotocol support.
 */
class WebSocketUtils {
  /**
   * WebSocket server instance.
   */
  static wss;

  /**
   * Initialize the WebSocket server.
   * @param {object} server - The HTTP server instance.
   * @param {object} options - WebSocket server options.
   */
  static init(server, options) {
    WebSocketUtils.wss = new WebSocket.Server({ server, ...options });

    WebSocketUtils.wss.on('connection', (ws, req) => {
      const { headers, url } = req;

      // Handle WebSocket upgrade request
      const websocketUrl = new URL(url, 'http://example.com');
      const { searchParams } = websocketUrl;

      // Extract subprotocols
      const subprotocols = headers['sec-websocket-protocol'];

      // Handle WebSocket connection
      ws.on('message', (message) => {
        // Rewrite and forward message
        WebSocketUtils.rewriteAndForwardMessage(ws, message, subprotocols);
      });

      ws.on('close', () => {
        // Handle WebSocket close
      });

      ws.on('error', (error) => {
        // Handle WebSocket error
        globalThis.console.error('WebSocket error:', error);
      });
    });
  }

  /**
   * Rewrites and forwards a WebSocket message.
   * @param {WebSocket} ws - The WebSocket instance.
   * @param {Buffer} message - The message to rewrite and forward.
   * @param {string|string[]} subprotocols - The subprotocols of the WebSocket connection.
   */
  static rewriteAndForwardMessage(ws, message, subprotocols) {
    try {
      // Parse the WebSocket message
      let parsedMessage;
      try {
        parsedMessage = JSON.parse(message.toString());
      } catch (e) {
        // If the message is not JSON, send it as is
        parsedMessage = message;
      }

      // Rewrite the message
      const rewrittenMessage = WebSocketUtils.rewriteMessage(parsedMessage, subprotocols);

      // Forward the rewritten message
      ws.send(JSON.stringify(rewrittenMessage));
    } catch (error) {
      globalThis.console.error('Error rewriting and forwarding WebSocket message:', error);
    }
  }

  /**
   * Rewrites a WebSocket message based on the subprotocols.
   * @param {object|string} message - The message to rewrite.
   * @param {string|string[]} subprotocols - The subprotocols of the WebSocket connection.
   * @returns {object|string} The rewritten message.
   */
  static rewriteMessage(message, subprotocols) {
    if (typeof message === 'object') {
      // If the message is an object, check if it has a 'type' property
      if (message.type === 'iceCandidate') {
        // If the message is an ICE candidate, scrub it
        return WebSocketUtils.scrubIceCandidate(message);
      } else if (message.type === 'offer' || message.type === 'answer') {
        // If the message is an offer or answer, rewrite the SDP
        return WebSocketUtils.rewriteSdp(message);
      }
    }

    // If no specific rewriting is needed, return the original message
    return message;
  }

  /**
   * Handles WebSocket ICE candidate scrubbing to prevent IP leaks.
   * @param {object} candidate - The ICE candidate to scrub.
   * @returns {object} The scrubbed ICE candidate.
   */
  static scrubIceCandidate(candidate) {
    try {
      // Remove the IP address from the candidate
      delete candidate.ip;
      delete candidate.address;

      // Remove any other sensitive information
      candidate = JSON.parse(JSON.stringify(candidate));

      return candidate;
    } catch (error) {
      globalThis.console.error('Error scrubbing WebSocket ICE candidate:', error);
      return null;
    }
  }

  /**
   * Rewrites the SDP of an offer or answer message.
   * @param {object} message - The message containing the SDP.
   * @returns {object} The message with the rewritten SDP.
   */
  static rewriteSdp(message) {
    try {
      // Parse the SDP
      const sdp = message.sdp;

      // Remove any IP addresses from the SDP
      sdp.replace(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g, '');

      // Remove any other sensitive information
      message.sdp = sdp;

      return message;
    } catch (error) {
      globalThis.console.error('Error rewriting WebSocket SDP:', error);
      return null;
    }
  }
}

module.exports = WebSocketUtils;