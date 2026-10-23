import {eventSlots, needsSlotChoice, slotValue, slotLabel} from '../lib/event-slots.js';
import {sendTelegramMessage} from '../lib/telegram.js';
const clean = (value, max) => String(value || '').trim().replace(/[\u0000-\u001F\u007F]/g, '').slice(0, max);
const escapeHtml = (value) => value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const send = (response, status, body) => { response.status(status).setHeader('Content-Type','application/json; charset=utf-8'); response.setHeader('Cache-Control','no-store'); response.end(JSON.stringify(body)); };

export default async function handler(request, response) {
  if (request.method !== 'POST') { response.setHeader('Allow','POST'); return send(response,405,{message:'Метод не поддерживается.'}); }
  const origin=request.headers.origin, host=request.headers['x-forwarded-host']||request.headers.host;
  try { if(origin&&host&&new URL(origin).host!==host)return send(response,403,{message:'Отправка с другого сайта запрещена.'}); } catch { return send(response,400,{message:'Некорректный запрос.'}); }
  const body=typeof request.body==='string'?JSON.parse(request.body||'{}'):(request.body||{});
  if(clean(body.website,200))return send(response,200,{ok:true});
  if(Date.now()-Number(body.form_started_at)<1500)return send(response,429,{message:'Подождите секунду и отправьте ещё раз.'});
  const eventId=clean(body.event_id,40), name=clean(body.name,100), phone=clean(body.phone,40), social=clean(body.social,100), comment=clean(body.comment,500), guests=Math.min(10,Math.max(1,Number(body.guests)||1));
  if(!eventId||!name||!phone||body.consent!=='accepted')return send(response,400,{message:'Заполните имя, телефон и подтвердите согласие.'});
  try {
    const eventsResponse=await fetch('https://sens.109.199.105.77.nip.io/api/events',{headers:{Accept:'application/json'}});
    const events=await eventsResponse.json(); const event=events.find(item=>String(item.id)===eventId&&item.published);
    if(!event)return send(response,404,{message:'Это событие больше недоступно для записи.'});
    const slots=eventSlots(event);
    const selected=slots.find(slot=>slotValue(slot)===body.event_slot);
    if ((needsSlotChoice(event)||body.event_slot) && !selected) return send(response,400,{message:'Выберите доступное время и возрастную группу. Если расписание изменилось, обновите страницу.'});
    const selectedSlot=selected||slots[0];
    const text=['<b>Новая запись на мероприятие · СЭНС</b>','',`<b>Событие:</b> ${escapeHtml(event.title)}`,`<b>Дата:</b> ${escapeHtml(event.date)} · ${escapeHtml(slotLabel(selectedSlot))}`,`<b>Имя:</b> ${escapeHtml(name)}`,`<b>Телефон:</b> ${escapeHtml(phone)}`,`<b>Telegram / Instagram:</b> ${escapeHtml(social||'—')}`,`<b>Количество гостей:</b> ${guests}`,`<b>Комментарий:</b> ${escapeHtml(comment||'—')}`].join('\n');
    await sendTelegramMessage(text);
    return send(response,200,{ok:true});
  } catch(error){console.error('Registration failed:',error.message);return send(response,502,{message:'Не удалось отправить заявку. Попробуйте чуть позже.'});}
}
