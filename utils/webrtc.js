/**
 * WebRTC utility class for handling WebRTC ICE candidate scrubbing and improving WebRTC support.
 */
class WebRTCUtils {
  /**
   * Regular expression to match WebRTC ICE candidate strings.
   */
  static ICE_CANDIDATE_REGEX = /candidate:([a-zA-Z0-9]+)\s+([a-zA-Z0-9]+)\s+([a-zA-Z0-9]+)\s+([a-zA-Z0-9]+)\s+([a-zA-Z0-9]+)\s+([a-zA-Z0-9]+)/g;

  /**
   * Regular expression to match WebRTC ICE candidate IP addresses.
   */
  static IP_ADDRESS_REGEX = /(?:[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|[a-zA-Z0-9.-]+)/g;

  /**
   * Regular expression to match WebRTC SDP (Session Description Protocol) strings.
   */
  static SDP_REGEX = /sdp:\s*(.*)/g;

  /**
   * Scrubs WebRTC ICE candidate IP addresses and other sensitive information.
   * @param {string} candidate - The WebRTC ICE candidate string.
   * @returns {string} The scrubbed WebRTC ICE candidate string.
   */
  static scrubIceCandidate(candidate) {
    // Replace IP addresses with a placeholder
    candidate = candidate.replace(WebRTCUtils.IP_ADDRESS_REGEX, '0.0.0.0');

    // Remove any other sensitive information
    candidate = candidate.replace(/udp|tcp/g, 'udp'); // Normalize transport protocols

    return candidate;
  }

  /**
   * Handles WebRTC ICE candidate creation.
   * @param {RTCPeerConnection} peerConnection - The RTCPeerConnection instance.
   * @param {RTCIceCandidate} candidate - The RTCIceCandidate instance.
   */
  static handleIceCandidate(peerConnection, candidate) {
    const scrubbedCandidate = WebRTCUtils.scrubIceCandidate(candidate.candidate);
    peerConnection.addIceCandidate(new RTCIceCandidate({ candidate: scrubbedCandidate }));
  }

  /**
   * Initializes WebRTC event listeners.
   * @param {RTCPeerConnection} peerConnection - The RTCPeerConnection instance.
   */
  static initEventListeners(peerConnection) {
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        WebRTCUtils.handleIceCandidate(peerConnection, event.candidate);
      }
    };

    // Handle track events to prevent IP leaks
    peerConnection.ontrack = (event) => {
      // Remove any IP addresses from the track's metadata
      event.track.onmetadata = (metadata) => {
        metadata = metadata.replace(WebRTCUtils.IP_ADDRESS_REGEX, '0.0.0.0');
      };
    };
  }

  /**
   * Sanitizes WebRTC SDP (Session Description Protocol) strings to prevent IP leaks.
   * @param {string} sdp - The WebRTC SDP string.
   * @returns {string} The sanitized WebRTC SDP string.
   */
  static sanitizeSdp(sdp) {
    // Remove any IP addresses from the SDP string
    sdp = sdp.replace(WebRTCUtils.IP_ADDRESS_REGEX, '0.0.0.0');

    // Remove any other sensitive information
    sdp = sdp.replace(/a=ice-ufp:([a-zA-Z0-9]+)/g, 'a=ice-ufp:xxxxxxxxxxxx'); // Normalize ICE UFP

    return sdp;
  }

  /**
   * Handles WebRTC peer connection creation.
   * @param {object} config - The RTCPeerConnection configuration.
   * @returns {RTCPeerConnection} The created RTCPeerConnection instance.
   */
  static createPeerConnection(config) {
    const peerConnection = new RTCPeerConnection(config);

    // Initialize event listeners to prevent IP leaks
    WebRTCUtils.initEventListeners(peerConnection);

    return peerConnection;
  }
}

module.exports = WebRTCUtils;