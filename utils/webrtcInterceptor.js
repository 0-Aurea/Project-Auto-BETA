'use strict';

const { RTCPeerConnection } = require('wrtc');

/**
 * WebRTC interceptor utility class for handling WebRTC traffic.
 */
class WebRTCInterceptor {
  /**
   * Regular expression to match WebRTC ICE candidate messages.
   */
  static ICE_CANDIDATE_REGEX = /^candidate:.*$/;

  /**
   * Regular expression to match WebRTC offer/answer messages.
   */
  static OFFER_ANSWER_REGEX = /^offer|answer$/;

  /**
   * Intercepts and rewrites WebRTC ICE candidate messages.
   * @param {RTCPeerConnection} peerConnection - The RTCPeerConnection instance.
   * @param {function} callback - The callback function to handle intercepted messages.
   */
  static interceptIceCandidates(peerConnection, callback) {
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        if (WebRTCInterceptor.ICE_CANDIDATE_REGEX.test(candidate)) {
          // Rewrite the ICE candidate to prevent IP leaks
          const rewrittenCandidate = WebRTCInterceptor.rewriteIceCandidate(candidate);
          callback(rewrittenCandidate);
        }
      }
    };
  }

  /**
   * Rewrites a WebRTC ICE candidate message to prevent IP leaks.
   * @param {string} candidate - The ICE candidate message.
   * @returns {string} The rewritten ICE candidate message.
   */
  static rewriteIceCandidate(candidate) {
    // Remove IP addresses from the ICE candidate message
    return candidate.replace(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g, '0.0.0.0');
  }

  /**
   * Intercepts and rewrites WebRTC offer/answer messages.
   * @param {RTCPeerConnection} peerConnection - The RTCPeerConnection instance.
   * @param {function} callback - The callback function to handle intercepted messages.
   */
  static interceptOfferAnswer(peerConnection, callback) {
    peerConnection.onnegotiationneeded = () => {
      peerConnection.createOffer().then((offer) => {
        const rewrittenOffer = WebRTCInterceptor.rewriteOfferAnswer(offer);
        callback(rewrittenOffer);
      });
    };

    peerConnection.onaddstream = (event) => {
      // Handle answer messages
      peerConnection.createAnswer().then((answer) => {
        const rewrittenAnswer = WebRTCInterceptor.rewriteOfferAnswer(answer);
        callback(rewrittenAnswer);
      });
    };
  }

  /**
   * Rewrites a WebRTC offer/answer message.
   * @param {object} message - The offer/answer message.
   * @returns {object} The rewritten offer/answer message.
   */
  static rewriteOfferAnswer(message) {
    // Remove sensitive information from the offer/answer message
    delete message.sdp;
    return message;
  }

  /**
   * Handles WebRTC traffic by intercepting and rewriting ICE candidate and offer/answer messages.
   * @param {RTCPeerConnection} peerConnection - The RTCPeerConnection instance.
   * @param {function} callback - The callback function to handle intercepted messages.
   */
  static handleWebRTC(peerConnection, callback) {
    WebRTCInterceptor.interceptIceCandidates(peerConnection, callback);
    WebRTCInterceptor.interceptOfferAnswer(peerConnection, callback);
  }
}

module.exports = WebRTCInterceptor;