import { ENTRANCES, PLAN, ROOMS, findRoom, roomCentre, toPoints } from './lib/floor-plan.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const SCALE = 20; // svg units per metre

function svgEl(name, attrs = {}, text = '') {
  const node = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
  if (text) node.textContent = text;
  return node;
}

function drawPlan(svg, onPick) {
  const w = PLAN.width * SCALE;
  const h = PLAN.height * SCALE;
  svg.setAttribute('viewBox', `-44 -34 ${w + 68} ${h + 82}`);

  // Windows: the whole street wall, and the courtyard side of the welcome zone and studio.
  svg.append(svgEl('line', { class: 'floor__window', x1: 0, y1: h, x2: w, y2: h }));
  svg.append(svgEl('line', { class: 'floor__window', x1: 3.5 * SCALE, y1: 0, x2: 13.2 * SCALE, y2: 0 }));

  const groups = new Map();
  ROOMS.forEach((room) => {
    const group = svgEl('g', { class: `room${room.extra ? ' room--extra' : ''}`, 'data-room': room.id });
    group.append(svgEl('polygon', { points: toPoints(room.shape, SCALE) }));
    const centre = roomCentre(room.shape);
    const vertical = room.id === 'courtyard';
    const label = svgEl('text', {
      x: centre.x * SCALE, y: centre.y * SCALE, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
      ...(vertical ? { transform: `rotate(-90 ${centre.x * SCALE} ${centre.y * SCALE})` } : {})
    }, room.label);
    group.append(label);
    group.addEventListener('click', () => onPick(room.id));
    svg.append(group);
    groups.set(room.id, group);
  });

  ENTRANCES.forEach((door) => {
    const cx = door.x * SCALE;
    const cy = door.y * SCALE;
    svg.append(svgEl('circle', { class: 'floor__door', cx, cy, r: 7 }));
    const label = door.side === 'left'
      ? { x: cx - 16, y: cy, 'text-anchor': 'middle', transform: `rotate(-90 ${cx - 16} ${cy})` }
      : { x: cx + 12, y: door.side === 'top' ? cy - 12 : cy + 24 };
    svg.append(svgEl('text', { class: 'floor__door-label', ...label }, door.label));
  });

  const scaleY = h + 34;
  const scaleX = w - 5 * SCALE;
  const scaleBar = svgEl('g', { class: 'floor__scale' });
  scaleBar.append(svgEl('line', { x1: scaleX, y1: scaleY, x2: w, y2: scaleY }));
  scaleBar.append(svgEl('line', { x1: scaleX, y1: scaleY - 5, x2: scaleX, y2: scaleY + 5 }));
  scaleBar.append(svgEl('line', { x1: w, y1: scaleY - 5, x2: w, y2: scaleY + 5 }));
  scaleBar.append(svgEl('text', { x: scaleX - 8, y: scaleY + 4, 'text-anchor': 'end' }, '5 м'));
  svg.append(scaleBar);

  return groups;
}

function initFloor() {
  const root = document.querySelector('[data-floor]');
  if (!root) return;

  const svg = root.querySelector('[data-floor-svg]');
  const buttonsRoot = root.querySelector('[data-floor-buttons]');
  const info = {
    figure: root.querySelector('[data-room-figure]'),
    photo: root.querySelector('[data-room-photo]'),
    number: root.querySelector('[data-room-number]'),
    area: root.querySelector('[data-room-area]'),
    name: root.querySelector('[data-room-name]'),
    text: root.querySelector('[data-room-text]')
  };

  const buttons = new Map();
  let groups = new Map();

  function select(id) {
    const room = findRoom(id);
    groups.forEach((group, key) => group.classList.toggle('is-active', key === room.id));
    buttons.forEach((button, key) => button.setAttribute('aria-pressed', String(key === room.id)));

    info.number.textContent = `№ ${room.number}`;
    info.area.textContent = room.area;
    info.name.textContent = room.name;
    info.text.textContent = room.text;
    info.figure.hidden = !room.photo;
    if (room.photo) {
      info.photo.src = room.photo;
      info.photo.alt = room.alt;
    }
  }

  ROOMS.forEach((room) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = room.extra ? `${room.name} · отдельно` : room.name;
    button.addEventListener('click', () => select(room.id));
    buttonsRoot.append(button);
    buttons.set(room.id, button);
  });

  groups = drawPlan(svg, select);
  ROOMS.filter((room) => room.photo).forEach((room) => { new Image().src = room.photo; });
  select('hall');
}

const SLIDE_MS = 5000;

function initSlideshow() {
  const root = document.querySelector('[data-slideshow]');
  if (!root) return;
  const slides = [...root.querySelectorAll('.slides img')];
  const dots = [...root.querySelectorAll('.slides__dots i')];
  const caption = root.querySelector('[data-slide-caption]');
  const toggle = root.querySelector('[data-slide-toggle]');
  if (slides.length < 2) return;

  let index = 0;
  let timer = 0;
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = true;

  const show = (next) => {
    index = (next + slides.length) % slides.length;
    slides.forEach((img, i) => img.classList.toggle('is-on', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('is-on', i === index));
    caption.textContent = slides[index].dataset.caption;
  };
  const schedule = () => {
    clearInterval(timer);
    if (!paused && visible) timer = setInterval(() => show(index + 1), SLIDE_MS);
  };
  const setPaused = (value) => {
    paused = value;
    toggle.setAttribute('aria-pressed', String(paused));
    schedule();
  };

  toggle.addEventListener('click', () => setPaused(!paused));
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); }).observe(root);
  show(0);
  setPaused(paused);
}

initFloor();
initSlideshow();
