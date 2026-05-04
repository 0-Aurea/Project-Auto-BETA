describe('WebRTC Utility Functions', () => {
  describe('WebRTC ICE Candidate Scrubbing', () => {
    it('should scrub IP addresses from ICE candidate payloads', () => {
      const originalCandidate = {
        candidate: 'candidate:1 1 udp 2130706431 192.168.1.100 57867 typ host generation 0',
      };

      const scrubbedCandidate = WebRTCUtils.scrubIceCandidate(originalCandidate);
      expect(scrubbedCandidate.candidate).not.toContain('192.168.1.100');
    });

    it('should handle null or undefined input', () => {
      expect(WebRTCUtils.scrubIceCandidate(null)).toBeNull();
      expect(WebRTCUtils.scrubIceCandidate(undefined)).toBeUndefined();
    });

    it('should handle non-string candidate payloads', () => {
      expect(WebRTCUtils.scrubIceCandidate({})).toEqual({});
      expect(WebRTCUtils.scrubIceCandidate([])).toEqual([]);
    });
  });

  describe('WebRTC SDP Message Handling', () => {
    it('should handle SDP messages with IP addresses', () => {
      const originalSdp = 'v=0\r\n' +
        'o=- 0 0 IN IP4 192.168.1.100\r\n' +
        's=-\r\n' +
        't=0 0\r\n' +
        'm=audio 49170 RTP/AVP 0\r\n' +
        'a=rtpmap:0 PCMU/8000\r\n';

      const rewrittenSdp = WebRTCUtils.rewriteSdp(originalSdp);
      expect(rewrittenSdp).not.toContain('192.168.1.100');
    });

    it('should handle null or undefined SDP input', () => {
      expect(WebRTCUtils.rewriteSdp(null)).toBeNull();
      expect(WebRTCUtils.rewriteSdp(undefined)).toBeUndefined();
    });
  });

  describe('WebRTC Stream Management', () => {
    it('should track and manage WebRTC streams', () => {
      const streamId = 'stream-123';
      WebRTCUtils.addStream(streamId);
      expect(WebRTCUtils.getStreams()).toContain(streamId);
      WebRTCUtils.removeStream(streamId);
      expect(WebRTCUtils.getStreams()).not.toContain(streamId);
    });

    it('should handle duplicate stream additions', () => {
      const streamId = 'stream-123';
      WebRTCUtils.addStream(streamId);
      WebRTCUtils.addStream(streamId);
      expect(WebRTCUtils.getStreams()).toContain(streamId);
      expect(WebRTCUtils.getStreams().filter(id => id === streamId).length).toBe(1);
    });
  });
});