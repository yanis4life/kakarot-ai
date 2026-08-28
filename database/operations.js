import { v4 as uuidv4 } from 'uuid';

export async function createUser(db, { email, passwordHash, name, ipAddress }) {
  const id = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(
    `INSERT INTO users (id, email, password_hash, name, role, coins, last_coin_reset, created_at, updated_at, ip_address)
     VALUES (?, ?, ?, ?, 'user', 30, ?, ?, ?, ?)`
  ).bind(id, email, passwordHash, name, now, now, now, ipAddress).run();
  return id;
}

export async function getUserByEmail(db, email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
}

export async function getUserById(db, id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
}

export async function updateUser(db, id, fields) {
  const sets = [];
  const values = [];
  for (const [key, value] of Object.entries(fields)) {
    sets.push(`${key} = ?`);
    values.push(value);
  }
  values.push(id);
  return db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...values).run();
}

export async function createWorkspace(db, userId, name) {
  const id = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(
    'INSERT INTO workspaces (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, userId, name, now, now).run();
  return id;
}

export async function listWorkspaces(db, userId) {
  return db.prepare('SELECT * FROM workspaces WHERE user_id = ? ORDER BY updated_at DESC').bind(userId).all();
}

export async function updateWorkspace(db, id, userId, name) {
  const now = Math.floor(Date.now() / 1000);
  return db.prepare('UPDATE workspaces SET name = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .bind(name, now, id, userId).run();
}

export async function deleteWorkspace(db, id, userId) {
  await db.prepare('DELETE FROM conversations WHERE workspace_id = ? AND user_id = ?').bind(id, userId).run();
  return db.prepare('DELETE FROM workspaces WHERE id = ? AND user_id = ?').bind(id, userId).run();
}

export async function createConversation(db, userId, workspaceId, title, modelUsed, thinkingEnabled) {
  const id = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(
    `INSERT INTO conversations (id, user_id, workspace_id, title, model_used, thinking_enabled, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, userId, workspaceId, title, modelUsed, thinkingEnabled ? 1 : 0, now, now).run();
  return id;
}

export async function listConversations(db, userId, workspaceId) {
  return db.prepare(
    'SELECT * FROM conversations WHERE user_id = ? AND workspace_id = ? AND is_archived = 0 ORDER BY updated_at DESC'
  ).bind(userId, workspaceId).all();
}

export async function getConversation(db, id, userId) {
  return db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').bind(id, userId).first();
}

export async function updateConversation(db, id, userId, fields) {
  const sets = [];
  const values = [];
  for (const [key, value] of Object.entries(fields)) {
    sets.push(`${key} = ?`);
    values.push(value);
  }
  values.push(id, userId);
  return db.prepare(`UPDATE conversations SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`).bind(...values).run();
}

export async function deleteConversation(db, id, userId) {
  await db.prepare('DELETE FROM messages WHERE conversation_id = ?').bind(id).run();
  await db.prepare('DELETE FROM summaries WHERE conversation_id = ?').bind(id).run();
  return db.prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?').bind(id, userId).run();
}

export async function createMessage(db, conversationId, role, content, isSummary = 0) {
  const id = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(
    'INSERT INTO messages (id, conversation_id, role, content, created_at, is_summary) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, conversationId, role, content, now, isSummary).run();
  return id;
}

export async function getMessages(db, conversationId, limit = 10) {
  return db.prepare(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
  ).bind(conversationId).all();
}

export async function getRecentMessages(db, conversationId, limit = 10) {
  return db.prepare(
    'SELECT * FROM messages WHERE conversation_id = ? AND is_summary = 0 ORDER BY created_at DESC LIMIT ?'
  ).bind(conversationId, limit).all();
}

export async function getSummary(db, conversationId) {
  return db.prepare(
    'SELECT * FROM summaries WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(conversationId).first();
}

export async function createSummary(db, conversationId, content, messageCount) {
  const id = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(
    'INSERT INTO summaries (id, conversation_id, content, message_count, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, conversationId, content, messageCount, now).run();
  return id;
}

export async function createApiKey(db, userId, keyHash, name, expiresAt = null) {
  const id = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(
    'INSERT INTO api_keys (id, user_id, key_hash, name, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, userId, keyHash, name, now, expiresAt).run();
  return id;
}

export async function listApiKeys(db, userId) {
  return db.prepare('SELECT id, name, last_used, created_at, expires_at, is_active FROM api_keys WHERE user_id = ? ORDER BY created_at DESC')
    .bind(userId).all();
}

export async function deleteApiKey(db, id, userId) {
  return db.prepare('DELETE FROM api_keys WHERE id = ? AND user_id = ?').bind(id, userId).run();
}

export async function createAuditLog(db, userId, action, details, ip) {
  const id = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(
    'INSERT INTO audit_logs (id, user_id, action, details, ip, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, userId, action, JSON.stringify(details), ip, now).run();
}

export async function getAuditLogs(db, filters = {}) {
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];
  if (filters.userId) { query += ' AND user_id = ?'; params.push(filters.userId); }
  if (filters.action) { query += ' AND action = ?'; params.push(filters.action); }
  query += ' ORDER BY created_at DESC';
  if (filters.limit) { query += ' LIMIT ?'; params.push(filters.limit); }
  return db.prepare(query).bind(...params).all();
}

export async function checkIpRestriction(db, ipAddress) {
  return db.prepare('SELECT * FROM ip_restrictions WHERE ip_address = ?').bind(ipAddress).first();
}

export async function incrementIpCount(db, ipAddress) {
  const existing = await checkIpRestriction(db, ipAddress);
  const now = Math.floor(Date.now() / 1000);
  if (existing) {
    return db.prepare('UPDATE ip_restrictions SET account_count = account_count + 1, updated_at = ? WHERE ip_address = ?')
      .bind(now, ipAddress).run();
  } else {
    const id = uuidv4();
    return db.prepare(
      'INSERT INTO ip_restrictions (id, ip_address, account_count, created_at, updated_at) VALUES (?, ?, 1, ?, ?)'
    ).bind(id, ipAddress, now, now).run();
  }
}

export async function decrementIpCount(db, ipAddress) {
  const existing = await checkIpRestriction(db, ipAddress);
  if (existing) {
    const now = Math.floor(Date.now() / 1000);
    if (existing.account_count <= 1) {
      return db.prepare('DELETE FROM ip_restrictions WHERE ip_address = ?').bind(ipAddress).run();
    }
    return db.prepare('UPDATE ip_restrictions SET account_count = account_count - 1, updated_at = ? WHERE ip_address = ?')
      .bind(now, ipAddress).run();
  }
}

export async function getModelSettings(db) {
  return db.prepare('SELECT * FROM model_settings').all();
}

export async function upsertModelSetting(db, modelKey, coinCost, isEnabled, rateLimit) {
  const now = Math.floor(Date.now() / 1000);
  const existing = await db.prepare('SELECT * FROM model_settings WHERE model_key = ?').bind(modelKey).first();
  if (existing) {
    return db.prepare(
      'UPDATE model_settings SET coin_cost = ?, is_enabled = ?, rate_limit_per_minute = ?, updated_at = ? WHERE model_key = ?'
    ).bind(coinCost, isEnabled, rateLimit, now, modelKey).run();
  } else {
    const id = uuidv4();
    return db.prepare(
      'INSERT INTO model_settings (id, model_key, coin_cost, is_enabled, rate_limit_per_minute, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, modelKey, coinCost, isEnabled, rateLimit, now).run();
  }
}

export async function getAllUsers(db, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  return db.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(limit, offset).all();
}

export async function getSystemStats(db) {
  const totalUsers = await db.prepare('SELECT COUNT(*) as count FROM users').first();
  const totalConversations = await db.prepare('SELECT COUNT(*) as count FROM conversations').first();
  const totalMessages = await db.prepare('SELECT COUNT(*) as count FROM messages').first();
  const totalCoinsUsed = await db.prepare('SELECT SUM(coins_used) as total FROM conversations').first();
  return {
    totalUsers: totalUsers.count,
    totalConversations: totalConversations.count,
    totalMessages: totalMessages.count,
    totalCoinsUsed: totalCoinsUsed.total || 0
  };
}