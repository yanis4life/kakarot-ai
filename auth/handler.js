import { successResponse, errorResponse } from '../utils/response.js';
import { hashPassword, verifyPassword, generateJwt, generateCsrfToken, generateId } from '../utils/crypto.js';
import { validateEmail, validatePassword, sanitizeString, getClientIp } from '../utils/validation.js';
import { createUser, getUserByEmail, getUserById, updateUser, incrementIpCount, checkIpRestriction } from '../database/operations.js';
import { checkCoinsAndReset } from '../coins/manager.js';

function getCookieSecure(env) {
  return env.ENVIRONMENT === 'production' ? 'Secure; ' : '';
}

function setAuthCookies(response, accessToken, refreshToken, csrfToken, env) {
  const secure = getCookieSecure(env);
  response.headers.append('Set-Cookie', `token=${accessToken}; HttpOnly; ${secure}SameSite=Lax; Path=/; Max-Age=900`);
  response.headers.append('Set-Cookie', `refresh_token=${refreshToken}; HttpOnly; ${secure}SameSite=Lax; Path=/; Max-Age=604800`);
  response.headers.append('Set-Cookie', `csrf_token=${csrfToken}; ${secure}SameSite=Lax; Path=/`);
}

function clearAuthCookies(response, env) {
  const secure = getCookieSecure(env);
  response.headers.append('Set-Cookie', `token=; HttpOnly; ${secure}SameSite=Lax; Path=/; Max-Age=0`);
  response.headers.append('Set-Cookie', `refresh_token=; HttpOnly; ${secure}SameSite=Lax; Path=/; Max-Age=0`);
  response.headers.append('Set-Cookie', `csrf_token=; ${secure}SameSite=Lax; Path=/; Max-Age=0`);
}

export async function handleRegister(request, env) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return errorResponse('VALIDATION_ERROR', 'Email, password, and name are required');
    }

    if (!validateEmail(email)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid email format');
    }

    if (!validatePassword(password)) {
      return errorResponse('VALIDATION_ERROR', 'Password must be at least 8 characters');
    }

    const existingUser = await getUserByEmail(env.DB, email);
    if (existingUser) {
      return errorResponse('VALIDATION_ERROR', 'Email already registered');
    }

    const ip = getClientIp(request);
    const ipRestriction = await checkIpRestriction(env.DB, ip);

    if (ipRestriction && ipRestriction.account_count >= 5) {
      return errorResponse('IP_LIMIT_REACHED', 'Maximum accounts reached for this IP address', {}, 403);
    }

    const passwordHash = await hashPassword(password);
    const sanitizedName = sanitizeString(name);
    const userId = await createUser(env.DB, { email, passwordHash, name: sanitizedName, ipAddress: ip });

    await incrementIpCount(env.DB, ip);

    const jwtSecret = env.JWT_SECRET;
    const csrfToken = generateCsrfToken();
    const accessToken = generateJwt({ userId, email, role: 'user' }, jwtSecret, 900);
    const refreshToken = generateJwt({ userId, type: 'refresh' }, jwtSecret, 604800);

    const response = successResponse({ user: { id: userId, email, name: sanitizedName, role: 'user', coins: 30 } }, 201);
    setAuthCookies(response, accessToken, refreshToken, csrfToken, env);

    return response;
  } catch (e) {
    return errorResponse('INTERNAL_ERROR', 'Registration failed', {}, 500);
  }
}

export async function handleLogin(request, env) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('VALIDATION_ERROR', 'Email and password are required');
    }

    const user = await getUserByEmail(env.DB, email);
    if (!user) {
      return errorResponse('AUTH_FAILED', 'Invalid email or password', {}, 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return errorResponse('AUTH_FAILED', 'Invalid email or password', {}, 401);
    }

    await checkCoinsAndReset(env.DB, user);

    const now = Math.floor(Date.now() / 1000);
    await updateUser(env.DB, user.id, { last_active: now, updated_at: now });

    const jwtSecret = env.JWT_SECRET;
    const csrfToken = generateCsrfToken();
    const accessToken = generateJwt({ userId: user.id, email: user.email, role: user.role }, jwtSecret, 900);
    const refreshToken = generateJwt({ userId: user.id, type: 'refresh' }, jwtSecret, 604800);

    const refreshedUser = await getUserById(env.DB, user.id);

    const response = successResponse({
      user: {
        id: refreshedUser.id,
        email: refreshedUser.email,
        name: refreshedUser.name,
        role: refreshedUser.role,
        coins: refreshedUser.coins
      }
    });
    setAuthCookies(response, accessToken, refreshToken, csrfToken, env);

    return response;
  } catch (e) {
    return errorResponse('INTERNAL_ERROR', 'Login failed', {}, 500);
  }
}

