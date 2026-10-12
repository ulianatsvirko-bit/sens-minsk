// Shared view helpers for the afisha list and the event page.
import { durationText, escapeHtml, formatPrice, isValidDateKey, safeImageUrl } from './home-events.js';

export const TYPES = {
  performances: 'Сцена',
  talks: 'Разговор',
  practice: 'Практика'
};

const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS_SHORT = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];
const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

export const VENUE = {
  name: 'СЭНС',
  street: 'ул. Кульман, 1/2',
  city: 'Минск',
  country: 'BY'
};

export function eventSlots(event) {
  return Array.isArray(event?.times) && event.times.length ? event.times : [{ time: event?.time || '', endTime: '', age: '' }];
}

export function dateParts(dateKey) {
  const [y, m, d] = String(dateKey).split('-').map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return { day: String(d).padStart(2, '0'), monthShort: MONTHS_SHORT[m - 1], long: `${d} ${MONTHS_GEN[m - 1]}`, weekday };
}

/** Start–end times without ages, e.g. "12:00–14:00 / 18:00–20:00". */
export function timesText(event) {
  return eventSlots(event).filter((slot) => slot.time).map((slot) => `${slot.time}${slot.endTime ? `–${slot.endTime}` : ''}`).join(' / ');
}

export const FALLBACK_IMAGE = 'assets/space/hall-semicircle.jpg';

/** Swap broken event images (deleted uploads) for a photo of the hall. */
export function useImageFallback(root = document) {
  root.addEventListener('error', (event) => {
    const img = event.target;
    if (img instanceof HTMLImageElement && img.closest('.listing__image, .event-gallery, .event-card__image, .past__rail') && !img.dataset.fallback) {
      img.dataset.fallback = '1';
      img.src = FALLBACK_IMAGE;
    }
  }, true);
}

export function ageText(event) {
  return [...new Set(eventSlots(event).map((slot) => slot.age).filter(Boolean))].join(' / ');
}

/** Split published events into upcoming (soonest first) and past (latest first). */
export function splitEvents(events, today) {
  const valid = (Array.isArray(events) ? events : []).filter((event) => event?.published && isValidDateKey(event.date));
  const key = (event) => `${event.date}T${event.time || ''}`;
  return {
    upcoming: valid.filter((event) => event.date >= today).sort((a, b) => key(a).localeCompare(key(b))),
    past: valid.filter((event) => event.date < today).sort((a, b) => key(b).localeCompare(key(a)))
  };
}

export function filterByType(events, type) {
  return type && TYPES[type] ? events.filter((event) => event.type === type) : events;
}

/** Afisha row. Every API value is escaped. */
export function renderListing(event, { past = false } = {}) {
  const url = `event.html?id=${encodeURIComponent(String(event.id ?? ''))}`;
  const parts = dateParts(event.date);
  const title = escapeHtml(event.title || 'Событие');
  const facts = [
    escapeHtml(timesText(event)),
    durationText(event) && escapeHtml(durationText(event)),
    ageText(event) && escapeHtml(ageText(event)),
    escapeHtml(formatPrice(event.price))
  ].filter(Boolean);
  const action = past
    ? `<a class="link-arrow" href="${url}">Фото и описание <span aria-hidden="true">→</span></a>`
    : `<a class="btn btn--signal" href="${url}#register">Записаться <span aria-hidden="true">→</span></a>`;

  return `<li class="listing${past ? ' listing--past' : ''}" data-type="${escapeHtml(event.type || '')}">`
    + `<p class="listing__date"><b>${parts.day}</b><span>${parts.monthShort}</span><small>${escapeHtml(parts.weekday)}</small></p>`
    + `<a class="listing__image" href="${url}" tabindex="-1" aria-hidden="true"><img src="${escapeHtml(safeImageUrl(event.image))}" alt="" width="640" height="800" loading="lazy" decoding="async"></a>`
    + `<div class="listing__body"><p class="meta meta--signal">${escapeHtml(TYPES[event.type] || 'Событие')}</p>`
    + `<h3 class="listing__title"><a href="${url}">${title}</a></h3>`
    + `<ul class="listing__facts">${facts.map((fact) => `<li>${fact}</li>`).join('')}</ul>${action}</div></li>`;
}

/** Plain-text description split into escaped paragraphs. */
export function paragraphs(text) {
  return String(text || '').trim().split(/\n\s*\n/).filter(Boolean)
    .map((part) => `<p>${escapeHtml(part).replace(/\n/g, '<br>')}</p>`).join('');
}

const pad = (value) => String(value).padStart(2, '0');
const icsText = (value) => String(value || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

/** iCalendar file for "add to calendar". Times are local Minsk time. */
export function toIcs(event, url) {
  const slot = eventSlots(event)[0];
  const date = String(event.date).replace(/-/g, '');
  const [sh, sm] = (slot.time || '19:00').split(':').map(Number);
  const [eh, em] = slot.endTime ? slot.endTime.split(':').map(Number) : [sh + 2, sm];
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SENS Minsk//Afisha//RU', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:sens-event-${event.id}@sens-minsk.vercel.app`,
    `DTSTAMP:${date}T000000Z`,
    `DTSTART;TZID=Europe/Minsk:${date}T${pad(sh)}${pad(sm)}00`,
    `DTEND;TZID=Europe/Minsk:${date}T${pad(Math.min(eh, 23))}${pad(em)}00`,
    `SUMMARY:${icsText(event.title)}`,
    `LOCATION:${icsText(`${VENUE.name}, ${VENUE.street}, ${VENUE.city}`)}`,
    `URL:${url}`,
    'END:VEVENT', 'END:VCALENDAR'
  ];
  return lines.join('\r\n');
}

/** Schema.org Event for search engines. */
export function eventSchema(event, url, today) {
  const slot = eventSlots(event)[0];
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: `${event.date}T${slot.time || '19:00'}:00+03:00`,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: VENUE.name,
      address: { '@type': 'PostalAddress', streetAddress: VENUE.street, addressLocality: VENUE.city, addressCountry: VENUE.country }
    },
    image: [new URL(safeImageUrl(event.image), url).href],
    description: String(event.description || '').slice(0, 300),
    url
  };
  if (slot.endTime) schema.endDate = `${event.date}T${slot.endTime}:00+03:00`;
  if (event.date >= today && /\d/.test(String(event.price || ''))) {
    schema.offers = { '@type': 'Offer', price: String(event.price).replace(/[^\d.,]/g, '').replace(',', '.'), priceCurrency: 'BYN', url };
  }
  return schema;
}
