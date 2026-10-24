// HTML for a rent landing page (/arenda-zala-dlya-…), built on the rent page styles.
import { RENT_FORMATS, formatFaq } from './rent-formats.js';

const ORIGIN = 'https://sense.smartdance.by';

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const jsonLd = (schema) => `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`;

function image(shot, { eager = false } = {}) {
  const loading = eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"';
  return `<img src="${shot.src}" alt="${escapeHtml(shot.alt)}" width="${shot.width}" height="${shot.height}" ${loading}>`;
}

/** Reel and photos from a real event in the hall; the video loads only near the viewport (rent-format.js). */
function scenesSection(scenes) {
  if (!scenes) return '';
  const { video } = scenes;
  return `
    <section class="block block--rule" aria-labelledby="scenes-title">
      <div class="wrap">
        <div class="block-head">
          <p class="meta meta--signal">Так было у нас</p>
          <h2 id="scenes-title" class="title">Как это выглядит</h2>
        </div>
        <div class="format-scenes">
          <figure class="format-scenes__video">
            <video data-src="${video.src}" poster="${video.poster}" width="${video.width}" height="${video.height}" muted loop playsinline controls preload="none" aria-label="${escapeHtml(video.label)}"></video>
          </figure>
          ${scenes.photos.map((shot) => `<figure>${image(shot)}</figure>`).join('\n          ')}
        </div>
      </div>
    </section>
`;
}

