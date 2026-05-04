const WebRTCIceCandidateScrubber = (() => {
  const pc = new RTCPeerConnection({
    iceServers: [],
    iceCandidatePoolSize: 0,
  });

  let candidateQueue = [];

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      candidateQueue.push(event.candidate);
    }
  };

  pc.onnegotiationneeded = () => {
    pc.createOffer().then((offer) => {
      return pc.setLocalDescription(new RTCSessionDescription({ type: 'offer', sdp: offer }));
    }).catch((error) => {
      console.error('Error in onnegotiationneeded:', error);
    });
  };

  const scrubCandidates = (candidates) => {
    const scrubbedCandidates = [];

    candidates.forEach((candidate) => {
      const { candidate: candidateStr } = candidate;
      const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
      const scrubbedCandidateStr = candidateStr.replace(ipRegex, '0.0.0.0');

      scrubbedCandidates.push({ ...candidate, candidate: scrubbedCandidateStr });
    });

    return scrubbedCandidates;
  };

  const proxyWebRTC = (request, response) => {
    if (request.method === 'POST' && request.url.includes('RTCIceCandidate')) {
      try {
        const candidates = JSON.parse(request.body);

        const scrubbedCandidates = scrubCandidates(candidates);

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(scrubbedCandidates));
      } catch (error) {
        console.error('Error in proxyWebRTC:', error);
        response.writeHead(500, { 'Content-Type': 'text/plain' });
        response.end('Internal Server Error');
      }
    } else {
      response.writeHead(405, { 'Content-Type': 'text/plain' });
      response.end('Method Not Allowed');
    }
  };

  return { proxyWebRTC };
})();

class ProxyEngine {
  constructor() {
    this.webRTCIceCandidateScrubber = WebRTCIceCandidateScrubber.proxyWebRTC;
    this.dynamicImportHandler = this.dynamicImportHandler.bind(this);
    this.websocketUpgradeHandler = this.websocketUpgradeHandler.bind(this);
  }

  dynamicImportHandler(request, response) {
    const dynamicImportRegex = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    const html = request.body;

    const modifiedHtml = html.replace(dynamicImportRegex, (match, importUrl) => {
      const proxiedUrl = this.getProxiedUrl(importUrl);
      return `import('${proxiedUrl}')`;
    });

    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(modifiedHtml);
  }

  websocketUpgradeHandler(request, response) {
    if (request.method === 'GET' && request.headers['upgrade'] === 'websocket') {
      const websocketUrl = request.url;
      const proxiedUrl = this.getProxiedUrl(websocketUrl);

      const websocketOptions = {
        headers: {
          'Upgrade': 'websocket',
          'Connection': 'Upgrade',
        },
      };

      const websocketRequest = {
        ...request,
        url: proxiedUrl,
        headers: websocketOptions.headers,
      };

      const WebSocket = require('ws');
      const wss = new WebSocket.Server({ noServer: true });

      wss.on('connection', (ws) => {
        const client = new WebSocket(websocketUrl);

        client.on('message', (message) => {
          ws.send(message);
        });

        ws.on('message', (message) => {
          client.send(message);
        });

        client.on('close', () => {
          ws.close();
        });

        ws.on('close', () => {
          client.close();
        });
      });

      const server = require('http').createServer((req, res) => {
        if (req.headers['upgrade'] === 'websocket') {
          wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
            wss.emit('connection', ws, req);
          });
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      server.listen(0, () => {
        console.log('WebSocket server listening on port', server.address().port);
      });
    } else {
      response.writeHead(405, { 'Content-Type': 'text/plain' });
      response.end('Method Not Allowed');
    }
  }

  getProxiedUrl(url) {
    const encoder = new TextEncoder();
    const randomSalt = Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, '0')).join('');
    const encodedUrl = btoa(unescape(encodeURIComponent(url))).replace(/=/g, '');
    const proxiedUrl = `/${randomSalt}${encodedUrl}`;

    return proxiedUrl;
  }

  handleRequest(request, response) {
    if (request.url.includes('RTCIceCandidate')) {
      this.webRTCIceCandidateScrubber(request, response);
    } else if (request.method === 'GET' && request.headers['upgrade'] === 'websocket') {
      this.websocketUpgradeHandler(request, response);
    } else {
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('Not Found');
    }
  }
}

module.exports = ProxyEngine;