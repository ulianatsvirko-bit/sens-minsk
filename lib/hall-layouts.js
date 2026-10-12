// Seat layouts for the homepage "transformer" floor plan.
// Coordinates live in a 600×300 viewBox: the long wall with windows is at the top.

export const HALL = { width: 600, height: 300 };
export const SEAT_COUNT = 72;

const range = (count, start, step) => Array.from({ length: count }, (_, i) => start + i * step);

function grid(xs, ys) {
  return xs.flatMap((x) => ys.map((y) => ({ x, y })));
}

function ring(cx, cy, radius, count, offset = 0) {
  return range(count, 0, 1).map((i) => {
    const angle = offset + (i / count) * Math.PI * 2;
    return { x: Math.round(cx + Math.cos(angle) * radius), y: Math.round(cy + Math.sin(angle) * radius) };
  });
}

function square(cx, cy, half) {
  return [
    { x: cx - half, y: cy - half }, { x: cx + half, y: cy - half },
    { x: cx - half, y: cy + half }, { x: cx + half, y: cy + half }
  ];
}

/** Seats along an ellipse around (cx, cy). */
function ellipse(cx, cy, rx, ry, count, offset = 0) {
  return range(count, 0, 1).map((i) => {
    const angle = offset + (i / count) * Math.PI * 2;
    return { x: Math.round(cx + Math.cos(angle) * rx), y: Math.round(cy + Math.sin(angle) * ry) };
  });
}

/** Shallow arcs facing the stage end, like the rows in the theatre photo. */
function arcRows(cx, cy, radii, spacing, maxHalfHeight) {
  return radii.flatMap((radius) => {
    const half = Math.asin(Math.min(1, maxHalfHeight / radius));
    const count = Math.floor((half * 2 * radius) / spacing) + 1;
    const step = count > 1 ? (half * 2) / (count - 1) : 0;
    return range(count, -half, step).map((angle) => ({
      x: Math.round(cx + Math.cos(angle) * radius), y: Math.round(cy + Math.sin(angle) * radius)
    }));
  });
}

/** Rows in a checkerboard: every other row shifts by half a seat. */
function staggered(xs, ys, shift) {
  return xs.flatMap((x, column) => ys
    .map((y) => (column % 2 ? y + shift : y))
    .filter((y) => y < 280)
    .map((y) => ({ x, y })));
}

