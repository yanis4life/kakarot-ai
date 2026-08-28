import { handleChatCompletion, handleModels } from './chat.js';
import { errorResponse, corsResponse } from '../../utils/response.js';

export async function handleV1Routes(request, env, user) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return corsResponse();
  }

  if (path === '/v1/chat/completions' && request.method === 'POST') {
    return handleChatCompletion(request, env, user);
  }

  if (path === '/v1/models' && request.method === 'GET') {
    return handleModels(request, env);
  }

  return errorResponse('NOT_FOUND', 'Endpoint not found', {}, 404);
}