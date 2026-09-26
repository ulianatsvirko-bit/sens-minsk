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
    'class="section events"',
    'class="section about"',
    'class="section space-preview"',
    'class="company"',
    'class="section together"',
    'class="final"',
    '<footer>'
  ];
  const positions = markers.map((marker) => html.indexOf(marker));
  assert.ok(positions.every((position) => position >= 0), `missing section marker: ${positions}`);
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

test('homepage uses confirmed troupe wording and avoids unsupported claims', async () => {
  const html = await read('index.html');
  assert.match(html, /Труппа театра современной хореографии <span>СЭНС<\/span>/);
  assert.doesNotMatch(html, /собственн(?:ая|ой|ый|ого)\s+(?:театральн(?:ая|ой)\s+)?(?:труппа|репертуар)/i);
  assert.doesNotMatch(html, /(?:труппа|репертуар)[^.<]{0,40}собственн/i);
  assert.match(html, /Александра Буяльская/);
  assert.doesNotMatch(html, /открывается|скоро откро/i);
});

test('homepage event client uses the shared renderer and API source', async () => {
  const script = await read('home.js');
  assert.match(script, /fetch\('\/api\/events'\)/);
  assert.match(script, /renderUpcomingEvents\(events\)/);
});

test('Vercel routes homepage and space while leaving rent untouched', async () => {
  const config = JSON.parse(await read('vercel.json'));
  assert.deepEqual(config.rewrites.slice(0, 2), [
    { source: '/', destination: '/index.html' },
    { source: '/space', destination: '/space.html' }
  ]);
  assert.equal(config.redirects.some(({ source, destination }) => source === '/rent.html' || destination === '/rent.html'), false);
});
