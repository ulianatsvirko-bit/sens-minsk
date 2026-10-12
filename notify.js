// "Write to me first" dialog: wishes for the afisha and show notifications, sent to /api/contact.
export function initNotify() {
  const dialog = document.querySelector('[data-notify-dialog]');
  const form = document.querySelector('[data-notify-form]');
  if (!dialog || !form) return;

  const topic = dialog.querySelector('[data-notify-topic]');
  const status = dialog.querySelector('[data-notify-status]');
  const submit = form.querySelector('[type="submit"]');
  let openedAt = 0;
  let opener = null;

  const setStatus = (text, state = '') => { status.textContent = text; status.dataset.state = state; };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-notify]');
    if (!trigger) return;
    opener = trigger;
    topic.textContent = trigger.dataset.notify;
    const isPlay = trigger.dataset.notify.startsWith('Спектакль');
    form.querySelectorAll('input[name="interest"]').forEach((box) => { box.checked = isPlay && box.value === 'Спектакли'; });
    setStatus('');
    openedAt = Date.now();
    dialog.showModal();
  });

  dialog.querySelector('[data-notify-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => opener?.focus());

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const interests = data.getAll('interest').join(', ');
    const payload = {
      name: data.get('name'),
      contact: data.get('contact'),
      format: `Пожелание к афише · ${topic.textContent}`,
      idea: [interests && `Интересно: ${interests}`, data.get('idea')].filter(Boolean).join('\n'),
      consent: data.get('consent'),
      website: data.get('website'),
      form_started_at: openedAt
    };

    submit.disabled = true;
    setStatus('Отправляем…');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Не удалось отправить. Напишите нам в Instagram или на почту.');
      form.reset();
      setStatus('Готово! Напишем, когда событие появится в афише.', 'ok');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Не удалось отправить.', 'error');
    } finally {
      submit.disabled = false;
    }
  });
}
