import { successResponse, errorResponse } from '../utils/response.js';
import { listConversations, createConversation, getConversation, updateConversation, deleteConversation, createMessage, getMessages, getRecentMessages } from '../database/operations.js';
import { sanitizeString } from '../utils/validation.js';
import { handleChatCompletion } from './v1/chat.js';

export async function handleConversations(request, env, user) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token', 'Access-Control-Allow-Credentials': 'true' } });
  }

  if (path === '/conversations' && request.method === 'GET') {
    const workspaceId = url.searchParams.get('workspace_id');
    if (!workspaceId) return errorResponse('VALIDATION_ERROR', 'workspace_id query parameter is required');
    const result = await listConversations(env.DB, user.id, workspaceId);
    return successResponse({ conversations: result.results || [] });
  }

  if (path === '/conversations' && request.method === 'POST') {
    const body = await request.json();
    const { workspace_id, title, model_used, thinking_enabled } = body;
    if (!workspace_id || !title) {
      return errorResponse('VALIDATION_ERROR', 'workspace_id and title are required');
    }
    const id = await createConversation(env.DB, user.id, workspace_id, sanitizeString(title), model_used || 'gpt54', thinking_enabled || false);
    const now = Math.floor(Date.now() / 1000);
    return successResponse({ conversation: { id, user_id: user.id, workspace_id, title, model_used: model_used || 'gpt54', thinking_enabled: thinking_enabled ? 1 : 0, created_at: now, updated_at: now } }, 201);
  }

  if (path.startsWith('/conversations/') && request.method === 'GET') {
    const id = path.split('/').pop();
    if (path.endsWith('/messages')) {
      const convId = path.split('/').slice(-2, -1)[0];
      const result = await getMessages(env.DB, convId);
      return successResponse({ messages: result.results || [] });
    }
    const conversation = await getConversation(env.DB, id, user.id);
    if (!conversation) return errorResponse('NOT_FOUND', 'Conversation not found', {}, 404);
    const result = await getMessages(env.DB, id);
    return successResponse({ conversation, messages: result.results || [] });
  }

  if (path.startsWith('/conversations/') && request.method === 'PUT') {
    const id = path.split('/').pop();
    const body = await request.json();
    const updates = { updated_at: Math.floor(Date.now() / 1000) };
    if (body.title) updates.title = sanitizeString(body.title);
    if (body.model_used) updates.model_used = body.model_used;
    if (body.thinking_enabled !== undefined) updates.thinking_enabled = body.thinking_enabled ? 1 : 0;
    await updateConversation(env.DB, id, user.id, updates);
    return successResponse({ message: 'Conversation updated' });
  }

  if (path.startsWith('/conversations/') && request.method === 'DELETE') {
    const id = path.split('/').pop();
    await deleteConversation(env.DB, id, user.id);
    return successResponse({ message: 'Conversation deleted' });
  }

  if (path.endsWith('/messages') && request.method === 'POST') {
    const parts = path.split('/');
    const convId = parts[parts.length - 2];
    const body = await request.json();
    const conversation = await getConversation(env.DB, convId, user.id);
    if (!conversation) return errorResponse('NOT_FOUND', 'Conversation not found', {}, 404);
    const userMessage = body.message || body.content || '';
    if (!userMessage) return errorResponse('VALIDATION_ERROR', 'Message content is required');

    await createMessage(env.DB, convId, 'user', sanitizeString(userMessage));

    const recentResult = await getRecentMessages(env.DB, convId, 10);
    const contextMessages = (recentResult.results || []).reverse().map(m => ({
      role: m.role,
      content: m.content
    }));

    const chatRequest = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({
        model: conversation.model_used,
        messages: contextMessages,
        stream: body.stream || false,
        conversation_id: convId
      })
    });

    return handleChatCompletion(chatRequest, env, user);
  }

  return errorResponse('NOT_FOUND', 'Conversation endpoint not found', {}, 404);
}