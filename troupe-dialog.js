// Troupe member dialog: tap a card → photo gallery, name, role and Instagram.
import { findMember, instagramUrl, memberGallery } from './lib/troupe.js?v=20261012-4';

function slide(shot, index) {
  const item = document.createElement('li');
  const img = document.createElement('img');
  Object.assign(img, { src: shot.src, alt: shot.alt, width: shot.width, height: shot.height, decoding: 'async' });
  if (index > 0) img.loading = 'lazy';
  if (shot.width > shot.height) img.classList.add('is-wide');
  item.append(img);
  return item;
}

export function initTroupe() {
  const dialog = document.querySelector('[data-member-dialog]');
  if (!dialog) return;

  const track = dialog.querySelector('[data-member-track]');
  const nav = dialog.querySelector('[data-member-nav]');
  const count = dialog.querySelector('[data-member-count]');
  const prev = dialog.querySelector('[data-member-prev]');
  const next = dialog.querySelector('[data-member-next]');
  const instagram = dialog.querySelector('[data-member-instagram]');
  let opener = null;

  const current = () => Math.round(track.scrollLeft / (track.clientWidth || 1));
  const updateCount = () => {
    const total = track.children.length;
    const index = Math.min(total - 1, current());
    count.textContent = `${index + 1} / ${total}`;
    prev.disabled = index === 0;
    next.disabled = index === total - 1;
  };
  const go = (step) => track.scrollBy({ left: step * track.clientWidth, behavior: 'smooth' });

  const open = (button) => {
    const member = findMember(button.dataset.member);
    if (!member) return;
    opener = button;
    const gallery = memberGallery(member);
    track.replaceChildren(...gallery.map(slide));
    track.setAttribute('aria-label', `Фотографии: ${member.name}`);
    nav.hidden = gallery.length < 2;
    dialog.querySelector('[data-member-name]').textContent = member.name;
    dialog.querySelector('[data-member-role]').textContent = member.role;
    dialog.querySelector('[data-member-bio]').textContent = member.bio || 'Труппа театра современной хореографии СЭНС';
    const url = instagramUrl(member.instagram);
    instagram.hidden = !url;
    if (url) {
      instagram.href = url;
      instagram.querySelector('span').textContent = `@${url.split('/')[3]}`;
    }
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    track.scrollLeft = 0;
    updateCount();
  };

  document.querySelectorAll('[data-member]').forEach((button) => button.addEventListener('click', () => open(button)));
  track.addEventListener('scroll', updateCount, { passive: true });
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') go(-1);
    if (event.key === 'ArrowRight') go(1);
  });
  dialog.querySelector('[data-member-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
    opener?.focus();
  });
}
