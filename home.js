import {upcomingEvents} from './lib/upcoming.js';
const eventRoot = document.querySelector('[data-home-events]');
const month = ['ЯНВ','ФЕВ','МАР','АПР','МАЙ','ИЮН','ИЮЛ','АВГ','СЕН','ОКТ','НОЯ','ДЕК'];
const formats = {performances:'Спектакль · Показ',talks:'Публичный разговор',practice:'Воркшоп · Практика'};
const escapeHtml = value => String(value || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const shortText = value => { const clean=String(value||'').replace(/\s+/g,' ').trim(); return clean.length>118?`${clean.slice(0,115).trim()}…`:clean; };

fetch('/api/events').then(response => response.ok ? response.json() : Promise.reject()).then(events => {
  const upcoming=upcomingEvents(events).slice(0,4);
  const next=document.querySelector('[data-next-event]');
  if(next&&upcoming.length){const event=upcoming[0];next.href=`event.html?id=${encodeURIComponent(event.id)}`;next.innerHTML=`<span>Ближайшее · ${escapeHtml(new Date(event.date+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long'}))} · ${escapeHtml(scheduleText(event))}</span><strong>${escapeHtml(event.title)}</strong><span aria-hidden="true">↗</span>`;}
  eventRoot.innerHTML=upcoming.length?upcoming.map(event=>{const date=new Date(`${event.date}T12:00:00`);const conditions=formatPrice(event.price);return `<article class="home-event"><a class="home-event-image" href="event.html?id=${encodeURIComponent(event.id)}" aria-label="${escapeHtml(event.title)}"><img src="${escapeHtml(event.image||'assets/premiere-stage.jpg')}" alt="" loading="lazy"></a><div class="home-event-body"><p class="event-date"><b>${String(date.getDate()).padStart(2,'0')}</b><span>${month[date.getMonth()]} · ${escapeHtml(scheduleText(event))}</span></p><p class="event-format">${escapeHtml(formats[event.type]||event.type||'Событие')}</p><h3><a href="event.html?id=${encodeURIComponent(event.id)}">${escapeHtml(event.title)}</a></h3><p class="event-summary">${escapeHtml(shortText(event.description)||'Подробности события — на отдельной странице.')}</p><p class="event-conditions">${escapeHtml(conditions)}</p><a class="event-register" href="event.html?id=${encodeURIComponent(event.id)}#detail-registration">Записаться <span>→</span></a></div></article>`}).join(''):'<p class="loading">Новые события скоро появятся в календаре.</p>';
}).catch(()=>{eventRoot.innerHTML='<p class="loading">Не удалось загрузить афишу. <a href="events.html">Открыть календарь</a>.</p>'});

function scheduleText(event){return (event.times?.length?event.times:[{time:event.time}]).map(slot=>slot.time+(slot.endTime?'–'+slot.endTime:'')+(slot.age?' · '+slot.age:'')).join(' / ');}
function formatPrice(value){const price=String(value??'').trim();if(!price)return 'Стоимость уточняется';if(/\bBYN\b|бесплат|free|регистрац/i.test(price))return price;return `${price} BYN`;}
