// Главная, новости, мероприятия, раздел «Об обществе».
import { esc, clean, source, imgTag, renderBlocks, linkAttrs } from './core.mjs';
import { pageHead, pagination, linkTabs, widget } from './layout.mjs';
import * as D from './data.mjs';
import { newsRow, eventTile, eventMini, projectCard, person, sectionHead, thumb, short, fundraising, sampleNote } from './parts.mjs';

// ---------------------------------------------------------------- 01 Главная
// Текст под заголовком — формулировка Аркона от 09.10.2026, дословно. «Сключает» — термин РКО, не опечатка.
const HERO_LEAD = 'Русское Космическое Общество сключает труд, науку, культуру, образование и проектную деятельность, с целью созидания ноосферно-космического будущего.';
export function home() {
  const [lead, ...rest] = D.news;
  const body = `
<section class="rko-hero">
  <div class="container">
    <div class="row align-items-center">
      <div class="col-lg-6">
        <h1 class="rko-hero__title"><span class="rko-hero__word rko-hero__word--gold">Человек.</span><br><span class="rko-hero__word rko-hero__word--red">Земля.</span><br><span class="rko-hero__word rko-hero__word--blue">Космос.</span></h1>
        <p class="rko-hero__lead">${esc(HERO_LEAD)}</p>
        <div class="rko-hero__actions">
          <a class="btn btn-primary btn-lg" href="about.html">Узнать о РКО</a>
          <a class="btn btn-outline-dark btn-lg" href="article.html">Как вступить</a>
        </div>
      </div>
      <div class="col-lg-6 mt-5 mt-lg-0">
        <article class="rko-lead">
          <a class="rko-lead__img embed-responsive embed-responsive-16by9" href="${lead.href}" tabindex="-1" aria-hidden="true">${imgTag(lead.image, '', 'embed-responsive-item')}</a>
          <div class="rko-lead__body">
            <div class="rko-meta"><span class="rko-type">Главная новость</span><time datetime="${D.dateParts(lead.date).iso}">${D.ruDate(lead.date)}</time></div>
            <h2 class="rko-lead__title"><a href="${lead.href}">${esc(lead.title)}</a></h2>
            ${lead.teaser ? `<p class="mb-0">${esc(lead.teaser)}</p>` : ''}
          </div>
        </article>
      </div>
    </div>
  </div>
</section>

<section class="rko-section rko-section--sand">
  <div class="container">
    <div class="row">
      <div class="col-lg-8">
        ${sectionHead('Новости', [['Все новости', 'news.html']])}
        <div class="rko-rows">
          ${rest.slice(0, 5).map((n) => newsRow(n)).join('\n')}
        </div>
      </div>
      <div class="col-lg-4 mt-5 mt-lg-0">
        ${sectionHead('Мероприятия', [['Календарь', 'calendar.html']])}
        <ul class="list-unstyled rko-minilist rko-minilist--events">
          ${D.events.map((e) => eventMini(e)).join('\n')}
        </ul>
        <a class="btn btn-outline-dark btn-block" href="poster.html">Все мероприятия</a>
        <a class="rko-banner d-block mt-4" href="project-collecting.html">${imgTag(D.supportBanner.image, D.supportBanner.alt, 'img-fluid')}</a>
      </div>
    </div>
  </div>
</section>

<section class="rko-section">
  <div class="container">
    ${sectionHead('Проекты', [['Все проекты', 'projects.html']])}
    <div class="row">
      ${D.projects.slice(3, 6).map((p) => projectCard(p, 3, { fund: false })).join('\n')}
    </div>
  </div>
</section>

<section class="rko-support">
  <div class="container">
    <div class="row align-items-center">
      <div class="col-lg-8">
        <h2 class="rko-support__title">Мы — то, что мы делаем</h2>
        <p class="rko-support__text">Вы можете поддержать конкретный проект или деятельность Русского Космического Общества в целом. Вместе с Вами мы сделаем то, что должны!</p>
      </div>
      <div class="col-lg-4 text-lg-right mt-3 mt-lg-0">
        <a class="btn btn-support btn-lg" href="donate.html">Поддержать РКО</a>
      </div>
    </div>
  </div>
</section>

<section class="rko-section">
  <div class="container">
    ${sectionHead('Летопись РКО', [['Все отчёты', 'articles-list.html']])}
    <div class="row rko-reports">
      ${D.reports.slice(0, 4).map((r) => `<div class="col-6 col-lg-3 mb-4">
        <a class="rko-report" href="article.html">
          <span class="rko-report__img embed-responsive embed-responsive-16by9">${thumb(r.image, '', 'embed-responsive-item')}</span>
          <span class="rko-report__year">${r.year}</span>
          <span class="rko-report__title">Отчёт о деятельности</span>
        </a>
      </div>`).join('\n')}
    </div>
    <p class="rko-reports__more">Ранее: ${D.reports.slice(4).map((r) => `<a href="article.html">${r.year}</a>`).join(', ')}</p>
  </div>
</section>

<section class="rko-section rko-section--sand">
  <div class="container">
    <div class="row">
      <div class="col-lg-6">
        ${sectionHead('Первый отряд', [['Об отряде', 'tabs.html']])}
        <div class="rko-people">
          ${D.squad.map((p) => person(p)).join('\n')}
        </div>
      </div>
      <div class="col-lg-6 mt-5 mt-lg-0">
        ${sectionHead('Материалы', [['Все разделы', 'articles.html']])}
        <ul class="list-unstyled rko-minilist">
          ${D.articles.slice(0, 4).map((a) => `<li class="rko-mini">
            <div class="rko-meta"><span>${esc(a.author)}</span></div>
            <a class="rko-mini__title" href="${a.href}">${esc(a.title)}</a>
          </li>`).join('\n')}
        </ul>
        <div class="rko-chips">
          ${['Публикации', 'Конференции', 'Медиа', 'Издания'].map((c) => `<a class="rko-chip" href="articles-list.html">${c}</a>`).join('')}
          <a class="rko-chip" href="library.html">Библиотека</a>
        </div>
      </div>
    </div>
  </div>
</section>`;
  return { file: 'index.html', title: 'Главная', active: '', crumb: [], body, bodyClass: 'rko-home' };
}

