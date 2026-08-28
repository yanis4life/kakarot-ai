import { errorResponse } from '../utils/response.js';
import { generateId } from '../utils/crypto.js';

export async function checkRateLimit(env, identifier, tier = 'default') {
  const now = Math.floor(Date.now() / 1000);
  const windowSize = 60;
  const limits = { default: 60, admin: 1000, premium: 120 };
  const maxRequests = limits[tier] || limits.default;
  const windowKey = Math.floor(now / windowSize);
  const rateKey = `${identifier}:${windowKey}`;
  const current = await env.KV.get(rateKey);
  const count = current ? parseInt(current) : 0;
  if (count >= maxRequests) {
    return { limited: true, error: errorResponse('RATE_LIMITED', 'Too many requests. Please try again later.', {}, 429) };
  }
  await env.KV.put(rateKey, String(count + 1), { expirationTtl: windowSize * 2 });
  return { limited: false, remaining: maxRequests - count - 1 };
}

export async function checkCsrf(request) {
  if (request.method === 'GET' || request.method === 'OPTIONS' || request.method === 'HEAD') {
    return true;
  }
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const csrfCookie = cookies.csrf_token;
  const csrfHeader = request.headers.get('X-CSRF-Token');
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return false;
  }
  return true;
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(c => {
    const parts = c.trim().split('=');
    if (parts.length >= 2) {
      cookies[parts[0]] = parts.slice(1).join('=');
    }
  });
  return cookies;
}