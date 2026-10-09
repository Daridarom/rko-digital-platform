// Повторяющиеся элементы списков: строки новостей, плитки событий, карточки проектов, люди.
import { esc, clean, imgTag, rub } from './core.mjs';
import { ruDate, dateParts } from './data.mjs';

export const thumb = (image, alt, cls = '') => imgTag(image, alt, cls, '', { small: true });

const tagLink = (tag) => (tag ? `<a class="rko-tag" href="project.html">${esc(tag)}</a>` : '');

// Строка новости. typeLabel задаётся только во встраиваемых виджетах (замечание «Прочие заголовки»).
export function newsRow(n, { compact = false, typeLabel = '', h = 3 } = {}) {
  const d = dateParts(n.date);
  const meta = [
    typeLabel ? `<span class="rko-type">${esc(typeLabel)}</span>` : '',
    d ? `<time datetime="${d.iso}">${ruDate(n.date)}</time>` : '',
    tagLink(n.tag),
  ].filter(Boolean).join('');
  if (compact) {
    return `<li class="rko-mini">
      <div class="rko-meta">${meta}</div>
      <a class="rko-mini__title" href="${n.href}">${esc(n.title)}</a>
    </li>`;
  }
  return `<article class="media rko-row">
    ${n.image ? `<a class="rko-row__img" href="${n.href}" tabindex="-1" aria-hidden="true">${thumb(n.image, '')}</a>` : ''}
    <div class="media-body">
      <div class="rko-meta">${meta}</div>
      <h${h} class="rko-row__title"><a href="${n.href}">${esc(n.title)}</a></h${h}>
      ${n.teaser ? `<p class="rko-row__text">${esc(n.teaser)}</p>` : ''}
    </div>
  </article>`;
}

// Плитка мероприятия: дата — главный элемент, поэтому плитку не спутать с новостью.
export function eventTile(e, h = 3) {
  const d = dateParts(e.date);
  return `<article class="rko-event h-100">
    <a class="rko-event__img" href="${e.href}" tabindex="-1" aria-hidden="true">${thumb(e.image, '')}</a>
    <div class="rko-event__body">
      <div class="rko-event__when">
        <time class="rko-event__date" datetime="${d.iso}">${d.day}</time>
        <div class="rko-event__info"><b>${d.monthFull} ${d.year}</b><span>${esc(e.category)}</span></div>
      </div>
      <h${h} class="rko-event__title"><a href="${e.href}">${esc(e.title)}</a></h${h}>
      ${e.tag ? `<div class="rko-meta">${tagLink(e.tag)}</div>` : ''}
    </div>
  </article>`;
}

export function eventMini(e, { typeLabel = '' } = {}) {
  const d = dateParts(e.date);
  return `<li class="rko-mini rko-mini--event">
    <time class="rko-mini__date" datetime="${d.iso}"><b>${d.day}</b> ${d.month}</time>
    <div>
      ${typeLabel ? `<div class="rko-meta"><span class="rko-type">${esc(typeLabel)}</span></div>` : ''}
      <a class="rko-mini__title" href="${e.href}">${esc(e.title)}</a>
    </div>
  </li>`;
}

const STATUS_CLASS = {
  'Действующий': 'rko-status--current', 'Стратегические инициативы': 'rko-status--strategy',
  'Завершённый': 'rko-status--completed', 'Перспективный': 'rko-status--planned',
};
export const statusBadge = (status) => (status ? `<span class="badge rko-status ${STATUS_CLASS[status] || 'rko-status--completed'}">${esc(status)}</span>` : '');

// Блок сбора средств: три состояния — с целью, без цели, сбор не ведётся.
export function fundraising(p, { large = false } = {}) {
  if (p.collected == null) return '';
  if (p.target) {
    const raw = (p.collected / p.target) * 100;
    const shown = raw > 0 && raw < 1 ? 'меньше 1' : String(Math.round(raw));
    const bar = Math.min(100, Math.max(raw > 0 ? 1 : 0, Math.round(raw)));
    return `<div class="rko-fund${large ? ' rko-fund--lg' : ''}">
      <div class="rko-fund__sum"><b>${rub(p.collected)}</b> <span>из ${rub(p.target)}</span></div>
      <div class="progress"><div class="progress-bar" role="progressbar" style="width:${bar}%" aria-valuenow="${Math.round(raw)}" aria-valuemin="0" aria-valuemax="100" aria-label="Собрано ${shown}% от нужной суммы"></div></div>
      <div class="rko-fund__note">Собрано ${shown}% · осталось ${rub(p.target - p.collected)}</div>
    </div>`;
  }
  return `<div class="rko-fund${large ? ' rko-fund--lg' : ''}">
    <div class="rko-fund__sum"><b>${rub(p.collected)}</b> <span>собрано</span></div>
    <div class="rko-fund__note">Цель сбора не указана</div>
  </div>`;
}

