const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals = document.querySelectorAll('.reveal');

if (reducedMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((element) => element.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  reveals.forEach((element) => {
    const revealSiblings = [...element.parentElement.children].filter((child) => child.classList.contains('reveal'));
    const order = revealSiblings.indexOf(element);
    element.style.setProperty('--reveal-delay', `${Math.min(Math.max(order, 0), 5) * 85}ms`);
    revealObserver.observe(element);
  });
}

const menu = document.querySelector('[data-menu]');
menu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    if (!desktopNavigation.matches) menu.removeAttribute('open');
  });
});

const desktopNavigation = window.matchMedia('(min-width: 64rem)');

function syncNavigation(event) {
  if (!menu) return;
  if (event.matches) menu.setAttribute('open', '');
  else menu.removeAttribute('open');
}

syncNavigation(desktopNavigation);
desktopNavigation.addEventListener('change', syncNavigation);

const header = document.querySelector('[data-header]');
const progress = document.querySelector('[data-progress]');
const heroImage = document.querySelector('.hero-image');
const visit = document.querySelector('.visit');
const visitWord = document.querySelector('.visit-word');
let lastScroll = window.scrollY;
let ticking = false;

function updatePageChrome() {
  const currentScroll = window.scrollY;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = scrollable > 0 ? currentScroll / scrollable : 0;

  if (progress) progress.style.transform = `scaleX(${Math.min(Math.max(ratio, 0), 1)})`;

  if (header) {
    const goingDown = currentScroll > lastScroll;
    header.classList.toggle('is-hidden', goingDown && currentScroll > 180 && !menu?.open);
  }

  if (!reducedMotion && heroImage && currentScroll <= window.innerHeight * 1.2) {
    heroImage.style.setProperty('--hero-shift', `${Math.min(currentScroll * 0.12, 90)}px`);
  }

  if (!reducedMotion && visit && visitWord) {
    const visitRect = visit.getBoundingClientRect();
    if (visitRect.bottom > 0 && visitRect.top < window.innerHeight) {
      const visitProgress = (window.innerHeight - visitRect.top) / (window.innerHeight + visitRect.height);
      visitWord.style.setProperty('--visit-shift', `${(visitProgress - 0.5) * 80}px`);
    }
  }

  lastScroll = currentScroll;
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(updatePageChrome);
}, { passive: true });

updatePageChrome();

const contactForm = document.querySelector('[data-contact-form]');
const formStatus = document.querySelector('[data-form-status]');
const submitButton = contactForm?.querySelector('[data-submit-button]');
const formStartedAt = contactForm?.querySelector('[data-form-started-at]');
const formEntry = contactForm?.querySelector('[data-form-entry]');
const formSuccess = contactForm?.querySelector('[data-form-success]');
const isLocalPreview = window.location.protocol === 'file:';

if (formStartedAt) formStartedAt.value = String(Date.now());

function setFormStatus(message, type = '') {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.dataset.status = type;
}

if (isLocalPreview) {
  setFormStatus('Это локальная копия. Заявки отправляются на sens-minsk.vercel.app.', 'error');
}

contactForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (isLocalPreview) {
    setFormStatus('Откройте sens-minsk.vercel.app — там форма отправит заявку в Telegram.', 'error');
    return;
  }

  const formData = new FormData(contactForm);
  const draft = Object.fromEntries(formData.entries());
  window.localStorage.setItem('sens-contact-draft', JSON.stringify(draft));

  if (!contactForm.reportValidity()) return;

  contactForm.setAttribute('aria-busy', 'true');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.firstChild.textContent = 'Отправляем… ';
  }
  setFormStatus('Отправляем заявку…', 'pending');

  try {
    const response = await fetch(contactForm.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Не удалось отправить заявку.');
    }

    contactForm.reset();
    window.localStorage.removeItem('sens-contact-draft');
    if (formStartedAt) formStartedAt.value = String(Date.now());
    setFormStatus('Готово! Заявка отправлена.', 'success');
    if (formEntry && formSuccess) {
      formEntry.hidden = true;
      formSuccess.hidden = false;
      window.requestAnimationFrame(() => formSuccess.classList.add('is-visible'));
      formSuccess.focus({ preventScroll: true });
    }
  } catch (error) {
    setFormStatus(`${error.message} Попробуйте ещё раз или напишите на sensehubminsk@gmail.com.`, 'error');
  } finally {
    contactForm.removeAttribute('aria-busy');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.firstChild.textContent = 'Оставить заявку ';
    }
  }
});
