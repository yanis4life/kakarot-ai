import { errorResponse, successResponse, streamResponse } from '../../utils/response.js';
import { getModelByKey, modelMap, PPLX_API_URL } from '../../models/modelMap.js';
import { checkAndDeductCoins } from '../../coins/manager.js';
import { createMessage, getMessages, getRecentMessages, getSummary, createSummary, getConversation, updateConversation } from '../../database/operations.js';
import { getClientIp } from '../../utils/validation.js';

export async function handleChatCompletion(request, env, user) {
  try {
    const body = await request.json();
    const { model, messages, stream } = body;

    const allowedParams = ['model', 'messages', 'stream'];
    const extraParams = Object.keys(body).filter(k => !allowedParams.includes(k));
    if (extraParams.length > 0) {
      return errorResponse('VALIDATION_ERROR', `Unexpected parameters: ${extraParams.join(', ')}`);
    }

    if (!model || !messages || !Array.isArray(messages)) {
      return errorResponse('VALIDATION_ERROR', 'model and messages are required');
    }

    const modelConfig = getModelByKey(model);
    if (!modelConfig) {
      return errorResponse('MODEL_UNAVAILABLE', `Model '${model}' is not available`, {}, 404);
    }

    const ip = getClientIp(request);
    const cost = modelConfig.coin_cost;

    const deductionResult = await checkAndDeductCoins(env.DB, user.id, cost, model, null, ip);
    if (!deductionResult.success) {
      if (deductionResult.error === 'INSUFFICIENT_COINS') {
        return errorResponse('INSUFFICIENT_COINS', 'Insufficient coins. Please wait for daily reset.', {}, 402);
      }
      return errorResponse('INTERNAL_ERROR', 'Failed to process coin deduction', {}, 500);
    }

    const userMessage = messages[messages.length - 1]?.content || '';
    const systemPrompt = modelConfig.prompt;

    const perplexityResponse = await callPerplexityApi(modelConfig.pref, systemPrompt, userMessage, stream || false);

    if (stream) {
      const conversationId = body.conversation_id || null;
      if (conversationId) {
        await createMessage(env.DB, conversationId, 'user', userMessage);
      }

      const encoder = new TextEncoder();
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();

      const response = streamResponse(readable);

      processStreamResponse(perplexityResponse, writer, encoder, model, env, user, conversationId, cost, ip);

      return response;
    }

    const content = await perplexityResponse.text();

    let responseContent = content;
    try {
      const parsed = JSON.parse(content);
      responseContent = parsed.answer || parsed.text || parsed.content || content;
    } catch (e) {}

    const response = {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: responseContent
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };

    return successResponse(response);
  } catch (e) {
    return errorResponse('INTERNAL_ERROR', 'Failed to process chat completion', {}, 500);
  }
}

async function callPerplexityApi(modelPref, systemPrompt, userMessage, stream) {
  const payload = {
    params: {
      model_preference: modelPref
    },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    stream: stream,
    source: 'default',
    version: '2.5'
  };

  const response = await fetch(PPLX_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': stream ? 'text/event-stream' : 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return response;
}

async function processStreamResponse(perplexityResponse, writer, encoder, model, env, user, conversationId, cost, ip) {
  try {
    const reader = perplexityResponse.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          const openaiChunk = {
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [
              {
                index: 0,
                delta: { content: data },
                finish_reason: null
              }
            ]
          };

          writer.write(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
          fullContent += data;
        }
      }
    }

    const finalChunk = {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          index: 0,
          delta: {},
          finish_reason: 'stop'
        }
      ]
    };
    writer.write(encoder.encode(`data: ${JSON.stringify(finalChunk)}\n\ndata: [DONE]\n\n`));

    if (conversationId) {
      await createMessage(env.DB, conversationId, 'assistant', fullContent);
      const messages = await getMessages(env.DB, conversationId);
      const userMessages = messages.filter(m => m.is_summary === 0);
      if (userMessages.length % 5 === 0) {
        await queueSummaryGeneration(env, conversationId, model, fullContent);
      }
    }

    writer.close();
  } catch (e) {
    writer.close();
  }
}

async function queueSummaryGeneration(env, conversationId, model, content) {
  try {
    await env.SUMMARY_QUEUE.send({
      conversationId,
      model,
      content
    });
  } catch (e) {}
}

export async function handleModels(request, env) {
  const { getEnabledModels } = await import('../../models/modelMap.js');
  const models = getEnabledModels();
  return successResponse({
    object: 'list',
    data: models
  });
}