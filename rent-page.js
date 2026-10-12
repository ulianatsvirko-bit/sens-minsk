import { calculate, formatByn, isWeekend, PRICES } from './lib/rent-calc.js';
import { busyByDate, monthGrid } from './lib/busy-slots.js';
import { localDateKey } from './lib/home-events.js';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const MONTHS_AHEAD = 12;
const FORMAT_BY_MODE = { hourly: 'Аренда по часам', daily: 'Аренда на сутки', turnkey: 'Событие под ключ' };

const state = { date: '', mode: 'hourly', hours: PRICES.minHours, guests: 50, tech: false, busy: new Map() };

function humanDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return `${d} ${MONTHS_GEN[m - 1]}, ${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}`;
}

/* ---------- Calculator ---------- */
const calc = {
  root: document.querySelector('[data-calc]'),
  lines: document.querySelector('[data-calc-lines]'),
  total: document.querySelector('[data-calc-total]'),
  hint: document.querySelector('[data-calc-hint]'),
  date: document.querySelector('[data-calc-date]'),
  hours: document.querySelector('[data-hours]'),
  guestsOut: document.querySelector('[data-guests-out]')
};

function currentEstimate() {
  return calculate({ mode: state.mode, date: state.date, hours: state.hours, guests: state.guests, tech: state.tech });
}

function renderCalc() {
  if (!calc.root) return;
  const result = currentEstimate();
  calc.root.querySelectorAll('[data-show]').forEach((node) => { node.hidden = !node.dataset.show.split(' ').includes(state.mode); });
  calc.hours.textContent = String(state.hours);
  calc.guestsOut.textContent = String(state.guests);
  calc.root.querySelector('[data-step="-1"]').disabled = state.hours <= PRICES.minHours;
  calc.root.querySelector('[data-step="1"]').disabled = state.hours >= PRICES.maxHours;

  calc.date.textContent = state.date
    ? `${humanDate(state.date)} · ${isWeekend(state.date) ? 'выходной' : 'будний день'}`
    : 'Дата не выбрана · считаем как будний день';
  calc.lines.replaceChildren(...result.lines.map((line) => {
    const item = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = line.label;
    const amount = document.createElement('span');
    amount.textContent = formatByn(line.amount);
    item.append(label, amount);
    return item;
  }));
  calc.total.textContent = formatByn(result.total);
  calc.hint.textContent = result.hint;
}

function initCalc() {
  if (!calc.root) return;
  calc.root.addEventListener('change', (event) => {
    if (event.target.name === 'mode') state.mode = event.target.value;
    if (event.target.matches('[data-tech]')) state.tech = event.target.checked;
    renderCalc();
  });
  calc.root.querySelector('[data-guests]').addEventListener('input', (event) => { state.guests = Number(event.target.value); renderCalc(); });
  calc.root.querySelectorAll('[data-step]').forEach((button) => button.addEventListener('click', () => {
    state.hours = Math.min(PRICES.maxHours, Math.max(PRICES.minHours, state.hours + Number(button.dataset.step)));
    renderCalc();
  }));
  document.querySelector('[data-calc-send]')?.addEventListener('click', () => fillFormFromCalc());
  renderCalc();
}

/* ---------- Calendar ---------- */
const cal = {
  body: document.querySelector('[data-cal-body]'),
  month: document.querySelector('[data-cal-month]'),
  prev: document.querySelector('[data-cal-prev]'),
  next: document.querySelector('[data-cal-next]'),
  day: document.querySelector('[data-cal-day]')
};
const today = localDateKey();
const [todayYear, todayMonth] = today.split('-').map(Number);
let view = { year: todayYear, month: todayMonth - 1 };

const monthIndex = ({ year, month }) => year * 12 + month;

function dayButton(key) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cal__day-btn';
  button.textContent = String(Number(key.slice(8)));
  button.dataset.date = key;
  const busy = state.busy.get(key);
  const past = key < today;
  if (isWeekend(key)) button.classList.add('is-weekend');
  if (key === today) button.classList.add('is-today');
  if (busy?.full) button.classList.add('is-busy');
  else if (busy) button.classList.add('is-part');
  button.disabled = past;
  button.setAttribute('aria-pressed', String(key === state.date));
  const status = past ? 'прошло' : busy?.full ? 'занято' : busy ? `занято ${busy.ranges.join(', ')}` : 'свободно';
  button.setAttribute('aria-label', `${humanDate(key)}, ${status}`);
  if (busy?.full) button.setAttribute('aria-disabled', 'true');
  return button;
}

