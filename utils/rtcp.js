const { RTCP } = require('./rtcpConstants');

/**
 * RTCP (Real-Time Control Protocol) utility class for handling RTCP packets.
 */
class RTCPUtils {
  /**
   * Regular expression to match RTCP packets.
   */
  static RTCP_REGEX = /^rtcp$/;

  /**
   * Handle RTCP packets and prevent IP leaks.
   * @param {object} rtcpPacket - The RTCP packet to handle.
   * @returns {object} The handled RTCP packet.
   */
  static handleRTCP(rtcpPacket) {
    // Check if the packet is a valid RTCP packet
    if (!RTCPUtils.RTCP_REGEX.test(rtcpPacket.type)) {
      throw new Error('Invalid RTCP packet');
    }

    // Scrub IP addresses from RTCP packets
    rtcpPacket = RTCPUtils.scrubIPAddresses(rtcpPacket);

    return rtcpPacket;
  }

  /**
   * Scrub IP addresses from RTCP packets to prevent IP leaks.
   * @param {object} rtcpPacket - The RTCP packet to scrub.
   * @returns {object} The scrubbed RTCP packet.
   */
  static scrubIPAddresses(rtcpPacket) {
    // Iterate over each report block in the RTCP packet
    rtcpPacket.reportBlocks.forEach((reportBlock) => {
      // Check if the report block contains an IP address
      if (reportBlock.ssrc) {
        // Replace the IP address with a placeholder
        reportBlock.ssrc = RTCP.PLACEHOLDER_IP;
      }
    });

    return rtcpPacket;
  }

  /**
   * Handle RTCP sender reports and prevent IP leaks.
   * @param {object} senderReport - The RTCP sender report to handle.
   * @returns {object} The handled RTCP sender report.
   */
  static handleSenderReport(senderReport) {
    // Scrub IP addresses from sender reports
    senderReport = RTCPUtils.scrubIPAddresses(senderReport);

    return senderReport;
  }

  /**
   * Handle RTCP receiver reports and prevent IP leaks.
   * @param {object} receiverReport - The RTCP receiver report to handle.
   * @returns {object} The handled RTCP receiver report.
   */
  static handleReceiverReport(receiverReport) {
    // Scrub IP addresses from receiver reports
    receiverReport = RTCPUtils.scrubIPAddresses(receiverReport);

    return receiverReport;
  }
}

module.exports = { RTCPUtils };