export function projectCard(p, h = 3) {
  const filters = ['all', p.status, p.support && p.status !== 'Завершённый' ? 'support' : ''].filter(Boolean).join('|');
  return `<div class="col-md-6 col-lg-4 mb-4" data-rko-item="${esc(filters)}">
    <article class="card rko-project h-100">
      <a class="rko-project__img" href="${p.href}" tabindex="-1" aria-hidden="true">${thumb(p.image, '')}</a>
      <div class="card-body d-flex flex-column">
        <div class="rko-meta">${statusBadge(p.status)}${p.direction ? `<span>${esc(p.direction)}</span>` : ''}</div>
        <h${h} class="card-title rko-project__title"><a href="${p.href}">${esc(p.title)}</a></h${h}>
        <div class="mt-auto">
          ${fundraising(p)}
          ${p.support && p.status !== 'Завершённый' ? `<a class="btn btn-outline-primary btn-sm rko-project__btn" href="${p.href}#support">Поддержать проект</a>` : ''}
        </div>
      </div>
    </article>
  </div>`;
}

export function person(u, { size = 64, text = '' } = {}) {
  return `<div class="media rko-person">
    ${u.image ? thumb(u.image, '', `rko-person__photo rko-person__photo--${size}`) : `<span class="rko-person__photo rko-person__photo--${size} rko-person__photo--empty" aria-hidden="true"></span>`}
    <div class="media-body">
      ${u.href ? `<a class="rko-person__name" href="${u.href}">${esc(u.name)}</a>` : `<span class="rko-person__name">${esc(u.name)}</span>`}
      ${u.department ? `<a class="rko-person__dept" href="department.html">${esc(u.department)}</a>` : ''}
      ${u.role ? `<span class="rko-person__role">${esc(u.role)}</span>` : ''}
      ${text}
    </div>
  </div>`;
}

export function bookRow(b, h = 3) {
  return `<li class="rko-book">
    <a class="rko-book__cover" href="${b.href}" tabindex="-1" aria-hidden="true">${b.image ? thumb(b.image, '') : '<span class="rko-book__nocover">Нет обложки</span>'}</a>
    <div class="rko-book__body">
      <h${h} class="rko-book__title"><a href="${b.href}">${esc(b.title)}</a></h${h}>
      <div class="rko-book__author">${esc(b.author)}</div>
      ${b.annotation ? `<p class="rko-book__text">${esc(b.annotation.length > 170 ? b.annotation.slice(0, b.annotation.lastIndexOf(' ', 170)) + '…' : b.annotation)}</p>` : ''}
    </div>
    <div class="rko-book__file">
      ${b.size ? `<a class="btn btn-outline-primary btn-sm" href="#" data-rko-demo>Скачать</a><span class="rko-book__size">${esc(b.size)}</span>` : ''}
    </div>
  </li>`;
}

export const sectionHead = (title, links = []) => `<div class="rko-sechead d-flex flex-wrap align-items-end">
  <h2 class="rko-h2 mb-0">${esc(title)}</h2>
  <div class="rko-sechead__links ml-auto">${links.map(([t, h]) => `<a class="rko-more" href="${h}">${esc(t)}</a>`).join('')}</div>
</div>`;

export const short = (text, max) => { const t = clean(text); return t.length > max ? t.slice(0, t.lastIndexOf(' ', max)) + '…' : t; };

// Склонение по числу: plural(1964, ['страница', 'страницы', 'страниц'])
export function plural(n, [one, few, many]) {
  const a = Math.abs(n) % 100; const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}
export const sampleNote = (text) => `<p class="rko-cut">${esc(text)}</p>`;
