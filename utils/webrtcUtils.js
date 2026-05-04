const { RTCPeerConnection, RTCSessionDescription } = globalThis;

/**
 * WebRTC utility class for handling ICE candidate scrubbing and peer connection management.
 */
class WebRTCUtils {
  /**
   * Regular expression to match WebRTC ICE candidate IP addresses.
   */
  static ICE_CANDIDATE_IP_REGEX = /(?:candidate:)?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g;

  /**
   * Scrub WebRTC ICE candidate IP addresses to prevent IP leaks.
   * @param {string} iceCandidate - The ICE candidate string.
   * @returns {string} The scrubbed ICE candidate string.
   */
  static scrubIceCandidate(iceCandidate) {
    return iceCandidate.replace(WebRTCUtils.ICE_CANDIDATE_IP_REGEX, (match, ip) => {
      // Replace IP address with a placeholder
      return match.replace(ip, '0.0.0.0');
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
        onIceCandidate(scrubbedCandidate);
      }
    };

    return peerConnection;
  }

  /**
   * Set the local description of a peer connection and handle errors.
   * @param {RTCPeerConnection} peerConnection - The peer connection.
   * @param {RTCSessionDescription} description - The local description.
   * @returns {Promise<void>}
   */
  static async setLocalDescription(peerConnection, description) {
    try {
      await peerConnection.setLocalDescription(description);
    } catch (error) {
      globalThis.console.error('Error setting local description:', error);
    }
  }

  /**
   * Set the remote description of a peer connection and handle errors.
   * @param {RTCPeerConnection} peerConnection - The peer connection.
   * @param {RTCSessionDescription} description - The remote description.
   * @returns {Promise<void>}
   */
  static async setRemoteDescription(peerConnection, description) {
    try {
      await peerConnection.setRemoteDescription(description);
    } catch (error) {
      globalThis.console.error('Error setting remote description:', error);
    }
  }
}

export default WebRTCUtils;