// ---------------------------------------------------------------- 02 Список новостей
function sidebarEvents() {
  return widget('Ближайшие мероприятия', `<ul class="list-unstyled rko-minilist rko-minilist--events">${D.events.map((e) => eventMini(e, { typeLabel: 'Мероприятие' })).join('')}</ul>`, ['Календарь', 'calendar.html']);
}
function sidebarArticles() {
  return widget('Материалы', `<ul class="list-unstyled rko-minilist">${D.articles.slice(0, 3).map((a) => `<li class="rko-mini"><div class="rko-meta"><span class="rko-type">Статья</span><span>${esc(a.author)}</span></div><a class="rko-mini__title" href="${a.href}">${esc(a.title)}</a></li>`).join('')}</ul>`, ['Все материалы', 'articles.html']);
}
function sidebarNews(title = 'Актуальные новости', skip = 0) {
  return widget(title, `<ul class="list-unstyled rko-minilist">${D.news.slice(skip, skip + 5).map((n) => newsRow(n, { compact: true })).join('')}</ul>`, ['Все новости', 'news.html']);
}

export function newsList() {
  const body = `${pageHead('Новости', { lead: D.INTRO.news })}
<div class="container rko-content">
  <div class="row">
    <div class="col-lg-8">
      <div class="rko-rows">
        ${D.news.map((n) => newsRow(n, { h: 2 })).join('\n')}
      </div>
      ${pagination(1, 135, 'Страницы новостей')}
    </div>
    <aside class="col-lg-4 rko-aside">
      ${sidebarEvents()}
      ${sidebarArticles()}
    </aside>
  </div>
</div>`;
  return { file: 'news.html', title: 'Новости', active: 'news', crumb: [['Новости']], body };
}

