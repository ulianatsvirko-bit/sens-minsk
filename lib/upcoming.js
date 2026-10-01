export function upcomingEvents(events, now=new Date()) {
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Minsk',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 return events.filter(event=>event.published&&/^\d{4}-\d{2}-\d{2}$/.test(event.date)&&event.date>=today).sort((a,b)=>`${a.date}${a.time||''}`.localeCompare(`${b.date}${b.time||''}`));
}
