import test from 'node:test';
import assert from 'node:assert/strict';
import { sendTelegramMessage } from '../lib/telegram.js';

test('sends each application to two personal chats', async () => {
  const originalFetch = globalThis.fetch;
  process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  process.env.TELEGRAM_CHAT_ID = '111';
  process.env.TELEGRAM_CHAT_ID_2 = '222';
  const deliveries = [];
  globalThis.fetch = async (_url, options) => {
    deliveries.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ ok: true }) };
  };
  try {
    await sendTelegramMessage('Заявка');
    assert.deepEqual(deliveries.map(({ chat_id }) => chat_id), ['111', '222']);
    assert.deepEqual(deliveries.map(({ text }) => text), ['Заявка', 'Заявка']);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.TELEGRAM_CHAT_ID_2;
  }
});
