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

export const LAYOUTS = {
  theatre: {
    name: 'Спектакль',
    label: 'сцена у торцевой стены, ряды',
    text: 'Классические ряды перед сценой: каждому зрителю видно всё. Для спектаклей, танцевальных показов и премьер.',
    capacity: 'до 100 зрителей',
    photo: 'assets/space/hall-semicircle.jpg',
    alt: 'Ряды стульев полукругом перед сценой',
    stage: { x: 20, y: 40, width: 90, height: 220 },
    seats: () => grid(range(9, 150, 50), range(8, 50, 28.5))
  },
  lecture: {
    name: 'Лекция',
    label: 'кафедра и два блока с проходом',
    text: 'Фронтальная рассадка с проходом посередине. Для лекций, презентаций, публичных разговоров и кинопоказов.',
    capacity: 'до 100 слушателей',
    photo: 'assets/space/hall-rows-aisle.jpg',
    alt: 'Два блока рядов с проходом посередине',
    stage: { x: 20, y: 105, width: 55, height: 90 },
    seats: () => grid(range(9, 120, 55), [40, 66, 92, 118, 182, 208, 234, 260])
  },
  cabaret: {
    name: 'Концерт · вечер',
    label: 'сцена и гости вокруг столиков',
    text: 'Кабаре: гости сидят группами, между ними остаётся воздух. Для концертов, вечеров, стендапа и камерных встреч.',
    capacity: 'до 100 мест',
    photo: 'assets/seating/seating-cabaret.jpg',
    alt: 'Рассадка кабаре: стулья расставлены группами',
    stage: { x: 20, y: 60, width: 100, height: 180 },
    seats: () => [190, 300, 410, 520].flatMap((x) => [50, 117, 183, 250].map((y) => ({ x, y })))
      .slice(0, 12)
      .flatMap(({ x, y }) => ring(x, y, 22, 6, Math.PI / 6))
  },
  runway: {
    name: 'Показ вдоль зала',
    label: 'подиум по центру, зрители с двух сторон',
    text: 'Сцена тянется через весь зал, зрители сидят по обе стороны. Для показов мод, дефиле и танцевальных шоу.',
    capacity: 'до 100 гостей',
    photo: 'assets/space/hall-stage-chairs.jpg',
    alt: 'Стулья вдоль обеих длинных стен, свободный центр и сцена в торце',
    stage: { x: 40, y: 125, width: 520, height: 50 },
    seats: () => grid(range(18, 50, 29.4), [70, 98, 202, 230])
  },
  free: {
    name: 'Практика · съёмка',
    label: 'свободный зал',
    text: 'Стулья убираются — остаётся 221 м² ровного пола и семь метров высоты. Для танцевальных практик, репетиций, мастер-классов и съёмок.',
    capacity: '221 м² свободного пола',
    photo: 'assets/space/hall-empty.jpg',
    alt: 'Пустой зал: ровный пол, окна во всю стену, фермы под потолком',
    stage: null,
    seats: () => []
  },
  party: {
    name: 'Праздник',
    label: 'диджей, лаунж-зоны и танцпол',
    text: 'Лаунж-зоны по краям и свободный центр для танцев. Для корпоративов, дней рождения и закрытых вечеринок.',
    capacity: 'около 100 гостей и больше без рассадки',
    photo: 'assets/space/welcome-lounge.jpg',
    alt: 'Лаунж-зона: белые пуфы и столики у окон',
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
