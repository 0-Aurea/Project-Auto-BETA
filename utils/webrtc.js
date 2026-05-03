const { RTCPeerConnection, RTCSessionDescription } = globalThis;

/**
 * WebRTC utility class for handling WebRTC ICE candidate scrubbing to prevent IP leaks.
 */
class WebRTCUtils {
  /**
   * Regular expression to match WebRTC ICE candidate IP addresses.
   */
  static IP_ADDRESS_REGEX = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;

  /**
   * Scrub WebRTC ICE candidate IP addresses to prevent IP leaks.
   * @param {RTCPeerConnection} pc - The RTCPeerConnection instance.
   */
  static scrubIceCandidates(pc) {
    if (!(pc instanceof RTCPeerConnection)) {
      throw new Error('Invalid RTCPeerConnection instance');
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        const scrubbedCandidate = WebRTCUtils.scrubIpAddresses(candidate);
        event.candidate.candidate = scrubbedCandidate;
      }
    };
  }

  /**
   * Scrub IP addresses from a WebRTC ICE candidate string.
   * @param {string} candidate - The WebRTC ICE candidate string.
   * @returns {string} The scrubbed WebRTC ICE candidate string.
   */
  static scrubIpAddresses(candidate) {
    return candidate.replace(WebRTCUtils.IP_ADDRESS_REGEX, (match) => {
      // Replace IP addresses with a placeholder value
      return '0.0.0.0';
    });
  }

  /**
   * Scrub IP addresses from a WebRTC SDP string.
   * @param {string} sdp - The WebRTC SDP string.
   * @returns {string} The scrubbed WebRTC SDP string.
   */
  static scrubSdpIpAddresses(sdp) {
    return sdp.replace(WebRTCUtils.IP_ADDRESS_REGEX, (match) => {
      // Replace IP addresses with a placeholder value
      return '0.0.0.0';
    });
  }

  /**
   * Patch the RTCPeerConnection prototype to scrub WebRTC ICE candidate IP addresses.
   */
  static patchRTCPeerConnection() {
    if (RTCPeerConnection.prototype._originalIceCandidate) {
      return;
    }

    RTCPeerConnection.prototype._originalIceCandidate = RTCPeerConnection.prototype.onicecandidate;

    RTCPeerConnection.prototype.onicecandidate = function (event) {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        const scrubbedCandidate = WebRTCUtils.scrubIpAddresses(candidate);
        event.candidate.candidate = scrubbedCandidate;
      }

      this._originalIceCandidate.call(this, event);
    };

    RTCPeerConnection.prototype._originalSetLocalDescription = RTCPeerConnection.prototype.setLocalDescription;

    RTCPeerConnection.prototype.setLocalDescription = async function (description) {
      if (description.type === 'offer' || description.type === 'answer') {
        const scrubbedSdp = WebRTCUtils.scrubSdpIpAddresses(description.sdp);
        description.sdp = scrubbedSdp;
      }

      return this._originalSetLocalDescription.call(this, description);
    };

    RTCPeerConnection.prototype._originalSetRemoteDescription = RTCPeerConnection.prototype.setRemoteDescription;

    RTCPeerConnection.prototype.setRemoteDescription = async function (description) {
      if (description.type === 'offer' || description.type === 'answer') {
        const scrubbedSdp = WebRTCUtils.scrubSdpIpAddresses(description.sdp);
        description.sdp = scrubbedSdp;
      }

      return this._originalSetRemoteDescription.call(this, description);
    };
  }
}

WebRTCUtils.patchRTCPeerConnection();

export default WebRTCUtils;