// ---------------------------------------------------------------- 03 Новость
export function newsItem() {
  const data = source('news-item');
  const n = D.news[0];
  const project = D.projects.find((p) => p.slug === '350');
  const blocks = data.blocks.filter((b) => !(b.type === 'heading' && b.text.startsWith('#')) && !(b.type === 'list' && b.items.join('') === 'Комментарии'));
  const body = `${pageHead(data.title, { meta: `<time datetime="${D.dateParts(n.date).iso}">${D.ruDate(n.date)}, ${n.time}</time><a class="rko-tag" href="${project.href}">${esc(n.tag)}</a>` })}
<div class="container rko-content">
  <div class="row">
    <div class="col-lg-8">
      <article class="rko-article">
        ${renderBlocks(blocks)}
      </article>
    </div>
    <aside class="col-lg-4 rko-aside">
      <section class="rko-widget rko-widget--card">
        <h2 class="rko-widget__title">Проект</h2>
        <a class="rko-widget__project" href="${project.href}">${esc(project.title)}</a>
        ${fundraising(project)}
        <a class="btn btn-primary btn-block mt-3" href="${project.href}#support">Поддержать проект</a>
      </section>
      ${sidebarNews('Актуальные новости', 1)}
    </aside>
  </div>
</div>`;
  return { file: 'news-item.html', title: data.title, active: 'news', crumb: [['Новости', 'news.html'], [data.title]], body };
}

// ---------------------------------------------------------------- 04 Список мероприятий
export function poster() {
  const body = `${pageHead('Мероприятия', { lead: D.INTRO.poster })}
<div class="container rko-content">
  <div class="rko-toolbar d-flex flex-wrap align-items-center">
    ${linkTabs([['Грядущие', '#'], ['Все', '#']], 0, 'Период')}
    <div class="rko-toolbar__side ml-md-auto d-flex align-items-center">
      <label class="sr-only" for="eventCategory">Вид мероприятия</label>
      <select class="custom-select custom-select-sm" id="eventCategory">
        <option selected>Все виды</option>
        ${D.eventCategories.map((c) => `<option>${esc(c)}</option>`).join('')}
      </select>
      <a class="btn btn-outline-dark btn-sm text-nowrap ml-2" href="calendar.html">Календарь</a>
    </div>
  </div>
  <div class="row">
    ${D.events.map((e) => `<div class="col-md-6 col-lg-4 mb-4">${eventTile(e, 2)}</div>`).join('\n')}
  </div>
</div>`;
  return { file: 'poster.html', title: 'Мероприятия', active: 'news', crumb: [['Новости', 'news.html'], ['Мероприятия']], body };
}

// ---------------------------------------------------------------- 05 Страница мероприятия
export function posterItem() {
  const data = source('poster-item');
  const e = D.events[0];
  const address = data.blocks.find((b) => b.type === 'table' && /Адрес/.test(JSON.stringify(b.rows)))?.rows[0] || [];
  const blocks = data.blocks.filter((b) => b.type !== 'table' || !/Адрес|10-й шрифт/.test(JSON.stringify(b.rows)));
  const body = `${pageHead(e.title, { meta: `<span>${esc(e.category)}</span><a class="rko-tag" href="project.html">${esc(e.tag)}</a>` })}
<div class="container rko-content">
  <div class="row">
    <div class="col-lg-8">
      <article class="rko-article">
        ${renderBlocks(blocks, { limit: 34 })}
        <p class="rko-cut">В макете показано начало материала.</p>
      </article>
    </div>
    <aside class="col-lg-4 rko-aside">
      <section class="rko-widget rko-widget--card rko-sticky">
        <h2 class="sr-only">Сведения о мероприятии</h2>
        <dl class="rko-facts">
          <dt>Дата</dt><dd>8–9 октября 2026</dd>
          <dt>Место</dt><dd>Государственный университет управления</dd>
          ${address[2] ? `<dt>Адрес</dt><dd>${esc(clean(address[2]).replace(/^Россия, 109542, /, '').replace(/, федеральное.*$/, ''))}<br><span class="text-muted">${esc(clean(address[0]).replace(' :', ':'))}</span></dd>` : ''}
          <dt>Формат</dt><dd>Смешанный</dd>
        </dl>
        <a class="btn btn-outline-dark btn-block" href="calendar.html">Календарь мероприятий</a>
      </section>
    </aside>
  </div>
</div>`;
  return { file: 'poster-item.html', title: e.title, active: 'news', crumb: [['Новости', 'news.html'], ['Мероприятия', 'poster.html'], [e.title]], body };
}

