const { QUIC } = require('quic');
const { HTTP3 } = require('http3');
const { URL } = require('url');
const { IncomingMessage, ServerResponse } = require('http');

/**
 * QUIC protocol and HTTP/3 utility class for handling QUIC connections and HTTP/3 requests.
 */
class QUICUtils {
  /**
   * QUIC server instance.
   */
  static quicServer;

  /**
   * HTTP/3 client instance.
   */
  static http3Client;

  /**
   * Supported QUIC protocols.
   */
  static SUPPORTED_PROTOCOLS = ['quic', 'http3'];

  /**
   * Initialize the QUIC server and HTTP/3 client.
   * @param {Server} server - The HTTP server instance.
   * @param {Object} options - QUIC server options.
   */
  static init(server, options) {
    QUICUtils.quicServer = new QUIC.Server(options);
    QUICUtils.http3Client = new HTTP3.Client();

    QUICUtils.quicServer.on('connection', (connection) => {
      connection.on('stream', (stream) => {
        stream.on('data', (data) => {
          const request = new IncomingMessage(stream);
          const response = new ServerResponse(stream);

          QUICUtils.handleRequest(request, response);
        });
      });
    });

    QUICUtils.quicServer.listen(443);
  }

  /**
   * Handle incoming QUIC requests and forward to the target server.
   * @param {IncomingMessage} request - The incoming request.
   * @param {ServerResponse} response - The outgoing response.
   */
  static handleRequest(request, response) {
    const { url, method, headers } = request;
    const targetUrl = new URL(url);

    // Rewrite request headers
    headers[':method'] = method;
    headers[':scheme'] = targetUrl.protocol.slice(0, -1);
    headers[':authority'] = targetUrl.host;
    headers[':path'] = targetUrl.pathname;

    // Forward request to target server
    QUICUtils.http3Client.request({
      method,
      url: targetUrl.href,
      headers,
      body: request.body,
    })
      .then((targetResponse) => {
        // Rewrite response headers
        response.writeHead(targetResponse.status, targetResponse.headers);

        // Forward response body
        targetResponse.body.pipe(response);

        response.end();
      })
      .catch((error) => {
        console.error(error);
        response.writeHead(500);
        response.end();
      });
  }

  /**
   * Close the QUIC server and HTTP/3 client.
   */
  static close() {
    QUICUtils.quicServer.close();
    QUICUtils.http3Client.close();
  }
}

module.exports = QUICUtils;