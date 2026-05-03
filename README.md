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

* **Cache TTL**: Set the time-to-live (TTL) for cached responses in hours (default: 1 hour)
* **Cache Size**: Set the maximum size of the cache in megabytes (default: 100 MB)
* **Cache Enabled**: Enable or disable caching (default: enabled)

### Performance

* **Brotli Compression**: Enable or disable Brotli compression (default: enabled)
* **Gzip Compression**: Enable or disable gzip compression (default: enabled)
* **Prefetch Hints**: Enable or disable prefetch hints (default: enabled)

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

## Comparison Table

| Feature | Ultraviolet | Nexus |
| --- | --- | --- |
| Core Proxy Engine | Basic | Advanced |
| JS / HTML / CSS Rewriting | Limited | Comprehensive |
| Caching & Performance | Basic | Advanced |
| Frontend | Bare-bones | Sleek & Feature-rich |

## Contributing

Contributions to this project are welcome. Please submit a pull request with your changes and a brief description of what you've added or fixed.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgements

Special thanks to the developers of Ultraviolet for inspiring this project.

## Known Issues

* None reported yet.

## Future Plans

* Implement additional features, such as support for WebAssembly and PGP encryption.
* Improve performance and security.