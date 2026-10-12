// Floor plan of СЭНС (rooms 12–18 of the building survey), in metres.
// x runs along the long window wall (Кульман), y from the courtyard side (0) to the street windows.

export const PLAN = { width: 37.2, height: 17.1 };

export const ROOMS = [
  {
    id: 'hall',
    label: 'Зал · 221 м²',
    number: '13',
    name: 'Арт-пространство',
    area: '221,1 м²',
    text: 'Главный зал 24,5 × 6,7 м с потолками 7 м. Окна во всю длинную стену, фермы под свет, до 100 стульев в любой расстановке. Для танца стелем линолеум.',
    photo: 'assets/space/hall-empty.jpg',
    alt: 'Пустой главный зал: окна со шторами, фермы под потолком, длинная перспектива',
    shape: [[6.15, 10.15], [30.7, 10.15], [30.7, 17.1], [6.15, 17.1]]
  },
  {
    id: 'storage',
    label: 'Склад',
    number: '13',
    name: 'Служебное помещение',
    area: 'за шторами',
    text: 'Подсобка, отделённая от зала шторами: здесь хранятся декорации, реквизит и всё, что не нужно на вашем событии.',
    photo: null,
    alt: '',
    shape: [[6.15, 6.8], [13.2, 6.8], [13.2, 10.15], [6.15, 10.15]]
  },
  {
    id: 'welcome',
    label: 'Welcome',
    number: '12',
    name: 'Welcome-зона и гардероб',
    area: '81,2 м²',
    text: 'Здесь встречают гостей: главный вход, гардероб, регистрация, бар или фуршет. Зона открыта в зал — можно сделать её частью события.',
    photo: 'assets/space/welcome-long.jpg',
    alt: 'Welcome-зона: белые пуфы, столики и шторы, в глубине — зал',
    shape: [[0, 4.45], [3.5, 4.45], [3.5, 0], [5.7, 0], [5.7, 6.8], [6.15, 6.8], [6.15, 17.1], [0, 17.1]]
  },
  {
    id: 'greenroom',
    label: 'Гримёрка',
    number: '18',
    name: 'Гримёрка',
    area: '39,1 м²',
    text: 'Отдельная комната для артистов и спикеров: переодеться, подготовиться, оставить вещи.',
    photo: null,
    alt: '',
    shape: [[31, 10.5], [37.2, 10.5], [37.2, 17.1], [31, 17.1]]
  },
  {
    id: 'courtyard',
    label: 'Двор ↑',
    number: '17',
    name: 'Коридор и выход во двор',
    area: '21,8 м²',
    text: 'Второй вход. Внутренний дворик можно оформить для встречи гостей, фотозоны или перерыва на воздухе.',
    photo: null,
    alt: '',
    shape: [[13.2, 0], [15.4, 0], [15.4, 10.15], [13.2, 10.15]]
  },
  {
    id: 'restrooms',
    label: 'WC',
    number: '15–16',
    name: 'Санузлы',
    area: '9,8 м²',
    text: 'Мужской и женский, рядом с welcome-зоной.',
    photo: 'assets/space/restroom-sign.jpg',
    alt: 'Табличка «Женский» на светлой двери',
    shape: [[0.45, 0.3], [3.5, 0.3], [3.5, 4.3], [0.45, 4.3]]
  },
  {
    id: 'studio',
    label: 'Белый зал',
    number: '14',
    name: 'Белый зал',
    area: '45,7 м²',
    text: '«Белый зал» 7,3 × 6 м с зеркалом и станком. Можно взять в аренду вместе с основным — для разминки, репетиций или второй программы.',
    photo: 'assets/space/studio.jpg',
    alt: 'Белый зал с зеркальной стеной, станком и большими окнами',
    extra: true,
    shape: [[5.7, 0.3], [13.2, 0.3], [13.2, 6.7], [5.7, 6.7]]
  }
];

export const ENTRANCES = [
  { label: 'Главный вход', x: 1.4, y: 17.1 },
  { label: 'Выход во двор', x: 14.3, y: 0 }
];

/** Area of a polygon in m² (shoelace formula). */
export function polygonArea(shape) {
  const doubled = shape.reduce((sum, [x1, y1], i) => {
    const [x2, y2] = shape[(i + 1) % shape.length];
    return sum + x1 * y2 - x2 * y1;
  }, 0);
  return Math.abs(doubled) / 2;
}

/** Visual centre of a room for its label: the centre of its bounding box. */
export function roomCentre(shape) {
  const xs = shape.map(([x]) => x);
  const ys = shape.map(([, y]) => y);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
}

export function toPoints(shape, scale) {
  return shape.map(([x, y]) => `${(x * scale).toFixed(1)},${(y * scale).toFixed(1)}`).join(' ');
}

export function findRoom(id) {
  return ROOMS.find((room) => room.id === id) || ROOMS[0];
}