export async function handleGoogleAuth(request, env) {
  try {
    const body = await request.json();
    const { credential } = body;

    if (!credential) {
      return errorResponse('VALIDATION_ERROR', 'Google credential is required');
    }

    const tokenParts = credential.split('.');
    if (tokenParts.length !== 3) {
      return errorResponse('AUTH_FAILED', 'Invalid credential', {}, 401);
    }

    const payload = JSON.parse(atob(tokenParts[1]));
    const email = payload.email;
    const name = payload.name || email.split('@')[0];

    if (!email) {
      return errorResponse('AUTH_FAILED', 'Invalid Google credential', {}, 401);
    }

    let user = await getUserByEmail(env.DB, email);

    if (!user) {
      const ip = getClientIp(request);
      const ipRestriction = await checkIpRestriction(env.DB, ip);
      if (ipRestriction && ipRestriction.account_count >= 5) {
        return errorResponse('IP_LIMIT_REACHED', 'Maximum accounts reached for this IP address', {}, 403);
      }
      const passwordHash = await hashPassword(generateId(32));
      const userId = await createUser(env.DB, { email, passwordHash, name: sanitizeString(name), ipAddress: ip });
      await incrementIpCount(env.DB, ip);
      user = await getUserById(env.DB, userId);
    }

    await checkCoinsAndReset(env.DB, user);

    const now = Math.floor(Date.now() / 1000);
    await updateUser(env.DB, user.id, { last_active: now, updated_at: now });

    const jwtSecret = env.JWT_SECRET;
    const csrfToken = generateCsrfToken();
    const accessToken = generateJwt({ userId: user.id, email: user.email, role: user.role }, jwtSecret, 900);
    const refreshToken = generateJwt({ userId: user.id, type: 'refresh' }, jwtSecret, 604800);

    const refreshedUser = await getUserById(env.DB, user.id);

    const response = successResponse({
      user: {
        id: refreshedUser.id,
        email: refreshedUser.email,
        name: refreshedUser.name,
        role: refreshedUser.role,
        coins: refreshedUser.coins
      }
    });
    setAuthCookies(response, accessToken, refreshToken, csrfToken, env);

    return response;
  } catch (e) {
    return errorResponse('INTERNAL_ERROR', 'Google authentication failed', {}, 500);
  }
}

export async function handleLogout(request, env) {
  const response = successResponse({ message: 'Logged out successfully' });
  clearAuthCookies(response, env);
  return response;
}

export async function handleRefresh(request, env) {
  try {
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookies = parseCookies(cookieHeader);
    const refreshToken = cookies.refresh_token;

    if (!refreshToken) {
      return errorResponse('AUTH_FAILED', 'Refresh token required', {}, 401);
    }

    const { verifyJwt, generateJwt, generateCsrfToken } = await import('../utils/crypto.js');
    const payload = verifyJwt(refreshToken, env.JWT_SECRET);

    if (!payload || payload.type !== 'refresh') {
      return errorResponse('AUTH_FAILED', 'Invalid refresh token', {}, 401);
    }

    const user = await getUserById(env.DB, payload.userId);
    if (!user) {
      return errorResponse('AUTH_FAILED', 'User not found', {}, 401);
    }

    const csrfToken = generateCsrfToken();
    const accessToken = generateJwt({ userId: user.id, email: user.email, role: user.role }, env.JWT_SECRET, 900);
    const newRefreshToken = generateJwt({ userId: user.id, type: 'refresh' }, env.JWT_SECRET, 604800);

    const response = successResponse({ message: 'Token refreshed' });
    setAuthCookies(response, accessToken, newRefreshToken, csrfToken, env);

    return response;
  } catch (e) {
    return errorResponse('INTERNAL_ERROR', 'Token refresh failed', {}, 500);
  }
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