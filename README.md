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
          |  (Cache API)     |
          +---------------+
                  |
                  |
                  v
          +---------------+
          |  Express Server  |
          |  (HTTPS Tunnel)  |
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

* Node.js (>= 16.0.0)
* npm (>= 8.0.0)
* Docker (optional)

### Installation

1. Clone the repository: `git clone https://github.com/your-username/Nexus-Proxy.git`
2. Install dependencies: `npm install`
3. Start the proxy: `npm start`

### Docker Setup

1. Build the Docker image: `docker build -t nexus-proxy .`
2. Run the Docker container: `docker run -p 8080:8080 nexus-proxy`

## Configuration Options

### Caching

* **Cache TTL**: Set the time-to-live (TTL) for cached responses in hours (default: 1 hour). Configure in `config.json`:
```json
{
  "cache": {
    "ttl": 1
  }
}
```
* **Cache Size**: Set the maximum size of the cache in megabytes (default: 100 MB). Configure in `config.json`:
```json
{
  "cache": {
    "size": 100
  }
}
```
* **Cache Enabled**: Enable or disable caching (default: enabled). Configure in `config.json`:
```json
{
  "cache": {
    "enabled": true
  }
}
```

### Performance

* **Brotli Compression**: Enable or disable Brotli compression (default: enabled). Configure in `config.json`:
```json
{
  "performance": {
    "brotli": true
  }
}
```

## Contributing

Contributions are welcome! Please submit pull requests to the main branch. Ensure that all tests pass and code is formatted according to the project's ESLint and Prettier configurations.

## License

Nexus Proxy is licensed under the MIT License. See LICENSE for details.

## Acknowledgements

Special thanks to the developers of Ultraviolet for their work on the original proxy technology. Nexus aims to build upon and improve these concepts to provide a more secure and feature-rich proxy solution.