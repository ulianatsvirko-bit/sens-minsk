import { durationText, escapeHtml, formatPrice, localDateKey, safeImageUrl } from './lib/home-events.js';
import { TYPES, ageText, dateParts, eventSchema, eventSlots, paragraphs, renderListing, splitEvents, toIcs, useImageFallback } from './lib/event-view.js';
import { addSlotChoice } from './lib/event-slots.js';
import { initNotify } from './notify.js';

const root = document.querySelector('[data-event]');
const id = new URLSearchParams(location.search).get('id') || '';
const today = localDateKey();
const MAP_URL = 'https://yandex.by/maps/?text=%D0%9C%D0%B8%D0%BD%D1%81%D0%BA%20%D0%9A%D1%83%D0%BB%D1%8C%D0%BC%D0%B0%D0%BD%201%2F2';

function slotLines(event) {
  return eventSlots(event).map((slot) => `${slot.time}${slot.endTime ? `–${slot.endTime}` : ''}${slot.age ? ` · ${slot.age}` : ''}`);
}

function factsHtml(event, isPast) {
  const parts = dateParts(event.date);
  const rows = [
    ['Дата', `${parts.long}, ${parts.weekday}`],
    ['Время', slotLines(event).map(escapeHtml).join('<br>')],
    durationText(event) && ['Длительность', escapeHtml(durationText(event))],
    ageText(event) && ['Возраст', escapeHtml(ageText(event))],
    ['Стоимость', escapeHtml(formatPrice(event.price))],
    !isPast && event.places > 0 && ['Мест', String(Number(event.places))],
    ['Где', `Кульман 1/2, Минск · <a href="${MAP_URL}" target="_blank" rel="noopener">маршрут ↗</a>`]
  ].filter(Boolean);
  return `<dl class="event-facts">${rows.map(([term, value]) => `<div><dt>${term}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
}

function galleryHtml(event) {
  const photos = [...new Set([event.image, ...(event.gallery || [])].filter(Boolean))].map(safeImageUrl);
  const title = escapeHtml(event.title || 'Событие');
  const slides = (photos.length ? photos : [safeImageUrl('')]).map((src, i) =>
    `<img class="${i ? '' : 'is-on'}" src="${escapeHtml(src)}" alt="${title} — фото ${i + 1}" width="1200" height="1500" ${i ? 'loading="lazy" ' : 'fetchpriority="high" '}decoding="async">`).join('');
  const controls = photos.length > 1
    ? `<div class="event-gallery__nav"><button type="button" data-gallery-prev aria-label="Предыдущее фото">←</button><span data-gallery-count aria-live="polite">1 / ${photos.length}</span><button type="button" data-gallery-next aria-label="Следующее фото">→</button></div>`
    : '';
  return `<figure class="event-gallery" data-gallery>${slides}${controls}</figure>`;
}

const REGISTER_FORM = `
  <form class="register-form" data-register-form novalidate>
    <input type="hidden" name="event_id">
    <input type="hidden" name="form_started_at">
    <label class="honeypot" aria-hidden="true">Сайт<input name="website" tabindex="-1" autocomplete="off"></label>
    <label class="field"><span>Имя и фамилия *</span><input name="name" required maxlength="100" autocomplete="name"></label>
    <label class="field"><span>Телефон *</span><input name="phone" required maxlength="40" autocomplete="tel" inputmode="tel"></label>
    <label class="field"><span>Telegram или Instagram</span><input name="social" maxlength="100" placeholder="@username"></label>
    <label class="field"><span>Сколько вас *</span><input name="guests" type="number" min="1" max="10" value="1" required></label>
    <label class="field register-form__wide"><span>Комментарий</span><textarea name="comment" maxlength="500"></textarea></label>
    <label class="consent register-form__wide"><input type="checkbox" name="consent" value="accepted" required><span>Согласен(на) на обработку персональных данных *</span></label>
    <button class="btn btn--signal" type="submit">Записаться <span aria-hidden="true">→</span></button>
    <p class="form-status register-form__wide" role="status" data-register-status></p>
  </form>
  <div class="register-done" data-register-done hidden tabindex="-1">
    <p class="title">Вы записаны!</p>
    <p>Заявка ушла организатору — мы свяжемся, если понадобится что-то уточнить.</p>
  </div>`;

