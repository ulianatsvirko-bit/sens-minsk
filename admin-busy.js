// Admin: busy dates shown in the public rent calendar.
(() => {
  const $ = (selector) => document.querySelector(selector);
  const app = $('#app');
  const form = $('#busy-form');
  const list = $('#busy-list');
  if (!app || !form || !list) return;

  const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const toast = (message) => {
    const node = $('#toast');
    if (!node) return;
    node.textContent = message;
    node.classList.add('show');
    setTimeout(() => node.classList.remove('show'), 2400);
  };

  async function request(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Не удалось сохранить.');
    return data;
  }

  function label(slot) {
    const [y, m, d] = slot.date.split('-').map(Number);
    const day = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
    return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}, ${day}`;
  }

  function render(slots) {
    $('#busy-count').textContent = String(slots.length);
    list.replaceChildren(...(slots.length ? slots.map((slot) => {
      const item = document.createElement('li');
      const date = document.createElement('b');
      date.textContent = label(slot);
      const info = document.createElement('span');
      info.textContent = [slot.start ? `${slot.start}–${slot.end}` : 'весь день', slot.note].filter(Boolean).join(' · ');
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Освободить';
      remove.addEventListener('click', async () => {
        if (!confirm(`Освободить ${label(slot)}?`)) return;
        try { await request(`/api/admin/busy/${encodeURIComponent(slot.id)}`, { method: 'DELETE' }); toast('Дата освобождена.'); load(); }
        catch (error) { toast(error.message); }
      });
      item.append(date, info, remove);
      return item;
    }) : [Object.assign(document.createElement('li'), { textContent: 'Пока нет занятых дат.' })]));
  }

  async function load() {
    try { render(await request('/api/admin/busy')); } catch { /* not signed in yet */ }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const start = $('#busy-start').value;
    const end = $('#busy-end').value;
    $('#busy-end').setCustomValidity(start && end && end <= start ? 'Конец должен быть позже начала.' : '');
    if (!form.reportValidity()) return;
    try {
      await request('/api/admin/busy', { method: 'POST', body: JSON.stringify({ date: $('#busy-date').value, start, end, note: $('#busy-note').value }) });
      form.reset();
      toast('Дата отмечена занятой.');
      load();
    } catch (error) { toast(error.message); }
  });

  // admin.js reveals #app after a successful session check or login.
  new MutationObserver(() => { if (!app.hidden) load(); }).observe(app, { attributes: true, attributeFilter: ['hidden'] });
  if (!app.hidden) load();
})();
