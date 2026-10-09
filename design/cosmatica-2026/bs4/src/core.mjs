// Общие утилиты генератора макетов: чтение данных, картинки, ссылки, блоки текста.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.resolve(ROOT, '..', 'site');
const DATA = path.join(SITE, 'data');

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

// Невидимые символы из выгрузки и лишние пробелы. Сами слова не правим.
export const clean = (v) => String(v ?? '').replace(/[​﻿]/g, '').replace(/\s+/g, ' ').trim();

export const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
export const source = (slug) => readJSON(path.join(DATA, 'source', `${slug}.json`));

const linkedIndex = readJSON(path.join(DATA, 'linked-index.json'));
export function linked(url) {
  const entry = linkedIndex[url];
  if (!entry) return null;
  const candidates = [path.join(DATA, entry.file), path.join(DATA, 'linked', entry.file)];
  const file = candidates.find((p) => fs.existsSync(p));
  return file ? readJSON(file) : null;
}

// «Заголовок #Проект» → { title, tag }
export function splitTag(raw) {
  const text = clean(raw);
  const at = text.indexOf(' #');
  if (at === -1) return { title: text, tag: '' };
  return { title: text.slice(0, at).trim(), tag: text.slice(at + 2).trim() };
}

// ---------- Картинки: копируем только использованные, чтобы папка была самодостаточной
const geometry = readJSON(path.join(DATA, 'image-geometry.json')).images || {};
const usedImages = new Map();
// small: true — для карточек и списков берём уменьшенную копию, если она есть в выгрузке.
export function img(src, { small = false } = {}) {
  if (!src) return null;
  const g = geometry[src] || {};
  let rel = src; let w = g.w || null; let h = g.h || null;
  if (small && g.thumbnail && fs.existsSync(path.join(SITE, g.thumbnail))) {
    rel = g.thumbnail;
    if (w && h) { h = Math.round(h * 420 / w); w = 420; }
  }
  const abs = path.join(SITE, rel);
  if (!fs.existsSync(abs)) return null;
  const name = rel.replace(/^assets\/(source|optimized)\//, '').replace(/\//g, '-');
  usedImages.set(name, abs);
  return { src: `assets/img/src/${name}`, w, h };
}
export function flushImages() {
  const dir = path.join(ROOT, 'assets', 'img', 'src');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  let bytes = 0;
  for (const [name, abs] of usedImages) {
    fs.copyFileSync(abs, path.join(dir, name));
    bytes += fs.statSync(abs).size;
  }
  return { count: usedImages.size, bytes };
}
export function imgTag(src, alt = '', cls = '', extra = '', opts = {}) {
  const i = typeof src === 'string' ? img(src, opts) : src;
  if (!i) return '';
  const size = i.w && i.h ? ` width="${i.w}" height="${i.h}"` : '';
  return `<img src="${i.src}" alt="${esc(clean(alt))}"${cls ? ` class="${cls}"` : ''}${size} loading="lazy"${extra ? ' ' + extra : ''}>`;
}

// ---------- Ссылки: адреса действующего сайта ведут на соответствующий макет
const EXACT = {
  '': 'index.html',
  'news': 'news.html', 'poster': 'poster.html', 'poster/calendar': 'calendar.html',
  'about': 'about.html', 'about/informacija': 'about-info.html', 'about/contacts': 'contacts.html',
  'direction': 'direction.html', 'collegium': 'collegium.html', 'partners': 'partners.html',
  'departments': 'departments.html', 'projects': 'projects.html', 'projects/donate_rko': 'donate.html',
  'users': 'users.html', 'articles': 'articles.html', 'library': 'library.html',
  'first-squad.html': 'tabs.html', 'auth/login': 'login.html', 'auth/restore': 'restore.html',
  'auth/register': 'register.html', 'search': 'search.html',
  'projects/350': 'project-fundraising.html', 'projects/rusleo': 'project-collecting.html', 'projects/342': 'project-completed.html',
};
const PREFIX = [
  [/^news\//, 'news-item.html'], [/^poster\//, 'poster-item.html'], [/^about\//, 'about.html'],
  [/^collegium\//, 'collegium-item.html'], [/^partners\//, 'partner.html'],
  [/^departments\//, 'department.html'], [/^projects\/index\//, 'projects.html'],
  [/^projects\//, 'project.html'], [/^users\//, 'profile.html'],
  [/^articles\/[^/]+\.html$/, 'article.html'], [/^articles\//, 'articles-list.html'],
  [/^glossary/, 'articles-list.html'], [/^library\/[^/]+\.html$/, 'book.html'],
  [/^library\//, 'library.html'], [/^files\//, '#'],
];
export function mapUrl(url) {
  if (!url) return '#';
  const m = String(url).match(/^https?:\/\/(?:www\.)?cosmatica\.org\/?(.*)$/);
  if (!m) return url;
  const rest = m[1].replace(/[?#].*$/, '').replace(/\/$/, '');
  if (rest in EXACT) return EXACT[rest];
  for (const [re, page] of PREFIX) if (re.test(rest)) return page;
  return 'article.html';
}
const isExternal = (href) => /^https?:\/\//.test(href);
export const linkAttrs = (href) => `href="${esc(href)}"${isExternal(href) ? ' target="_blank" rel="noopener noreferrer"' : ''}`;

// ---------- Блоки текста из выгрузки → обычная разметка статьи
function spans(block) {
  const list = block.spans?.length ? block.spans : [{ text: block.text }];
  return list.map((s) => {
    let out = esc(String(s.text ?? '').replace(/[​﻿]/g, '').replace(/[\t\r]+/g, ' '));
    if (!out.trim()) return out.includes('\n') ? ' ' : out;
    out = out.replace(/\n{2,}/g, '<br><br>').replace(/\n/g, ' ');
    for (const mark of s.marks || []) {
      if (mark === 'bold') out = `<strong>${out}</strong>`;
      if (mark === 'italic') out = `<em>${out}</em>`;
      if (mark === 'sup') out = `<sup>${out}</sup>`;
    }
    if (s.href) out = `<a ${linkAttrs(mapUrl(s.href))}>${out}</a>`;
    return out;
  }).join('').replace(/^(?:\s|<br>)+|(?:\s|<br>)+$/g, '');
}

export function renderBlocks(blocks, { limit = Infinity, skipImages = false, headingShift = 0 } = {}) {
  const out = [];
  let used = 0;
  for (const b of blocks || []) {
    if (used >= limit) break;
    if (b.type === 'paragraph') {
      const html = spans(b);
      if (!html || html === '.') continue;
      // Абзац, целиком набранный полужирным и короткий, — это подзаголовок в исходном тексте.
      const onlyBold = /^<strong>[^<]{3,70}[^<.!?…]<\/strong>$/.test(html);
      out.push(onlyBold ? `<h3>${html.replace(/<\/?strong>/g, '')}</h3>` : `<p>${html}</p>`);
      used++;
    } else if (b.type === 'heading') {
      const level = Math.min(4, Math.max(2, (b.level || 2) + headingShift));
      out.push(`<h${level}>${esc(clean(b.text))}</h${level}>`); used++;
    } else if (b.type === 'list') {
      const tag = b.ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${b.items.map((i) => `<li>${esc(clean(typeof i === 'string' ? i : i.text))}</li>`).join('')}</${tag}>`); used++;
    } else if (b.type === 'image' && !skipImages) {
      const tag = imgTag(b.src, b.alt, 'img-fluid');
      if (tag) { out.push(`<figure class="rko-figure">${tag}</figure>`); used++; }
    } else if (b.type === 'table') {
      const rows = b.rows.filter((r) => r.some((c) => clean(c)));
      if (!rows.length) continue;
      out.push(`<div class="table-responsive"><table class="table table-bordered table-sm"><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(clean(c))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); used++;
    } else if (b.type === 'separator') {
      out.push('<hr>');
    } else if (b.type === 'video') {
      // В макете ролик не подгружается со стороннего сервера: показываем место под проигрыватель.
      out.push(`<div class="embed-responsive embed-responsive-16by9 rko-video" data-embed-url="${esc(b.embedUrl)}"><div class="embed-responsive-item rko-video__stub"><span class="rko-video__play" aria-hidden="true"></span><span>${esc(b.title || 'Видео')}</span></div></div>`); used++;
    }
  }
  return out.join('\n');
}

export const firstText = (data, max = 220) => {
  const p = (data.blocks || []).find((b) => b.type === 'paragraph' && clean(b.text).length > 60);
  const t = clean(p?.text || data.fields?.find((f) => !f.key)?.value || '');
  return t.length > max ? t.slice(0, t.lastIndexOf(' ', max)) + '…' : t;
};

export const rub = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
