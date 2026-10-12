// Shared behaviour for pages built on sens.css: menu, scroll progress, reveals, mobile action bar.
(() => {
  const menu = document.querySelector('.site-menu');
  if (menu) {
    const wide = matchMedia('(min-width: 56rem)');
    const summary = menu.querySelector('summary');
    const sync = () => {
      menu.open = wide.matches;
      if (wide.matches) document.body.style.overflow = '';
    };
    sync();
    wide.addEventListener('change', sync);
    menu.addEventListener('toggle', () => {
      summary.setAttribute('aria-label', menu.open ? 'Закрыть меню' : 'Открыть меню');
      if (!wide.matches) document.body.style.overflow = menu.open ? 'hidden' : '';
    });
    menu.addEventListener('click', (event) => { if (event.target.closest('a') && !wide.matches) menu.open = false; });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.open && !wide.matches) { menu.open = false; summary.focus(); }
    });

    const page = location.pathname.split('/').pop() || 'index.html';
    menu.querySelectorAll('nav a').forEach((link) => {
      const target = new URL(link.href, location.href);
      const targetPage = target.pathname.split('/').pop() || 'index.html';
      if (targetPage === page && !target.hash && page !== 'index.html') link.setAttribute('aria-current', 'page');
      // Inner pages of a section (a play, an event) light up their parent item via <body data-nav>.
      if (document.body.dataset.nav && link.getAttribute('href') === document.body.dataset.nav) link.setAttribute('aria-current', 'true');
    });
  }

  const progress = document.querySelector('[data-progress]');
  if (progress) {
    let queued = false;
    const update = () => {
      const distance = document.documentElement.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, scrollY / distance) : 0})`;
      queued = false;
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  const revealTargets = document.querySelectorAll('[data-reveal], [data-threads]');
  if (revealTargets.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    revealTargets.forEach((target) => observer.observe(target));
  }

  // Hide the mobile action bar over the footer so it never covers contacts.
  const bar = document.querySelector('[data-action-bar]');
  const footer = document.querySelector('.site-footer');
  if (bar && footer) {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) bar.setAttribute('data-hidden', '');
      else bar.removeAttribute('data-hidden');
    }).observe(footer);
  }
})();
