import { localDateKey } from './lib/home-events.js';
import { TYPES, filterByType, renderListing, renderPastCard, splitEvents, useImageFallback } from './lib/event-view.js?v=20261012-2';
import { initNotify } from './notify.js';

const EMPTY_UPCOMING = `
  <div class="afisha-empty">
    <div>
      <h3>Собираем афишу на ближайшие недели</h3>
      <p>Новые события появятся здесь и в Instagram. Расскажите, что хотите увидеть в СЭНС, — напишем, когда это случится.</p>
    </div>
    <div class="afisha-empty__actions">
      <button class="btn btn--signal" type="button" data-notify="Афиша СЭНС">Оставить пожелание <span aria-hidden="true">→</span></button>
      <a class="btn btn--quiet" href="https://www.instagram.com/senseminsk/" target="_blank" rel="noopener">Instagram ↗</a>
    </div>
  </div>`;

const PAST_SHOWCASE_SIZE = 6;

/** Nothing scheduled yet: a slim notice, then recent events as photo cards. */
function emptyWithPast(past) {
  return `
  <div class="afisha-empty afisha-empty--slim">
    <p><b>Новые события скоро.</b> Оставьте контакт — напишем первыми.</p>
    <div class="afisha-empty__actions">
      <button class="btn btn--signal" type="button" data-notify="Афиша СЭНС">Узнавать о новых событиях <span aria-hidden="true">→</span></button>
      <a class="btn btn--quiet" href="https://www.instagram.com/senseminsk/" target="_blank" rel="noopener">Instagram ↗</a>
    </div>
  </div>
  <h3 class="past-grid__title">Так было недавно</h3>
  <ol class="past-grid">${past.map(renderPastCard).join('')}</ol>
  <a class="link-arrow" href="events.html?view=past">Все прошедшие события <span aria-hidden="true">→</span></a>`;
}

const params = new URLSearchParams(location.search);
const state = {
  view: params.get('view') === 'past' ? 'past' : 'upcoming',
  type: TYPES[params.get('type')] ? params.get('type') : '',
  upcoming: [],
  past: []
};

const list = document.querySelector('[data-list]');
const pastSection = document.querySelector('[data-past-section]');
const pastList = document.querySelector('[data-past-list]');

function syncUrl() {
  const next = new URLSearchParams();
  if (state.view === 'past') next.set('view', 'past');
  if (state.type) next.set('type', state.type);
  const query = next.toString();
  history.replaceState(null, '', query ? `?${query}` : location.pathname);
}

function renderControls() {
  document.querySelectorAll('[data-view-link]').forEach((link) => {
    if (link.dataset.viewLink === state.view) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
    const href = new URLSearchParams(link.dataset.viewLink === 'past' ? { view: 'past' } : {});
    if (state.type) href.set('type', state.type);
    link.href = `events.html${href.toString() ? `?${href}` : ''}`;
  });
  document.querySelectorAll('[data-type]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.type === state.type)));
  document.getElementById('afisha-title').textContent = state.view === 'past' ? 'Так было' : 'Афиша';
}

function renderList() {
  const typeName = state.type ? TYPES[state.type].toLowerCase() : '';
  if (state.view === 'past') {
    const items = filterByType(state.past, state.type);
    list.innerHTML = items.length
      ? `<ol class="listings">${items.map((event) => renderListing(event, { past: true })).join('')}</ol>`
      : `<p class="afisha__loading">Прошедших событий${typeName ? ` в формате «${typeName}»` : ''} пока нет.</p>`;
    pastSection.hidden = true;
    return;
  }

  const items = filterByType(state.upcoming, state.type);
  if (items.length) {
    list.innerHTML = `<ol class="listings">${items.map((event) => renderListing(event)).join('')}</ol>`;
  } else if (state.upcoming.length) {
    list.innerHTML = `<p class="afisha__loading">В формате «${typeName}» пока ничего не запланировано. <button class="link-arrow" type="button" data-type="">Показать все события</button></p>`;
  } else if (state.past.length && !state.type) {
    list.innerHTML = emptyWithPast(state.past.slice(0, PAST_SHOWCASE_SIZE));
    pastSection.hidden = true;
    return;
  } else {
    list.innerHTML = EMPTY_UPCOMING;
  }

  const past = filterByType(state.past, state.type).slice(0, 6);
  pastSection.hidden = !past.length;
  pastList.innerHTML = past.map((event) => renderListing(event, { past: true })).join('');
}

function render() {
  renderControls();
  renderList();
}

document.addEventListener('click', (event) => {
  const filter = event.target.closest('[data-type]');
  if (!filter) return;
  state.type = filter.dataset.type;
  syncUrl();
  render();
});

async function load() {
  try {
    const response = await fetch('/api/events');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { upcoming, past } = splitEvents(await response.json(), localDateKey());
    state.upcoming = upcoming;
    state.past = past;
    render();
  } catch {
    list.innerHTML = '<p class="afisha__loading">Афиша не загрузилась. Обновите страницу или посмотрите анонсы в <a href="https://www.instagram.com/senseminsk/" target="_blank" rel="noopener">Instagram</a>.</p>';
  } finally {
    list.removeAttribute('aria-busy');
  }
}

renderControls();
useImageFallback();
initNotify();
load();
