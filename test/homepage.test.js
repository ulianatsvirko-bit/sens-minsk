import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), 'utf8');
}

test('homepage follows the required section order', async () => {
  const html = await read('index.html');
  const markers = [
    'class="hero"',
    'id="afisha"',
    'id="hall"',
    'id="repertoire"',
    'id="troupe"',
    'id="rent"',
    '<footer'
  ];
  const positions = markers.map((marker) => html.indexOf(marker));
  assert.ok(positions.every((position) => position >= 0), `missing section marker: ${positions}`);
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

test('homepage uses confirmed troupe wording and avoids unsupported claims', async () => {
  const html = await read('index.html');
  assert.match(html, /Труппа театра современной хореографии <em>СЭНС<\/em>/);
  assert.doesNotMatch(html, /собственн(?:ая|ой|ый|ого)\s+(?:театральн(?:ая|ой)\s+)?(?:труппа|репертуар)/i);
  assert.doesNotMatch(html, /(?:труппа|репертуар)[^.<]{0,40}собственн/i);
  assert.match(html, /Александра Буяльская/);
  assert.doesNotMatch(html, /открывается|скоро откро/i);
});

test('homepage event client uses the shared renderers and API source', async () => {
  const script = await read('home-page.js');
  assert.match(script, /fetch\('\/api\/events'\)/);
  assert.match(script, /renderUpcomingEvents\(events\)/);
  assert.match(script, /renderPastEvents\(/);
});

test('homepage hero video stays muted, inline and pausable', async () => {
  const html = await read('index.html');
  assert.match(html, /<video[^>]*\bmuted\b[^>]*\bplaysinline\b/);
  assert.match(html, /data-video-toggle/);
});

test('every homepage image declares its size', async () => {
  const html = await read('index.html');
  const images = html.match(/<img\b[^>]*>/g) || [];
  assert.ok(images.length > 10);
  for (const tag of images) assert.match(tag, /width="\d+" height="\d+"/, tag);
});

test('Vercel keeps public pages static and proxies the event API', async () => {
  const config = JSON.parse(await read('vercel.json'));
  assert.deepEqual(config.redirects.slice(0, 1), [
    { source: '/space', destination: '/space.html', permanent: false }
  ]);
  assert.equal(config.rewrites.some(({ source, destination }) => source === '/api/events' && destination.includes('/api/events')), true);
  assert.equal(config.rewrites.some(({ source }) => source === '/api/admin/:path*'), true);
  assert.equal(config.redirects.some(({ source, destination }) => source === '/rent.html' || destination === '/rent.html'), false);
});

test('space page is built on the shared foundation and draws the floor plan', async () => {
  const html = await read('space.html');
  assert.match(html, /href="sens\.css/);
  assert.match(html, /data-floor-svg/);
  assert.match(html, /src="space-page\.js/);
  assert.match(html, /t\.me\/sensehubminsk/);
  const images = html.match(/<img\b[^>]*>/g) || [];
  for (const tag of images) assert.match(tag, /width="\d+" height="\d+"/, tag);
});

test('rent page keeps the #contact anchor, calculator, calendar and sends extra fields', async () => {
  const html = await read('rent.html');
  assert.match(html, /href="sens\.css/);
  assert.match(html, /id="contact"/);
  assert.match(html, /data-calc\b/);
  assert.match(html, /data-calendar\b/);
  for (const name of ['name', 'contact', 'format', 'date', 'guests', 'estimate', 'consent', 'website', 'form_started_at']) {
    assert.match(html, new RegExp(`name="${name}"`), name);
  }
  const images = html.match(/<img\b[^>]*>/g) || [];
  for (const tag of images) assert.match(tag, /width="\d+" height="\d+"/, tag);
});

test('Vercel proxies the public busy-dates API to the VPS', async () => {
  const config = JSON.parse(await read('vercel.json'));
  assert.ok(config.rewrites.some(({ source, destination }) => source === '/api/busy' && destination.endsWith('/api/busy')));
});

test('play pages exist, link to each other and are linked from the homepage', async () => {
  const home = await read('index.html');
  for (const [slug, other] of [['spinoy-k-zavtra', 'superpozitsiya'], ['superpozitsiya', 'spinoy-k-zavtra']]) {
    const html = await read(`${slug}.html`);
    assert.match(home, new RegExp(`href="${slug}\\.html"`));
    assert.match(html, new RegExp(`href="${other}\\.html"`));
    assert.match(html, /data-notify="Спектакль/);
    assert.match(html, /Татьяна Лебедева/);
    assert.match(html, /"@type": "CreativeWork"/);
    for (const tag of html.match(/<img\b[^>]*>/g) || []) assert.match(tag, /width="\d+" height="\d+"/, tag);
  }
  const sitemap = await read('sitemap.xml');
  assert.match(sitemap, /spinoy-k-zavtra\.html/);
  assert.match(sitemap, /superpozitsiya\.html/);
});