// group "photo": the plan repeats what the photo shows. group "plan": no photo yet, the plan is the picture.
export const LAYOUTS = {
  theatre: {
    group: 'photo',
    name: 'Спектакль',
    label: 'сцена у торцевой стены, ряды дугой',
    text: 'Ряды дугой перед сценой у тёмной торцевой стены: каждому зрителю видно всё. Для спектаклей, танцевальных показов и премьер.',
    capacity: 'до 100 зрителей',
    photo: 'assets/space/hall-semicircle.jpg',
    alt: 'Ряды стульев дугой перед сценой у торцевой стены',
    stage: { x: 20, y: 50, width: 85, height: 200 },
    seats: () => arcRows(-20, 150, [210, 245, 280, 315, 350, 385], 27, 118)
  },
  lecture: {
    group: 'photo',
    name: 'Лекция',
    label: 'кафедра и два блока с проходом',
    text: 'Фронтальная рассадка с проходом посередине. Для лекций, презентаций, публичных разговоров и кинопоказов.',
    capacity: 'до 100 слушателей',
    photo: 'assets/space/hall-rows-aisle.jpg',
    alt: 'Два блока рядов с проходом посередине',
    stage: { x: 20, y: 105, width: 55, height: 90 },
    seats: () => grid(range(9, 120, 55), [40, 66, 92, 118, 182, 208, 234, 260])
  },
  concert: {
    group: 'photo',
    name: 'Концерт',
    label: 'сцена и ряды в шахматном порядке',
    text: 'Ряды в шахматном порядке с воздухом между стульями: сцену видно в просвет между соседями. Для концертов, стендапа и вечеров.',
    capacity: 'до 100 мест',
    photo: 'assets/seating/seating-cabaret.jpg',
    alt: 'Ряды стульев в шахматном порядке с проходами',
    stage: { x: 20, y: 70, width: 90, height: 160 },
    seats: () => staggered(range(8, 165, 52), range(7, 40, 38), 19)
  },
  windows: {
    group: 'photo',
    name: 'Показ вдоль зала',
    label: 'зрители вдоль окон, вся длина зала — сцена',
    text: 'Зрители в один-два ряда вдоль окон, перед ними — вся длина зала. Для танцевальных показов, дефиле и перформансов, где действие проходит мимо зрителя.',
    capacity: '1–2 ряда вдоль окон',
    photo: 'assets/space/hall-stage-chairs.jpg',
    alt: 'Два ряда стульев вдоль окон, свободный пол и сцена в торце',
    stage: { x: 30, y: 95, width: 540, height: 180 },
    seats: () => grid(range(18, 45, 30), [30, 60])
  },
  free: {
    group: 'photo',
    name: 'Практика · съёмка',
    label: 'свободный зал',
    text: 'Стулья убираются — остаётся 221 м² ровного пола и семь метров высоты. Для танцевальных практик, репетиций, мастер-классов и съёмок.',
    capacity: '221 м² свободного пола',
    photo: 'assets/space/hall-empty.jpg',
    alt: 'Пустой зал: ровный пол, окна во всю стену, фермы под потолком',
    stage: null,
    seats: () => []
  },
  cabaret: {
    group: 'plan',
    name: 'Кабаре',
    label: 'сцена и гости вокруг столиков',
    text: 'Гости сидят компаниями вокруг столиков, между ними остаётся воздух. Для концертов, камерных вечеров и стендапа с напитками.',
    capacity: 'до 100 мест',
    photo: null,
    stage: { x: 20, y: 60, width: 100, height: 180 },
    seats: () => [190, 300, 410, 520].flatMap((x) => [50, 117, 183, 250].map((y) => ({ x, y })))
      .slice(0, 12)
      .flatMap(({ x, y }) => ring(x, y, 22, 6, Math.PI / 6))
  },
  runway: {
    group: 'plan',
    name: 'Подиум',
    label: 'подиум по центру, зрители с двух сторон',
    text: 'Подиум тянется через весь зал, зрители сидят по обе стороны. Для показов мод и дефиле.',
    capacity: 'до 100 гостей',
    photo: null,
    stage: { x: 40, y: 125, width: 520, height: 50 },
    seats: () => grid(range(18, 50, 29.4), [70, 98, 202, 230])
  },
  arena: {
    group: 'plan',
    name: 'Арена',
    label: 'сцена в центре, зрители по кругу',
    text: 'Сцена в центре зала, зрители окружают её со всех сторон. Для иммерсивных спектаклей, батлов и джемов.',
    capacity: 'зрители по кругу в 2 ряда',
    photo: null,
    stage: { x: 235, y: 110, width: 130, height: 80 },
    seats: () => [...ellipse(300, 150, 175, 95, 24), ...ellipse(300, 150, 245, 128, 30, Math.PI / 30)]
  },
  party: {
    group: 'plan',
    name: 'Праздник',
    label: 'диджей, лаунж-зоны и танцпол',
    text: 'Лаунж-зоны по краям и свободный центр для танцев. Для корпоративов, дней рождения и закрытых вечеринок.',
    capacity: 'около 100 гостей и больше без рассадки',
    photo: null,
    stage: { x: 20, y: 110, width: 60, height: 80 },
    seats: () => [[170, 50], [300, 50], [430, 50], [550, 50], [170, 250], [300, 250], [430, 250], [550, 250]]
      .flatMap(([x, y]) => square(x, y, 14))
  }
};

export function seatPositions(name) {
  const layout = LAYOUTS[name] || LAYOUTS.theatre;
  const active = layout.seats();
  return range(SEAT_COUNT, 0, 1).map((i) => active[i] || null);
}
