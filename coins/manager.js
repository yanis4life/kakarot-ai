import { createAuditLog } from '../database/operations.js';

export async function checkCoinsAndReset(db, user) {
  const now = Math.floor(Date.now() / 1000);
  const oneDay = 86400;

  if (user.coins <= 0 && user.last_coin_reset) {
    if (now - user.last_coin_reset >= oneDay) {
      await db.prepare(
        'UPDATE users SET coins = 30, last_coin_reset = ? WHERE id = ?'
      ).bind(now, user.id).run();
      return true;
    }
    return false;
  }

  if (user.last_coin_reset && (now - user.last_coin_reset >= oneDay)) {
    await db.prepare(
      'UPDATE users SET coins = 30, last_coin_reset = ? WHERE id = ?'
    ).bind(now, user.id).run();
    return true;
  }

  return false;
}

export async function checkAndDeductCoins(db, userId, cost, modelKey, conversationId, ip) {
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  if (!user) {
    return { success: false, error: 'USER_NOT_FOUND' };
  }

  const now = Math.floor(Date.now() / 1000);
  const oneDay = 86400;

  if (user.coins <= 0 && user.last_coin_reset && (now - user.last_coin_reset >= oneDay)) {
    await db.prepare(
      'UPDATE users SET coins = 30, last_coin_reset = ? WHERE id = ?'
    ).bind(now, user.id).run();
    const refreshedUser = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    if (refreshedUser.coins < cost) {
      return { success: false, error: 'INSUFFICIENT_COINS' };
    }
    await db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').bind(cost, userId).run();
    await createAuditLog(db, userId, 'coin_deduction', {
      model: modelKey,
      conversation_id: conversationId,
      coins_deducted: cost,
      balance_after: refreshedUser.coins - cost
    }, ip);
    return { success: true, coinsRemaining: refreshedUser.coins - cost };
  }

  if (user.coins < cost) {
    return { success: false, error: 'INSUFFICIENT_COINS' };
  }

  await db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').bind(cost, userId).run();

  await createAuditLog(db, userId, 'coin_deduction', {
    model: modelKey,
    conversation_id: conversationId,
    coins_deducted: cost,
    balance_after: user.coins - cost
  }, ip);

  return { success: true, coinsRemaining: user.coins - cost };
}

export async function getUserCoinInfo(db, userId) {
  const user = await db.prepare('SELECT coins, last_coin_reset FROM users WHERE id = ?').bind(userId).first();
  if (!user) return null;

  const now = Math.floor(Date.now() / 1000);
  const oneDay = 86400;
  const nextReset = user.last_coin_reset ? user.last_coin_reset + oneDay : now + oneDay;
  const todayStart = user.last_coin_reset || now;
  const usedToday = 30 - user.coins;

  const totalResult = await db.prepare(
    "SELECT SUM(CAST(JSON_EXTRACT(details, '$.coins_deducted') AS INTEGER)) as total FROM audit_logs WHERE user_id = ? AND action = 'coin_deduction'"
  ).bind(userId).first();

  return {
    coins: user.coins,
    next_reset: nextReset,
    used_today: Math.max(0, usedToday),
    total_used: totalResult?.total || 0
  };
}

export async function getCoinHistory(db, userId, limit = 50) {
  return db.prepare(
    "SELECT * FROM audit_logs WHERE user_id = ? AND action = 'coin_deduction' ORDER BY created_at DESC LIMIT ?"
  ).bind(userId, limit).all();
}