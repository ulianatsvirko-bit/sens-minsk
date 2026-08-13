const MAX_LENGTH = {
  name: 100,
  contact: 160,
  format: 100,
  idea: 1500,
};

function clean(value, maxLength) {
  return String(value || '').trim().replace(/[\u0000-\u001F\u007F]/g, '').slice(0, maxLength);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sendJson(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { message: 'Метод не поддерживается.' });
  }

  const origin = request.headers.origin;
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return sendJson(response, 403, { message: 'Отправка с другого сайта запрещена.' });
      }
    } catch {
      return sendJson(response, 400, { message: 'Некорректный запрос.' });
    }
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.error('Telegram environment variables are not configured.');
    return sendJson(response, 503, { message: 'Форма временно недоступна.' });
  }

  let body;
  try {
    body = typeof request.body === 'string' ? JSON.parse(request.body || '{}') : (request.body || {});
  } catch {
    return sendJson(response, 400, { message: 'Некорректные данные формы.' });
  }
  const website = clean(body.website, 200);
  const startedAt = Number(body.form_started_at);

  if (website) return sendJson(response, 200, { ok: true });
  if (Number.isFinite(startedAt) && Date.now() - startedAt < 1500) {
    return sendJson(response, 429, { message: 'Слишком быстрая отправка.' });
  }

  const name = clean(body.name, MAX_LENGTH.name);
  const contact = clean(body.contact, MAX_LENGTH.contact);
  const format = clean(body.format, MAX_LENGTH.format);
  const idea = clean(body.idea, MAX_LENGTH.idea);
  const consent = clean(body.consent, 20);

  if (!name || !contact || !format || consent !== 'accepted') {
    return sendJson(response, 400, { message: 'Заполните обязательные поля и подтвердите согласие на обработку данных.' });
  }

  const text = [
    '<b>Новая заявка на сотрудничество · СЭНС</b>',
    '',
    `<b>Имя:</b> ${escapeHtml(name)}`,
    `<b>Контакт:</b> ${escapeHtml(contact)}`,
    `<b>Формат:</b> ${escapeHtml(format)}`,
    `<b>Идея:</b> ${escapeHtml(idea || '—')}`,
    '<b>Согласие на обработку данных:</b> получено',
  ].join('\n');

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    const telegramResult = await telegramResponse.json();

    if (!telegramResponse.ok || !telegramResult.ok) {
      console.error('Telegram sendMessage failed:', telegramResult.description || telegramResponse.status);
      return sendJson(response, 502, { message: 'Сервис отправки временно недоступен.' });
    }

    return sendJson(response, 200, { ok: true });
  } catch (error) {
    console.error('Telegram request failed:', error.message);
    return sendJson(response, 502, { message: 'Не удалось связаться с сервисом отправки.' });
  }
}
