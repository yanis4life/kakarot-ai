import { verifyJwt } from '../utils/crypto.js';
import { errorResponse } from '../utils/response.js';
import { getUserById } from '../database/operations.js';
import { checkCoinsAndReset } from '../coins/manager.js';

export async function authenticateRequest(request, env) {
  const jwtSecret = env.JWT_SECRET;
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const token = cookies.token || extractBearerToken(request);

  if (!token) {
    return { error: errorResponse('AUTH_FAILED', 'Authentication required', {}, 401) };
  }

  const payload = verifyJwt(token, jwtSecret);
  if (!payload) {
    return { error: errorResponse('AUTH_FAILED', 'Invalid or expired token', {}, 401) };
  }

  const user = await getUserById(env.DB, payload.userId);
  if (!user) {
    return { error: errorResponse('AUTH_FAILED', 'User not found', {}, 401) };
  }

  await checkCoinsAndReset(env.DB, user);

  const refreshedUser = await getUserById(env.DB, payload.userId);
  return { user: refreshedUser, payload };
}

export async function authenticateAdmin(request, env) {
  const result = await authenticateRequest(request, env);
  if (result.error) return result;
  if (result.user.role !== 'admin') {
    return { error: errorResponse('PERMISSION_DENIED', 'Admin access required', {}, 403) };
  }
  return result;
}

export function authenticateApiKey(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const key = authHeader.slice(7);
    if (key.startsWith('kakarot_api_')) {
      return { apiKey: key };
    }
  }
  return null;
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

function extractBearerToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (!token.startsWith('kakarot_api_')) {
      return token;
    }
  }
  return null;
}