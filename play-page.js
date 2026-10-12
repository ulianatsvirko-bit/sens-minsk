import { initNotify } from './notify.js';

function initHeroVideo() {
  const video = document.querySelector('[data-play-video]');
  const toggle = document.querySelector('[data-play-video-toggle]');
  if (!video || !toggle) return;

  let paused = false;
  const setPaused = (value) => {
    paused = value;
    toggle.setAttribute('aria-pressed', String(paused));
    if (paused) video.pause();
    else video.play().catch(() => setPaused(true));
  };

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) setPaused(true);
  toggle.addEventListener('click', () => setPaused(!paused));
  new IntersectionObserver(([entry]) => {
    if (paused) return;
    if (entry.isIntersecting) video.play().catch(() => setPaused(true));
    else video.pause();
  }).observe(video);
}

initHeroVideo();
initNotify();
