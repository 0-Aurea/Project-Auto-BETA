/**
 * WebRTC utility class for handling WebRTC ICE candidate scrubbing.
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
   * Scrubs WebRTC ICE candidate IP addresses.
   * @param {string} candidate - The WebRTC ICE candidate string.
   * @returns {string} The scrubbed WebRTC ICE candidate string.
   */
  static scrubIceCandidate(candidate) {
    const ipAddresses = candidate.match(WebRTCUtils.IP_ADDRESS_REGEX);
    if (ipAddresses) {
      ipAddresses.forEach((ipAddress) => {
        candidate = candidate.replace(ipAddress, '0.0.0.0');
      });
    }
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
  }
}

module.exports = WebRTCUtils;