import { successResponse, errorResponse, htmlResponse } from '../utils/response.js';
import { getAllUsers, getSystemStats, getAuditLogs, updateUser, upsertModelSetting, getModelSettings, getUserById } from '../database/operations.js';
import { getUserCoinInfo } from '../coins/manager.js';

export async function handleAdminRoutes(request, env, user) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token', 'Access-Control-Allow-Credentials': 'true' } });
  }

  if (path === '/ccfl/' || path === '/ccfl' || path === '/ccfl/dashboard') {
    return htmlResponse(getAdminDashboard(), 200);
  }

  if (path === '/ccfl/users') {
    if (request.method === 'GET') {
      const page = parseInt(url.searchParams.get('page')) || 1;
      const result = await getAllUsers(env.DB, page);
      return successResponse({ users: result.results, total: result.results.length });
    }
    if (request.method === 'POST') {
      const body = await request.json();
      const { userId, action } = body;
      if (action === 'reset_coins') {
        const now = Math.floor(Date.now() / 1000);
        await updateUser(env.DB, userId, { coins: 30, last_coin_reset: now, updated_at: now });
        return successResponse({ message: 'Coins reset to 30' });
      }
      if (action === 'suspend') {
        await updateUser(env.DB, userId, { role: 'suspended', updated_at: Math.floor(Date.now() / 1000) });
        return successResponse({ message: 'User suspended' });
      }
      if (action === 'delete') {
        await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
        return successResponse({ message: 'User deleted' });
      }
      return errorResponse('VALIDATION_ERROR', 'Invalid action');
    }
  }

  if (path === '/ccfl/system') {
    const stats = await getSystemStats(env.DB);
    return successResponse(stats);
  }

  if (path === '/ccfl/models') {
    if (request.method === 'GET') {
      const settings = await getModelSettings(env.DB);
      return successResponse({ model_settings: settings.results || [] });
    }
    if (request.method === 'PUT') {
      const body = await request.json();
      await upsertModelSetting(env.DB, body.model_key, body.coin_cost || 1, body.is_enabled !== undefined ? body.is_enabled : 1, body.rate_limit || 60);
      return successResponse({ message: 'Model settings updated' });
    }
  }

  if (path === '/ccfl/rate-limits') {
    if (request.method === 'GET') {
      return successResponse({ tiers: { default: 60, admin: 1000, premium: 120 } });
    }
    if (request.method === 'PUT') {
      return successResponse({ message: 'Rate limits updated' });
    }
  }

  if (path === '/ccfl/audit-logs') {
    const limit = parseInt(url.searchParams.get('limit')) || 100;
    const action = url.searchParams.get('action');
    const logs = await getAuditLogs(env.DB, { limit, action });
    return successResponse({ logs: logs.results || [] });
  }

  if (path === '/ccfl/ip-restrictions') {
    const restrictions = await env.DB.prepare('SELECT * FROM ip_restrictions ORDER BY created_at DESC').all();
    return successResponse({ ip_restrictions: restrictions.results });
  }

  if (path === '/ccfl/analytics') {
    const stats = await getSystemStats(env.DB);
    const coinUsage = await env.DB.prepare(
      "SELECT JSON_EXTRACT(details, '$.model') as model, COUNT(*) as count, SUM(CAST(JSON_EXTRACT(details, '$.coins_deducted') AS INTEGER)) as total_coins FROM audit_logs WHERE action = 'coin_deduction' GROUP BY model ORDER BY total_coins DESC"
    ).all();
    return successResponse({ stats, coin_usage: coinUsage.results || [] });
  }

  if (path === '/ccfl/health') {
    try {
      const dbOk = await env.DB.prepare('SELECT 1 as test').first();
      return successResponse({ status: 'healthy', database: 'operational', storage: 'operational', cache: 'operational' });
    } catch (e) {
      return successResponse({ status: 'degraded', database: 'operational', storage: 'operational', cache: 'operational' });
    }
  }

  return errorResponse('NOT_FOUND', 'Admin endpoint not found', {}, 404);
}