function renderEvent(event, upcoming) {
  const isPast = event.date < today;
  const parts = dateParts(event.date);
  const url = location.href.split('#')[0];
  const more = upcoming.filter((item) => String(item.id) !== String(event.id)).slice(0, 3);

  root.innerHTML = `
    <article class="event">
      <header class="wrap event-hero">
        <div class="event-hero__copy">
          <p class="meta meta--signal">${escapeHtml(TYPES[event.type] || 'Событие')} · ${parts.day} ${parts.monthShort}${isPast ? ' · прошло' : ''}</p>
          <h1 class="event-title">${escapeHtml(event.title || 'Событие')}</h1>
          ${factsHtml(event, isPast)}
          <div class="event-actions">
            ${isPast
              ? '<button class="btn btn--signal" type="button" data-notify="Похожие события в СЭНС">Сообщить о похожих <span aria-hidden="true">→</span></button>'
              : '<a class="btn btn--signal" href="#register">Записаться <span aria-hidden="true">↓</span></a><button class="btn btn--quiet" type="button" data-ics>В календарь</button>'}
            <button class="btn btn--quiet" type="button" data-share>Поделиться</button>
          </div>
          <p class="form-status" role="status" data-share-status></p>
        </div>
        ${galleryHtml(event)}
      </header>

      <section class="wrap event-about" aria-label="Описание">
        <div class="prose event-prose">${paragraphs(event.description) || '<p>Описание скоро появится.</p>'}</div>
      </section>

      ${isPast ? `
      <section class="block block--rule event-past" aria-labelledby="past-title">
        <div class="wrap">
          <h2 id="past-title" class="title">Это событие уже прошло</h2>
          <p class="lead">Оставьте контакт — напишем, когда в афише появится что-то похожее.</p>
          <button class="btn btn--signal" type="button" data-notify="Похожие события в СЭНС">Сообщить о похожих <span aria-hidden="true">→</span></button>
        </div>
      </section>` : `
      <section id="register" class="block event-register" aria-labelledby="register-title">
        <div class="wrap event-register__inner">
          <div>
            <p class="meta">Запись · ${parts.long}</p>
            <h2 id="register-title" class="display">Будете с&nbsp;нами?</h2>
          </div>
          <div class="event-register__card">${REGISTER_FORM}</div>
        </div>
      </section>`}

      ${more.length ? `
      <section class="block block--rule" aria-labelledby="more-title">
        <div class="wrap">
          <div class="block-head"><h2 id="more-title" class="title">Ещё в афише</h2></div>
          <ol class="listings">${more.map((item) => renderListing(item)).join('')}</ol>
        </div>
      </section>` : ''}
    </article>`;

  document.title = `${event.title} — ${parts.long} · СЭНС`;
  setMeta('description', `${event.title}: ${parts.long}, ${slotLines(event)[0]}. ${String(event.description || '').slice(0, 120)}`);
  setMeta('og:title', event.title, 'property');
  setMeta('og:image', new URL(safeImageUrl(event.image), location.href).href, 'property');
  addSchema(eventSchema(event, url, today));
  document.querySelector('[data-bar-register]')?.toggleAttribute('hidden', isPast);

  initGallery();
  initShare(event, url);
  if (!isPast) initRegister(event);
}

function setMeta(name, content, attr = 'name') {
  let tag = document.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.append(tag);
  }
  tag.setAttribute('content', content);
}

function addSchema(schema) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema).replace(/</g, '\\u003c');
  document.head.append(script);
}

function initGallery() {
  const gallery = root.querySelector('[data-gallery]');
  const slides = [...gallery.querySelectorAll('img')];
  if (slides.length < 2) return;
  let index = 0;
  const count = gallery.querySelector('[data-gallery-count]');
  const show = (next) => {
    index = (next + slides.length) % slides.length;
    slides.forEach((img, i) => img.classList.toggle('is-on', i === index));
    count.textContent = `${index + 1} / ${slides.length}`;
  };
  gallery.querySelector('[data-gallery-prev]').addEventListener('click', () => show(index - 1));
  gallery.querySelector('[data-gallery-next]').addEventListener('click', () => show(index + 1));
  let startX = null;
  gallery.addEventListener('pointerdown', (event) => { startX = event.clientX; });
  gallery.addEventListener('pointerup', (event) => {
    if (startX === null) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 40) show(index + (delta < 0 ? 1 : -1));
    startX = null;
  });
}

function initShare(event, url) {
  const status = root.querySelector('[data-share-status]');
  root.querySelector('[data-share]')?.addEventListener('click', async () => {
    try {
      if (navigator.share) await navigator.share({ title: event.title, url });
      else { await navigator.clipboard.writeText(url); status.textContent = 'Ссылка скопирована.'; }
    } catch { /* share sheet closed */ }
  });
  root.querySelector('[data-ics]')?.addEventListener('click', () => {
    const blob = new Blob([toIcs(event, url)], { type: 'text/calendar;charset=utf-8' });
    const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `sens-${event.date}.ics` });
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  });
}

function initRegister(event) {
  const form = root.querySelector('[data-register-form]');
  const status = root.querySelector('[data-register-status]');
  const done = root.querySelector('[data-register-done]');
  form.elements.event_id.value = String(event.id);
  form.elements.form_started_at.value = String(Date.now());
  addSlotChoice(form, event);
  form.querySelector('[data-slot-choice]')?.classList.add('field', 'register-form__wide');

  form.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    status.textContent = 'Отправляем…';
    status.dataset.state = '';
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Не удалось отправить заявку.');
      form.hidden = true;
      done.hidden = false;
      done.focus();
    } catch (error) {
      status.textContent = `${error instanceof Error ? error.message : 'Не удалось отправить.'} Можно написать нам в Telegram @sensehubminsk.`;
      status.dataset.state = 'error';
    } finally {
      button.disabled = false;
    }
  });
}

function renderMissing() {
  document.title = 'Событие не найдено · СЭНС';
  root.innerHTML = `
    <section class="wrap event-missing">
      <h1 class="title">Событие не найдено</h1>
      <p class="lead">Возможно, ссылка устарела или событие сняли с афиши.</p>
      <a class="btn btn--signal" href="events.html">Открыть афишу <span aria-hidden="true">→</span></a>
    </section>`;
}

async function load() {
  try {
    const [eventResponse, listResponse] = await Promise.all([
      fetch(`/api/events/${encodeURIComponent(id)}`),
      fetch('/api/events').catch(() => null)
    ]);
    if (!eventResponse.ok) throw new Error('not found');
    const event = await eventResponse.json();
    const all = listResponse?.ok ? await listResponse.json() : [];
    renderEvent(event, splitEvents(all, today).upcoming);
  } catch {
    renderMissing();
  } finally {
    root.removeAttribute('aria-busy');
  }
}

useImageFallback();
initNotify();
load();
