import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { TROUPE, findMember, instagramUrl, memberGallery } from '../lib/troupe.js';

test('every troupe member has a unique id and an existing portrait', () => {
  const ids = TROUPE.map((member) => member.id);
  assert.equal(new Set(ids).size, ids.length);
  TROUPE.forEach((member) => assert.ok(existsSync(member.photo), member.photo));
});

test('gallery photos exist on disk', () => {
  TROUPE.flatMap((member) => member.gallery || []).forEach((shot) => assert.ok(existsSync(shot.src), shot.src));
});

test('member without a gallery falls back to the portrait', () => {
  const member = { id: 'x', name: 'Имя', photo: 'assets/troupe/x.jpg' };
  assert.deepEqual(memberGallery(member), [{ src: 'assets/troupe/x.jpg', alt: 'Имя', width: 853, height: 1280 }]);
});

test('Liza Esipova has her six-photo gallery', () => {
  assert.equal(memberGallery(findMember('elizaveta-esipova')).length, 6);
  assert.equal(findMember('nobody'), undefined);
});

test('instagram handles become safe profile links', () => {
  assert.equal(instagramUrl('@liza.esipova'), 'https://www.instagram.com/liza.esipova/');
  assert.equal(instagramUrl('https://www.instagram.com/liza_e/'), 'https://www.instagram.com/liza_e/');
  assert.equal(instagramUrl('instagram.com/liza_e?igsh=abc'), 'https://www.instagram.com/liza_e/');
  assert.equal(instagramUrl(''), '');
  assert.equal(instagramUrl('javascript:alert(1)'), '');
});

test('Liza Esipova has a bio and the ballet artist role', () => {
  const liza = findMember('elizaveta-esipova');
  assert.equal(liza.role, 'Артистка балета');
  assert.match(liza.bio, /университет культуры и искусств/);
});

test('Nikita Skurat has eight photos, landscape shots marked wide', () => {
  const gallery = memberGallery(findMember('nikita-skurat'));
  assert.equal(gallery.length, 8);
  assert.deepEqual(gallery.map((shot) => shot.width > shot.height), [false, false, false, true, false, false, false, true]);
  assert.ok(gallery.every((shot) => !shot.alt.startsWith('wide:')));
});

test('Konstantin Matsukevich has a nine-photo gallery', () => {
  assert.equal(memberGallery(findMember('konstantin-matsukevich')).length, 9);
});
