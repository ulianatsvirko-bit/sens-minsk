// Live "superposition" figure: pink threads oscillating as standing waves.
// All threads share nodes (the knots where they cross) — the moments of connection.

const SVG_NS = 'http://www.w3.org/2000/svg';
const WIDTH = 400;
const HEIGHT = 640;
const THREAD_COUNT = 9;
const SAMPLES = 64;
const NODE_COUNT = 4;

/** @returns {{ amp: number, phase: number, speed: number, drift: number, opacity: number }[]} */
function makeThreads() {
  return Array.from({ length: THREAD_COUNT }, (_, i) => {
    const t = i / (THREAD_COUNT - 1);
    return {
      amp: 40 + 120 * Math.sin(Math.PI * t),
      phase: t * Math.PI * 2,
      speed: 0.45 + 0.35 * ((i * 7) % THREAD_COUNT) / THREAD_COUNT,
      drift: (i % 2 ? 1 : -1) * (0.6 + t * 0.8),
      opacity: 0.35 + 0.65 * Math.sin(Math.PI * t),
    };
  });
}

/** Path for one thread at time `time` (seconds). */
function threadPath(thread, time) {
  const cx = WIDTH / 2;
  const k = (Math.PI * NODE_COUNT) / HEIGHT;
  const swing = Math.cos(time * thread.speed + thread.phase);
  let d = '';
  for (let s = 0; s <= SAMPLES; s += 1) {
    const y = (HEIGHT * s) / SAMPLES;
    const wobble = Math.sin(y * 0.02 + time * 0.7 + thread.phase) * thread.drift * 6;
    const x = cx + thread.amp * Math.sin(k * y) * swing + wobble * Math.sin(k * y);
    d += `${s ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

function buildFigure(svg) {
  svg.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('class', 'waves__threads');
  const threads = makeThreads();
  const paths = threads.map((thread) => {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('class', 'waves__thread');
    path.style.opacity = String(thread.opacity);
    group.append(path);
    return path;
  });
  svg.append(group);

  for (let n = 0; n <= NODE_COUNT; n += 1) {
    const knot = document.createElementNS(SVG_NS, 'circle');
    knot.setAttribute('class', 'waves__knot');
    knot.setAttribute('cx', String(WIDTH / 2));
    knot.setAttribute('cy', String((HEIGHT * n) / NODE_COUNT));
    knot.setAttribute('r', '4');
    knot.style.animationDelay = `${n * -0.7}s`;
    svg.append(knot);
  }

  return (time) => threads.forEach((thread, i) => paths[i].setAttribute('d', threadPath(thread, time)));
}

export function initSuperpositionWaves() {
  const svg = document.querySelector('[data-waves]');
  if (!svg) return;

  const draw = buildFigure(svg);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  draw(1.2);
  if (reduceMotion) return;

  let frame = 0;
  let isVisible = false;
  const start = performance.now();
  const tick = (now) => {
    draw((now - start) / 1000 + 1.2);
    frame = requestAnimationFrame(tick);
  };

  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting === isVisible) return;
    isVisible = entry.isIntersecting;
    if (isVisible) frame = requestAnimationFrame(tick);
    else cancelAnimationFrame(frame);
  }).observe(svg);
}

initSuperpositionWaves();
