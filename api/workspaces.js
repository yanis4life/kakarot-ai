import { successResponse, errorResponse } from '../utils/response.js';
import { listWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } from '../database/operations.js';
import { sanitizeString } from '../utils/validation.js';

export async function handleWorkspaces(request, env, user) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token', 'Access-Control-Allow-Credentials': 'true' } });
  }

  if (path === '/workspaces' && request.method === 'GET') {
    const result = await listWorkspaces(env.DB, user.id);
    return successResponse({ workspaces: result.results || [] });
  }

  if (path === '/workspaces' && request.method === 'POST') {
    const body = await request.json();
    const name = body.name || 'New Workspace';
    const id = await createWorkspace(env.DB, user.id, sanitizeString(name));
    const now = Math.floor(Date.now() / 1000);
    return successResponse({ workspace: { id, name, user_id: user.id, created_at: now, updated_at: now } }, 201);
  }

  if (path.startsWith('/workspaces/') && request.method === 'PUT') {
    const id = path.split('/').pop();
    const body = await request.json();
    if (!body.name) return errorResponse('VALIDATION_ERROR', 'Name is required');
    await updateWorkspace(env.DB, id, user.id, sanitizeString(body.name));
    return successResponse({ message: 'Workspace updated' });
  }

  if (path.startsWith('/workspaces/') && request.method === 'DELETE') {
    const id = path.split('/').pop();
    await deleteWorkspace(env.DB, id, user.id);
    return successResponse({ message: 'Workspace deleted' });
  }

  return errorResponse('NOT_FOUND', 'Workspace endpoint not found', {}, 404);
}