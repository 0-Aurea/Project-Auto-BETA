# NEXUS Proxy Architecture
================================

## Overview
------------

NEXUS is a fully self-hosted web proxy designed to provide a secure and private browsing experience. The proxy is built using a combination of Node.js, Express, and vanilla JavaScript for the Service Worker.

## Architecture Diagram
------------------------

The NEXUS proxy architecture can be broken down into the following components:

*   **Client-Side (Service Worker)**
    *   Handles incoming requests from the client
    *   Intercepts and rewrites requests using XOR + base64 URL encoding with a rotating salt
    *   Caches proxied responses using the Service Worker Cache API
*   **Server-Side (Node.js/Express)**
    *   Handles HTTPS CONNECTs and upgrades
    *   Forwards requests to the target server
    *   Returns responses to the client
*   **Rewriter**
    *   Rewrites HTML, JS, and CSS to redirect sub-requests through the proxy
    *   Handles dynamic JS imports, eval(), WebSockets, and WebRTC ICE candidate scrubbing

## Component Interactions
-------------------------

### Request Flow

1.  The client makes a request to the NEXUS proxy.
2.  The Service Worker intercepts the request and applies XOR + base64 URL encoding with a rotating salt.
3.  The encoded request is forwarded to the server-side Node.js/Express process.
4.  The server-side process upgrades the request to an HTTPS CONNECT and forwards it to the target server.
5.  The target server returns a response to the server-side process.
6.  The server-side process returns the response to the Service Worker.
7.  The Service Worker caches the response using the Service Worker Cache API.

### Response Flow

1.  The server-side process receives a response from the target server.
2.  The response is forwarded to the Service Worker.
3.  The Service Worker rewrites the response (HTML, JS, CSS) to redirect sub-requests through the proxy.
4.  The rewritten response is returned to the client.

## Data Storage
----------------

*   **Service Worker Cache API**: used to cache proxied responses with TTL headers.
*   **IndexedDB**: used to store proxy history.

## Security Features
--------------------

*   **XOR + base64 URL encoding**: protects against request tampering and eavesdropping.
*   **Rotating salt**: enhances security by changing the salt used for encoding.
*   **HTTPS CONNECT**: ensures secure communication between the server-side process and the target server.
*   **WebRTC ICE candidate scrubbing**: prevents IP leaks.

## Performance Features
-----------------------

*   **Brotli/gzip decompression + re-compression pipeline**: improves performance by compressing responses.
*   **Prefetch hints**: parses `<link rel="prefetch/preload">` and caches ahead.

## Technology Stack
-------------------

*   **Node.js**: used for the server-side process.
*   **Express**: used as the web framework for the server-side process.
*   **Vanilla JavaScript**: used for the Service Worker.

## Future Development
---------------------

*   **Improved Rewriter**: enhance the rewriter to handle more complex cases.
*   **Enhanced Security Features**: add additional security features, such as support for multiple encoding modes.

## Comparison to Ultraviolet
-----------------------------

| Feature | Ultraviolet | NEXUS |
| --- | --- | --- |
| Encoding | Simple "/" prefix | XOR + base64 URL encoding with rotating salt |
| HTTPS CONNECT | Separate bare-server process | Integrated HTTPS tunnel |
| WebSocket Support | Limited | Full WebSocket upgrade proxying |
| WebRTC Support | Limited | WebRTC ICE candidate scrubbing |
| Caching | Limited | Service Worker Cache API with TTL headers |
| Performance Features | Limited | Brotli/gzip decompression + re-compression pipeline |