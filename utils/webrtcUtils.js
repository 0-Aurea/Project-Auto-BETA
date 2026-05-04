const { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate } = globalThis;

/**
 * WebRTC utility class for handling ICE candidate scrubbing and peer connection management.
 */
class WebRTCUtils {
  /**
   * Regular expression to match WebRTC ICE candidate IP addresses.
   */
  static ICE_CANDIDATE_IP_REGEX = /(?:candidate:)?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g;

  /**
   * Regular expression to match WebRTC ICE candidate IPv6 addresses.
   */
  static ICE_CANDIDATE_IPV6_REGEX = /(?:candidate:)?([0-9a-fA-F:]+\/)?([0-9a-fA-F:]+)/g;

  /**
   * Regular expression to match WebRTC SDP (Session Description Protocol) strings.
   */
  static SDP_REGEX = /sdp:\s*(.*)/g;

  /**
   * Placeholder IP address for scrubbed ICE candidates.
   */
  static PLACEHOLDER_IP = '0.0.0.0';

  /**
   * Placeholder IPv6 address for scrubbed ICE candidates.
   */
  static PLACEHOLDER_IPV6 = '::';

  /**
   * Scrub WebRTC ICE candidate IP addresses to prevent IP leaks.
   * @param {string} iceCandidate - The ICE candidate string.
   * @returns {string} The scrubbed ICE candidate string.
   */
  static scrubIceCandidate(iceCandidate) {
    return iceCandidate
      .replace(WebRTCUtils.ICE_CANDIDATE_IP_REGEX, (match, ip) => {
        // Replace IP address with a placeholder
        return match.replace(ip, WebRTCUtils.PLACEHOLDER_IP);
      })
      .replace(WebRTCUtils.ICE_CANDIDATE_IPV6_REGEX, (match, prefix, ip) => {
        // Replace IPv6 address with a placeholder
        return match.replace(ip, WebRTCUtils.PLACEHOLDER_IPV6);
      });
  }

  /**
   * Scrub WebRTC SDP strings to prevent IP leaks.
   * @param {string} sdp - The SDP string.
   * @returns {string} The scrubbed SDP string.
   */
  static scrubSdp(sdp) {
    return sdp
      .replace(WebRTCUtils.ICE_CANDIDATE_IP_REGEX, (match, ip) => {
        // Replace IP address with a placeholder
        return match.replace(ip, WebRTCUtils.PLACEHOLDER_IP);
      })
      .replace(WebRTCUtils.ICE_CANDIDATE_IPV6_REGEX, (match, prefix, ip) => {
        // Replace IPv6 address with a placeholder
        return match.replace(ip, WebRTCUtils.PLACEHOLDER_IPV6);
      });
  }

  /**
   * Create a new peer connection with a custom onicecandidate handler.
   * @param {function} onIceCandidate - The custom onicecandidate handler.
   * @returns {RTCPeerConnection} The new peer connection.
   */
  static createPeerConnection(onIceCandidate) {
    const peerConnection = new RTCPeerConnection();

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const scrubbedCandidate = WebRTCUtils.scrubIceCandidate(event.candidate.candidate);
        onIceCandidate(new RTCIceCandidate({ candidate: scrubbedCandidate }));
      }
    };

    return peerConnection;
  }

  /**
   * Set the local description of a peer connection and handle errors.
   * @param {RTCPeerConnection} peerConnection - The peer connection.
   * @param {RTCSessionDescription} description - The local description.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  static setLocalDescription(peerConnection, description) {
    return peerConnection.setLocalDescription(description)
      .catch((error) => {
        globalThis.console.error('Error setting local description:', error);
        throw error;
      });
  }

  /**
   * Create an offer for a peer connection and handle errors.
   * @param {RTCPeerConnection} peerConnection - The peer connection.
   * @returns {Promise<RTCSessionDescription>} A promise that resolves with the offer.
   */
  static createOffer(peerConnection) {
    return peerConnection.createOffer()
      .then((offer) => {
        return WebRTCUtils.setLocalDescription(peerConnection, offer)
          .then(() => offer);
      })
      .catch((error) => {
        globalThis.console.error('Error creating offer:', error);
        throw error;
      });
  }

  /**
   * Create an answer for a peer connection and handle errors.
   * @param {RTCPeerConnection} peerConnection - The peer connection.
   * @returns {Promise<RTCSessionDescription>} A promise that resolves with the answer.
   */
  static createAnswer(peerConnection) {
    return peerConnection.createAnswer()
      .then((answer) => {
        return WebRTCUtils.setLocalDescription(peerConnection, answer)
          .then(() => answer);
      })
      .catch((error) => {
        globalThis.console.error('Error creating answer:', error);
        throw error;
      });
  }
}

export default WebRTCUtils;