function renderCalendar() {
  if (!cal.body) return;
  cal.month.textContent = `${MONTHS[view.month]} ${view.year}`;
  const offset = monthIndex(view) - monthIndex({ year: todayYear, month: todayMonth - 1 });
  cal.prev.disabled = offset <= 0;
  cal.next.disabled = offset >= MONTHS_AHEAD;
  cal.body.replaceChildren(...monthGrid(view.year, view.month).map((week) => {
    const row = document.createElement('tr');
    week.forEach((key) => {
      const cell = document.createElement('td');
      if (key) cell.append(dayButton(key));
      row.append(cell);
    });
    return row;
  }));
}

function describeDay(key) {
  const busy = state.busy.get(key);
  if (!busy) return `${humanDate(key)} — свободно. Стоимость пересчитана ниже.`;
  if (busy.full) return `${humanDate(key)} — занято весь день. Выберите другую дату или напишите нам: иногда получается подвинуть.`;
  return `${humanDate(key)} — занято ${busy.ranges.join(', ')}. Остальное время свободно, уточним в заявке.`;
}

function initCalendar() {
  if (!cal.body) return;
  cal.prev.addEventListener('click', () => { view = view.month === 0 ? { year: view.year - 1, month: 11 } : { ...view, month: view.month - 1 }; renderCalendar(); });
  cal.next.addEventListener('click', () => { view = view.month === 11 ? { year: view.year + 1, month: 0 } : { ...view, month: view.month + 1 }; renderCalendar(); });
  cal.body.addEventListener('click', (event) => {
    const button = event.target.closest('[data-date]');
    if (!button || button.disabled) return;
    const key = button.dataset.date;
    cal.day.textContent = describeDay(key);
    if (state.busy.get(key)?.full) return;
    state.date = key;
    renderCalendar();
    cal.body.querySelector(`[data-date="${key}"]`)?.focus();
    renderCalc();
  });
  renderCalendar();
}

async function loadBusy() {
  const fetchJson = (url) => fetch(url).then((response) => (response.ok ? response.json() : [])).catch(() => []);
  const [slots, events] = await Promise.all([fetchJson('/api/busy'), fetchJson('/api/events')]);
  state.busy = busyByDate(Array.isArray(slots) ? slots : [], Array.isArray(events) ? events : []);
  renderCalendar();
}

/* ---------- Form ---------- */
const form = document.querySelector('[data-contact-form]');

function fillFormFromCalc() {
  if (!form) return;
  const result = currentEstimate();
  const summary = `${result.lines.map((line) => line.label).join(' + ')} — ${formatByn(result.total)}`;
  form.querySelector('[data-format]').value = FORMAT_BY_MODE[state.mode];
  form.querySelector('[data-form-date]').value = state.date;
  form.querySelector('[data-form-guests]').value = state.mode === 'turnkey' ? String(state.guests) : '';
  form.querySelector('[data-form-estimate]').value = summary;
  const note = form.querySelector('[data-estimate-note]');
  note.textContent = `Ваш расчёт: ${state.date ? `${humanDate(state.date)}, ` : ''}${summary}`;
  note.hidden = false;
  setTimeout(() => form.querySelector('input[name="name"]').focus({ preventScroll: true }), 400);
}

function initForm() {
  if (!form) return;
  const startedAt = form.querySelector('[data-form-started-at]');
  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('[data-submit]');
  const setStatus = (text, kind = '') => { status.textContent = text; status.dataset.state = kind; };
  startedAt.value = String(Date.now());

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    submit.disabled = true;
    setStatus('Отправляем…');
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Не удалось отправить заявку.');
      form.reset();
      form.querySelector('[data-form-entry]').hidden = true;
      const success = form.querySelector('[data-form-success]');
      success.hidden = false;
      success.focus();
    } catch (error) {
      setStatus(`${error instanceof Error ? error.message : 'Не удалось отправить.'} Напишите нам в Telegram @sensehubminsk.`, 'error');
      startedAt.value = String(Date.now() - 2000);
    } finally {
      submit.disabled = false;
    }
  });
}

initCalc();
initCalendar();
initForm();
loadBusy();
