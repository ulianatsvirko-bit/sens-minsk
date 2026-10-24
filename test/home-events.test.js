import test from 'node:test';
import assert from 'node:assert/strict';

import {
  escapeHtml,
  localDateKey,
  renderUpcomingEvents,
  safeImageUrl,
  selectUpcomingEvents
} from '../lib/home-events.js';

test('localDateKey uses local calendar fields', () => {
  const date = new Date(2026, 8, 22, 23, 30);
  assert.equal(localDateKey(date), '2026-09-22');
});

test('selectUpcomingEvents keeps published events from today, sorts them, and returns three', () => {
  const events = [
    { id: 'past', published: true, date: '2026-09-21', time: '12:00' },
    { id: 'draft', published: false, date: '2026-09-22', time: '09:00' },
    { id: 'fourth', published: true, date: '2026-09-25', time: '10:00' },
    { id: 'third', published: true, date: '2026-09-24', time: '10:00' },
    { id: 'second', published: true, date: '2026-09-23', time: '18:00' },
    { id: 'today-late', published: true, date: '2026-09-22', time: '20:00' },
    { id: 'today-early', published: true, date: '2026-09-22', time: '10:00' },
    { id: 'invalid', published: true, date: 'tomorrow', time: '10:00' }
  ];

  assert.deepEqual(
    selectUpcomingEvents(events, '2026-09-22').map((event) => event.id),
    ['today-early', 'today-late', 'second']
  );
});

test('selectUpcomingEvents handles non-array API data', () => {
  assert.deepEqual(selectUpcomingEvents({ events: [] }, '2026-09-22'), []);
});

test('escapeHtml escapes text and attribute delimiters', () => {
  assert.equal(escapeHtml(`<script>'&"</script>`), '&lt;script&gt;&#39;&amp;&quot;&lt;/script&gt;');
});

test('safeImageUrl rejects executable and control-character URLs', () => {
  assert.equal(safeImageUrl('javascript:alert(1)'), 'assets/premiere-stage.jpg');
  assert.equal(safeImageUrl('data:image/svg+xml,<svg/>'), 'assets/premiere-stage.jpg');
  assert.equal(safeImageUrl('https://example.com/image.jpg\nnext'), 'assets/premiere-stage.jpg');
  assert.equal(safeImageUrl('/uploads/show.webp'), '/uploads/show.webp');
});

test('renderUpcomingEvents escapes API content and URL identifiers', () => {
  const html = renderUpcomingEvents([{
    id: `one&x=\"bad`,
    published: true,
    date: '2026-09-22',
    time: '19:00',
    type: '<unsafe>',
    title: `<img src=x onerror=alert(1)>`,
    description: `A & B < C`,
    image: `\" onerror=\"alert(1)`
  }], '2026-09-22');

  assert.match(html, /event\?id=one%26x%3D%22bad/);
  assert.doesNotMatch(html, /<img src=x onerror/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /A &amp; B &lt; C/);
  assert.match(html, /src="assets\/premiere-stage\.jpg"/);
});

test('selectPastEvents keeps published events before today, newest first, limited', async () => {
  const { selectPastEvents } = await import('../lib/home-events.js');
  const events = [
    { id: 'old', published: true, date: '2026-09-01', time: '12:00' },
    { id: 'draft', published: false, date: '2026-09-10', time: '12:00' },
    { id: 'recent', published: true, date: '2026-10-10', time: '18:00' },
    { id: 'today', published: true, date: '2026-10-12', time: '18:00' },
    { id: 'mid', published: true, date: '2026-09-20', time: '18:00' }
  ];
  assert.deepEqual(selectPastEvents(events, '2026-10-12', 2).map((event) => event.id), ['recent', 'mid']);
  assert.deepEqual(selectPastEvents(null, '2026-10-12'), []);
});

test('renderPastEvents escapes content and links to the event page', async () => {
  const { renderPastEvents } = await import('../lib/home-events.js');
  const html = renderPastEvents([{ id: '7', published: true, date: '2026-09-25', title: '<b>Вечер</b>', image: 'javascript:x' }]);
  assert.match(html, /<li><a href="event\?id=7">/);
  assert.match(html, /&lt;b&gt;Вечер&lt;\/b&gt;/);
  assert.match(html, /src="assets\/premiere-stage\.jpg"/);
  assert.match(html, /25 сентября/);
});

test('renderUpcomingEvents returns an empty string when nothing is planned', () => {
  assert.equal(renderUpcomingEvents([], '2026-10-12'), '');
});

test('impossible calendar dates are ignored everywhere', async () => {
  const { isValidDateKey, selectPastEvents } = await import('../lib/home-events.js');
  assert.equal(isValidDateKey('2026-13-45'), false);
  assert.equal(isValidDateKey('2026-02-30'), false);
  assert.equal(isValidDateKey('2026-10-12'), true);
  const events = [{ id: 'bad', published: true, date: '2026-13-45' }];
  assert.deepEqual(selectUpcomingEvents(events, '2026-01-01'), []);
  assert.deepEqual(selectPastEvents(events, '2027-01-01'), []);
});

test('the next event card has a solid sign-up button, not a plain link', () => {
  const html = renderUpcomingEvents([
    { id: 7, title: 'Практика', date: '2026-10-24', time: '12:00', published: 1 }
  ], '2026-10-12');
  assert.match(html, /<a class="btn btn--signal event-card__cta" href="event\?id=7#detail-registration">Записаться/);
});
