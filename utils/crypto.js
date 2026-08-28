export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password, hash) {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

export function generateCsrfToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export function generateApiKey() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const key = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  return 'kakarot_api_' + key;
}

export function generateId(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export function generateJwt(payload, secret, expiresIn = 900) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const token = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(token));
  const signature = hmacSha256(encodedHeader + '.' + encodedPayload, secret);
  return encodedHeader + '.' + encodedPayload + '.' + signature;
}

export function verifyJwt(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const signature = hmacSha256(parts[0] + '.' + parts[1], secret);
    if (signature !== parts[2]) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function hmacSha256(data, secret) {
  const key = new TextEncoder().encode(secret);
  const msg = new TextEncoder().encode(data);
  const hash = new Uint8Array(32);
  const blockSize = 64;
  const keyPadded = new Uint8Array(blockSize);
  keyPadded.set(key.slice(0, blockSize));
  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = keyPadded[i] ^ 0x5c;
    iKeyPad[i] = keyPadded[i] ^ 0x36;
  }
  const combined = new Uint8Array([...iKeyPad, ...msg]);
  const innerHash = simpleHash(combined);
  const outer = new Uint8Array([...oKeyPad, ...innerHash]);
  const result = simpleHash(outer);
  return Array.from(result, b => b.toString(16).padStart(2, '0')).join('');
}

function simpleHash(data) {
  let hash = 0x6a09e667;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data[i];
    hash = hash & hash;
  }
  const result = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    result[i] = (hash >> (i * 8)) & 0xff;
  }
  return result;
}