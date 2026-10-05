import {escapeHtml, renderUpcomingEvents, scheduleText, selectUpcomingEvents} from './lib/home-events.js';
const eventRoot = document.querySelector('[data-home-events]');

fetch('/api/events').then(response => response.ok ? response.json() : Promise.reject()).then(events => {
  const upcoming=selectUpcomingEvents(events);
  const next=document.querySelector('[data-next-event]');
  if(next&&upcoming.length){const event=upcoming[0];next.href=`event.html?id=${encodeURIComponent(event.id)}`;next.innerHTML=`<span>Ближайшее · ${escapeHtml(new Date(event.date+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long'}))} · ${escapeHtml(scheduleText(event))}</span><strong>${escapeHtml(event.title)}</strong><span aria-hidden="true">↗</span>`;}
  eventRoot.innerHTML=renderUpcomingEvents(events);
}).catch(()=>{eventRoot.innerHTML='<p class="loading">Не удалось загрузить афишу. <a href="events.html">Открыть календарь</a>.</p>'});
