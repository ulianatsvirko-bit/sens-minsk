const MONTHS = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];
const FORMATS = {
  performances: 'Спектакль · Показ',
  talks: 'Публичный разговор',
  practice: 'Воркшоп · Практика'
};
const FALLBACK_IMAGE = 'assets/premiere-stage.jpg';

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function selectUpcomingEvents(events, today = localDateKey()) {
  if (!Array.isArray(events)) return [];
  return events
    .filter((event) => event && event.published && /^\d{4}-\d{2}-\d{2}$/.test(event.date) && event.date >= today)
    .sort((a, b) => `${a.date}T${a.time || ''}`.localeCompare(`${b.date}T${b.time || ''}`))
    .slice(0, 3);
}

export function safeImageUrl(value) {
  const candidate = String(value ?? '').trim();
  if (!candidate || /[\u0000-\u001f\u007f<>"'`]/.test(candidate)) return FALLBACK_IMAGE;
  try {
    const parsed = new URL(candidate, 'https://sens.local/');
    if (!['http:', 'https:'].includes(parsed.protocol)) return FALLBACK_IMAGE;
    return candidate;
  } catch {
    return FALLBACK_IMAGE;
  }
}

export function scheduleText(event) {
  const slots = Array.isArray(event?.times) && event.times.length ? event.times : [{ time: event?.time }];
  return slots
    .filter((slot) => slot && slot.time)
    .map((slot) => `${slot.time}${slot.age ? ` · ${slot.age}` : ''}`)
    .join(' / ');
}

function shortText(value) {
  const clean = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= 112) return clean;
  const cut = clean.slice(0, 109);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 72 ? lastSpace : 109).replace(/[,:;.!?—-]+$/u, '').trim()}…`;
}

export function renderUpcomingEvents(events, today = localDateKey()) {
  const upcoming = selectUpcomingEvents(events, today);
  if (!upcoming.length) return '<p class="loading">Новые события скоро появятся в календаре.</p>';

  return upcoming.map((event) => {
    const date = new Date(`${event.date}T12:00:00`);
    const detailUrl = `event.html?id=${encodeURIComponent(String(event.id ?? ''))}`;
    const title = escapeHtml(event.title || 'Событие');
    const image = escapeHtml(safeImageUrl(event.image));
    const summary = escapeHtml(shortText(event.description) || 'Подробности события — на отдельной странице.');
    const format = escapeHtml(FORMATS[event.type] || 'Событие');
    const schedule = escapeHtml(scheduleText(event));

    return `<article class="home-event"><a class="home-event-image" href="${detailUrl}" aria-label="${title}"><img src="${image}" alt="" loading="lazy"></a><div class="home-event-body"><p class="event-date"><b>${String(date.getDate()).padStart(2, '0')}</b><span>${MONTHS[date.getMonth()]} · ${schedule}</span></p><p class="event-format">${format}</p><h3><a href="${detailUrl}">${title}</a></h3><p class="event-summary">${summary}</p><a class="event-register" href="${detailUrl}#detail-registration">Записаться <span>→</span></a></div></article>`;
  }).join('');
}
