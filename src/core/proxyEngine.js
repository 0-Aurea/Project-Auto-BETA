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
      // Handle error
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
      const candidates = JSON.parse(request.body);

      const scrubbedCandidates = scrubCandidates(candidates);

      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(scrubbedCandidates));
    } else {
      // Handle other requests
    }
  };

  return { proxyWebRTC };
})();

export default WebRTCIceCandidateScrubber.proxyWebRTC;