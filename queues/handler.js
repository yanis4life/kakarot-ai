import { createSummary, getMessages, getConversation } from '../database/operations.js';
import { getModelByKey } from '../models/modelMap.js';

export async function handleQueue(batch, env, ctx) {
  for (const message of batch.messages) {
    try {
      const { conversationId, model, content, type } = message.body;

      if (type === 'summary' || (!type && conversationId)) {
        await handleSummaryGeneration(env, conversationId, model);
      }

      if (type === 'email') {
        await handleEmailNotification(env, message.body);
      }

      message.ack();
    } catch (e) {
      message.retry();
    }
  }
}

async function handleSummaryGeneration(env, conversationId, model) {
  try {
    const messages = await getMessages(env.DB, conversationId);
    const userMessages = messages.filter(m => m.is_summary === 0);

    if (userMessages.length < 5) return;

    const summaryContent = userMessages.slice(-10).map(m =>
      `${m.role}: ${m.content.substring(0, 200)}`
    ).join('\n');

    const summary = `Summary of recent conversation: ${summaryContent.substring(0, 1000)}`;

    await createSummary(env.DB, conversationId, summary, userMessages.length);

    const modelConfig = getModelByKey(model) || getModelByKey('gpt54');
    const summaryMessage = `[System] Conversation summary: ${summary}`;

    await env.DB.prepare(
      "INSERT INTO messages (id, conversation_id, role, content, created_at, is_summary) VALUES (?, ?, 'system', ?, ?, 1)"
    ).bind(
      crypto.randomUUID(),
      conversationId,
      summaryMessage,
      Math.floor(Date.now() / 1000)
    ).run();
  } catch (e) {}
}

async function handleEmailNotification(env, data) {
  try {
    const { to, subject, body } = data;
    if (env.EMAIL_SENDER && to) {
      const emailUrl = `https://api.mailgun.net/v3/${env.EMAIL_SENDER}/messages`;
      const formData = new URLSearchParams();
      formData.append('from', env.EMAIL_SENDER);
      formData.append('to', to);
      formData.append('subject', subject);
      formData.append('text', body);
      await fetch(emailUrl, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${btoa('api:key')}` },
        body: formData
      });
    }
  } catch (e) {}
}