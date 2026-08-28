export function successResponse(data, status = 200) {
  return new Response(JSON.stringify({ success: true, ...data }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials': 'true' }
  });
}

export function errorResponse(code, message, details = {}, status = 400) {
  return new Response(JSON.stringify({
    success: false,
    error: { code, message, details }
  }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials': 'true' }
  });
}

export function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials': 'true' }
  });
}

export function corsResponse() {
  return new Response(null, {
    status: 204,
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Max-Age': '86400' }
  });
}

export function streamResponse(readable) {
  return new Response(readable, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials': 'true' }
  });
}