import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/contact.js';

function fakeResponse() {
  const res = { statusCode: 0, body: '', headers: {} };
  res.status = (code) => { res.statusCode = code; return res; };
  res.setHeader = (key, value) => { res.headers[key] = value; return res; };
  res.end = (body) => { res.body = body; return res; };
  return res;
}

async function send(body) {
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
    await handler({ method: 'POST', headers: {}, body }, res);
    return { res, sent };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

const base = { name: 'Анна', contact: '@anna', format: 'Аренда', consent: 'accepted', form_started_at: Date.now() - 10_000 };

test('rent request forwards date, guests and the site estimate', async () => {
  const { res, sent } = await send({ ...base, date: '2026-10-20', guests: '60', estimate: 'Сутки, пн–чт — 2 000 BYN' });
  assert.equal(res.statusCode, 200);
  assert.match(sent[0], /<b>Дата:<\/b> 2026-10-20/);
  assert.match(sent[0], /<b>Гостей:<\/b> 60/);
  assert.match(sent[0], /<b>Расчёт на сайте:<\/b> Сутки/);
  assert.match(sent[0], /СЭНС<\/b>\n\n<b>Имя/);
});

test('missing or malformed optional fields are left out', async () => {
  const { sent } = await send({ ...base, date: '20.10.2026', guests: 'много' });
  assert.doesNotMatch(sent[0], /Дата|Гостей|Расчёт/);
});

test('requests without a start timestamp are rejected', async () => {
  const { res, sent } = await send({ ...base, form_started_at: undefined });
  assert.equal(res.statusCode, 400);
  assert.equal(sent.length, 0);
});

test('estimate text is escaped for Telegram HTML', async () => {
  const { sent } = await send({ ...base, estimate: '<b>0 BYN</b>' });
  assert.match(sent[0], /&lt;b&gt;0 BYN&lt;\/b&gt;/);
});

test('impossible dates and stale form timestamps are rejected', async () => {
  const { sent } = await send({ ...base, date: '2026-99-99' });
  assert.doesNotMatch(sent[0], /Дата/);
  const stale = await send({ ...base, form_started_at: Date.now() - 3 * 24 * 60 * 60 * 1000 });
  assert.equal(stale.res.statusCode, 400);
});
