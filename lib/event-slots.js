export function eventSlots(event) {
  return event.times?.length ? event.times : [{time: event.time, age: ''}];
}
export function needsSlotChoice(event) {
  const slots = eventSlots(event);
  return slots.length > 1 || slots.some(slot => slot.age?.trim());
}
export function slotValue(slot) {
  return JSON.stringify([slot.time, slot.age || '']);
}
export function slotLabel(slot) {
  return slot.time + (slot.endTime ? '–' + slot.endTime : '') + (slot.age ? ' · ' + slot.age : '');
}
export function addSlotChoice(form, event) {
  form.querySelector('[data-slot-choice]')?.remove();
  if (!needsSlotChoice(event)) return;
  const label = document.createElement('label');
  label.dataset.slotChoice = '';
  label.textContent = 'Время и возрастная группа';
  const select = document.createElement('select');
  select.name = 'event_slot';
  select.required = true;
  select.add(new Option('Выберите время', ''));
  eventSlots(event).forEach(slot => select.add(new Option(slotLabel(slot), slotValue(slot))));
  label.append(select);
  form.prepend(label);
}
