import test from 'node:test';
import assert from 'node:assert/strict';
import { PRICES, calculate, formatByn, isLongWeekend, isWeekend, plural, weekday } from '../lib/rent-calc.js';
import { busyByDate, monthGrid, parseBusySlot, publicBusy } from '../lib/busy-slots.js';

// 2026-10-12 is a Monday.
test('weekday helpers know the calendar', () => {
  assert.equal(weekday('2026-10-12'), 1);
  assert.equal(weekday('2026-02-30'), null);
  assert.equal(isWeekend('2026-10-17'), true);
  assert.equal(isWeekend('2026-10-16'), false);
  assert.equal(isLongWeekend('2026-10-16'), true);
  assert.equal(isLongWeekend('2026-10-15'), false);
});

test('hourly rent uses weekday and weekend rates with a three-hour minimum', () => {
  assert.equal(calculate({ mode: 'hourly', date: '2026-10-12', hours: 4 }).total, 4 * PRICES.hourWeekday);
  assert.equal(calculate({ mode: 'hourly', date: '2026-10-17', hours: 4 }).total, 4 * PRICES.hourWeekend);
  assert.equal(calculate({ mode: 'hourly', date: '2026-10-12', hours: 1 }).total, 3 * PRICES.hourWeekday);
});

test('hourly rent suggests a full day when it would cost as much', () => {
  assert.match(calculate({ mode: 'hourly', date: '2026-10-12', hours: 11 }).hint, /сутки/);
  assert.equal(calculate({ mode: 'hourly', date: '2026-10-12', hours: 4 }).hint, '');
});

test('daily rent switches price on Friday', () => {
  assert.equal(calculate({ mode: 'daily', date: '2026-10-15' }).total, PRICES.dayMonThu);
  assert.equal(calculate({ mode: 'daily', date: '2026-10-16' }).total, PRICES.dayFriSun);
});

test('turnkey charges per guest above fifty, capped at one hundred', () => {
  assert.equal(calculate({ mode: 'turnkey', guests: 40 }).total, 3500);
  assert.equal(calculate({ mode: 'turnkey', guests: 100 }).total, 6000);
  assert.equal(calculate({ mode: 'turnkey', guests: 400 }).total, 6000);
});

test('technical staff is added to rent but not to turnkey', () => {
  assert.equal(calculate({ mode: 'daily', date: '2026-10-12', tech: true }).total, PRICES.dayMonThu + PRICES.techStaff);
  assert.equal(calculate({ mode: 'turnkey', guests: 50, tech: true }).total, 3500);
});

test('projector with screen adds 50 BYN to rent but not to turnkey', () => {
  const daily = calculate({ mode: 'daily', date: '2026-10-12', video: true });
  assert.equal(daily.total, PRICES.dayMonThu + PRICES.projector);
  assert.equal(PRICES.projector, 50);
  assert.ok(daily.lines.some((line) => line.label.includes('Проектор')));
  assert.equal(calculate({ mode: 'turnkey', guests: 50, video: true }).total, 3500);
});

test('plural and formatByn speak Russian', () => {
  assert.equal(plural(1, 'час', 'часа', 'часов'), 'час');
  assert.equal(plural(3, 'час', 'часа', 'часов'), 'часа');
  assert.equal(plural(12, 'час', 'часа', 'часов'), 'часов');
  assert.equal(formatByn(6000), '6 000 BYN');
});

test('parseBusySlot validates dates and time ranges', () => {
  assert.deepEqual(parseBusySlot({ date: '2026-10-20' }), { date: '2026-10-20', start: '', end: '', note: '' });
  assert.deepEqual(parseBusySlot({ date: '2026-10-20', start: '18:00', end: '22:00', note: 'Корпоратив\n' }).note, 'Корпоратив');
  assert.throws(() => parseBusySlot({ date: '2026-13-01' }));
  assert.throws(() => parseBusySlot({ date: '2026-10-20', start: '18:00' }));
  assert.throws(() => parseBusySlot({ date: '2026-10-20', start: '22:00', end: '18:00' }));
});

test('publicBusy hides notes and past slots', () => {
  const result = publicBusy([
    { date: '2026-10-01', note: 'old' },
    { date: '2026-10-20', start: '18:00', end: '22:00', note: 'секрет' }
  ], '2026-10-12');
  assert.deepEqual(result, [{ date: '2026-10-20', start: '18:00', end: '22:00' }]);
});

test('busyByDate merges slots with published events', () => {
  const map = busyByDate(
    [{ date: '2026-10-20', start: '10:00', end: '12:00' }, { date: '2026-10-21' }],
    [{ published: true, date: '2026-10-20', times: [{ time: '19:00', endTime: '21:00' }] }, { published: false, date: '2026-10-22', time: '19:00' }]
  );
  assert.deepEqual(map.get('2026-10-20'), { full: false, ranges: ['10:00–12:00', '19:00–21:00'] });
  assert.equal(map.get('2026-10-21').full, true);
  assert.equal(map.has('2026-10-22'), false);
});

test('monthGrid starts weeks on Monday', () => {
  const weeks = monthGrid(2026, 9); // October 2026 starts on Thursday
  assert.deepEqual(weeks[0], [null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
  assert.ok(weeks.every((week) => week.length === 7));
  assert.equal(weeks.flat().filter(Boolean).length, 31);
});

test('white hall adds 50 BYN per rented hour to hourly rent only', () => {
  const base = calculate({ mode: 'hourly', date: '2026-10-12', hours: 4 }).total;
  const withStudio = calculate({ mode: 'hourly', date: '2026-10-12', hours: 4, studio: true });
  assert.equal(PRICES.studioPerHour, 50);
  assert.equal(withStudio.total, base + 4 * 50);
  assert.ok(withStudio.lines.some((line) => line.label.startsWith('Белый зал')));
  assert.equal(calculate({ mode: 'daily', date: '2026-10-12', studio: true }).total, PRICES.dayMonThu);
  assert.equal(calculate({ mode: 'turnkey', guests: 50, studio: true }).total, 3500);
});
