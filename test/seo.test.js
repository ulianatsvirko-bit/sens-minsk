import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { findMember } from '../lib/troupe.js';
import { artistMeta, buildSitemap, eventMeta, renderHead } from '../lib/seo.js';

const ORIGIN = 'https://sense.smartdance.by';
const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

test('artist page head carries the name, a canonical link and a Person schema', async () => {
  const html = renderHead(await read('artist.html'), artistMeta(findMember('nikita-skurat'), ORIGIN));
  assert.match(html, /<title>Никита Скурат — артист труппы СЭНС<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/sense\.smartdance\.by\/artist\?id=nikita-skurat">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/sense\.smartdance\.by\/assets\/troupe\/nikita-skurat\.jpg">/);
  assert.match(html, /<meta property="og:url" content="https:\/\/sense\.smartdance\.by\/artist\?id=nikita-skurat">/);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(schema['@type'], 'Person');
  assert.equal(schema.memberOf.url, `${ORIGIN}/troupe`);
  assert.equal(html.match(/<title>/g).length, 1);
  assert.equal(html.match(/name="description"/g).length, 1);
});

test('injected values are escaped so event titles cannot break the page', () => {
  const html = renderHead('<head><title>x</title><meta name="description" content="x"></head>', {
    title: 'A "quoted" <b>', description: 'd & <i>', url: `${ORIGIN}/x`, image: `${ORIGIN}/i.jpg`, schema: { name: '</script><script>alert(1)' }
  });
  assert.match(html, /<title>A &quot;quoted&quot; &lt;b&gt;<\/title>/);
  assert.match(html, /content="d &amp; &lt;i&gt;"/);
  assert.doesNotMatch(html, /<\/script><script>alert/);
});

test('event meta uses the title, date and description of the event', () => {
  const event = { id: '7', title: 'Практика', date: '2026-11-02', time: '19:00', times: [{ time: '19:00', age: '' }], description: 'Контактная импровизация для всех.', image: '/uploads/p.jpg', price: '20 BYN', published: true };
  const meta = eventMeta(event, ORIGIN, '2026-10-24');
  assert.equal(meta.title, 'Практика — 2 ноября · СЭНС');
  assert.match(meta.description, /^Практика, 2 ноября в СЭНС на Кульман 1\/2\. Контактная импровизация/);
  assert.equal(meta.url, `${ORIGIN}/event?id=7`);
  assert.equal(meta.image, `${ORIGIN}/uploads/p.jpg`);
  assert.equal(meta.schema['@type'], 'Event');
});

test('sitemap lists pages, every artist and published events only', () => {
  const xml = buildSitemap(ORIGIN, {
    pages: ['/', '/troupe'],
    members: [{ id: 'anna-arkhipova' }],
    events: [{ id: '3', date: '2026-11-02', published: true }, { id: '4', date: '2026-11-03', published: false }]
  });
  assert.match(xml, /<loc>https:\/\/sense\.smartdance\.by\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/sense\.smartdance\.by\/troupe<\/loc>/);
  assert.match(xml, /<loc>https:\/\/sense\.smartdance\.by\/artist\?id=anna-arkhipova<\/loc>/);
  assert.match(xml, /<loc>https:\/\/sense\.smartdance\.by\/event\?id=3<\/loc>/);
  assert.doesNotMatch(xml, /event\?id=4/);
});

test('the server renders artist and event heads and the sitemap itself', async () => {
  const server = await read('server.js');
  assert.match(server, /app\.get\('\/artist'/);
  assert.match(server, /app\.get\('\/event'/);
  assert.match(server, /app\.get\('\/sitemap\.xml'/);
});

test('troupe page schema lists every artist with a link to their page', async () => {
  const { TROUPE } = await import('../lib/troupe.js');
  const html = await read('troupe.html');
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(schema['@type'], 'PerformingGroup');
  assert.deepEqual(schema.member.map((person) => person.url), TROUPE.map(({ id }) => `${ORIGIN}/artist?id=${id}`));
});

test('page descriptions stay within what search results show', async () => {
  for (const file of ['index.html', 'events.html', 'rent.html', 'space.html', 'troupe.html', 'spinoy-k-zavtra.html', 'superpozitsiya.html']) {
    const description = (await read(file)).match(/<meta name="description" content="([^"]*)"/)[1];
    assert.ok(description.length <= 170, `${file}: ${description.length}`);
  }
});
