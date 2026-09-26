const registrationEvents = new Map();
import {addSlotChoice} from './lib/event-slots.js';
const filters = document.querySelectorAll('.filter');
filters.forEach((filter) => filter.addEventListener('click', () => {
  filters.forEach((item) => item.classList.toggle('is-active', item === filter));
  const selected = filter.dataset.filter;
  document.querySelectorAll('.event-card').forEach((card) => { card.hidden = selected !== 'all' && card.dataset.type !== selected; });
}));

fetch('/api/events').then((response) => response.ok ? response.json() : []).then((savedEvents) => {
  savedEvents.forEach(event => registrationEvents.set(String(event.id), event));
  const monthNames = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];
  const weekdayNames = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
  const typeNames = { performances: 'Спектакль · Показ', talks: 'Публичный разговор', practice: 'Воркшоп · Практика' };
  const fallbackImages = ['assets/premiere-stage.jpg', 'assets/space/blocks.jpg', 'assets/space-rehearsal.jpg'];
  const visibleEvents = savedEvents.filter((event) => event.published).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const list = document.querySelector('.events-list');
  list.innerHTML = visibleEvents.length ? visibleEvents.map((event, index) => {
    const date = new Date(`${event.date}T12:00:00`);
    const image = event.image || fallbackImages[index % fallbackImages.length];
    return `<article class="event-card poster-card" data-type="${event.type}" data-detail-url="event.html?id=${event.id}" tabindex="0" role="link" aria-label="${event.title.replace(/&/g,'&amp;').replace(/\"/g,'&quot;')}"><div class="event-image" style="background-image:linear-gradient(180deg,#0000 48%,#000b 100%),url('${image}')"><span>${String(index + 1).padStart(2, '0')}</span><div class="poster-actions"><a class="button secondary-button" href="event.html?id=${event.id}">Подробнее</a><button class="button" type="button" data-register data-event-id="${event.id}" data-event-title="${event.title.replace(/&/g,'&amp;').replace(/\"/g,'&quot;')}" data-event-date="${String(date.getDate()).padStart(2,'0')} ${monthNames[date.getMonth()]} · ${scheduleText(event).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}">Записаться</button></div></div></article>`;
  }).join('') : '<p class="calendar-note">Скоро здесь появятся новые события.</p>';
}).catch(() => {});

const registrationDialog = document.querySelector('[data-registration-dialog]');
const registrationForm = document.querySelector('[data-registration-form]');
const registrationStatus = document.querySelector('[data-registration-status]');
const registrationSuccess = document.querySelector('[data-registration-success]');
document.addEventListener('click', (event) => {
  const poster = event.target.closest('[data-detail-url]');
  if (poster && !event.target.closest('a, button')) location.href = poster.dataset.detailUrl;
  const opener = event.target.closest('[data-register]');
  if (opener) {
    registrationForm.hidden = false; registrationSuccess.hidden = true; registrationForm.reset();
    addSlotChoice(registrationForm, registrationEvents.get(opener.dataset.eventId));
    registrationForm.elements.event_id.value = opener.dataset.eventId || '';
    registrationForm.elements.form_started_at.value = String(Date.now());
    document.querySelector('[data-registration-title]').textContent = opener.dataset.eventTitle || 'Запись на событие';
    document.querySelector('[data-registration-date]').textContent = opener.dataset.eventDate || '';
    registrationStatus.textContent = ''; registrationDialog.showModal();
  }
  if (event.target.closest('[data-dialog-close]')) registrationDialog.close();
});
registrationDialog.addEventListener('click', (event) => { if (event.target === registrationDialog) registrationDialog.close(); });
registrationForm.addEventListener('submit', async (event) => {
  event.preventDefault(); if (!registrationForm.reportValidity()) return;
  const button=registrationForm.querySelector('[type="submit"]'); button.disabled=true; button.firstChild.textContent='Отправляем… '; registrationStatus.textContent='';
  try {
    const body=Object.fromEntries(new FormData(registrationForm).entries());
    const response=await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const result=await response.json(); if(!response.ok)throw new Error(result.message||'Не удалось отправить заявку.');
    registrationForm.hidden=true; registrationSuccess.hidden=false;
  } catch(error) { registrationStatus.textContent=error.message; }
  finally { button.disabled=false; button.firstChild.textContent='Отправить заявку '; }
});

document.addEventListener('keydown',(event)=>{const poster=event.target.closest('[data-detail-url]');if(poster&&(event.key==='Enter'||event.key===' ')){event.preventDefault();location.href=poster.dataset.detailUrl;}});

function scheduleText(event){return (event.times?.length?event.times:[{time:event.time}]).map(slot=>slot.time+(slot.age?' · '+slot.age:'')).join(' / ');}
