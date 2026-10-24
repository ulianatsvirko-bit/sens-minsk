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

export function isValidDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function selectUpcomingEvents(events, today = localDateKey()) {
  if (!Array.isArray(events)) return [];
  return events
    .filter((event) => event && event.published && isValidDateKey(event.date) && event.date >= today)
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
    .map((slot) => `${slot.time}${slot.endTime ? `–${slot.endTime}` : ''}${slot.age ? ` · ${slot.age}` : ''}`)
    .join(' / ');
}

export function durationText(event) {
  const slots = Array.isArray(event?.times) ? event.times : [];
  const labels = slots.map((slot) => {
    if (!slot?.time || !slot?.endTime) return '';
    const [startHour, startMinute] = slot.time.split(':').map(Number);
    const [endHour, endMinute] = slot.endTime.split(':').map(Number);
    const minutes = endHour * 60 + endMinute - startHour * 60 - startMinute;
    if (minutes <= 0) return '';
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return [hours ? `${hours} ч` : '', rest ? `${rest} мин` : ''].filter(Boolean).join(' ');
  }).filter(Boolean);
  return [...new Set(labels)].join(' / ');
}

export function formatPrice(value) {
  const price = String(value ?? '').trim();
  if (!price) return 'Стоимость уточняется';
  if (/\bBYN\b|бесплат|free|регистрац/i.test(price)) return price;
  if (/\bруб(?:\.|лей)?\b/i.test(price)) return price.replace(/\s*руб(?:\.|лей)?\b/ig, ' BYN');
  return `${price} BYN`;
}

function shortText(value) {
  const clean = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= 112) return clean;
  const cut = clean.slice(0, 109);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 72 ? lastSpace : 109).replace(/[,:;.!?—-]+$/u, '').trim()}…`;
}

const MONTHS_GENITIVE = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

function isDatedEvent(event) {
  return Boolean(event && event.published && isValidDateKey(event.date));
}

function eventUrl(event) {
  return `event?id=${encodeURIComponent(String(event.id ?? ''))}`;
}

function longDate(dateKey) {
  const [, month, day] = dateKey.split('-').map(Number);
  return `${day} ${MONTHS_GENITIVE[month - 1]}`;
}

export function selectPastEvents(events, today = localDateKey(), limit = 8) {
  if (!Array.isArray(events)) return [];
  return events
    .filter((event) => isDatedEvent(event) && event.date < today)
    .sort((a, b) => `${b.date}T${b.time || ''}`.localeCompare(`${a.date}T${a.time || ''}`))
    .slice(0, limit);
}

export function renderUpcomingEvents(events, today = localDateKey()) {
  const upcoming = selectUpcomingEvents(events, today);
  if (!upcoming.length) return '';

  const cards = upcoming.map((event) => {
    const date = new Date(`${event.date}T12:00:00`);
    const url = eventUrl(event);
    const title = escapeHtml(event.title || 'Событие');
    const image = escapeHtml(safeImageUrl(event.image));
    const summary = escapeHtml(shortText(event.description));
    const format = escapeHtml(FORMATS[event.type] || 'Событие');
    const schedule = escapeHtml(scheduleText(event));
    const price = escapeHtml(formatPrice(event.price));

    return `<li class="event-card"><a class="event-card__image" href="${url}" tabindex="-1" aria-hidden="true"><img src="${image}" alt="" width="800" height="1000" loading="lazy" decoding="async"></a><p class="event-card__date"><b>${String(date.getDate()).padStart(2, '0')}</b><span class="meta">${MONTHS[date.getMonth()]} · ${schedule}</span></p><p class="meta">${format}</p><h3><a href="${url}">${title}</a></h3>${summary ? `<p>${summary}</p>` : ''}<p class="meta">${price}</p><a class="btn btn--signal event-card__cta" href="${url}#detail-registration">Записаться <span aria-hidden="true">→</span></a></li>`;
  }).join('');
  return `<ul class="event-cards">${cards}</ul>`;
}

export function renderPastEvents(events) {
  return events.map((event) => {
    const title = escapeHtml(event.title || 'Событие');
    const image = escapeHtml(safeImageUrl(event.image));
    return `<li><a href="${eventUrl(event)}"><img src="${image}" alt="" width="608" height="760" loading="lazy" decoding="async"><span class="meta">${escapeHtml(longDate(event.date))}</span><b>${title}</b></a></li>`;
  }).join('');
}