// ---------------------------------------------------------------- 06 Календарь
export function calendar() {
  // Дни 1, 8 и 24 отмечены в выгрузке календаря; 9-е — второй день конференции (по её тексту).
  // Названия события 1 октября в выгрузке нет, поэтому день отмечен без подписи.
  const marks = { 1: null, 8: D.events[0], 9: D.events[0], 24: D.events[1] };
  const cells = [];
  for (let i = 0; i < 3; i++) cells.push(null); // 1 октября 2026 — четверг
  for (let d = 1; d <= 31; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const months = source('calendar').categories.filter((c) => /\d{4}/.test(c));
  const body = `${pageHead('Календарь мероприятий')}
<div class="container rko-content">
  <div class="rko-calendar__nav d-flex align-items-center justify-content-between">
    <a class="btn btn-outline-dark btn-sm disabled" href="#" aria-disabled="true" tabindex="-1" aria-label="Предыдущий месяц: сентябрь"><span aria-hidden="true">←</span><span class="d-none d-sm-inline ml-1">Сентябрь</span></a>
    <div class="dropdown">
      <button class="btn btn-link rko-calendar__month dropdown-toggle" type="button" id="monthMenu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Октябрь 2026</button>
      <div class="dropdown-menu dropdown-menu-right" aria-labelledby="monthMenu">
        ${months.map((m, i) => `<a class="dropdown-item${i === 0 ? ' active' : ''}" href="#">${esc(m.charAt(0).toUpperCase() + m.slice(1).replace(',', ''))}</a>`).join('')}
      </div>
    </div>
    <a class="btn btn-outline-dark btn-sm" href="#" aria-label="Следующий месяц: ноябрь"><span class="d-none d-sm-inline mr-1">Ноябрь</span><span aria-hidden="true">→</span></a>
  </div>
  <div class="rko-calendar__wrap">
    <table class="table table-bordered rko-calendar">
      <caption class="sr-only">Мероприятия в октябре 2026 года</caption>
      <thead><tr>${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => `<th scope="col">${d}</th>`).join('')}</tr></thead>
      <tbody>
        ${weeks.map((w) => `<tr>${w.map((d) => {
          if (!d) return '<td class="rko-calendar__empty"></td>';
          const busy = d in marks; const ev = marks[d];
          return `<td${busy ? ' class="rko-calendar__busy"' : ''}><span class="rko-calendar__num">${d}</span>${ev ? `<a class="rko-calendar__event" href="${ev.href}">${esc(short(ev.title, 54))}</a>` : (busy ? '<span class="sr-only">Есть событие</span>' : '')}</td>`;
        }).join('')}</tr>`).join('\n        ')}
      </tbody>
    </table>
  </div>
  <h2 class="rko-h2 rko-h2--sm">События месяца</h2>
  <ul class="list-unstyled rko-minilist rko-minilist--events rko-minilist--wide">
    ${D.events.slice(0, 2).map((e) => eventMini(e)).join('\n')}
  </ul>
  <a class="rko-more" href="poster.html">Все мероприятия</a>
</div>`;
  return { file: 'calendar.html', title: 'Календарь мероприятий', active: 'news', crumb: [['Новости', 'news.html'], ['Мероприятия', 'poster.html'], ['Календарь']], body };
}

// ---------------------------------------------------------------- 07 Статья
export function about() {
  const data = source('about');
  const body = `${pageHead('Об РКО')}
<div class="container rko-content">
  <article class="rko-article rko-article--narrow">
    ${renderBlocks(data.blocks)}
  </article>
</div>`;
  return { file: 'about.html', title: 'Об РКО', active: 'about', crumb: [['Об обществе']], body };
}

// ---------------------------------------------------------------- 08 Об РКО — список материалов
export function aboutInfo() {
  const items = source('about-info').blocks.filter((b) => b.type === 'heading').map((b) => clean(b.text));
  const body = `${pageHead('Информация', { lead: D.INTRO['about-info'] })}
<div class="container rko-content">
  <div class="row">
    <div class="col-lg-8">
      <ol class="list-unstyled rko-linklist">
        ${items.map((t) => `<li><a href="about.html">${esc(t)}</a></li>`).join('\n        ')}
      </ol>
    </div>
    <aside class="col-lg-4 rko-aside">
      ${widget('Об обществе', `<div class="list-group list-group-flush rko-sidenav">
        ${[['Информация', 'about-info.html', true], ['Символика', 'about.html'], ['Документы', 'about-info.html'], ['Органы управления', 'direction.html'], ['Высший Совет РКО', 'collegium.html'], ['Партнёры', 'partners.html'], ['Контакты', 'contacts.html'], ['Первый отряд', 'tabs.html']].map(([t, h, on]) => `<a class="list-group-item list-group-item-action${on ? ' active' : ''}" href="${h}"${on ? ' aria-current="page"' : ''}>${t}</a>`).join('')}
      </div>`)}
    </aside>
  </div>
</div>`;
  return { file: 'about-info.html', title: 'Информация', active: 'about', crumb: [['Об обществе', 'about.html'], ['Информация']], body };
}

// ---------------------------------------------------------------- 09 Органы управления
const slugify = (i) => `organ-${i + 1}`;
// Заголовки разделов в источнике набраны прописными; регистр слов сохраняем как в меню сайта.
const ORGAN_TITLES = { 'ПРАВЛЕНИЕ': 'Правление', 'ВЫСШИЙ СОВЕТ РКО': 'Высший Совет РКО', 'РЕГИОНАЛЬНЫЕ ОТДЕЛЕНИЯ': 'Региональные отделения', 'ЗАРУБЕЖНЫЕ ПРЕДСТАВИТЕЛЬСТВА': 'Зарубежные представительства' };
const organTitle = (t) => ORGAN_TITLES[t] || t;

function directionEntry(e, regional, h) {
  // В региональных разделах заголовок записи — регион, а первая строка текста — имя председателя.
  const label = regional ? e.name : e.label;
  let name = regional ? '' : e.name;
  const text = e.text.slice();
  if (regional && text.length && text[0].length <= 42 && !/[.,:]/.test(text[0])) name = text.shift();
  return `<div class="col-md-6 mb-3">
    <div class="media rko-organ__person">
      ${e.image ? thumb(e.image, '', 'rko-person__photo rko-person__photo--96') : '<span class="rko-person__photo rko-person__photo--96 rko-person__photo--empty" aria-hidden="true"></span>'}
      <div class="media-body">
        ${label ? `<div class="rko-organ__label">${esc(label)}</div>` : ''}
        ${name ? `<h${h} class="rko-organ__name">${esc(name)}</h${h}>` : ''}
        ${text.slice(0, 2).map((t) => `<p>${esc(short(t, 150))}</p>`).join('')}
      </div>
    </div>
  </div>`;
}

export function direction() {
  const tree = D.directionTree();
  const sections = tree.map((s, i) => {
    const regional = /ОТДЕЛЕНИЯ|ПРЕДСТАВИТЕЛЬСТВА/.test(s.title);
    const head = s.title === 'Глава';
    const groups = s.groups.map((g) => {
      const h = g.title ? 4 : 3;
      if (!g.entries.length) {
        return `<div class="rko-organ__group">${g.title ? `<h3 class="rko-organ__subtitle">${esc(g.title)}</h3>` : ''}<p class="rko-organ__vacant">Сведения не опубликованы</p></div>`;
      }
      if (head) {
        const e = g.entries[0];
        return `<div class="media rko-organ__head">
          ${thumb(e.image, '', 'rko-person__photo rko-person__photo--160')}
          <div class="media-body">
            <h3 class="rko-organ__name rko-organ__name--lg">${esc(e.name)}</h3>
            ${e.text.map((t) => `<p>${esc(t)}</p>`).join('')}
          </div>
        </div>`;
      }
      // Записи без руководителя выносим в строку под сеткой: в сетке они оставляли пустые места.
      const isEmpty = (e) => (regional ? e.text.length <= 1 && !e.image : !e.name && !e.text.length);
      const filled = g.entries.filter((e) => !isEmpty(e));
      const empty = g.entries.filter(isEmpty);
      return `<div class="rko-organ__group">
        ${g.title ? `<h3 class="rko-organ__subtitle">${esc(g.title)}</h3>` : ''}
        <div class="row">${filled.map((e) => directionEntry(e, regional, h)).join('\n')}</div>
        ${empty.length ? `<p class="rko-organ__vacant">${regional
          ? empty.map((e) => `${esc(e.name)}: ${esc((e.text[0] || '').replace(/\.$/, '').toLowerCase())}`).join('; ')
          : `Руководитель не указан: ${empty.map((e) => esc(e.label)).join(', ')}`}.</p>` : ''}
      </div>`;
    }).join('\n');
    return `<section class="rko-organ" id="${slugify(i)}" aria-labelledby="${slugify(i)}-title">
      <h2 class="rko-organ__title" id="${slugify(i)}-title">${esc(organTitle(s.title))}</h2>
      <div class="rko-organ__body">${groups}</div>
    </section>`;
  }).join('\n');
  const body = `${pageHead('Органы управления')}
<div class="container rko-content">
  <div class="row">
    <aside class="col-lg-3 order-lg-1 rko-aside rko-aside--left d-none d-lg-block">
      <nav class="rko-sticky" aria-label="Разделы страницы">
        <div class="list-group list-group-flush rko-sidenav" id="organNav">
          ${tree.map((s, i) => `<a class="list-group-item list-group-item-action" href="#${slugify(i)}">${esc(organTitle(s.title))}</a>`).join('\n          ')}
        </div>
      </nav>
    </aside>
    <div class="col-lg-9 order-lg-2">
      ${sections}
      ${sampleNote('В макете сведения о людях сокращены до двух строк.')}
    </div>
  </div>
</div>`;
  return { file: 'direction.html', title: 'Органы управления', active: 'about', crumb: [['Об обществе', 'about.html'], ['Органы управления']], body, bodyClass: 'rko-scrollspy' };
}

// ---------------------------------------------------------------- 10 Высший совет — список
export function collegium() {
  const body = `${pageHead('Высший Совет РКО', { lead: D.INTRO.collegium })}
<div class="container rko-content">
  <div class="rko-councils">
  <div class="row">
    ${D.councils.map((c) => `<div class="col-md-6">
      <article class="media rko-council">
        ${thumb(c.image, '', 'rko-council__img')}
        <div class="media-body">
          <h2 class="rko-council__title"><a href="${c.href}">${esc(c.title)}</a></h2>
          <p>${esc(short(c.text, 150))}</p>
        </div>
      </article>
    </div>`).join('\n')}
  </div>
  </div>
</div>`;
  return { file: 'collegium.html', title: 'Высший Совет РКО', active: 'about', crumb: [['Об обществе', 'about.html'], ['Высший Совет РКО']], body };
}

// ---------------------------------------------------------------- 11 Высший совет — страница
export function collegiumItem() {
  const data = source('collegium-item');
  const blocks = data.blocks.filter((b) => b.type !== 'list');
  const body = `${pageHead(data.title)}
<div class="container rko-content">
  ${linkTabs([['Совет', '#'], ['Члены совета', '#', 3]], 0)}
  <div class="row">
    <div class="col-lg-8">
      <article class="rko-article">
        ${renderBlocks(blocks, { limit: 24 })}
        <p class="rko-cut">В макете показано начало материала.</p>
      </article>
    </div>
    <aside class="col-lg-4 rko-aside">
      ${widget('Другие советы', `<div class="list-group list-group-flush rko-sidenav">${D.councils.slice(1, 9).map((c) => `<a class="list-group-item list-group-item-action" href="${c.href}">${esc(c.title)}</a>`).join('')}</div>`, ['Все советы', 'collegium.html'])}
    </aside>
  </div>
</div>`;
  return { file: 'collegium-item.html', title: data.title, active: 'about', crumb: [['Об обществе', 'about.html'], ['Высший Совет РКО', 'collegium.html'], [data.title]], body };
}

// ---------------------------------------------------------------- 12 Партнёры
export function partnersList() {
  const body = `${pageHead('Партнёры')}
<div class="container rko-content">
  <div class="row">
    ${D.partners.map((p) => `<div class="col-lg-6 mb-4">
      <article class="card rko-partner h-100">
        <div class="card-body media">
          <span class="rko-partner__logo">${thumb(p.image, `Логотип: ${p.title}`)}</span>
          <div class="media-body">
            <h2 class="rko-partner__title"><a href="${p.href}">${esc(p.title)}</a></h2>
            <p>${esc(short(p.text, 170))}</p>
            ${p.site ? `<a class="rko-partner__site" ${linkAttrs(p.site)}>${esc(p.site.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>` : ''}
          </div>
        </div>
      </article>
    </div>`).join('\n')}
  </div>
</div>`;
  return { file: 'partners.html', title: 'Партнёры', active: 'about', crumb: [['Об обществе', 'about.html'], ['Партнёры']], body };
}

// ---------------------------------------------------------------- 13 Страница партнёра
export function partner() {
  const p = D.partners[0];
  const body = `${pageHead(p.title)}
<div class="container rko-content">
  <div class="row">
    <div class="col-md-4 col-lg-3 mb-4">
      <div class="rko-partner__plate">${imgTag(p.image, `Логотип: ${p.title}`, 'img-fluid')}</div>
    </div>
    <div class="col-md-8 col-lg-6">
      <article class="rko-article">
        <p>${esc(p.text)}</p>
      </article>
      ${p.site ? `<a class="btn btn-outline-dark" ${linkAttrs(p.site)}>Сайт партнёра: ${esc(p.site.replace(/^https?:\/\/(www\.)?/, ''))}</a>` : ''}
    </div>
  </div>
  <section class="rko-subsection">
    ${sectionHead('Другие партнёры', [['Все партнёры', 'partners.html']])}
    <div class="row">
      ${D.partners.slice(1, 7).map((x) => `<div class="col-sm-6 col-lg-4 mb-3">
        <a class="media rko-partner__mini h-100" href="${x.href}">
          <span class="rko-partner__logo">${thumb(x.image, '')}</span>
          <span class="media-body">
            <span class="rko-partner__mini-title">${esc(x.title)}</span>
            ${x.site ? `<span class="rko-partner__mini-site">${esc(x.site.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, ''))}</span>` : ''}
          </span>
        </a>
      </div>`).join('\n')}
    </div>
  </section>
</div>`;
  return { file: 'partner.html', title: p.title, active: 'about', crumb: [['Об обществе', 'about.html'], ['Партнёры', 'partners.html'], [p.title]], body };
}

// ---------------------------------------------------------------- 14 Контакты
export function contacts() {
  const body = `${pageHead('Контакты')}
<div class="container rko-content">
  <div class="row">
    <div class="col-md-6 col-lg-4 mb-4">
      <section class="rko-contact">
        <h2 class="rko-contact__title">Связаться</h2>
        <dl class="rko-facts">
          <dt>Телефон</dt><dd><a href="tel:+79219967296">+7 921 996-72-96</a></dd>
          <dt>Электронная почта</dt><dd><a href="mailto:info@cosmatica.org">info@cosmatica.org</a></dd>
        </dl>
      </section>
    </div>
    <div class="col-md-6 col-lg-4 mb-4">
      <section class="rko-contact">
        <h2 class="rko-contact__title">Адрес в Москве</h2>
        <address class="mb-0">107023, г. Москва,<br>ул. Кржижановского, 21А</address>
      </section>
    </div>
    <div class="col-md-6 col-lg-4 mb-4">
      <section class="rko-contact">
        <h2 class="rko-contact__title">Адрес в Санкт-Петербурге</h2>
        <address class="mb-0">195248, Санкт-Петербург,<br>пр. Энергетиков, д. 19, каб. 21</address>
      </section>
    </div>
  </div>
  <section class="rko-subsection">
    <div class="row">
      <div class="col-lg-8">
        <h2 class="rko-h2 rko-h2--sm">Отделения в регионах</h2>
        <p>Отделений и представительств Общества: ${D.departments.length}. Адреса и телефоны — на страницах отделений.</p>
        <a class="btn btn-outline-dark" href="departments.html">Найти своё отделение</a>
      </div>
      <div class="col-lg-4 mt-4 mt-lg-0">
        <h2 class="rko-h2 rko-h2--sm">В сети</h2>
        <ul class="list-unstyled rko-linklist rko-linklist--sm">
          <li><a href="https://t.me/RKO_cosmatica" target="_blank" rel="noopener noreferrer">Telegram</a></li>
          <li><a href="https://vk.com/cosmatica" target="_blank" rel="noopener noreferrer">ВКонтакте</a></li>
          <li><a href="https://ok.ru/group/55464677015766" target="_blank" rel="noopener noreferrer">Одноклассники</a></li>
        </ul>
      </div>
    </div>
  </section>
</div>`;
  return { file: 'contacts.html', title: 'Контакты', active: 'about', crumb: [['Об обществе', 'about.html'], ['Контакты']], body };
}

export { sidebarNews, sidebarEvents, sidebarArticles };
