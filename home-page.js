import { localDateKey, renderPastEvents, renderUpcomingEvents, selectPastEvents } from './lib/home-events.js';
import { HALL, LAYOUTS, SEAT_COUNT, seatPositions } from './lib/hall-layouts.js?v=20261012-4';
import { initNotify } from './notify.js';
import { useImageFallback } from './lib/event-view.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const MOVE_MS = 900;
const WAVE_MS = 320;
const AUTOPLAY_MS = 4200;

/* ---------- Hero video ---------- */
function initHeroVideo() {
  const video = document.querySelector('[data-hero-video]');
  const toggle = document.querySelector('[data-video-toggle]');
  if (!video || !toggle) return;

  let paused = false;
  const setPaused = (value) => {
    paused = value;
    toggle.setAttribute('aria-pressed', String(paused));
    if (paused) video.pause();
    else video.play().catch(() => setPaused(true));
  };

  // Widescreen loop on desktop, vertical loop on phones and tablets.
  const wide = matchMedia('(min-width: 64rem)');
  const pickSource = () => {
    const size = wide.matches ? 'wide' : 'narrow';
    const src = video.dataset[`src${size === 'wide' ? 'Wide' : 'Narrow'}`];
    if (video.currentSrc.endsWith(src)) return;
    video.poster = video.dataset[`poster${size === 'wide' ? 'Wide' : 'Narrow'}`];
    video.src = src;
    if (!paused) video.play().catch(() => setPaused(true));
  };
  pickSource();
  wide.addEventListener('change', pickSource);

  if (reducedMotion.matches) setPaused(true);
  toggle.addEventListener('click', () => setPaused(!paused));

  // Stop decoding while the hero is off screen.
  new IntersectionObserver(([entry]) => {
    if (paused) return;
    if (entry.isIntersecting) video.play().catch(() => setPaused(true));
    else video.pause();
  }).observe(video);
}

