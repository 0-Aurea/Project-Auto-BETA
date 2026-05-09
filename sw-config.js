export const PREFIX = '/service/';

const KEY = 'nexus-proxy';

/**
 * XORs a Uint8Array with a key.
 * 
 * @param {Uint8Array} uint8Array The array to XOR.
 * @param {string} key The key to XOR with.
 * @returns {Uint8Array} The XORed array.
 */
function xor(uint8Array, key) {
  const keyUint8Array = new TextEncoder().encode(key);
  const result = new Uint8Array(uint8Array.length);
  for (let i = 0; i < uint8Array.length; i++) {
    result[i] = uint8Array[i] ^ keyUint8Array[i % keyUint8Array.length];
  }
  return result;
}

/**
 * Encodes a URL by encrypting it with a key and converting it to a URL-safe base64 string.
 * 
 * @param {string} url The URL to encode.
 * @returns {string} The encoded URL.
 */
export function encode(url) {
  try {
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(url);
    const encrypted = xor(uint8Array, KEY);
    const base64String = btoa(String.fromCharCode(...encrypted));
    const safeBase64String = base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return PREFIX + safeBase64String;
  } catch (error) {
    throw new Error(`Failed to encode URL: ${error.message}`);
  }
}

/**
 * Decodes a URL by converting it from a URL-safe base64 string and decrypting it with a key.
 * 
 * @param {string} encodedStr The encoded URL.
 * @returns {string} The decoded URL.
 */
export function decode(encodedStr) {
  try {
    if (!encodedStr.startsWith(PREFIX)) {
      throw new Error('Invalid encoded string');
    }
    const safeBase64String = encodedStr.substring(PREFIX.length);
    const paddedBase64String = safeBase64String + '='.repeat((4 - safeBase64String.length % 4) % 4);
    const decrypted = new Uint8Array(atob(paddedBase64String.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => c.charCodeAt(0)));
    const decoder = new TextDecoder();
    return decoder.decode(xor(decrypted, KEY));
  } catch (error) {
    throw new Error(`Failed to decode URL: ${error.message}`);
  }
}