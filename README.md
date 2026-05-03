# Nexus Proxy README
=========

## Introduction

Nexus is a self-hosted web proxy designed to be objectively better than Titanium Network's Ultraviolet proxy in every measurable way. This repository contains the source code for the Nexus proxy, which is built using Node.js, Express, and vanilla JavaScript.

## Features

* **Core Proxy Engine**: XOR + base64 URL encoding with a rotating salt, integrated HTTPS tunnel, full request/response header rewriting, cookie scoping, WebSocket upgrade proxying, and WebRTC ICE candidate scrubbing.
* **JS / HTML / CSS Rewriting**: Smarter JS rewriter, CSS rewriter, and HTML rewriter to handle dynamic JS imports, eval(), WebSockets, blob URLs, inline event handlers, source maps, CSS @imports, and WebRTC leaks.
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
* **Gzip Compression**: Enable or disable gzip compression (default: enabled). Configure in `config.json`:
```json
{
  "performance": {
    "gzip": true
  }
}
```
* **Prefetch Hints**: Enable or disable prefetch hints (default: enabled). Configure in `config.json`:
```json
{
  "performance": {
    "prefetch": true
  }
}
```

### Frontend

* **Dark Mode**: Enable or disable dark mode (default: enabled). Configure in `config.json`:
```json
{
  "frontend": {
    "darkMode": true
  }
}
```
* **Ad Block**: Enable or disable built-in ad blocking (default: enabled). Configure in `config.json`:
```json
{
  "frontend": {
    "adBlock": true
  }
}
```
* **Bookmarks**: Enable or disable bookmarks system (default: enabled). Configure in `config.json`:
```json
{
  "frontend": {
    "bookmarks": true
  }
}
```

## Architecture Diagram

```
          +---------------+
          |  Client  |
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
          |  (HTTPS Tunnel)   |
          +---------------+
                  |
                  |
                  v
          +---------------+
          |  Proxied Origin  |
          +---------------+
```

## Development

To contribute to the Nexus proxy, follow these guidelines:

* Fork the repository and create a new branch for your changes.
* Run `npm install` to install dependencies.
* Run `npm start` to start the proxy.
* Make changes and commit them with a descriptive message.
* Create a pull request to merge your changes into the main branch.

## License

Nexus Proxy is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgements

* Titanium Network's Ultraviolet proxy, which inspired the creation of Nexus.
* Node.js, Express, and vanilla JavaScript, which make up the core technologies of Nexus.