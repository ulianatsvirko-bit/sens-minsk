// Artist page: artist.html?id=<member id> → portrait, role, bio, Instagram, photos and the next artist.
import { artistHref, findMember, instagramUrl, memberNeighbours } from './lib/troupe.js?v=20261023-1';

const FALLBACK_BIO = 'Труппа театра современной хореографии СЭНС.';

function photo(shot) {
  const item = document.createElement('li');
  if (shot.width > shot.height) item.classList.add('is-wide');
  const img = document.createElement('img');
  Object.assign(img, { src: shot.src, alt: shot.alt, width: shot.width, height: shot.height, loading: 'lazy', decoding: 'async' });
  item.append(img);
  return item;
}

function fillNeighbour(link, member) {
  link.href = artistHref(member.id);
  link.querySelector('b').textContent = member.name;
}

function render(member) {
  const page = document.querySelector('[data-artist]');
  document.title = `${member.name} — труппа СЭНС`;
  document.querySelector('meta[name="description"]')
    .setAttribute('content', `${member.name}, ${member.role.toLowerCase()} труппы театра современной хореографии СЭНС в Минске.`);
  document.querySelector('meta[property="og:title"]').setAttribute('content', `${member.name} — труппа СЭНС`);

  const portrait = page.querySelector('[data-artist-photo]');
  Object.assign(portrait, { src: member.photo, alt: member.name });
  page.querySelector('[data-artist-role]').textContent = member.role;
  page.querySelector('[data-artist-name]').textContent = member.name;
  page.querySelector('[data-artist-bio]').textContent = member.bio || FALLBACK_BIO;

  const instagram = page.querySelector('[data-artist-instagram]');
  const url = instagramUrl(member.instagram);
  instagram.hidden = !url;
  if (url) {
    instagram.href = url;
    instagram.querySelector('span').textContent = `@${url.split('/')[3]}`;
  }

  const gallery = member.gallery || [];
  page.querySelector('[data-artist-photos]').hidden = gallery.length === 0;
  page.querySelector('[data-artist-gallery]').replaceChildren(...gallery.map(photo));

  const { prev, next } = memberNeighbours(member.id);
  fillNeighbour(document.querySelector('[data-artist-prev]'), prev);
  fillNeighbour(document.querySelector('[data-artist-next]'), next);
}

const member = findMember(new URLSearchParams(location.search).get('id'));
if (member) render(member);
else location.replace('troupe.html');
