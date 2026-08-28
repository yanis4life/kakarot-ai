import { handleRequest } from '../api/router.js';
import { handleQueue } from '../queues/handler.js';
import { handleCron } from '../scheduled/handler.js';

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      if (path.startsWith('/api/') || path.startsWith('/auth/') || path.startsWith('/v1/') || path.startsWith('/settings/') || path.startsWith('/workspaces/') || path.startsWith('/conversations/') || path.startsWith('/ccfl/') || path === '/' || path.startsWith('/static/') || path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/chat') || path.startsWith('/workspaces') || path.startsWith('/settings') || path.startsWith('/admin')) {
        return handleRequest(request, env, ctx);
      }

      return new Response('Not Found', { status: 404 });
    } catch (e) {
      return new Response(JSON.stringify({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  },

  async queue(batch, env, ctx) {
    return handleQueue(batch, env, ctx);
  },

  async scheduled(event, env, ctx) {
    return handleCron(event, env, ctx);
  }
};