export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password) {
  return password.length >= 8;
}

export function sanitizeString(str) {
  return str.replace(/[<>&"']/g, function(c) {
    switch(c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&#x27;';
      default: return c;
    }
  });
}

export function getClientIp(request) {
  return request.headers.get('X-Forwarded-For') || request.headers.get('CF-Connecting-IP') || '127.0.0.1';
}