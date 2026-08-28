import { successResponse, errorResponse } from '../utils/response.js';
import { getUserById, updateUser, listApiKeys, createApiKey, deleteApiKey, getAuditLogs } from '../database/operations.js';
import { generateApiKey, hashPassword, verifyPassword } from '../utils/crypto.js';
import { validatePassword, sanitizeString } from '../utils/validation.js';
import { getUserCoinInfo, getCoinHistory } from '../coins/manager.js';

export async function handleSettings(request, env, user) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token', 'Access-Control-Allow-Credentials': 'true' } });
  }

  if (path === '/settings/profile' && request.method === 'GET') {
    const userData = await getUserById(env.DB, user.id);
    return successResponse({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        coins: userData.coins,
        created_at: userData.created_at
      }
    });
  }

  if (path === '/settings/profile' && request.method === 'PUT') {
    const body = await request.json();
    const updates = {};
    if (body.name) updates.name = sanitizeString(body.name);
    if (Object.keys(updates).length === 0) {
      return errorResponse('VALIDATION_ERROR', 'No fields to update');
    }
    updates.updated_at = Math.floor(Date.now() / 1000);
    await updateUser(env.DB, user.id, updates);
    return successResponse({ message: 'Profile updated' });
  }

  if (path === '/settings/password' && request.method === 'PUT') {
    const body = await request.json();
    const { current_password, new_password } = body;
    if (!current_password || !new_password) {
      return errorResponse('VALIDATION_ERROR', 'Current and new password are required');
    }
    if (!validatePassword(new_password)) {
      return errorResponse('VALIDATION_ERROR', 'Password must be at least 8 characters');
    }
    const userData = await getUserById(env.DB, user.id);
    const valid = await verifyPassword(current_password, userData.password_hash);
    if (!valid) {
      return errorResponse('AUTH_FAILED', 'Current password is incorrect', {}, 401);
    }
    const newHash = await hashPassword(new_password);
    await updateUser(env.DB, user.id, { password_hash: newHash, updated_at: Math.floor(Date.now() / 1000) });
    return successResponse({ message: 'Password updated' });
  }

  if (path === '/settings/api-keys' && request.method === 'GET') {
    const keys = await listApiKeys(env.DB, user.id);
    return successResponse({ api_keys: keys.results || [] });
  }

  if (path === '/settings/api-keys' && request.method === 'POST') {
    const body = await request.json();
    const keyName = body.name || 'Default Key';
    const apiKey = generateApiKey();
    const keyHash = await hashPassword(apiKey);
    const expiresAt = body.expires_in_days ? Math.floor(Date.now() / 1000) + (body.expires_in_days * 86400) : null;
    await createApiKey(env.DB, user.id, keyHash, sanitizeString(keyName), expiresAt);
    return successResponse({ api_key: apiKey, name: keyName }, 201);
  }

  if (path.startsWith('/settings/api-keys/') && request.method === 'DELETE') {
    const keyId = path.split('/').pop();
    await deleteApiKey(env.DB, keyId, user.id);
    return successResponse({ message: 'API key revoked' });
  }

  if (path === '/settings/coins' && request.method === 'GET') {
    const coinInfo = await getUserCoinInfo(env.DB, user.id);
    if (!coinInfo) return errorResponse('NOT_FOUND', 'User not found', {}, 404);
    return successResponse(coinInfo);
  }

  if (path === '/settings/rate-limits' && request.method === 'GET') {
    return successResponse({
      tier: user.rate_limit_tier || 'default',
      requests_per_minute: 60,
      coins_per_day: 30,
      coins_remaining: user.coins
    });
  }

  if (path === '/settings/export' && request.method === 'GET') {
    const { getMessages, listConversations, listWorkspaces } = await import('../database/operations.js');
    const wsResult = await listWorkspaces(env.DB, user.id);
        const workspaces = wsResult.results || [];
    const conversations = [];
    for (const ws of workspaces) {
      const convResult = await listConversations(env.DB, user.id, ws.id);
            const convs = convResult.results || [];
      for (const conv of convs) {
        const msgResult = await getMessages(env.DB, conv.id);
            const messages = msgResult.results || [];
        conversations.push({
          id: conv.id,
          workspace_id: conv.workspace_id,
          workspace_name: ws.name,
          title: conv.title,
          model_used: conv.model_used,
          coins_used: conv.coins_used,
          created_at: conv.created_at,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
            created_at: m.created_at
          }))
        });
      }
    }
    return successResponse({
      user: {
        email: user.email,
        name: user.name,
        created_at: user.created_at
      },
      workspaces: workspaces.map(w => ({ id: w.id, name: w.name, created_at: w.created_at })),
      conversations,
      export_date: new Date().toISOString()
    });
  }

  if (path === '/settings/import' && request.method === 'POST') {
    const body = await request.json();
    const { conversations } = body;
    if (!conversations || !Array.isArray(conversations)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid import data');
    }
    const { createConversation, createMessage, listWorkspaces, createWorkspace } = await import('../database/operations.js');
    let imported = 0;
    for (const conv of conversations) {
      if (!conv.title || !conv.messages) continue;
      let workspaceId = conv.workspace_id;
      const wsResult = await listWorkspaces(env.DB, user.id);
        const workspaces = wsResult.results || [];
      const ws = workspaces.find(w => w.name === (conv.workspace_name || 'Imported'));
      if (ws) {
        workspaceId = ws.id;
      } else {
        workspaceId = await createWorkspace(env.DB, user.id, conv.workspace_name || 'Imported');
      }
      const convId = await createConversation(env.DB, user.id, workspaceId, conv.title, conv.model_used || 'gpt54', 0);
      for (const msg of conv.messages) {
        await createMessage(env.DB, convId, msg.role, msg.content);
      }
      imported++;
    }
    return successResponse({ message: `Imported ${imported} conversations` });
  }

  if (path === '/settings/preferences' && request.method === 'GET') {
    return successResponse({ theme: 'dark', language: 'en' });
  }

  if (path === '/settings/preferences' && request.method === 'PUT') {
    return successResponse({ message: 'Preferences updated' });
  }

  return errorResponse('NOT_FOUND', 'Settings endpoint not found', {}, 404);
}