/* ---------- Afisha ---------- */
const EMPTY_STATE = `
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

async function initAfisha() {
  const now = document.querySelector('[data-afisha-now]');
  const past = document.querySelector('[data-past]');
  const rail = document.querySelector('[data-past-rail]');
  if (!now) return;

  now.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch('/api/events');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const events = await response.json();
    const today = localDateKey();

    now.innerHTML = renderUpcomingEvents(events) || EMPTY_STATE;

    const pastEvents = selectPastEvents(events, today);
    if (pastEvents.length && rail && past) {
      rail.innerHTML = renderPastEvents(pastEvents);
      past.hidden = false;
    }
  } catch {
    now.innerHTML = '<p class="afisha__loading">Афиша не загрузилась. Обновите страницу или откройте <a href="events.html">полный календарь</a>.</p>';
  } finally {
    now.removeAttribute('aria-busy');
  }
}

/* ---------- Transformer ---------- */
function initTransformer() {
  const root = document.querySelector('[data-transformer]');
  if (!root) return;

  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panel = root.querySelector('[role="tabpanel"]');
  const seatLayer = root.querySelector('[data-plan-seats]');
  const stage = root.querySelector('[data-plan-stage]');
  const photo = root.querySelector('[data-format-photo]');
  const fields = {
    name: root.querySelector('[data-format-name]'),
    text: root.querySelector('[data-format-text]'),
    cap: root.querySelector('[data-format-cap]'),
    label: root.querySelector('[data-plan-label]')
  };
  const svg = seatLayer.closest('svg');

  const seats = Array.from({ length: SEAT_COUNT }, (_, i) => {
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('r', '5');
    circle.setAttribute('class', 'plan__seat');
    seatLayer.append(circle);
    return circle;
  });
  let lastPosition = seats.map(() => ({ x: 560, y: 280 }));
  let currentPhoto = photo.getAttribute('src');
  let swapTimer = 0;

  const preload = (src) => { const img = new Image(); img.src = src; };
  Object.values(LAYOUTS).filter((layout) => layout.photo).forEach((layout) => preload(layout.photo));

  let movingTimer = 0;

  function drawPlan(name) {
    const layout = LAYOUTS[name];
    const positions = seatPositions(name);
    // Removed seats stay where they were and fade out, so they can fly back from there.
    lastPosition = positions.map((point, i) => point || lastPosition[i]);
    seats.forEach((seat, i) => {
      // Seats travel as a wave that starts at the stage end of the hall.
      const delay = positions[i] ? Math.round((positions[i].x / HALL.width) * WAVE_MS + (i % 3) * 30) : 0;
      seat.style.setProperty('--d', `${delay}ms`);
      seat.style.transform = `translate(${lastPosition[i].x}px, ${lastPosition[i].y}px)`;
      seat.classList.toggle('is-off', !positions[i]);
    });
    svg.classList.add('is-moving');
    clearTimeout(movingTimer);
    movingTimer = setTimeout(() => svg.classList.remove('is-moving'), MOVE_MS + WAVE_MS);
    if (layout.stage) {
      Object.entries(layout.stage).forEach(([key, value]) => stage.setAttribute(key, String(value)));
      stage.style.opacity = '1';
    } else {
      stage.style.opacity = '0';
    }
  }

  function select(tab, { focus = false } = {}) {
    const name = tab.dataset.layout;
    const layout = LAYOUTS[name];
    if (!layout) return;

    tabs.forEach((other) => {
      const isActive = other === tab;
      other.setAttribute('aria-selected', String(isActive));
      other.tabIndex = isActive ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tab.id);
    if (focus) tab.focus();

    fields.name.textContent = layout.name;
    fields.text.textContent = layout.text;
    fields.cap.textContent = layout.capacity;
    fields.label.textContent = layout.label;
    drawPlan(name);

    clearTimeout(swapTimer);
    // Formats without a photo show only the plan, large, in place of the photo.
    root.dataset.mode = layout.photo ? 'photo' : 'plan';
    if (!layout.photo) return;
    if (currentPhoto === layout.photo) { photo.classList.remove('is-swapping'); return; }
    currentPhoto = layout.photo;
    const swap = () => { photo.src = layout.photo; photo.alt = layout.alt; photo.classList.remove('is-swapping'); };
    if (reducedMotion.matches) swap();
    else { photo.classList.add('is-swapping'); swapTimer = setTimeout(swap, 300); }
  }

  // Until someone picks a format, the hall quietly rearranges itself on its own.
  let autoTimer = 0;
  let isTouched = false;
  const stopAuto = () => { isTouched = true; clearInterval(autoTimer); };
  const startAuto = () => {
    if (isTouched || reducedMotion.matches) return;
    clearInterval(autoTimer);
    // Only formats with a photo rotate, so the block never changes height on its own.
    const photoTabs = tabs.filter((tab) => LAYOUTS[tab.dataset.layout]?.photo);
    autoTimer = setInterval(() => {
      const index = photoTabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
      select(photoTabs[(index + 1) % photoTabs.length]);
    }, AUTOPLAY_MS);
  };
  root.addEventListener('pointerdown', stopAuto);
  root.addEventListener('keydown', stopAuto);
  root.addEventListener('focusin', stopAuto);

  root.querySelector('[role="tablist"]').addEventListener('click', (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) select(tab);
  });
  root.querySelector('[role="tablist"]').addEventListener('keydown', (event) => {
    const index = tabs.indexOf(document.activeElement);
    if (index < 0) return;
    const moves = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next = null;
    if (event.key in moves) next = tabs[(index + moves[event.key] + tabs.length) % tabs.length];
    if (event.key === 'Home') next = tabs[0];
    if (event.key === 'End') next = tabs[tabs.length - 1];
    if (!next) return;
    event.preventDefault();
    select(next, { focus: true });
  });

  // Seats fly in from the storage corner the first time the plan is seen.
  drawPlan('free');
  let hasEntered = false;
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) { clearInterval(autoTimer); return; }
    if (!hasEntered) {
      hasEntered = true;
      select(tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0]);
    }
    startAuto();
  }, { threshold: 0.35 }).observe(svg);
}

/* Videos further down the page load and play only while visible. */
function initLazyVideos() {
  if (reducedMotion.matches) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) target.play().catch(() => {});
      else target.pause();
    });
  }, { threshold: 0.25 });
  document.querySelectorAll('[data-lazy-video]').forEach((video) => observer.observe(video));
}

/* Photo strips: arrows scroll by roughly one screen and disable at the ends. */
function initStrips() {
  document.querySelectorAll('[data-strip]').forEach((strip) => {
    const wrap = strip.parentElement;
    const prev = wrap.querySelector('[data-strip-prev]');
    const next = wrap.querySelector('[data-strip-next]');
    const update = () => {
      prev.disabled = strip.scrollLeft <= 2;
      next.disabled = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 2;
    };
    const step = () => Math.max(strip.clientWidth * 0.8, 240);
    prev.addEventListener('click', () => strip.scrollBy({ left: -step(), behavior: reducedMotion.matches ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => strip.scrollBy({ left: step(), behavior: reducedMotion.matches ? 'auto' : 'smooth' }));
    strip.addEventListener('scroll', update, { passive: true });
    new ResizeObserver(update).observe(strip);
    update();
  });
}

useImageFallback();
initStrips();
initLazyVideos();
initHeroVideo();
initAfisha();
initTransformer();
initNotify();
