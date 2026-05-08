const encoder = new TextEncoder();
const decoder = new TextDecoder();

const encodeUrl = (url) => {
  const uint8Array = encoder.encode(url);
  const base64String = btoa(String.fromCharCode(...uint8Array));
  const urlSafeBase64 = base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return urlSafeBase64;
};

const decodeUrl = (urlSafeBase64) => {
  const paddedBase64 = urlSafeBase64 + '==='.slice(0, (4 - urlSafeBase64.length % 4) % 4);
  const base64String = paddedBase64.replace(/-/g, '+').replace(/_/g, '/');
  const uint8Array = new Uint8Array(Array.from(atob(base64String), (c) => c.charCodeAt(0)));
  const url = decoder.decode(uint8Array);
  return url;
};

export { encodeUrl, decodeUrl };