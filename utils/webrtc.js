const { RTCPeerConnection, RTCSessionDescription } = globalThis;

/**
 * WebRTC utility class for managing ICE candidate scrubbing and WebRTC-related functions.
 */
class WebRTCUtils {
  /**
   * Regular expression to match IP addresses in SDP strings.
   */
  static IP_ADDRESS_REGEX = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;

  /**
   * Scrub IP addresses from an SDP string.
   * @param {string} sdp - The SDP string to scrub.
   * @returns {string} The scrubbed SDP string.
   */
  static scrubIPAddresses(sdp) {
    return sdp.replace(WebRTCUtils.IP_ADDRESS_REGEX, '0.0.0.0');
  }

  /**
   * Scrub IP addresses from an RTCSessionDescription.
   * @param {RTCSessionDescription} description - The RTCSessionDescription to scrub.
   * @returns {RTCSessionDescription} The scrubbed RTCSessionDescription.
   */
  static async scrubSessionDescription(description) {
    const scrubbedSDP = WebRTCUtils.scrubIPAddresses(description.sdp);
    return new RTCSessionDescription({ sdp: scrubbedSDP });
  }

  /**
   * Create a new RTCPeerConnection with IP address scrubbing.
   * @param {RTCConfiguration} configuration - The RTCConfiguration for the peer connection.
   * @returns {RTCPeerConnection} The new RTCPeerConnection.
   */
  static createPeerConnection(configuration) {
    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const scrubbedCandidate = WebRTCUtils.scrubIPAddresses(event.candidate.candidate);
        event.candidate.candidate = scrubbedCandidate;
      }
    };

    return pc;
  }

  /**
   * Handle WebRTC ICE candidate leaks by scrubbing IP addresses.
   * @param {RTCPeerConnection} pc - The RTCPeerConnection to handle.
   */
  static handleICECandidateLeak(pc) {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const scrubbedCandidate = WebRTCUtils.scrubIPAddresses(event.candidate.candidate);
        event.candidate.candidate = scrubbedCandidate;
      }
    };
  }
}

export default WebRTCUtils;