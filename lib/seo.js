// Server-side SEO: per-page <head> for artist and event pages, and the sitemap.
import { dateParts, eventSchema } from './event-view.js';
import { safeImageUrl } from './home-events.js';
import { instagramUrl } from './troupe.js';

const DESCRIPTION_MAX = 160;
const TROUPE_NAME = 'Труппа театра современной хореографии СЭНС';

const escapeAttr = (value) => String(value)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Cuts text to the description limit on a word boundary. */
function clip(text, max = DESCRIPTION_MAX) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

/** Replaces the first tag matching `pattern`, or adds `tag` before </head>. */
function setTag(html, pattern, tag) {
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `  ${tag}\n</head>`);
}

/**
 * @param {string} html page template
 * @param {{ title: string, description: string, url: string, image: string, type?: string, schema?: object }} meta
 */
export function renderHead(html, meta) {
  const title = escapeAttr(meta.title);
  const description = escapeAttr(meta.description);
  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  out = setTag(out, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`);
  out = setTag(out, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${escapeAttr(meta.url)}">`);
  out = setTag(out, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
  out = setTag(out, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`);
  out = setTag(out, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${escapeAttr(meta.url)}">`);
  out = setTag(out, /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${escapeAttr(meta.image)}">`);
  if (meta.type) out = setTag(out, /<meta property="og:type" content="[^"]*">/, `<meta property="og:type" content="${escapeAttr(meta.type)}">`);
  if (meta.schema) {
    const json = JSON.stringify(meta.schema).replace(/</g, '\\u003c');
    out = out.replace('</head>', `  <script type="application/ld+json">${json}</script>\n</head>`);
  }
  return out;
}

export function artistMeta(member, origin) {
  const role = member.role.split('·')[0].trim().toLowerCase();
  const url = `${origin}/artist?id=${encodeURIComponent(member.id)}`;
  const image = `${origin}/${member.photo}`;
  const instagram = instagramUrl(member.instagram);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: member.name,
    jobTitle: member.role,
    image,
    url,
    memberOf: { '@type': 'PerformingGroup', name: TROUPE_NAME, url: `${origin}/troupe` }
  };
  if (member.bio) schema.description = member.bio;
  if (instagram) schema.sameAs = [instagram];
  return {
    title: `${member.name} — ${role} труппы СЭНС`,
    description: clip(`${member.name}, ${role} труппы театра современной хореографии СЭНС в Минске. ${member.bio || 'Фотографии артиста.'}`),
    url,
    image,
    type: 'profile',
    schema
  };
}

export function eventMeta(event, origin, today) {
  const { long } = dateParts(event.date);
  const url = `${origin}/event?id=${encodeURIComponent(event.id)}`;
  return {
    title: `${event.title} — ${long} · СЭНС`,
    description: clip(`${event.title}, ${long} в СЭНС на Кульман 1/2. ${event.description || ''}`),
    url,
    image: new URL(safeImageUrl(event.image), `${origin}/`).href,
    type: 'website',
    schema: eventSchema(event, url, today)
  };
}

/** @param {{ pages: string[], members: {id: string}[], events: {id: string, date: string, published: boolean}[] }} entries */
export function buildSitemap(origin, { pages, members, events }) {
  const urls = [
    ...pages.map((page) => `${origin}${page}`),
    ...members.map((member) => `${origin}/artist?id=${encodeURIComponent(member.id)}`),
    ...events.filter((event) => event.published).map((event) => `${origin}/event?id=${encodeURIComponent(event.id)}`)
  ];
  const rows = urls.map((url) => `  <url><loc>${escapeAttr(url)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}
