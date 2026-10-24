// Rent landing pages: the party reel loads when it nears the screen and pauses when it leaves.
(() => {
  const video = document.querySelector('.format-scenes video[data-src]');
  if (!video) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const load = () => {
    if (video.src) return;
    video.src = video.dataset.src;
  };
  if (!('IntersectionObserver' in window)) { load(); return; }

  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) { video.pause(); return; }
    load();
    if (!reducedMotion) video.play().catch(() => {});
  }, { rootMargin: '200px 0px' }).observe(video);
})();