function schemas(format, url, faq) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'СЭНС', item: `${ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Аренда зала', item: `${ORIGIN}/rent` },
        { '@type': 'ListItem', position: 3, name: format.short, item: url }
      ]
    }
  ];
}

const SITE_HEADER = `<header class="site-header">
    <div class="site-header__inner">
      <a class="site-brand" href="/" aria-label="СЭНС — главная"><img src="assets/sens-logo-lockup.png" alt="СЭНС" width="152" height="29"></a>
      <details class="site-menu">
        <summary aria-label="Открыть меню"></summary>
        <nav aria-label="Основная навигация">
          <a href="events">Афиша</a>
          <a href="/#repertoire">Спектакли</a>
          <a href="space">Пространство</a>
          <a href="troupe">Труппа</a>
          <a href="rent">Аренда</a>
          <a class="site-menu__cta" href="rent#contact">Забронировать зал</a>
        </nav>
      </details>
    </div>
    <div class="site-progress" aria-hidden="true"><span data-progress></span></div>
  </header>`;

const SITE_FOOTER = `<footer class="site-footer">
    <div class="site-footer__inner">
      <a href="/" aria-label="СЭНС — главная"><img src="assets/sens-logo-lockup.png" alt="СЭНС" width="128" height="24" loading="lazy"></a>
      <ul><li><a href="events">Афиша</a></li><li><a href="/#repertoire">Спектакли</a></li><li><a href="troupe">Труппа</a></li></ul>
      <ul><li><a href="space">Пространство</a></li><li><a href="rent">Аренда</a></li><li><a href="rent#contact">Заявка</a></li></ul>
      <ul><li>Минск, Кульман 1/2</li><li><a href="tel:+375445099414">+375 44 509-94-14</a></li><li><a href="https://t.me/sensehubminsk" target="_blank" rel="noopener">Telegram ↗</a></li><li><a href="https://www.instagram.com/senseminsk/" target="_blank" rel="noopener">Instagram ↗</a></li></ul>
    </div>
  </footer>`;

export function renderRentFormatPage(format) {
  const url = `${ORIGIN}/${format.slug}`;
  const faq = formatFaq(format);
  const others = RENT_FORMATS.filter((item) => item !== format);
  const text = escapeHtml;

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${text(format.title)}</title>
  <meta name="description" content="${text(format.description)}">
  <meta name="theme-color" content="#0b0b0c">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:site_name" content="СЭНС">
  <meta property="og:title" content="${text(format.h1)} — СЭНС">
  <meta property="og:description" content="${text(format.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${ORIGIN}/${format.photo.src}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="assets/sens-favicon.png" type="image/png">
  <link rel="preload" href="assets/fonts/beni-black.otf" as="font" type="font/otf" crossorigin>
  <link rel="stylesheet" href="sens.css?v=20261014-2">
  <link rel="stylesheet" href="rent-page.css?v=20261024-1">
  <link rel="stylesheet" href="rent-format.css?v=20261024-2">
  <script>document.documentElement.classList.add('js')</script>
  ${schemas(format, url, faq).map(jsonLd).join('\n  ')}
</head>
<body data-nav="rent">
  <a class="skip-link" href="#main">К содержанию</a>

  ${SITE_HEADER}

  <main id="main">
    <section class="rent-hero" aria-labelledby="format-title">
      <div class="wrap rent-hero__inner">
        <div class="rent-hero__copy">
          <a class="page-back" href="rent"><span aria-hidden="true">←</span> Аренда зала</a>
          <p class="meta meta--signal">Аренда · Кульман 1/2 · Минск</p>
          <h1 id="format-title" class="display format-title">${text(format.h1)}</h1>
          <p class="lead">${text(format.lead)}</p>
          <div class="rent-hero__actions">
            <a class="btn btn--signal" href="rent#contact">Оставить заявку <span aria-hidden="true">→</span></a>
            <a class="btn btn--line" href="https://t.me/sensehubminsk" target="_blank" rel="noopener">Спросить в Telegram ↗</a>
          </div>
        </div>
        <figure class="rent-hero__photo">${image(format.photo, { eager: true })}</figure>
      </div>
      <ul class="wrap price-strip" aria-label="Коротко о зале">
        <li><span>Вместимость</span><b>${text(format.capacity)}</b><small>221 м² · потолки 7 м</small></li>
        <li><span>Час</span><b>от 190 BYN</b><small>будни · 250 в выходные · от 3 часов</small></li>
        <li><span>Сутки</span><b>от 2 000 BYN</b><small>пн–чт · 2 500 в пт–вс</small></li>
        <li><span>Включено</span><b>свет и звук</b><small>стулья, мебель, гримёрка, welcome-зона</small></li>
      </ul>
    </section>

    <section class="block block--rule visit-strip" aria-labelledby="layout-title">
      <div class="wrap visit-strip__inner">
        <figure class="visit-strip__photo">${image(format.second)}</figure>
        <div class="visit-strip__copy">
          <p class="meta meta--signal">Расстановка</p>
          <h2 id="layout-title" class="title">Как подготовим зал</h2>
          <p class="lead">${text(format.layout)}</p>
          <ul class="format-points">
            ${format.points.map((point) => `<li>${text(point)}</li>`).join('\n            ')}
          </ul>
        </div>
      </div>
    </section>

${scenesSection(format.scenes)}
    <section class="block block--rule" aria-labelledby="faq-title">
      <div class="wrap faq">
        <h2 id="faq-title" class="title">Частые вопросы</h2>
        <div class="faq__list">
          ${faq.map(({ q, a }) => `<details><summary>${text(q)}</summary><p>${text(a)}</p></details>`).join('\n          ')}
        </div>
      </div>
    </section>

    <section class="block block--rule" aria-labelledby="others-title">
      <div class="wrap fit">
        <div>
          <p class="meta meta--signal">Ещё в этом зале</p>
          <h2 id="others-title" class="title">Другие форматы</h2>
        </div>
        <ul class="fit__list">
          ${others.map((item) => `<li><a href="${item.slug}">${text(item.short)}</a></li>`).join('\n          ')}
        </ul>
        <a class="link-arrow fit__link" href="space">План зала и техника <span aria-hidden="true">→</span></a>
      </div>
    </section>

    <section class="block format-cta" aria-labelledby="cta-title">
      <div class="wrap format-cta__inner">
        <h2 id="cta-title" class="title">Обсудим ваше событие</h2>
        <p class="lead">Ответим в течение рабочего дня, пригласим посмотреть зал и посчитаем стоимость под вашу дату.</p>
        <div class="rent-hero__actions">
          <a class="btn btn--signal" href="rent#contact">Оставить заявку <span aria-hidden="true">→</span></a>
          <a class="btn btn--line" href="tel:+375445099414">+375 44 509-94-14</a>
        </div>
      </div>
    </section>
  </main>

  ${SITE_FOOTER}

  <nav class="action-bar" aria-label="Быстрые действия" data-action-bar>
    <a href="rent#contact">Оставить заявку</a>
    <a href="https://t.me/sensehubminsk" target="_blank" rel="noopener">Написать в Telegram</a>
  </nav>

  ${format.scenes ? '<script src="rent-format.js?v=20261024-1" defer></script>\n  ' : ''}<script src="sens.js?v=20261014-2" defer></script>
</body>
</html>
`;
}
