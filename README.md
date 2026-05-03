# Nexus Proxy README
=========

## Introduction

Nexus is a self-hosted web proxy designed to be objectively better than Titanium Network's Ultraviolet proxy in every measurable way. This repository contains the source code for the Nexus proxy, which is built using Node.js, Express, and vanilla JavaScript. Nexus aims to provide a secure, fast, and feature-rich proxy solution for users who require enhanced online anonymity and flexibility.

## Features

* **Core Proxy Engine**: 
  * XOR + base64 URL encoding with a rotating salt for enhanced obfuscation
  * Integrated HTTPS tunnel for secure connections
  * Full request/response header rewriting for optimal anonymity
  * Cookie scoping to isolate cookies per proxied origin
  * WebSocket upgrade proxying for real-time communication
  * WebRTC ICE candidate scrubbing to prevent IP leaks
* **JS / HTML / CSS Rewriting**: 
  * Smarter JS rewriter to handle dynamic JS imports, eval(), WebSockets, blob URLs, inline event handlers, source maps, CSS @imports, and WebRTC leaks
  * CSS rewriter to handle url(), @import, and content: url(...)
  * HTML rewriter to handle all src/href/action/srcset/data attributes, <base> tag injection, <meta http-equiv="refresh"> rewrites, inline <script> and <style> blocks, and nonce stripping
* **Caching & Performance**: 
  * Service Worker Cache API for caching proxied responses with TTL headers
  * Brotli/gzip decompression + re-compression pipeline for efficient content encoding
  * Prefetch hints for parsing `<link rel="prefetch/preload">` and caching ahead
* **Frontend**: 
  * Sleek dark-mode UI with animated search bar
  * Tab bar for multiple proxied pages open in iframes simultaneously
  * Proxy history (IndexedDB, never sent to server)
  * Settings panel for encoding mode, cache toggle, ad-block toggle
  * Built-in hosts-based ad blocking (filter list parsed in the SW)
  * Bookmarks system
  * About:blank cloaking + custom tab title/icon

## Comparison with Ultraviolet

| Feature | Ultraviolet | Nexus |
| --- | --- | --- |
| **URL Encoding** | Simple "/" prefix | XOR + base64 with rotating salt |
| **HTTPS Tunnel** | Separate bare-server process | Integrated HTTPS tunnel |
| **Header Rewriting** | Limited | Full request/response header rewriting |
| **Cookie Scoping** | No | Isolate cookies per proxied origin |
| **WebSocket Proxying** | No | WebSocket upgrade proxying |
| **WebRTC Leak Protection** | No | WebRTC ICE candidate scrubbing |
| **JS Rewriting** | Basic | Smarter JS rewriter (eval(), dynamic imports, etc.) |
| **CSS Rewriting** | Limited | Handle url(), @import, content: url(...) |
| **HTML Rewriting** | Basic | Handle all src/href/action/srcset/data attributes, etc. |
| **Caching** | No | Service Worker Cache API with TTL headers |
| **Frontend** | Basic | Sleek dark-mode UI, tab bar, proxy history, etc. |

## Architecture Diagram

```
          +---------------+
          |  Client   |
          +---------------+
                  |
                  |
                  v
          +---------------+
          |  Service Worker  |
          |  (Nexus Proxy)  |
          +---------------+
                  |
                  |
                  v
          +---------------+
          |  Express Server  |
          |  (Node.js)       |
          +---------------+
                  |
                  |
                  v
          +---------------+
          |  Proxied Origin  |
          +---------------+
```

## Setup Instructions

### Prerequisites

* Node.js (v16 or higher)
* npm (v8 or higher)
* A compatible web browser

### Installation

1. Clone the repository: `git clone https://github.com/your-username/Nexus-Proxy.git`
2. Navigate to the repository: `cd Nexus-Proxy`
3. Install dependencies: `npm install`
4. Start the server: `npm start`

### Configuration

* Edit the `config.json` file to customize settings, such as the proxy port and salt.

## Usage

1. Open a web browser and navigate to `http://localhost:8080` (or the port specified in `config.json`).
2. Enter a URL in the search bar to proxy the request.

## Contributing

Contributions are welcome! Please submit a pull request with your changes and a brief description.

## License

Nexus Proxy is licensed under the MIT License.

## Acknowledgements

Special thanks to the developers of Ultraviolet for their work on the original proxy.

## Known Issues

* Some websites may not work properly due to aggressive rewriting.
* WebRTC leaks may still occur in certain scenarios.

## Future Development

* Implement additional features, such as DNS encryption and tor integration.
* Improve compatibility with websites that use complex JavaScript.