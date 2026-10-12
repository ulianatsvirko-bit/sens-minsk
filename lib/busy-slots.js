// Busy dates for the rent calendar: admin-entered slots plus published events.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validDate(value) {
  if (!DATE_RE.test(String(value))) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/**
 * Validate an admin busy slot. Empty start/end means the whole day.
 * @returns {{ date: string, start: string, end: string, note: string }}
 */
export function parseBusySlot(body = {}) {
  const date = String(body.date ?? '').trim();
  const start = String(body.start ?? '').trim();
  const end = String(body.end ?? '').trim();
  const note = String(body.note ?? '').trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 200);

  if (!validDate(date)) throw new Error('Укажите дату в формате ГГГГ-ММ-ДД.');
  if (Boolean(start) !== Boolean(end)) throw new Error('Укажите и начало, и конец — или оставьте оба поля пустыми для целого дня.');
  if (start && (!TIME_RE.test(start) || !TIME_RE.test(end))) throw new Error('Время указывается как ЧЧ:ММ.');
  if (start && end <= start) throw new Error('Конец должен быть позже начала.');
  return { date, start, end, note };
}

/** Public view of busy slots: no private notes, only today and later. */
export function publicBusy(slots, today) {
  return (Array.isArray(slots) ? slots : [])
    .filter((slot) => slot && validDate(slot.date) && slot.date >= today)
    .map(({ date, start = '', end = '' }) => ({ date, start, end }))
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
}

/**
 * Merge admin slots and published events into a map: date → { full: boolean, ranges: string[] }.
 */
export function busyByDate(slots = [], events = []) {
  const map = new Map();
  const add = (date, start, end) => {
    if (!validDate(date)) return;
    const entry = map.get(date) || { full: false, ranges: [] };
    const full = entry.full || !start;
    const ranges = start ? [...entry.ranges, end ? `${start}–${end}` : `с ${start}`] : entry.ranges;
    map.set(date, { full, ranges });
  };

  slots.forEach((slot) => add(slot?.date, slot?.start, slot?.end));
  events.filter((event) => event?.published).forEach((event) => {
    const times = Array.isArray(event.times) && event.times.length ? event.times : [{ time: event.time }];
    times.forEach((slot) => add(event.date, slot?.time || '', slot?.endTime || ''));
  });
  return map;
}

/** Month grid starting on Monday: array of weeks, each with 7 date keys or null. */
export function monthGrid(year, monthIndex) {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const days = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  const cells = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: days }, (_, i) => `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`)
  ];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}
