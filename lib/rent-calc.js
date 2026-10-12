// Rent price calculator. Prices follow the September 2026 price list (assets/sens-price.pdf)
// and the hourly weekend rate published on the rent page.

export const PRICES = {
  hourWeekday: 190,
  hourWeekend: 250,
  minHours: 3,
  maxHours: 16,
  dayMonThu: 2000,
  dayFriSun: 2500,
  techStaff: 300,
  projector: 50,
  studioPerHour: 50,
  turnkeyBase: 3500,
  turnkeyIncludedGuests: 50,
  turnkeyPerGuest: 50,
  maxGuests: 100
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Day of week (0 = Sunday) for a YYYY-MM-DD key, or null for an invalid key. */
export function weekday(dateKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || ''));
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (date.getUTCDate() !== Number(match[3])) return null;
  return date.getUTCDay();
}

export function isWeekend(dateKey) {
  const day = weekday(dateKey);
  return day === 0 || day === 6;
}

/** Friday to Sunday use the higher daily rate. */
export function isLongWeekend(dateKey) {
  const day = weekday(dateKey);
  return day === 0 || day === 5 || day === 6;
}

/**
 * @param {{ mode: 'hourly'|'daily'|'turnkey', date?: string, hours?: number, guests?: number, tech?: boolean, video?: boolean, studio?: boolean }} input
 * @returns {{ total: number, lines: {label: string, amount: number}[], hint: string }}
 */
export function calculate({ mode = 'hourly', date = '', hours = PRICES.minHours, guests = PRICES.turnkeyIncludedGuests, tech = false, video = false, studio = false } = {}) {
  const lines = [];
  let hint = '';

  if (mode === 'turnkey') {
    const count = clamp(Math.round(Number(guests) || 0), 1, PRICES.maxGuests);
    const extra = Math.max(0, count - PRICES.turnkeyIncludedGuests);
    lines.push({ label: `Событие под ключ, до ${PRICES.turnkeyIncludedGuests} гостей`, amount: PRICES.turnkeyBase });
    if (extra) lines.push({ label: `Ещё ${extra} ${plural(extra, 'гость', 'гостя', 'гостей')} × ${PRICES.turnkeyPerGuest} BYN`, amount: extra * PRICES.turnkeyPerGuest });
    hint = 'Сценарий, организация и площадка — на нас. Финальную смету соберём под задачу.';
  } else if (mode === 'daily') {
    const high = isLongWeekend(date);
    lines.push({ label: `Сутки, ${high ? 'пт–вс' : 'пн–чт'}`, amount: high ? PRICES.dayFriSun : PRICES.dayMonThu });
  } else {
    const count = clamp(Math.round(Number(hours) || 0), PRICES.minHours, PRICES.maxHours);
    const weekend = isWeekend(date);
    const rate = weekend ? PRICES.hourWeekend : PRICES.hourWeekday;
    lines.push({ label: `${count} ${plural(count, 'час', 'часа', 'часов')} × ${rate} BYN (${weekend ? 'выходной' : 'будний день'})`, amount: count * rate });
    const daily = isLongWeekend(date) ? PRICES.dayFriSun : PRICES.dayMonThu;
    if (count * rate >= daily) hint = `Выгоднее взять сутки — ${formatByn(daily)}.`;
    if (studio) lines.push({ label: `Белый зал · ${count} ${plural(count, 'час', 'часа', 'часов')} × ${PRICES.studioPerHour} BYN`, amount: count * PRICES.studioPerHour });
  }

  if (tech && mode !== 'turnkey') lines.push({ label: 'Технический персонал: звук, свет', amount: PRICES.techStaff });
  if (video && mode !== 'turnkey') lines.push({ label: 'Проектор и экран', amount: PRICES.projector });

  return { total: lines.reduce((sum, line) => sum + line.amount, 0), lines, hint };
}

export function plural(count, one, few, many) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function formatByn(amount) {
  return `${new Intl.NumberFormat('ru-RU').format(amount).replace(/ /g, ' ')} BYN`;
}
