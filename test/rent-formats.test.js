import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { RENT_FORMATS, findRentFormat, formatFaq } from '../lib/rent-formats.js';
import { renderRentFormatPage } from '../lib/rent-format-page.js';

const ORIGIN = 'https://sense.smartdance.by';
const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

test('every format has a unique slug, its own title, description and h1, and existing photos', () => {
  for (const key of ['slug', 'title', 'description', 'h1']) {
    const values = RENT_FORMATS.map((format) => format[key]);
    assert.equal(new Set(values).size, values.length, key);
  }
  for (const format of RENT_FORMATS) {
    assert.match(format.slug, /^arenda-zala-dlya-[a-z-]+$/);
    assert.ok(format.description.length <= 170, `${format.slug}: ${format.description.length}`);
    for (const shot of [format.photo, format.second]) assert.ok(existsSync(shot.src), shot.src);
  }
});

test('formats the venue confirmed are all covered', () => {
  const text = RENT_FORMATS.map((format) => `${format.h1} ${format.lead}`).join(' ').toLowerCase();
  for (const word of ['корпоратив', 'день рождения', 'детск', 'вечеринк', 'фотосесс', 'видеосъём', 'мастер-класс', 'тренинг', 'воркшоп', 'лекци', 'конференц', 'спектакл', 'репетиц', 'показ']) {
    assert.ok(text.includes(word), word);
  }
});

test('party formats say food and alcohol are welcome without a corkage fee', () => {
  for (const slug of ['arenda-zala-dlya-korporativa', 'arenda-zala-dlya-dnya-rozhdeniya']) {
    assert.ok(formatFaq(findRentFormat(slug)).some(({ a }) => /пробкового сбора нет/i.test(a)), slug);
  }
});

test('a format page has its own head, h1, FAQ schema and links to the other formats', () => {
  const format = findRentFormat('arenda-zala-dlya-korporativa');
  const html = renderRentFormatPage(format);
  assert.match(html, /<title>Зал для корпоратива в центре Минска — аренда от 190 BYN\/час · СЭНС<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/sense\.smartdance\.by\/arenda-zala-dlya-korporativa">/);
  assert.equal(html.match(/<h1\b/g).length, 1);
  assert.match(html, /<h1[^>]*>Зал для корпоратива в центре Минска<\/h1>/);
  assert.doesNotMatch(html, /\{\{\w+\}\}/);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((match) => JSON.parse(match[1]));
  const faq = schemas.find((schema) => schema['@type'] === 'FAQPage');
  assert.equal(faq.mainEntity.length, formatFaq(format).length);
  for (const other of RENT_FORMATS.filter((item) => item !== format)) assert.match(html, new RegExp(`href="${other.slug}"`));
  assert.match(html, /href="rent#contact"/);
  for (const tag of html.match(/<img\b[^>]*>/g)) assert.match(tag, /width="\d+" height="\d+"/, tag);
});

test('the rent page targets event searches and links every format page', async () => {
  const html = await read('rent.html');
  assert.match(html, /<h1[^>]*>Аренда зала для мероприятий/);
  assert.match(html, /<title>[^<]*мероприят/);
  for (const format of RENT_FORMATS) assert.match(html, new RegExp(`href="${format.slug}"`), format.slug);
});

test('the server answers format pages and lists them in the sitemap', async () => {
  const server = await read('server.js');
  assert.match(server, /findRentFormat\(/);
  assert.match(server, /RENT_FORMATS\.map/);
});
