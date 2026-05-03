# NEXUS Proxy Architecture
=============================

## Table of Contents
-----------------

*   [Overview](#overview)
*   [High-Level Architecture](#high-level-architecture)
*   [Components](#components)
    *   [Service Worker](#service-worker)
    *   [Proxy Server](#proxy-server)
    *   [Cache](#cache)
    *   [Frontend](#frontend)
*   [Data Flow](#data-flow)
*   [Security Considerations](#security-considerations)

## Overview
--------

NEXUS is a fully self-hosted dynamic web proxy designed to be objectively better than Titanium Network's Ultraviolet proxy in every measurable way. This document provides an overview of the NEXUS proxy architecture, including its components, data flow, and security considerations.

## High-Level Architecture
----------------------

The NEXUS proxy consists of the following high-level components:

*   **Service Worker**: Intercepts and rewrites requests, establishes the proxy tunnel
*   **Proxy Server**: Handles HTTPS connections, forwards requests to the target server
*   **Cache**: Stores and manages cached responses
*   **Frontend**: Provides the user interface for interacting with the proxy

## Components
------------

### Service Worker

The Service Worker is responsible for:

*   Intercepting requests using XOR + base64 URL encoding with a rotating salt
*   Rewriting HTML, JS, and CSS to redirect sub-requests through the proxy
*   Handling WebSocket upgrades and WebRTC ICE candidate scrubbing

The Service Worker uses the Cache API to store and manage cached responses.

### Proxy Server

The Proxy Server is responsible for:

*   Establishing HTTPS tunnels with the target server
*   Forwarding requests and responses between the client and target server
*   Handling cookie scoping and isolation

The Proxy Server is built using Node.js and Express.

### Cache

The Cache is responsible for:

*   Storing and managing cached responses
*   Handling cache invalidation and expiration

The Cache uses the Service Worker Cache API.

### Frontend

The Frontend provides the user interface for interacting with the proxy. It includes:

*   A sleek dark-mode UI with an animated search bar
*   A tab bar for multiple proxied pages
*   A proxy history (IndexedDB)
*   Settings panel for encoding mode, cache toggle, and ad-block toggle

## Data Flow
---------

The following diagram illustrates the data flow between components:
```
          +---------------+
          |  Client  |
          +---------------+
                  |
                  |
                  v
          +---------------+
          | Service Worker  |
          +---------------+
                  |
                  |
                  v
          +---------------+
          |  Proxy Server  |
          +---------------+
                  |
                  |
                  v
          +---------------+
          |  Target Server  |
          +---------------+
```
## Security Considerations
----------------------

NEXUS is designed with security in mind. The following security considerations are taken into account:

*   **Encryption**: All communication between the client and proxy server is encrypted using HTTPS.
*   **Authentication**: The proxy server authenticates requests using JWT tokens.
*   **Authorization**: The proxy server authorizes requests based on user permissions.
*   **Data Storage**: Sensitive data is stored securely using encryption and secure storage mechanisms.

## Comparison with Ultraviolet
-----------------------------

The following table compares NEXUS with Ultraviolet:

| Feature | Ultraviolet | NEXUS |
| --- | --- | --- |
| Encoding | Simple "/" prefix | XOR + base64 with rotating salt |
| HTTPS Tunnel | Separate bare-server process | Integrated HTTPS tunnel |
| Cache | Limited caching | Service Worker Cache API with TTL headers |
| Frontend | Basic URL bar | Sleek dark-mode UI with tab bar and settings panel |
| WebSocket Support | Limited | Full WebSocket upgrade proxying with header rewriting |
| WebRTC Support | Limited | WebRTC ICE candidate scrubbing to prevent IP leaks |