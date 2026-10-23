import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRegisterHandler } from '../api/register.js';

function fakeResponse() {
  const res = { statusCode: 0, body: '', headers: {} };
  res.status = (code) => { res.statusCode = code; return res; };
  res.setHeader = (key, value) => { res.headers[key] = value; return res; };
  res.end = (body) => { res.body = body; return res; };
  return res;
}

const EVENT = { id: '7', title: 'Практика', date: '2026-11-02', time: '19:00', times: [{ time: '19:00', age: '' }], published: true };
const base = { event_id: '7', name: 'Анна', phone: '+375291112233', consent: 'accepted', form_started_at: Date.now() - 10_000 };

async function register(body, loadEvents) {
  const sent = [];
  const originalFetch = globalThis.fetch;
  process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  process.env.TELEGRAM_CHAT_ID = '1';
  globalThis.fetch = async (url, init) => {
    sent.push(JSON.parse(init.body).text);
    return { ok: true, json: async () => ({ ok: true }) };
  };
  try {
    const res = fakeResponse();
    await createRegisterHandler(loadEvents)({ method: 'POST', headers: {}, body }, res);
    return { res, sent };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test('registration reads events from the injected source and sends to Telegram', async () => {
  const { res, sent } = await register(base, async () => [EVENT]);
  assert.equal(res.statusCode, 200);
  assert.match(sent[0], /<b>Событие:<\/b> Практика/);
  assert.match(sent[0], /<b>Имя:<\/b> Анна/);
});

test('registration for an unknown event is refused without sending', async () => {
  const { res, sent } = await register({ ...base, event_id: '99' }, async () => [EVENT]);
  assert.equal(res.statusCode, 404);
  assert.equal(sent.length, 0);
});

test('the Node server answers both site forms itself', async () => {
  const server = await readFile(new URL('../server.js', import.meta.url), 'utf8');
  assert.match(server, /app\.post\('\/api\/contact'/);
  assert.match(server, /app\.post\('\/api\/register'/);
});
