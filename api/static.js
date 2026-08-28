import { htmlResponse } from '../utils/response.js';

export async function serveStaticFile(request, env, path) {
  if (path === '/') {
    return htmlResponse(getLoginPage());
  }

  if (path === '/login' || path === '/login.html') {
    return htmlResponse(getLoginPage());
  }

  if (path === '/register' || path === '/register.html') {
    return htmlResponse(getRegisterPage());
  }

  if (path === '/chat' || path === '/chat.html') {
    return htmlResponse(getChatPage());
  }

  if (path === '/workspaces' || path === '/workspaces.html') {
    return htmlResponse(getWorkspacesPage());
  }

  if (path === '/settings' || path === '/settings.html') {
    return htmlResponse(getSettingsPage());
  }

  if (path.startsWith('/static/')) {
    return serveAsset(path.slice(8), env);
  }

  return htmlResponse('<html><body><h1>Not Found</h1></body></html>', 404);
}

async function serveAsset(assetPath, env) {
  if (assetPath.startsWith('css/')) {
    const cssFiles = {
      'css/app.css': getAppCSS,
      'css/login.css': getLoginCSS,
      'css/chat.css': getChatCSS,
      'css/settings.css': getSettingsCSS,
      'css/workspaces.css': getWorkspacesCSS
    };
    const getter = cssFiles[assetPath];
    if (getter) {
      return new Response(getter(), {
        headers: { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
      });
    }
  }

  if (assetPath.startsWith('js/')) {
    const jsFiles = {
      'js/app.js': getAppJS,
      'js/pages/login.js': getLoginJS,
      'js/pages/chat.js': getChatJS,
      'js/pages/settings.js': getSettingsJS,
      'js/pages/workspaces.js': getWorkspacesJS,
      'js/utils/api.js': getApiJS,
      'js/utils/store.js': getStoreJS
    };
    const getter = jsFiles[assetPath];
    if (getter) {
      return new Response(getter(), {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
      });
    }
  }

  if (assetPath.startsWith('assets/provider/')) {
    const logoName = assetPath.split('/').pop();
    const logos = {
      'openai.png': 'https://kakarot-ai.cc.cd/static/assets/provider/openai.png',
      'anthropic.png': 'https://kakarot-ai.cc.cd/static/assets/provider/anthropic.png',
      'google.png': 'https://kakarot-ai.cc.cd/static/assets/provider/google.png',
      'moonshot.png': 'https://kakarot-ai.cc.cd/static/assets/provider/moonshot.png',
      'zhipu.png': 'https://kakarot-ai.cc.cd/static/assets/provider/zhipu.png'
    };
    const url = logos[logoName];
    if (url) {
      const response = await fetch(url);
      return new Response(response.body, {
        headers: { 'Content-Type': response.headers.get('Content-Type') || 'image/png', 'Cache-Control': 'public, max-age=86400' }
      });
    }
  }

  return new Response('Not Found', { status: 404 });
}

function getLoginPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KAKAROT AI - Login</title>
<link rel="stylesheet" href="/static/css/app.css">
<link rel="stylesheet" href="/static/css/login.css">
</head>
<body>
<div class="auth-container">
<div class="auth-card">
<div class="auth-header">
<div class="logo">KAKAROT AI</div>
<p class="subtitle">Sign in to your account</p>
</div>
<form id="loginForm" class="auth-form">
<div class="form-group">
<label for="email">Email</label>
<input type="email" id="email" name="email" placeholder="you@example.com" required>
</div>
<div class="form-group">
<label for="password">Password</label>
<input type="password" id="password" name="password" placeholder="Enter your password" required>
</div>
<button type="submit" class="btn-primary">Sign In</button>
</form>
<div class="auth-divider"><span>or continue with</span></div>
<button id="googleLogin" class="btn-google">
<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
Continue with Google
</button>
<div class="auth-footer">
<p>Don't have an account? <a href="/register">Sign up</a></p>
</div>
<div id="errorMessage" class="error-message hidden"></div>
</div>
</div>
<script src="/static/js/utils/api.js"></script>
<script src="/static/js/pages/login.js"></script>
</body>
</html>`;
}

function getRegisterPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KAKAROT AI - Register</title>
<link rel="stylesheet" href="/static/css/app.css">
<link rel="stylesheet" href="/static/css/login.css">
</head>
<body>
<div class="auth-container">
<div class="auth-card">
<div class="auth-header">
<div class="logo">KAKAROT AI</div>
<p class="subtitle">Create your account</p>
</div>
<form id="registerForm" class="auth-form">
<div class="form-group">
<label for="name">Name</label>
<input type="text" id="name" name="name" placeholder="Your name" required>
</div>
<div class="form-group">
<label for="email">Email</label>
<input type="email" id="email" name="email" placeholder="you@example.com" required>
</div>
<div class="form-group">
<label for="password">Password</label>
<input type="password" id="password" name="password" placeholder="At least 8 characters" required minlength="8">
</div>
<button type="submit" class="btn-primary">Create Account</button>
</form>
<div class="auth-divider"><span>or continue with</span></div>
<button id="googleRegister" class="btn-google">
<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
Continue with Google
</button>
<div class="auth-footer">
<p>Already have an account? <a href="/login">Sign in</a></p>
</div>
<div id="errorMessage" class="error-message hidden"></div>
</div>
</div>
<script src="/static/js/utils/api.js"></script>
<script src="/static/js/pages/login.js"></script>
</body>
</html>`;
}

function getChatPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KAKAROT AI - Chat</title>
<link rel="stylesheet" href="/static/css/app.css">
<link rel="stylesheet" href="/static/css/chat.css">
</head>
<body>
<div id="app">
<header class="app-header">
<div class="header-left">
<button id="menuToggle" class="menu-btn" aria-label="Toggle menu">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
</button>
<div class="logo">KAKAROT AI</div>
</div>
<div class="header-center">
<select id="modelSelector" class="model-selector"></select>
<div id="thinkingToggle" class="thinking-toggle hidden">
<label class="toggle-switch">
<input type="checkbox" id="thinkingCheckbox">
<span class="toggle-slider"></span>
</label>
<span class="toggle-label">Thinking</span>
</div>
</div>
<div class="header-right">
<div id="coinDisplay" class="coin-display">
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#84cc16" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5" fill="#84cc16" opacity="0.3"/><path d="M12 8v8M8 12h8"/></svg>
<span id="coinCount">30</span>
<div id="coinTooltip" class="coin-tooltip hidden">
<span>Resets in: <span id="resetTimer">24h</span></span>
</div>
</div>
<div class="user-avatar" id="userAvatar">
<div class="avatar-initials" id="avatarInitials">U</div>
<div class="avatar-dropdown hidden" id="avatarDropdown">
<a href="/workspaces">Workspaces</a>
<a href="/settings">Settings</a>
<a href="#" id="logoutBtn">Sign Out</a>
</div>
</div>
</div>
</header>
<div class="app-body">
<aside class="sidebar" id="sidebar">
<div class="sidebar-header">
<button id="newWorkspaceBtn" class="btn-sidebar-action">New Workspace</button>
<button id="newConvBtn" class="btn-sidebar-action" style="margin-top:8px">New Conversation</button>
</div>
<div class="workspace-list" id="workspaceList"></div>
<div class="conversation-list" id="conversationList">
<div class="list-title">Conversations</div>
</div>
</aside>
<main class="main-content">
<div id="emptyState" class="empty-state">
<div class="empty-icon">
<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" stroke-width="1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
</div>
<h2>Select a conversation or start a new one</h2>
<p>Choose a workspace and conversation to begin chatting</p>
</div>
<div id="chatArea" class="chat-area hidden">
<div class="messages-container" id="messagesContainer"></div>
<div class="input-area">
<form id="messageForm" class="message-form">
<textarea id="messageInput" placeholder="Type your message..." rows="1"></textarea>
<button type="submit" class="send-btn" aria-label="Send message">
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
</button>
</form>
</div>
</div>
</main>
</div>
</div>
<div id="overlay" class="overlay hidden"></div>
<script src="/static/js/utils/api.js"></script>
<script src="/static/js/utils/store.js"></script>
<script src="/static/js/pages/chat.js"></script>
</body>
</html>`;
}

function getWorkspacesPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KAKAROT AI - Workspaces</title>
<link rel="stylesheet" href="/static/css/app.css">
<link rel="stylesheet" href="/static/css/workspaces.css">
</head>
<body>
<div id="app">
<header class="app-header">
<div class="header-left">
<a href="/chat" class="logo">KAKAROT AI</a>
</div>
<div class="header-right">
<div id="coinDisplay" class="coin-display">
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#84cc16" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5" fill="#84cc16" opacity="0.3"/><path d="M12 8v8M8 12h8"/></svg>
<span id="coinCount">30</span>
</div>
</div>
</header>
<main class="workspaces-main">
<div class="workspaces-header">
<h1>Workspaces</h1>
<button id="createWorkspaceBtn" class="btn-primary">New Workspace</button>
</div>
<div id="workspacesList" class="workspaces-grid"></div>
</main>
</div>
<div id="workspaceModal" class="modal hidden">
<div class="modal-content">
<h2 id="modalTitle">New Workspace</h2>
<form id="workspaceForm">
<input type="hidden" id="workspaceId">
<div class="form-group">
<label for="workspaceName">Name</label>
<input type="text" id="workspaceName" placeholder="Workspace name" required>
</div>
<div class="modal-actions">
<button type="button" class="btn-secondary" id="cancelModal">Cancel</button>
<button type="submit" class="btn-primary">Save</button>
</div>
</form>
</div>
</div>
<script src="/static/js/utils/api.js"></script>
<script src="/static/js/pages/workspaces.js"></script>
</body>
</html>`;
}

function getSettingsPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KAKAROT AI - Settings</title>
<link rel="stylesheet" href="/static/css/app.css">
<link rel="stylesheet" href="/static/css/settings.css">
</head>
<body>
<div id="app">
<header class="app-header">
<div class="header-left">
<a href="/chat" class="logo">KAKAROT AI</a>
</div>
<div class="header-right">
<div id="coinDisplay" class="coin-display">
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#84cc16" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5" fill="#84cc16" opacity="0.3"/><path d="M12 8v8M8 12h8"/></svg>
<span id="coinCount">30</span>
</div>
</div>
</header>
<main class="settings-main">
<aside class="settings-nav">
<a href="#profile" class="settings-nav-item active" data-tab="profile">Profile</a>
<a href="#password" class="settings-nav-item" data-tab="password">Password</a>
<a href="#api-keys" class="settings-nav-item" data-tab="api-keys">API Keys</a>
<a href="#coins" class="settings-nav-item" data-tab="coins">Coins</a>
<a href="#export" class="settings-nav-item" data-tab="export">Export / Import</a>
</aside>
<div class="settings-content">
<div id="profile-tab" class="settings-tab active">
<h2>Profile</h2>
<form id="profileForm">
<div class="form-group">
<label for="profileName">Name</label>
<input type="text" id="profileName" required>
</div>
<div class="form-group">
<label for="profileEmail">Email</label>
<input type="email" id="profileEmail" disabled>
</div>
<button type="submit" class="btn-primary">Save Changes</button>
</form>
</div>
<div id="password-tab" class="settings-tab hidden">
<h2>Change Password</h2>
<form id="passwordForm">
<div class="form-group">
<label for="currentPassword">Current Password</label>
<input type="password" id="currentPassword" required>
</div>
<div class="form-group">
<label for="newPassword">New Password</label>
<input type="password" id="newPassword" required minlength="8">
</div>
<button type="submit" class="btn-primary">Update Password</button>
</form>
</div>
<div id="api-keys-tab" class="settings-tab hidden">
<h2>API Keys</h2>
<button id="generateApiKeyBtn" class="btn-primary">Generate New Key</button>
<div id="apiKeysList" class="api-keys-list"></div>
</div>
<div id="coins-tab" class="settings-tab hidden">
<h2>Coin Balance</h2>
<div id="coinInfo" class="coin-info"></div>
<div id="coinHistory" class="coin-history"></div>
</div>
<div id="export-tab" class="settings-tab hidden">
<h2>Export / Import</h2>
<button id="exportDataBtn" class="btn-primary">Export My Data</button>
<button id="importDataBtn" class="btn-secondary">Import Data</button>
<input type="file" id="importFileInput" accept=".json" class="hidden">
</div>
</div>
</main>
</div>
<script src="/static/js/utils/api.js"></script>
<script src="/static/js/pages/settings.js"></script>
</body>
</html>`;
}

function getAppCSS() { return `/* App CSS */:root{--black:#0a0a0a;--dark-gray:#1a1a1a;--medium-gray:#2a2a2a;--light-gray:#f5f5f5;--white:#ffffff;--lemon-green:#84cc16;--font-family:Inter,system-ui,-apple-system,sans-serif}*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body{height:100%;font-family:var(--font-family);background:var(--black);color:var(--white);-webkit-font-smoothing:antialiased;overflow:hidden}.hidden{display:none!important}.btn-primary{background:var(--lemon-green);color:var(--black);border:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:opacity .2s}.btn-primary:hover{opacity:.9}.btn-secondary{background:var(--medium-gray);color:var(--white);border:1px solid #333;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer;transition:background .2s}.btn-secondary:hover{background:#333}.form-group{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}.form-group label{font-size:13px;font-weight:500;color:#999}.form-group input,.form-group textarea,.form-group select{background:var(--dark-gray);border:1px solid #333;border-radius:8px;padding:10px 14px;color:var(--white);font-size:14px;outline:none;transition:border-color .2s}.form-group input:focus,.form-group textarea:focus,.form-group select:focus{border-color:var(--lemon-green)}.app-header{display:flex;align-items:center;justify-content:space-between;padding:0 20px;height:56px;background:var(--dark-gray);border-bottom:1px solid #2a2a2a;position:fixed;top:0;left:0;right:0;z-index:100}.header-left{display:flex;align-items:center;gap:12px}.header-center{display:flex;align-items:center;gap:12px;flex:1;justify-content:center}.header-right{display:flex;align-items:center;gap:16px}.logo{font-size:18px;font-weight:700;letter-spacing:-.5px;color:var(--white);text-decoration:none}.menu-btn{background:none;border:none;color:var(--white);cursor:pointer;padding:4px;display:none}.coin-display{display:flex;align-items:center;gap:6px;cursor:pointer;position:relative;padding:4px 10px;background:var(--medium-gray);border-radius:20px;font-size:13px;font-weight:600}.coin-tooltip{position:absolute;top:100%;right:0;margin-top:8px;background:var(--dark-gray);border:1px solid #333;border-radius:8px;padding:8px 12px;font-size:12px;white-space:nowrap;z-index:200}.user-avatar{position:relative;cursor:pointer}.avatar-initials{width:32px;height:32px;border-radius:50%;background:var(--lemon-green);color:var(--black);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700}.avatar-dropdown{position:absolute;top:100%;right:0;margin-top:8px;background:var(--dark-gray);border:1px solid #333;border-radius:8px;padding:4px;min-width:160px;z-index:200}.avatar-dropdown a{display:block;padding:8px 12px;color:var(--white);text-decoration:none;font-size:13px;border-radius:4px;transition:background .2s}.avatar-dropdown a:hover{background:var(--medium-gray)}.model-selector{background:var(--medium-gray);border:1px solid #333;border-radius:8px;padding:6px 12px;color:var(--white);font-size:13px;outline:none;cursor:pointer;min-width:180px}.thinking-toggle{display:flex;align-items:center;gap:8px}.toggle-switch{position:relative;width:36px;height:20px;display:inline-block}.toggle-switch input{opacity:0;width:0;height:0}.toggle-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#333;border-radius:20px;transition:background .3s}.toggle-slider::before{content:"";position:absolute;height:16px;width:16px;left:2px;bottom:2px;background:var(--white);border-radius:50%;transition:transform .3s}.toggle-switch input:checked+.toggle-slider{background:var(--lemon-green)}.toggle-switch input:checked+.toggle-slider::before{transform:translateX(16px)}.toggle-label{font-size:12px;color:#999}.overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:50}.modal{position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;z-index:150}.modal-content{background:var(--dark-gray);border:1px solid #333;border-radius:12px;padding:24px;min-width:400px;max-width:90vw}.modal-content h2{margin-bottom:16px;font-size:18px}.modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}.error-message{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:8px;padding:10px 14px;color:#ef4444;font-size:13px;margin-top:12px}@media(max-width:767px){.app-header{padding:0 12px}.header-center{flex:0 1 auto;min-width:0}.model-selector{min-width:120px;max-width:160px;font-size:12px}.coin-display{font-size:12px;padding:3px 8px}.sidebar{position:fixed;top:56px;left:0;bottom:0;z-index:100;transform:translateX(-100%);transition:transform .3s;width:280px}.sidebar.open{transform:translateX(0)}.menu-btn{display:block}.message{max-width:95%}.input-area{padding:10px 12px}.message-form{padding:6px 10px}.message-form textarea{font-size:14px}}@media(max-width:480px){.app-header{padding:0 8px}.header-left .logo{font-size:14px}.model-selector{min-width:80px;max-width:120px;font-size:11px;padding:4px 8px}.coin-display{font-size:11px;padding:2px 6px}.header-right{gap:8px}.messages-container{padding:12px}.message{max-width:98%;padding:10px 12px;font-size:13px}}`; }

function getLoginCSS() { return `body{background:var(--black);display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Inter,system-ui,-apple-system,sans-serif;color:var(--white);margin:0}.auth-container{width:100%;max-width:400px;padding:20px}.auth-card{background:var(--dark-gray);border:1px solid #333;border-radius:16px;padding:32px}.auth-header{text-align:center;margin-bottom:28px}.auth-header .logo{font-size:24px;font-weight:700;letter-spacing:-1px;color:var(--white);margin-bottom:8px;display:block}.auth-header .subtitle{color:#999;font-size:14px}.auth-form{display:flex;flex-direction:column;gap:4px}.auth-form .btn-primary{width:100%;padding:12px;font-size:15px;margin-top:8px}.auth-divider{display:flex;align-items:center;gap:12px;margin:20px 0;color:#666;font-size:12px}.auth-divider::before,.auth-divider::after{content:"";flex:1;height:1px;background:#333}.btn-google{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:10px;background:var(--medium-gray);border:1px solid #333;border-radius:8px;color:var(--white);font-size:14px;cursor:pointer;transition:background .2s}.btn-google:hover{background:#333}.auth-footer{text-align:center;margin-top:20px;font-size:13px;color:#999}.auth-footer a{color:var(--lemon-green);text-decoration:none}.auth-footer a:hover{text-decoration:underline}@media(max-width:480px){.auth-container{padding:12px}.auth-card{padding:24px 20px}.auth-header .logo{font-size:20px}.auth-header .subtitle{font-size:13px}.auth-form .btn-primary{font-size:14px;padding:10px}.btn-google{font-size:13px;padding:8px}.auth-footer{font-size:12px}}@media(max-width:360px){.auth-card{padding:20px 16px}.auth-header .logo{font-size:18px}.auth-header{margin-bottom:20px}.auth-divider{margin:16px 0}}`; }

function getChatCSS() { return `.app-body{display:flex;height:calc(100vh - 56px);margin-top:56px}.sidebar{width:280px;background:var(--dark-gray);border-right:1px solid #2a2a2a;display:flex;flex-direction:column;overflow:hidden}.sidebar-header{padding:16px;border-bottom:1px solid #2a2a2a}.workspace-list{flex:0 0 auto;max-height:200px;overflow-y:auto;padding:8px;border-bottom:1px solid #2a2a2a}.conversation-list{flex:1;overflow-y:auto;padding:8px}.list-title{padding:8px 12px;font-size:11px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:1px}.main-content{flex:1;display:flex;flex-direction:column;overflow:hidden}.empty-state{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#666;text-align:center;padding:40px}.empty-state h2{font-size:20px;font-weight:600;color:#999}.empty-state p{font-size:14px}.chat-area{flex:1;display:flex;flex-direction:column;overflow:hidden}.messages-container{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:12px}.input-area{padding:16px 20px;border-top:1px solid #2a2a2a;background:var(--black)}.message-form{display:flex;gap:8px;align-items:flex-end;background:var(--dark-gray);border:1px solid #333;border-radius:12px;padding:8px 12px}.message-form textarea{flex:1;background:none;border:none;color:var(--white);font-size:14px;resize:none;outline:none;max-height:200px;font-family:inherit}.send-btn{background:var(--lemon-green);border:none;border-radius:8px;padding:8px;cursor:pointer;color:var(--black);display:flex;align-items:center;justify-content:center;transition:opacity .2s}.send-btn:hover{opacity:.9}.message{display:flex;flex-direction:column;max-width:80%;padding:12px 16px;border-radius:12px;font-size:14px;line-height:1.5}.message.user{background:var(--lemon-green);color:var(--black);align-self:flex-end;border-bottom-right-radius:4px}.message.assistant{background:var(--medium-gray);color:var(--white);align-self:flex-start;border-bottom-left-radius:4px}.message.system{background:transparent;color:#666;font-style:italic;font-size:12px;align-self:center;max-width:100%}@media(max-width:767px){.sidebar{position:fixed;top:56px;left:0;bottom:0;z-index:100;transform:translateX(-100%);transition:transform .3s;width:85vw;max-width:320px}.sidebar.open{transform:translateX(0)}.menu-btn{display:block}.message{max-width:92%;padding:10px 14px;font-size:13px}.messages-container{padding:12px;gap:8px}.empty-state{padding:24px}.empty-state h2{font-size:16px}.empty-state p{font-size:13px}}@media(max-width:480px){.sidebar{width:100vw;max-width:100%}.message{max-width:95%;padding:8px 12px;font-size:13px;line-height:1.4}.messages-container{padding:8px;gap:6px}.input-area{padding:8px 10px}.message-form{border-radius:10px;padding:6px 10px}.message-form textarea{font-size:14px}.send-btn{padding:6px}.empty-state h2{font-size:15px}.empty-state p{font-size:12px}}`; }

function getSettingsCSS() { return `.settings-main{display:flex;height:calc(100vh - 56px);margin-top:56px}.settings-nav{width:220px;background:var(--dark-gray);border-right:1px solid #2a2a2a;padding:16px 8px;display:flex;flex-direction:column;gap:2px}.settings-nav-item{padding:10px 12px;border-radius:6px;font-size:13px;color:#999;text-decoration:none;transition:all .2s}.settings-nav-item:hover{background:var(--medium-gray);color:var(--white)}.settings-nav-item.active{background:var(--medium-gray);color:var(--white)}.settings-content{flex:1;padding:32px;overflow-y:auto}.settings-tab{max-width:600px}.settings-tab h2{margin-bottom:24px;font-size:20px;font-weight:600}.api-keys-list{display:flex;flex-direction:column;gap:8px;margin-top:16px}.api-key-item{display:flex;align-items:center;justify-content:space-between;background:var(--medium-gray);padding:12px 16px;border-radius:8px;font-size:13px}.coin-info{background:var(--medium-gray);border-radius:12px;padding:24px;margin-bottom:20px;display:flex;flex-direction:column;gap:8px}.coin-info .balance{font-size:36px;font-weight:700;color:var(--lemon-green)}.coin-history{display:flex;flex-direction:column;gap:6px}.coin-history-item{display:flex;justify-content:space-between;padding:8px 12px;font-size:13px;color:#999;border-bottom:1px solid #2a2a2a}@media(max-width:767px){.settings-nav{display:none}.settings-content{padding:20px}.settings-tab{max-width:100%}.settings-tab h2{font-size:18px;margin-bottom:16px}.coin-info .balance{font-size:28px}}@media(max-width:480px){.settings-main{flex-direction:column}.settings-nav{display:flex;width:100%;flex-direction:row;overflow-x:auto;padding:8px 12px;gap:4px;border-right:none;border-bottom:1px solid #2a2a2a}.settings-nav-item{white-space:nowrap;padding:6px 10px;font-size:12px}.settings-content{padding:16px}.api-key-item{flex-direction:column;align-items:flex-start;gap:8px}.coin-info{padding:16px}.coin-info .balance{font-size:24px}}`; }

function getWorkspacesCSS() { return `.workspaces-main{height:calc(100vh - 56px);margin-top:56px;padding:32px;overflow-y:auto}.workspaces-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}.workspaces-header h1{font-size:24px;font-weight:700}.workspaces-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}.workspace-card{background:var(--dark-gray);border:1px solid #333;border-radius:12px;padding:20px;cursor:pointer;transition:border-color .2s}.workspace-card:hover{border-color:var(--lemon-green)}.workspace-card h3{font-size:16px;font-weight:600;margin-bottom:4px}.workspace-card p{font-size:12px;color:#666}.workspace-actions{display:flex;gap:8px;margin-top:12px}@media(max-width:767px){.workspaces-main{padding:20px}.workspaces-header h1{font-size:20px}.workspaces-grid{grid-template-columns:1fr;gap:12px}.workspace-card{padding:16px}}@media(max-width:480px){.workspaces-main{padding:16px 12px}.workspaces-header{flex-direction:column;align-items:stretch;gap:12px}.workspaces-header h1{font-size:18px}.workspaces-grid{gap:10px}.workspace-card{padding:14px}.workspace-card h3{font-size:15px}}`; }

function getAppJS() { return `// App JS`; }

function getApiJS() { return `const API={getCsrfToken(){const m=document.cookie.match(/csrf_token=([^;]+)/);return m?m[1]:''},async request(url,options={}){try{const csrfToken=this.getCsrfToken();const headers={"Content-Type":"application/json"};if(options.method&&options.method!=='GET'&&csrfToken){headers['X-CSRF-Token']=csrfToken}headers["X-Requested-With"]="XMLHttpRequest";const config={headers:{...headers,...options.headers},credentials:"include",...options};const response=await fetch(url,config);const data=await response.json();if(!response.ok){throw new Error(data.error?.message||"Request failed")}return data}catch(e){throw e}},async get(url){return this.request(url,{method:"GET"})},async post(url,body){return this.request(url,{method:"POST",body:JSON.stringify(body)})},async put(url,body){return this.request(url,{method:"PUT",body:JSON.stringify(body)})},async del(url){return this.request(url,{method:"DELETE"})},async login(email,password){return this.post("/auth/login",{email,password})},async register(email,password,name){return this.post("/auth/register",{email,password,name})},async logout(){return this.post("/auth/logout",{})},async getProfile(){return this.get("/settings/profile")},async updateProfile(data){return this.put("/settings/profile",data)},async updatePassword(current,newPass){return this.put("/settings/password",{current_password:current,new_password:newPass})},async getApiKeys(){return this.get("/settings/api-keys")},async generateApiKey(name){return this.post("/settings/api-keys",{name})},async revokeApiKey(id){return this.del("/settings/api-keys/"+id)},async getCoins(){return this.get("/settings/coins")},async getCoinHistory(){return this.get("/settings/coins")},async getWorkspaces(){return this.get("/workspaces")},async createWorkspace(name){return this.post("/workspaces",{name})},async updateWorkspace(id,name){return this.put("/workspaces/"+id,{name})},async deleteWorkspace(id){return this.del("/workspaces/"+id)},async getConversations(workspaceId){return this.get("/conversations?workspace_id="+workspaceId)},async createConversation(workspaceId,title,model){return this.post("/conversations",{workspace_id:workspaceId,title,model_used:model})},async getConversation(id){return this.get("/conversations/"+id)},async deleteConversation(id){return this.del("/conversations/"+id)},async sendMessage(conversationId,message,stream=false){return this.post("/conversations/"+conversationId+"/messages",{message,stream})},async getModels(){return this.get("/v1/models")},async exportData(){return this.get("/settings/export")},async importData(data){return this.post("/settings/import",data)}};`; }

function getStoreJS() { return `const Store={db:null,async init(){return new Promise((resolve)=>{const request=indexedDB.open("KakarotAI",1);request.onerror=()=>resolve();request.onsuccess=(e)=>{this.db=e.target.result;resolve()};request.onupgradeneeded=(e)=>{const db=e.target.result;db.createObjectStore("session",{keyPath:"key"});db.createObjectStore("cache",{keyPath:"key"})}})},async get(store,key){return new Promise((resolve)=>{if(!this.db)return resolve(null);const tx=this.db.transaction(store,"readonly");const req=tx.objectStore(store).get(key);req.onsuccess=()=>resolve(req.result?.value||null);req.onerror=()=>resolve(null)})},async set(store,key,value){return new Promise((resolve)=>{if(!this.db)return resolve();const tx=this.db.transaction(store,"readwrite");tx.objectStore(store).put({key,value});tx.oncomplete=()=>resolve()})},async remove(store,key){return new Promise((resolve)=>{if(!this.db)return resolve();const tx=this.db.transaction(store,"readwrite");tx.objectStore(store).delete(key);tx.oncomplete=()=>resolve()})},async clear(store){return new Promise((resolve)=>{if(!this.db)return resolve();const tx=this.db.transaction(store,"readwrite");tx.objectStore(store).clear();tx.oncomplete=()=>resolve()})}};`; }

function getLoginJS() { return `document.addEventListener("DOMContentLoaded",()=>{const loginForm=document.getElementById("loginForm");const registerForm=document.getElementById("registerForm");const googleBtn=document.getElementById("googleLogin")||document.getElementById("googleRegister");const errorDiv=document.getElementById("errorMessage");if(loginForm){loginForm.addEventListener("submit",async(e)=>{e.preventDefault();const email=document.getElementById("email").value;const password=document.getElementById("password").value;try{const result=await API.login(email,password);if(result.success){window.location.href="/chat"}}catch(err){errorDiv.textContent=err.message;errorDiv.classList.remove("hidden")}})}if(registerForm){registerForm.addEventListener("submit",async(e)=>{e.preventDefault();const name=document.getElementById("name").value;const email=document.getElementById("email").value;const password=document.getElementById("password").value;try{const result=await API.register(email,password,name);if(result.success){window.location.href="/chat"}}catch(err){errorDiv.textContent=err.message;errorDiv.classList.remove("hidden")}})}if(googleBtn){googleBtn.addEventListener("click",()=>{window.location.href="/auth/google"})}});`; }

function getChatJS() { return `document.addEventListener("DOMContentLoaded",async()=>{await Store.init();let currentWorkspace=null;let currentConversation=null;let userData=null;async function loadUser(){try{const result=await API.getProfile();userData=result.user;document.getElementById("coinCount").textContent=userData.coins;document.getElementById("avatarInitials").textContent=userData.name.charAt(0).toUpperCase();document.getElementById("userAvatar").addEventListener("click",(e)=>{e.stopPropagation();document.getElementById("avatarDropdown").classList.toggle("hidden")});document.addEventListener("click",()=>{document.getElementById("avatarDropdown").classList.add("hidden")})}catch(e){window.location.href="/login"}}async function loadModels(){try{const result=await API.getModels();const selector=document.getElementById("modelSelector");providerGroups={};result.data.forEach(model=>{if(!providerGroups[model.provider])providerGroups[model.provider]={name:model.provider.charAt(0).toUpperCase()+model.provider.slice(1),logo:model.provider_logo,models:[]};providerGroups[model.provider].models.push(model)});selector.innerHTML="";Object.entries(providerGroups).forEach(([key,group])=>{const optgroup=document.createElement("optgroup");optgroup.label=group.name;group.models.forEach(model=>{const option=document.createElement("option");option.value=model.id;option.textContent=model.name;option.dataset.supportsThinking=model.supports_thinking;optgroup.appendChild(option)});selector.appendChild(optgroup)});selector.addEventListener("change",()=>{const selected=selector.options[selector.selectedIndex];const supportsThinking=selected.dataset.supportsThinking==="true";const toggle=document.getElementById("thinkingToggle");if(supportsThinking){toggle.classList.remove("hidden")}else{toggle.classList.add("hidden")}})}catch(e){}}async function loadWorkspaces(){try{const result=await API.getWorkspaces();const list=document.getElementById("workspaceList");list.innerHTML="";result.workspaces.forEach(ws=>{const div=document.createElement("div");div.className="workspace-item";div.innerHTML='<div class="workspace-name">'+ws.name+"</div>";div.style.cssText="padding:8px 12px;cursor:pointer;border-radius:6px;font-size:13px;transition:background .2s";div.addEventListener("mouseenter",()=>div.style.background="#2a2a2a");div.addEventListener("mouseleave",()=>div.style.background="");div.addEventListener("click",()=>selectWorkspace(ws));list.appendChild(div)});if(result.workspaces.length>0&&!currentWorkspace){selectWorkspace(result.workspaces[0])}}catch(e){}}async function selectWorkspace(ws){currentWorkspace=ws;document.querySelectorAll(".workspace-item").forEach(el=>el.style.background="");const items=document.getElementById("workspaceList").children;Array.from(items).forEach(item=>{if(item.textContent===ws.name)item.style.background="var(--medium-gray)"});await loadConversations()}async function loadConversations(){try{const result=await API.getConversations(currentWorkspace.id);const list=document.getElementById("conversationList");const title=list.querySelector(".list-title");list.innerHTML="";list.appendChild(title);result.conversations.forEach(conv=>{const div=document.createElement("div");div.className="conv-item";div.style.cssText="padding:8px 12px;cursor:pointer;border-radius:6px;font-size:13px;transition:background .2s;margin:2px 0";div.textContent=conv.title;div.addEventListener("click",()=>selectConversation(conv));list.appendChild(div)});if(!currentConversation||currentConversation.workspace_id!==currentWorkspace.id){document.getElementById("emptyState").classList.remove("hidden");document.getElementById("chatArea").classList.add("hidden")}}catch(e){}}async function selectConversation(conv){currentConversation=conv;document.getElementById("emptyState").classList.add("hidden");document.getElementById("chatArea").classList.remove("hidden");const result=await API.getConversation(conv.id);const container=document.getElementById("messagesContainer");container.innerHTML="";result.messages.forEach(msg=>{appendMessage(msg.role,msg.content)})}function appendMessage(role,content){const container=document.getElementById("messagesContainer");const div=document.createElement("div");div.className="message "+role;div.textContent=content;container.appendChild(div);container.scrollTop=container.scrollHeight}document.getElementById("messageForm").addEventListener("submit",async(e)=>{e.preventDefault();const input=document.getElementById("messageInput");const message=input.value.trim();if(!message)return;input.value="";if(!currentConversation){const modelSel=document.getElementById("modelSelector");const model=modelSel?modelSel.value:"gpt54";const title=message.slice(0,50);try{const result=await API.createConversation(currentWorkspace.id,title,model);currentConversation=result.conversation;document.getElementById("emptyState").classList.add("hidden");document.getElementById("chatArea").classList.remove("hidden");const convList=document.getElementById("conversationList");const titleEl=convList.querySelector(".list-title");const div=document.createElement("div");div.className="conv-item";div.style.cssText="padding:8px 12px;cursor:pointer;border-radius:6px;font-size:13px;transition:background .2s;margin:2px 0";div.textContent=title;div.addEventListener("click",()=>selectConversation(currentConversation));convList.insertBefore(div,titleEl.nextSibling)}catch(err){appendMessage("system","Error: "+err.message);return}}appendMessage("user",message);try{const result=await API.sendMessage(currentConversation.id,message,false);if(result.choices&&result.choices[0]){appendMessage("assistant",result.choices[0].message.content);const coinInfo=await API.getCoins();document.getElementById("coinCount").textContent=coinInfo.coins}}catch(err){appendMessage("system","Error: "+err.message)}});document.getElementById("menuToggle").addEventListener("click",()=>{document.getElementById("sidebar").classList.toggle("open");document.getElementById("overlay").classList.toggle("hidden")});document.getElementById("overlay").addEventListener("click",()=>{document.getElementById("sidebar").classList.remove("open");document.getElementById("overlay").classList.add("hidden")});document.getElementById("logoutBtn").addEventListener("click",async(e)=>{e.preventDefault();await API.logout();window.location.href="/login"});document.getElementById("newWorkspaceBtn").addEventListener("click",async()=>{const name=prompt("Workspace name:");if(name){await API.createWorkspace(name);await loadWorkspaces()}});document.getElementById("newConvBtn").addEventListener("click",async()=>{if(!currentWorkspace){alert("Select a workspace first");return}const title=prompt("Conversation title:");if(!title)return;const modelSel=document.getElementById("modelSelector");const model=modelSel?modelSel.value:"gpt54";try{const result=await API.createConversation(currentWorkspace.id,title,model);currentConversation=result.conversation;document.getElementById("emptyState").classList.add("hidden");document.getElementById("chatArea").classList.remove("hidden");await loadConversations()}catch(err){alert("Error: "+err.message)}});document.getElementById("coinDisplay").addEventListener("mouseenter",async()=>{const tooltip=document.getElementById("coinTooltip");tooltip.classList.remove("hidden");try{const info=await API.getCoins();const remaining=Math.max(0,Math.floor((info.next_reset-Math.floor(Date.now()/1000))/3600));document.getElementById("resetTimer").textContent=remaining+"h"}catch(e){}});document.getElementById("coinDisplay").addEventListener("mouseleave",()=>{document.getElementById("coinTooltip").classList.add("hidden")});await loadUser();await loadModels();await loadWorkspaces()});`; }

function getSettingsJS() { return `document.addEventListener("DOMContentLoaded",async()=>{await Store.init();let userData=null;async function loadProfile(){try{const result=await API.getProfile();userData=result.user;document.getElementById("profileName").value=userData.name;document.getElementById("profileEmail").value=userData.email;document.getElementById("coinCount").textContent=userData.coins}catch(e){window.location.href="/login"}}document.querySelectorAll(".settings-nav-item").forEach(item=>{item.addEventListener("click",(e)=>{e.preventDefault();const tab=item.dataset.tab;document.querySelectorAll(".settings-nav-item").forEach(n=>n.classList.remove("active"));item.classList.add("active");document.querySelectorAll(".settings-tab").forEach(t=>t.classList.add("hidden"));document.getElementById(tab+"-tab").classList.remove("hidden")})});document.getElementById("profileForm").addEventListener("submit",async(e)=>{e.preventDefault();const name=document.getElementById("profileName").value;try{await API.updateProfile({name});alert("Profile updated")}catch(err){alert(err.message)}});document.getElementById("passwordForm").addEventListener("submit",async(e)=>{e.preventDefault();const current=document.getElementById("currentPassword").value;const newPass=document.getElementById("newPassword").value;try{await API.updatePassword(current,newPass);alert("Password updated");document.getElementById("passwordForm").reset()}catch(err){alert(err.message)}});document.getElementById("generateApiKeyBtn").addEventListener("click",async()=>{const name=prompt("Key name:");if(name){try{const result=await API.generateApiKey(name);alert("API Key: "+result.api_key+"\n\nSave this key - it will not be shown again.");await loadApiKeys()}catch(err){alert(err.message)}}});async function loadApiKeys(){try{const result=await API.getApiKeys();const list=document.getElementById("apiKeysList");list.innerHTML="";result.api_keys.forEach(key=>{const div=document.createElement("div");div.className="api-key-item";div.innerHTML='<span>'+key.name+'</span><button class="btn-secondary" data-id="'+key.id+'" style="padding:4px 8px;font-size:12px">Revoke</button>';list.appendChild(div);div.querySelector("button").addEventListener("click",async()=>{if(confirm("Revoke this key?")){await API.revokeApiKey(key.id);await loadApiKeys()}})})}catch(e){}}async function loadCoins(){try{const result=await API.getCoins();const info=document.getElementById("coinInfo");info.innerHTML='<div class="balance">'+result.coins+' coins</div><div>Used today: '+result.used_today+'</div><div>Total used: '+result.total_used+'</div>';const history=await API.getCoinHistory();const histDiv=document.getElementById("coinHistory");histDiv.innerHTML="<h3>Transaction History</h3>";if(history.logs){history.logs.forEach(log=>{const item=document.createElement("div");item.className="coin-history-item";const details=JSON.parse(log.details||"{}");item.innerHTML='<span>'+details.model+"</span><span>-"+details.coins_deducted+" coins</span>";histDiv.appendChild(item)})}}catch(e){}}document.getElementById("exportDataBtn").addEventListener("click",async()=>{try{const result=await API.exportData();const blob=new Blob([JSON.stringify(result,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="kakarot-export.json";a.click()}catch(err){alert(err.message)}});document.getElementById("importDataBtn").addEventListener("click",()=>{document.getElementById("importFileInput").click()});document.getElementById("importFileInput").addEventListener("change",async(e)=>{const file=e.target.files[0];if(!file)return;try{const text=await file.text();const data=JSON.parse(text);await API.importData(data);alert("Data imported successfully")}catch(err){alert("Import failed: "+err.message)}});document.querySelectorAll("[data-tab]").forEach(item=>{if(item.dataset.tab==="api-keys"){item.addEventListener("click",loadApiKeys)}if(item.dataset.tab==="coins"){item.addEventListener("click",loadCoins)}});await loadProfile()});`; }

function getWorkspacesJS() { return `document.addEventListener("DOMContentLoaded",async()=>{let workspaces=[];async function load(){try{const result=await API.getWorkspaces();workspaces=result.workspaces;const grid=document.getElementById("workspacesList");grid.innerHTML="";workspaces.forEach(ws=>{const card=document.createElement("div");card.className="workspace-card";card.innerHTML='<h3>'+ws.name+'</h3><p>Created '+new Date(ws.created_at*1000).toLocaleDateString()+"</p><div class='workspace-actions'><button class='btn-secondary' data-id='"+ws.id+"' data-name='"+ws.name+"' style='padding:4px 12px;font-size:12px'>Edit</button><button class='btn-secondary' data-id='"+ws.id+"' style='padding:4px 12px;font-size:12px;color:#ef4444'>Delete</button></div>";card.addEventListener("click",(e)=>{if(e.target.tagName==="BUTTON")return;window.location.href="/chat"});grid.appendChild(card)});document.querySelectorAll(".workspace-card .btn-secondary:first-child").forEach(btn=>{btn.addEventListener("click",(e)=>{e.stopPropagation();const id=btn.dataset.id;const name=btn.dataset.name;document.getElementById("workspaceId").value=id;document.getElementById("workspaceName").value=name;document.getElementById("modalTitle").textContent="Edit Workspace";document.getElementById("workspaceModal").classList.remove("hidden")})});document.querySelectorAll(".workspace-card .btn-secondary:last-child").forEach(btn=>{btn.addEventListener("click",async(e)=>{e.stopPropagation();const id=btn.dataset.id;if(confirm("Delete this workspace?")){await API.deleteWorkspace(id);await load()}})});const coinInfo=await API.getCoins();document.getElementById("coinCount").textContent=coinInfo.coins}catch(e){window.location.href="/login"}}document.getElementById("createWorkspaceBtn").addEventListener("click",()=>{document.getElementById("workspaceId").value="";document.getElementById("workspaceName").value="";document.getElementById("modalTitle").textContent="New Workspace";document.getElementById("workspaceModal").classList.remove("hidden")});document.getElementById("cancelModal").addEventListener("click",()=>{document.getElementById("workspaceModal").classList.add("hidden")});document.getElementById("workspaceForm").addEventListener("submit",async(e)=>{e.preventDefault();const id=document.getElementById("workspaceId").value;const name=document.getElementById("workspaceName").value;if(id){await API.updateWorkspace(id,name)}else{await API.createWorkspace(name)}document.getElementById("workspaceModal").classList.add("hidden");await load()});await load()});`; }

const getChatCSSStr = getChatCSS;
const getSettingsCSSStr = getSettingsCSS;
const getWorkspacesCSSStr = getWorkspacesCSS;
const getAppCSSStr = getAppCSS;
const getLoginCSSStr = getLoginCSS;
const getLoginJSStr = getLoginJS;
const getChatJSStr = getChatJS;
const getSettingsJSStr = getSettingsJS;
const getWorkspacesJSStr = getWorkspacesJS;
const getApiJSStr = getApiJS;
const getStoreJSStr = getStoreJS;
const getAppJSStr = getAppJS;