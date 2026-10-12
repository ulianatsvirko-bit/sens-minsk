import test from 'node:test';
import assert from 'node:assert/strict';
import { ageText, dateParts, eventSchema, filterByType, paragraphs, renderListing, renderPastCard, splitEvents, toIcs } from '../lib/event-view.js';

const event = (overrides = {}) => ({ id: '1', published: true, date: '2026-10-20', time: '19:00', type: 'talks', title: 'Разговор', price: '25', description: '', image: '/uploads/a.jpg', times: [{ time: '19:00', endTime: '21:00', age: '16+' }], ...overrides });

test('splitEvents separates upcoming and past and drops drafts and bad dates', () => {
  const { upcoming, past } = splitEvents([
    event({ id: 'a', date: '2026-10-12' }),
    event({ id: 'b', date: '2026-10-30' }),
    event({ id: 'c', date: '2026-10-01' }),
    event({ id: 'd', date: '2026-09-01' }),
    event({ id: 'draft', published: false }),
    event({ id: 'bad', date: '2026-13-01' })
  ], '2026-10-12');
  assert.deepEqual(upcoming.map((e) => e.id), ['a', 'b']);
  assert.deepEqual(past.map((e) => e.id), ['c', 'd']);
});

test('filterByType ignores unknown types', () => {
  const list = [event({ type: 'talks' }), event({ type: 'practice' })];
  assert.equal(filterByType(list, 'practice').length, 1);
  assert.equal(filterByType(list, 'nope').length, 2);
  assert.equal(filterByType(list, '').length, 2);
});

test('dateParts and ageText read the schedule', () => {
  assert.deepEqual(dateParts('2026-10-20'), { day: '20', monthShort: 'ОКТ', long: '20 октября', weekday: 'вторник' });
  assert.equal(ageText(event({ times: [{ time: '10:00', age: '6+' }, { time: '12:00', age: '12+' }, { time: '14:00', age: '6+' }] })), '6+ / 12+');
});

test('renderListing escapes API content and links registration for upcoming events only', () => {
  const html = renderListing(event({ id: '7"x', title: '<img onerror=1>' }));
  assert.match(html, /event\.html\?id=7%22x#register/);
  assert.doesNotMatch(html, /<img onerror/);
  assert.match(html, /&lt;img onerror=1&gt;/);
  assert.match(html, /16\+/);
  assert.match(html, /25 BYN/);
  const past = renderListing(event(), { past: true });
  assert.doesNotMatch(past, /#register/);
  assert.match(past, /listing--past/);
});

test('paragraphs escapes text and keeps line breaks', () => {
  assert.equal(paragraphs('a <b>\nb\n\nc'), '<p>a &lt;b&gt;<br>b</p><p>c</p>');
});

test('toIcs builds a valid calendar entry in Minsk time', () => {
  const ics = toIcs(event({ title: 'Вечер; танцы, музыка' }), 'https://x/event.html?id=1');
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART;TZID=Europe\/Minsk:20261020T190000/);
  assert.match(ics, /DTEND;TZID=Europe\/Minsk:20261020T210000/);
  assert.match(ics, /SUMMARY:Вечер\\; танцы\\, музыка/);
});

test('eventSchema describes the event and only offers tickets for upcoming priced events', () => {
  const upcoming = eventSchema(event(), 'https://sens-minsk.vercel.app/event.html?id=1', '2026-10-12');
  assert.equal(upcoming['@type'], 'Event');
  assert.equal(upcoming.startDate, '2026-10-20T19:00:00+03:00');
  assert.equal(upcoming.endDate, '2026-10-20T21:00:00+03:00');
  assert.equal(upcoming.offers.price, '25');
  assert.equal(upcoming.image[0], 'https://sens-minsk.vercel.app/uploads/a.jpg');
  const past = eventSchema(event(), 'https://sens-minsk.vercel.app/event.html?id=1', '2026-11-01');
  assert.equal(past.offers, undefined);
});

test('timesText lists start and end times without ages', async () => {
  const { timesText } = await import('../lib/event-view.js');
  assert.equal(timesText(event({ times: [{ time: '12:00', endTime: '14:00', age: '16+' }, { time: '18:00', age: '' }] })), '12:00–14:00 / 18:00');
});

test('renderPastCard shows poster, date and escaped title linking to the event', () => {
  const html = renderPastCard(event({ id: '9', date: '2026-10-04', title: '<b>Латина</b>', type: 'practice' }));
  assert.match(html, /href="event\.html\?id=9"/);
  assert.match(html, /src="\/uploads\/a\.jpg"/);
  assert.match(html, /4 октября/);
  assert.match(html, /&lt;b&gt;Латина&lt;\/b&gt;/);
  assert.doesNotMatch(html, /<b>Латина/);
});
