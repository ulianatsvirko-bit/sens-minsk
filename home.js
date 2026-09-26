import { renderUpcomingEvents } from './lib/home-events.js';

const eventRoot = document.querySelector('[data-home-events]');

if (eventRoot) {
  fetch('/api/events')
    .then((response) => response.ok ? response.json() : Promise.reject(new Error('events request failed')))
    .then((events) => {
      eventRoot.innerHTML = renderUpcomingEvents(events);
    })
    .catch(() => {
      eventRoot.innerHTML = '<p class="loading">Не удалось загрузить афишу. <a href="events.html">Открыть календарь</a>.</p>';
    });
}

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('reduce-motion');
}
