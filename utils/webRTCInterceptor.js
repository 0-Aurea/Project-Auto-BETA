'use strict';

/**
 * WebRTC interceptor utility class for handling WebRTC ICE candidate scrubbing to prevent IP leaks.
 */
class WebRTCInterceptor {
  /**
   * Regular expression to match WebRTC peer connection creation.
   */
  static PEER_CONNECTION_REGEX = /new\s+RTCPeerConnection\s*\(\s*({.*?})\s*\)/g;

  /**
   * Regular expression to match WebRTC ICE candidate events.
   */
  static ICE_CANDIDATE_REGEX = /onicecandidate\s*=\s*function\s*\(\s*event\s*\)\s*{/g;

  /**
   * Regular expression to match WebRTC ICE candidate object.
   */
  static ICE_CANDIDATE_OBJECT_REGEX = /candidate\s*:\s*({.*?})/g;

  /**
   * Intercepts and scrubs WebRTC ICE candidate to prevent IP leaks.
   * @param {string} jsCode - The JavaScript code to intercept.
   * @returns {string} The modified JavaScript code with WebRTC ICE candidate scrubbing.
   */
  static interceptWebRTC(jsCode) {
    // Check if the code creates a new RTCPeerConnection
    if (WebRTCInterceptor.PEER_CONNECTION_REGEX.test(jsCode)) {
      // Replace the onicecandidate event handler to scrub the candidate
      jsCode = jsCode.replace(WebRTCInterceptor.ICE_CANDIDATE_REGEX, (match) => {
        return match.replace('event.candidate', 'null');
      });

      // Remove the candidate object to prevent IP leaks
      jsCode = jsCode.replace(WebRTCInterceptor.ICE_CANDIDATE_OBJECT_REGEX, (match) => {
        return 'candidate: null';
      });
    }

    return jsCode;
  }

  /**
   * Wraps the WebRTC getUserMedia function to prevent access to local media.
   * @param {string} jsCode - The JavaScript code to wrap.
   * @returns {string} The modified JavaScript code with WebRTC getUserMedia wrapping.
   */
  static wrapGetUserMedia(jsCode) {
    // Check if the code calls getUserMedia
    const getUserMediaRegex = /navigator\.mediaDevices\.getUserMedia\s*\(\s*({.*?})\s*\)/g;
    if (getUserMediaRegex.test(jsCode)) {
      // Replace the getUserMedia call with a stub that returns a rejected promise
      jsCode = jsCode.replace(getUserMediaRegex, (match) => {
        return 'Promise.reject(new Error("getUserMedia is not supported"))';
      });
    }

    return jsCode;
  }
}

module.exports = WebRTCInterceptor;