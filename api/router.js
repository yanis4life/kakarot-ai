import { authenticateRequest, authenticateAdmin } from '../middleware/auth.js';
import { checkRateLimit, checkCsrf } from '../middleware/rateLimit.js';
import { errorResponse, corsResponse, htmlResponse } from '../utils/response.js';
import { handleRegister, handleLogin, handleGoogleAuth, handleLogout, handleRefresh } from '../auth/handler.js';
import { handleV1Routes } from './v1/index.js';
import { handleSettings } from './settings.js';
import { handleWorkspaces } from './workspaces.js';
import { handleConversations } from './conversations.js';
import { getClientIp } from '../utils/validation.js';
import { handleAdminRoutes } from '../admin/router.js';
import { serveStaticFile } from './static.js';

export async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return corsResponse();
  }

  if (path.startsWith('/static/') || path === '/' || path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/chat') || path.startsWith('/workspaces') || path.startsWith('/settings') || path === '/favicon.ico') {
    return serveStaticFile(request, env, path);
  }

  if (path.startsWith('/auth/')) {
    if (path === '/auth/register' && request.method === 'POST') return handleRegister(request, env);
    if (path === '/auth/login' && request.method === 'POST') return handleLogin(request, env);
    if (path === '/auth/google' && request.method === 'POST') return handleGoogleAuth(request, env);
    if (path === '/auth/logout' && request.method === 'POST') return handleLogout(request, env);
    if (path === '/auth/refresh' && request.method === 'POST') return handleRefresh(request, env);
    return errorResponse('NOT_FOUND', 'Auth endpoint not found', {}, 404);
  }

  if (path === '/v1/models' || path === '/v1/chat/completions') {
    if (path === '/v1/models' && request.method === 'GET') {
      const { handleModels } = await import('./v1/chat.js');
      return handleModels(request, env);
    }
    const authResult = await authenticateRequest(request, env);
    if (authResult.error) return authResult.error;
    const ip = getClientIp(request);
    const rateResult = await checkRateLimit(env, authResult.user.id, authResult.user.rate_limit_tier || 'default');
    if (rateResult.limited) return rateResult.error;
    return handleV1Routes(request, env, authResult.user);
  }

  if (path.startsWith('/ccfl/')) {
    const authResult = await authenticateAdmin(request, env);
    if (authResult.error) {
      if (path === '/ccfl/' || path === '/ccfl') {
        return htmlResponse('<html><body><h1>404 Not Found</h1></body></html>', 404);
      }
      return authResult.error;
    }
    return handleAdminRoutes(request, env, authResult.user);
  }

  const authResult = await authenticateRequest(request, env);
  if (authResult.error) return authResult.error;

  const ip = getClientIp(request);
  const rateResult = await checkRateLimit(env, authResult.user.id, authResult.user.rate_limit_tier || 'default');
  if (rateResult.limited) return rateResult.error;

  if (request.method !== 'GET' && request.method !== 'OPTIONS') {
    const csrfValid = await checkCsrf(request);
    if (!csrfValid) {
      return errorResponse('AUTH_FAILED', 'CSRF token validation failed', {}, 403);
    }
  }

  if (path.startsWith('/settings/')) return handleSettings(request, env, authResult.user);
  if (path.startsWith('/workspaces')) return handleWorkspaces(request, env, authResult.user);
  if (path.startsWith('/conversations')) return handleConversations(request, env, authResult.user);

  return errorResponse('NOT_FOUND', 'Endpoint not found', {}, 404);
}