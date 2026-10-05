const registrationEvents = new Map();
import {addSlotChoice} from './lib/event-slots.js';
import {upcomingEvents} from './lib/upcoming.js';
const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const filters=document.querySelectorAll('.filter');
const isPastView=new URLSearchParams(location.search).get('view')==='past';
if(isPastView){
 document.querySelector('#events-title').textContent='Прошедшие';
 const link=document.querySelector('[data-past-link]');
 link.textContent='Вернуться к ближайшим мероприятиям →';
 link.href='events.html';
}
function applyFilter(selected='all'){
 filters.forEach(item=>{const active=item.dataset.filter===selected;item.classList.toggle('is-active',active);item.setAttribute('aria-pressed',String(active))});
 const cards=[...document.querySelectorAll('.listing-card')];cards.forEach(card=>card.hidden=selected!=='all'&&card.dataset.type!==selected);
 document.querySelector('.filter-empty').hidden=!cards.length||cards.some(card=>!card.hidden);
}
filters.forEach(filter=>filter.addEventListener('click',()=>applyFilter(filter.dataset.filter)));applyFilter();
fetch('/api/events').then(response=>{if(!response.ok)throw new Error();return response.json()}).then(events=>{
 const visible=isPastView?events.filter(event=>event.date < new Date().toISOString().slice(0,10)).sort((a,b)=>b.date.localeCompare(a.date)):upcomingEvents(events);visible.forEach(event=>registrationEvents.set(String(event.id),event));
 document.querySelector('.events-list').innerHTML=visible.length?visible.map(event=>{
 const date=new Date(event.date+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long'}),url='event.html?id='+encodeURIComponent(event.id),times=eventTimes(event),start=times.map(slot=>slot.time).filter(Boolean).join(' / ')||'—',end=times.map(slot=>slot.endTime).filter(Boolean).join(' / ')||'—',price=formatPrice(event.price),scheduleLabel=`Начало: ${start}; Конец: ${end}`;
 return `<article class="listing-card" data-type="${esc(event.type)}"><a class="listing-image" href="${url}" aria-label="${esc(event.title)}"><img src="${esc(event.image||'assets/premiere-stage.jpg')}" alt="" loading="lazy"></a><div class="listing-copy"><p class="listing-meta">${esc(date)}</p><div class="listing-schedule" aria-label="${esc(scheduleLabel)}"><span><small>Начало</small><strong>${esc(start)}</strong></span><span><small>Конец</small><strong>${esc(end)}</strong></span></div><h3><a href="${url}">${esc(event.title)}</a></h3><p class="listing-price"><span>Стоимость</span> ${esc(price)}</p><div class="listing-actions"><a class="button" href="${url}">Подробнее</a><button class="button" type="button" data-register data-event-id="${esc(event.id)}" data-event-title="${esc(event.title)}" data-event-date="${esc(date+' · '+scheduleLabel)}">Записаться →</button></div></div></article>`;
 }).join(''):'<div class="calendar-empty"><p class="eyebrow">Пока тихо</p><h3>Новые события уже в работе.</h3><p>Следите за анонсами в Instagram или предложите свой проект для СЭНС.</p><p><a class="button" href="https://www.instagram.com/senseminsk/" target="_blank" rel="noreferrer">Instagram ↗</a> <a class="button" href="rent.html#contact">Предложить проект</a></p></div>';
 applyFilter(document.querySelector('.filter.is-active')?.dataset.filter);
}).catch(()=>{document.querySelector('.events-list').innerHTML='<div class="calendar-empty"><p class="eyebrow">Афиша временно недоступна</p><h3>Не удалось загрузить события.</h3><p>Попробуйте обновить страницу или посмотрите последние анонсы в Instagram.</p><p><a class="button" href="events.html">Обновить</a> <a class="button" href="https://www.instagram.com/senseminsk/" target="_blank" rel="noreferrer">Instagram ↗</a></p></div>'});

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

function eventTimes(event){return event.times?.length?event.times:[{time:event.time,endTime:event.endTime||''}];}
function scheduleText(event){return eventTimes(event).map(slot=>slot.time+(slot.endTime?'–'+slot.endTime:'')+(slot.age?' · '+slot.age:'')).join(' / ');}
function formatPrice(value){
 const price=String(value??'').trim();
 if(!price)return 'Уточняется';
 if(/\bBYN\b/i.test(price)||/бесплат|free|регистрац/i.test(price))return price;
 if(/\bруб(?:\.|лей)?\b/i.test(price))return price.replace(/\s*руб(?:\.|лей)?\b/ig,' BYN');
 return `${price} BYN`;
}
