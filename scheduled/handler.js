export async function handleCron(event, env, ctx) {
  const cronTrigger = event.cron || '';

  if (cronTrigger === '0 0 * * *' || cronTrigger === 'daily') {
    await handleDailyTasks(env);
  }

  if (cronTrigger === '0 0 1 * *' || cronTrigger === 'monthly') {
    await handleMonthlyTasks(env);
  }
}

async function handleDailyTasks(env) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 86400;

    await env.DB.prepare(
      "UPDATE users SET coins = 30, last_coin_reset = ? WHERE last_coin_reset < ? OR last_coin_reset IS NULL"
    ).bind(now, oneDayAgo).run();

    const logId = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO audit_logs (id, action, details, created_at) VALUES (?, 'daily_coin_reset', ?, ?)"
    ).bind(logId, JSON.stringify({ timestamp: now, type: 'daily_reset' }), now).run();

    const rateReset = Math.floor(now / 86400) * 86400 + 86400;
    await env.DB.prepare(
      'DELETE FROM rate_limits WHERE reset_at < ?'
    ).bind(now).run();
  } catch (e) {}
}

async function handleMonthlyTasks(env) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - 2592000;

    await env.DB.prepare(
      'DELETE FROM audit_logs WHERE created_at < ? AND action != ? AND action != ?'
    ).bind(thirtyDaysAgo, 'coin_deduction', 'daily_coin_reset').run();

    const logId = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO audit_logs (id, action, details, created_at) VALUES (?, 'monthly_archive', ?, ?)"
    ).bind(logId, JSON.stringify({ timestamp: now, type: 'monthly_archive' }), now).run();
  } catch (e) {}
}