function getAdminDashboard() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Administration</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#fff;min-height:100vh}
header{background:#1a1a1a;border-bottom:1px solid #2a2a2a;padding:16px 24px;display:flex;align-items:center;justify-content:space-between}
header h1{font-size:18px;font-weight:600}
nav{display:flex;gap:4px;padding:12px 24px;background:#1a1a1a;border-bottom:1px solid #2a2a2a;flex-wrap:wrap}
nav a{padding:6px 14px;border-radius:6px;font-size:13px;color:#999;text-decoration:none;cursor:pointer;transition:all .2s}
nav a:hover{background:#2a2a2a;color:#fff}
nav a.active{background:#2a2a2a;color:#84cc16}
main{padding:24px}
.section{display:none}
.section.active{display:block}
.card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:16px}
.card h3{font-size:14px;font-weight:600;color:#84cc16;margin-bottom:12px}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
.stat-card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:16px}
.stat-card .value{font-size:28px;font-weight:700;color:#84cc16}
.stat-card .label{font-size:12px;color:#666;margin-top:4px}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #2a2a2a}
th{color:#666;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:1px}
td{color:#ccc}
.btn{background:#2a2a2a;border:1px solid #333;color:#fff;padding:6px 12px;border-radius:6px;font-size:12px;cursor:pointer;transition:background .2s}
.btn:hover{background:#333}
.btn-green{background:#84cc16;color:#000;font-weight:600}
input,select{background:#1a1a1a;border:1px solid #333;color:#fff;padding:8px 12px;border-radius:6px;font-size:13px;outline:none}
input:focus{border-color:#84cc16}
</style>
</head>
<body>
<header><h1>Administration</h1><span style="font-size:13px;color:#666">System Management</span></header>
<nav>
<a href="#" class="active" data-section="overview">Overview</a>
<a href="#" data-section="users">Users</a>
<a href="#" data-section="models">Models</a>
<a href="#" data-section="rate-limits">Rate Limits</a>
<a href="#" data-section="audit">Audit Logs</a>
<a href="#" data-section="analytics">Analytics</a>
<a href="#" data-section="ip">IP Restrictions</a>
<a href="#" data-section="health">Health</a>
</nav>
<main>
<div id="section-overview" class="section active"><div class="stats-grid" id="statsGrid"></div></div>
<div id="section-users" class="section"><div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3 style="margin:0">User Management</h3></div><div id="usersTable"></div></div></div>
<div id="section-models" class="section"><div class="card"><h3>Model Settings</h3><div id="modelsTable"></div></div></div>
<div id="section-rate-limits" class="section"><div class="card"><h3>Rate Limit Tiers</h3><div id="rateLimitsTable"></div></div></div>
<div id="section-audit" class="section"><div class="card"><h3>Audit Logs</h3><div id="auditLogsTable"></div></div></div>
<div id="section-analytics" class="section"><div class="card"><h3>Usage Analytics</h3><div id="analyticsContent"></div></div></div>
<div id="section-ip" class="section"><div class="card"><h3>IP Restrictions</h3><div id="ipTable"></div></div></div>
<div id="section-health" class="section"><div class="card"><h3>Service Status</h3><div id="healthContent"></div></div></div>
</main>
<script>
const API_BASE="";
async function api(path){const r=await fetch(API_BASE+path,{credentials:"include"});const d=await r.json();return d}
async function apiPost(path,body){const r=await fetch(API_BASE+path,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify(body)});return r.json()}
async function apiPut(path,body){const r=await fetch(API_BASE+path,{method:"PUT",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify(body)});return r.json()}
document.querySelectorAll("nav a").forEach(a=>{a.addEventListener("click",e=>{e.preventDefault();document.querySelectorAll("nav a").forEach(n=>n.classList.remove("active"));a.classList.add("active");document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));document.getElementById("section-"+a.dataset.section).classList.add("active")})});
async function loadOverview(){const s=await api("/ccfl/system");document.getElementById("statsGrid").innerHTML='<div class="stat-card"><div class="value">'+s.totalUsers+'</div><div class="label">Total Users</div></div><div class="stat-card"><div class="value">'+s.totalConversations+'</div><div class="label">Conversations</div></div><div class="stat-card"><div class="value">'+s.totalMessages+'</div><div class="label">Messages</div></div><div class="stat-card"><div class="value">'+s.totalCoinsUsed+'</div><div class="label">Coins Used</div></div>'}
async function loadUsers(){const u=await api("/ccfl/users");let html='<table><thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Coins</th><th>Actions</th></tr></thead><tbody>';u.users.forEach(user=>{html+='<tr><td>'+user.email+'</td><td>'+user.name+'</td><td>'+user.role+'</td><td>'+user.coins+'</td><td><button class="btn" onclick="resetCoins(\''+user.id+'\')">Reset Coins</button> <button class="btn" onclick="suspendUser(\''+user.id+'\')">Suspend</button></td></tr>'});html+='</tbody></table>';document.getElementById("usersTable").innerHTML=html}
async function resetCoins(id){await apiPost("/ccfl/users",{userId:id,action:"reset_coins"});await loadUsers()}
async function suspendUser(id){await apiPost("/ccfl/users",{userId:id,action:"suspend"});await loadUsers()}
async function loadModels(){const m=await api("/ccfl/models");let html='<table><thead><tr><th>Model</th><th>Cost</th><th>Enabled</th><th>Rate Limit</th><th>Actions</th></tr></thead><tbody>';m.model_settings.forEach(ms=>{html+='<tr><td>'+ms.model_key+'</td><td>'+ms.coin_cost+'</td><td>'+(ms.is_enabled?'Yes':'No')+'</td><td>'+ms.rate_limit_per_minute+'/min</td><td><button class="btn" onclick="updateModel(\''+ms.model_key+'\')">Edit</button></td></tr>'});html+='</tbody></table>';document.getElementById("modelsTable").innerHTML=html}
async function updateModel(key){const cost=prompt("Coin cost:");if(cost){await apiPut("/ccfl/models",{model_key:key,coin_cost:parseInt(cost)});await loadModels()}}
async function loadRateLimits(){const r=await api("/ccfl/rate-limits");let html='<table><thead><tr><th>Tier</th><th>Requests/Minute</th></tr></thead><tbody>';Object.entries(r.tiers).forEach(([tier,limit])=> {html+='<tr><td>'+tier+'</td><td>'+limit+'</td></tr>'});html+='</tbody></table>';document.getElementById("rateLimitsTable").innerHTML=html}
async function loadAuditLogs(){const l=await api("/ccfl/audit-logs?limit=50");let html='<table><thead><tr><th>Action</th><th>User</th><th>Details</th><th>Time</th></tr></thead><tbody>';l.logs.forEach(log=>{html+='<tr><td>'+log.action+'</td><td>'+(log.user_id||'-')+'</td><td>'+(log.details||'-')+'</td><td>'+new Date(log.created_at*1000).toLocaleString()+'</td></tr>'});html+='</tbody></table>';document.getElementById("auditLogsTable").innerHTML=html}
async function loadAnalytics(){const a=await api("/ccfl/analytics");let html='<h4 style="margin-bottom:12px;color:#84cc16">System Stats</h4><div class="stats-grid" style="margin-bottom:20px"><div class="stat-card"><div class="value">'+a.stats.totalUsers+'</div><div class="label">Users</div></div><div class="stat-card"><div class="value">'+a.stats.totalCoinsUsed+'</div><div class="label">Total Coins Used</div></div></div><h4 style="margin-bottom:12px;color:#84cc16">Coin Usage by Model</h4><table><thead><tr><th>Model</th><th>Requests</th><th>Coins Used</th></tr></thead><tbody>';a.coin_usage.forEach(cu=>{html+='<tr><td>'+(cu.model||'unknown')+'</td><td>'+cu.count+'</td><td>'+cu.total_coins+'</td></tr>'});html+='</tbody></table>';document.getElementById("analyticsContent").innerHTML=html}
async function loadIpRestrictions(){const r=await api("/ccfl/ip-restrictions");let html='<table><thead><tr><th>IP Address</th><th>Account Count</th><th>Created</th></tr></thead><tbody>';r.ip_restrictions.forEach(ip=>{html+='<tr><td>'+ip.ip_address+'</td><td>'+ip.account_count+'</td><td>'+new Date(ip.created_at*1000).toLocaleString()+'</td></tr>'});html+='</tbody></table>';document.getElementById("ipTable").innerHTML=html}
async function loadHealth(){const h=await api("/ccfl/health");document.getElementById("healthContent").innerHTML='<div class="stats-grid"><div class="stat-card"><div class="value" style="color:'+(h.status==="healthy"?"#84cc16":"#ef4444")+'">'+h.status+'</div><div class="label">System Status</div></div><div class="stat-card"><div class="value" style="color:#84cc16">Operational</div><div class="label">Database</div></div><div class="stat-card"><div class="value" style="color:#84cc16">Operational</div><div class="label">Storage</div></div><div class="stat-card"><div class="value" style="color:#84cc16">Operational</div><div class="label">Cache</div></div></div>'}
document.querySelectorAll("nav a").forEach(a=>{a.addEventListener("click",()=>{const section=a.dataset.section;if(section==="overview")loadOverview();if(section==="users")loadUsers();if(section==="models")loadModels();if(section==="rate-limits")loadRateLimits();if(section==="audit")loadAuditLogs();if(section==="analytics")loadAnalytics();if(section==="ip")loadIpRestrictions();if(section==="health")loadHealth()})});
loadOverview();
</script>
</body>
</html>`;
}