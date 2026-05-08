export const PREFIX = '/service/';

export function encode(url) {
  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(url);
  const base64String = btoa(String.fromCharCode(...uint8Array));
  const safeBase64String = base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return PREFIX + safeBase64String;
}

export function decode(encodedStr) {
  const safeBase64String = encodedStr.substring(PREFIX.length);
  const paddedBase64String = safeBase64String + '='.repeat((4 - safeBase64String.length % 4) % 4);
  const uint8Array = new Uint8Array(atob(paddedBase64String.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => c.charCodeAt(0)));
  const decoder = new TextDecoder();
  return decoder.decode(uint8Array);
}