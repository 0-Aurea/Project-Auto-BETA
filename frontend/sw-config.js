export const PREFIX = '/service/';

const KEY = 'nexus-proxy';

export function encode(url) {
  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(url);
  const encrypted = xor(uint8Array, KEY);
  const base64String = btoa(String.fromCharCode(...encrypted));
  const safeBase64String = base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return PREFIX + safeBase64String;
}

export function decode(encodedStr) {
  if (!encodedStr.startsWith(PREFIX)) {
    throw new Error('Invalid encoded string');
  }
  const safeBase64String = encodedStr.substring(PREFIX.length);
  const paddedBase64String = safeBase64String + '='.repeat((4 - safeBase64String.length % 4) % 4);
  const decrypted = new Uint8Array(atob(paddedBase64String.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => c.charCodeAt(0)));
  const decoder = new TextDecoder();
  return decoder.decode(xor(decrypted, KEY));
}

function xor(arr, key) {
  const keyBytes = new TextEncoder().encode(key);
  const result = new Uint8Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    result[i] = arr[i] ^ keyBytes[i % keyBytes.length];
  }
  return result;
}