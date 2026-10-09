// Отделения, проекты, состав, материалы, библиотека.
import { esc, clean, source, imgTag, renderBlocks, linkAttrs, rub } from './core.mjs';
import { pageHead, pagination, linkTabs, contentTabs, widget, LIBRARY_CATEGORIES } from './layout.mjs';
import * as D from './data.mjs';
import { icon, categoryIcon } from './icons.mjs';
import { newsRow, eventMini, projectCard, person, sectionHead, thumb, short, fundraising, statusBadge, bookRow, sampleNote } from './parts.mjs';

// ---------------------------------------------------------------- 15 Отделения
function departmentsMap() {
  // Простая равнопромежуточная проекция; это схема для макета, а не географическая карта.
  const W = 1000; const H = 380; const lon0 = 16; const lon1 = 138; const lat0 = 42; const lat1 = 66;
  const xy = ([lat, lon]) => [((lon - lon0) / (lon1 - lon0)) * W, ((lat1 - lat) / (lat1 - lat0)) * H];
  // Подпись: [текст, сдвиг по x, сдвиг по y, выравнивание]. Подписаны только те точки, где подписи не наезжают.
  const LABELS = {
    'Калининградская область': ['Калининград', 10, 5, 'start'], 'Санкт-Петербург': ['Санкт-Петербург', 10, -8, 'start'],
    'Москва': ['Москва', 0, -12, 'middle'], 'Республика Крым': ['Крым', -10, 5, 'end'],
    'Волгоградская область': ['Волгоград', 10, 5, 'start'], 'Удмуртская республика': ['Удмуртия', 0, -12, 'middle'],
    'Тюменская область': ['Тюмень', 10, -8, 'start'],
    'Новосибирская область': ['Новосибирск', -10, 5, 'end'], 'Томская область': ['Томск', 10, -8, 'start'],
    'Республика Хакасия': ['Хакасия', 10, 5, 'start'], 'Республика Саха (Якутия). Представительство': ['Якутия', -10, 5, 'end'],
  };
  const lines = [];
  for (let lon = 20; lon <= 130; lon += 10) { const [x] = xy([50, lon]); lines.push(`<line x1="${x.toFixed(0)}" y1="0" x2="${x.toFixed(0)}" y2="${H}"/>`); }
  for (let lat = 45; lat <= 65; lat += 5) { const [, y] = xy([lat, 50]); lines.push(`<line x1="0" y1="${y.toFixed(0)}" x2="${W}" y2="${y.toFixed(0)}"/>`); }
  const dots = D.departments.filter((d) => d.geo).map((d) => {
    const [x, y] = xy(d.geo);
    const l = LABELS[d.title];
    const label = l ? `<text x="${(x + l[1]).toFixed(0)}" y="${(y + l[2]).toFixed(0)}" text-anchor="${l[3]}">${esc(l[0])}</text>` : '';
    return `<a href="${d.href}"><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="5"><title>${esc(d.title)}</title></circle>${label}</a>`;
  });
  return `<figure class="rko-map" data-rko-widget="map">
    <svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Схема расположения отделений РКО" preserveAspectRatio="xMidYMid meet">
      <g class="rko-map__grid">${lines.join('')}</g>
      <g class="rko-map__dots">${dots.join('')}</g>
    </svg>
    <figcaption>Место для карты с метками отделений. Карту подключает CMS, на макете показана схема расположения.</figcaption>
  </figure>`;
}

export function departments() {
  const ru = D.departments.filter((d) => !d.abroad).sort((a, b) => a.title.localeCompare(b.title, 'ru'));
  const abroad = D.departments.filter((d) => d.abroad);
  const COUNTRY = { 'Представительство в Беларуси': 'Беларусь', 'Представительство в Латвии': 'Латвия', 'Представительство в Канаде': 'Канада' };
  const letters = [...new Set(ru.map((d) => d.title[0]))];
  const body = `${pageHead('Отделения', { lead: `Региональные отделения и представительства Общества: ${D.departments.length}.` })}
<div class="container rko-content">
  ${departmentsMap()}
  <h2 class="rko-h2 rko-h2--sm">Россия</h2>
  <div class="rko-columns">
    ${letters.map((l) => `<div class="rko-columns__group">
      <div class="rko-columns__letter" aria-hidden="true">${l}</div>
      <ul class="list-unstyled">
        ${ru.filter((d) => d.title[0] === l).map((d) => `<li><a href="${d.href}">${esc(d.title.replace('. Представительство', ''))}</a>${d.representation ? ' <span class="rko-columns__note">представительство</span>' : ''}</li>`).join('')}
      </ul>
    </div>`).join('\n')}
  </div>
  <h2 class="rko-h2 rko-h2--sm">За рубежом</h2>
  <ul class="list-unstyled rko-columns rko-columns--plain">
    ${abroad.map((d) => `<li><a href="${d.href}">${esc(COUNTRY[d.title] || d.title)}</a></li>`).join('')}
  </ul>
</div>`;
  return { file: 'departments.html', title: 'Отделения', active: 'departments', crumb: [['Отделения']], body };
}

// ---------------------------------------------------------------- 16 Страница отделения
export function department() {
  const data = source('department');
  const tabs = data.blocks.find((b) => b.type === 'list').items.map((t) => { const m = t.match(/^(.*?)\s*(\d+)?$/); return [m[1], '#', m[2] ? +m[2] : null]; });
  const paragraphs = data.blocks.filter((b) => b.type === 'paragraph').map((b) => clean(b.text));
  const chair = D.directionTree().find((s) => /ОТДЕЛЕНИЯ/.test(s.title))?.groups[0].entries.find((e) => e.name === 'Москва');
  const members = D.users.filter((u) => u.department === 'Москва').slice(0, 6);
  const body = `${pageHead('Москва', { lead: 'Московское региональное отделение' })}
<div class="container rko-content">
  ${linkTabs(tabs, 0, 'Разделы отделения')}
  <div class="row">
    <div class="col-lg-8">
      <article class="rko-article">
        <p>${esc(paragraphs[0].replace(/\s+\./g, '.'))}</p>
      </article>
      <section class="rko-subsection">
        ${sectionHead('Новости отделения', [[`Все новости: ${tabs[1][2]}`, '#']])}
        <div class="rko-rows">
          ${D.news.slice(4, 8).map((n) => newsRow(n)).join('\n')}
        </div>
        ${sampleNote('Пример наполнения: в макете показаны общие новости сайта, а не новости этого отделения.')}
      </section>
    </div>
    <aside class="col-lg-4 rko-aside">
      <section class="rko-widget rko-widget--card">
        <h2 class="rko-widget__title">Контакты отделения</h2>
        ${chair ? person({ name: chair.text[0], image: chair.image, role: 'Председатель отделения', href: 'profile.html' }) : ''}
        <dl class="rko-facts">
          <dt>Адрес</dt><dd>${esc(paragraphs.find((p) => p.startsWith('Адрес:'))?.replace('Адрес: ', '') || '')}</dd>
          <dt>Телефон</dt><dd><a href="tel:+79219967296">+7 921 996-72-96</a></dd>
          <dt>Электронная почта</dt><dd><a href="mailto:info-msk@cosmatica.org">info-msk@cosmatica.org</a></dd>
        </dl>
      </section>
      ${widget('Состав', `<div class="rko-people rko-people--compact">${members.map((u) => person({ ...u, department: '' }, { size: 40 })).join('')}</div>`, [`Весь состав: ${tabs[4][2]}`, 'users.html'])}
      ${widget('Мероприятия', `<ul class="list-unstyled rko-minilist rko-minilist--events">${D.events.slice(0, 1).map((e) => eventMini(e)).join('')}</ul>${sampleNote('Пример наполнения.')}`, [`Все мероприятия: ${tabs[3][2]}`, 'poster.html'])}
    </aside>
  </div>
</div>`;
  return { file: 'department.html', title: 'Москва', active: 'departments', crumb: [['Отделения', 'departments.html'], ['Москва']], body };
}

// ---------------------------------------------------------------- 17 Список проектов
export function projectsList() {
  const keys = { 'Все': 'all', 'Стратегические инициативы': 'Стратегические инициативы', 'Действующие': 'Действующий', 'Завершённые': 'Завершённый', 'Перспективные': 'Перспективный', 'Ждут поддержки': 'support' };
  const anchors = { 'Стратегические инициативы': 'strategy', 'Действующие': 'current', 'Завершённые': 'completed', 'Перспективные': 'planned', 'Ждут поддержки': 'support' };
  const body = `${pageHead('Проекты')}
<div class="container rko-content">
  <ul class="nav nav-tabs rko-tabs" data-rko-filter="#projectGrid" aria-label="Тип проекта">
    ${D.projectFilters.map((f, i) => `<li class="nav-item"><a class="nav-link${i === 0 ? ' active' : ''}" href="#${anchors[f] || 'all'}" data-rko-key="${esc(keys[f])}">${esc(f)}</a></li>`).join('\n    ')}
  </ul>
  <div class="row" id="projectGrid">
    ${D.projects.map((p) => projectCard(p, 2)).join('\n')}
  </div>
  <p class="rko-empty d-none" data-rko-empty>В этом разделе на первой странице проектов нет. Полный список подставляет CMS.</p>
  ${pagination(1, 25, 'Страницы проектов')}
</div>`;
  return { file: 'projects.html', title: 'Проекты', active: 'projects', crumb: [['Проекты']], body };
}

// ---------------------------------------------------------------- 18 Страница проекта — три состояния
function projectPage(p, { file, limit = 26, supportMode }) {
  const d = p.detail;
  const tabs = (p.tabs.length ? p.tabs : ['О проекте']).map((t) => { const m = t.match(/^(.*?)\s*(\d+)?$/); return [m[1], '#', m[2] ? +m[2] : null]; });
  const docs = (d.documents || []).map((x) => ({ label: clean(x.label), href: '#' }));
  // Служебные хвосты страницы CMS («Стена проекта», «Комментарии») в описание не входят.
  const wall = (d.blocks || []).findIndex((b) => b.type === 'heading' && /^Стена проекта/.test(b.text));
  const blocks = (d.blocks || []).slice(0, wall === -1 ? undefined : wall)
    .filter((b, i) => !(b.type === 'list' && (i < 3 || b.items.join('') === 'Комментарии')) && !(b.type === 'image' && i === 0));
  const total = blocks.filter((b) => b.type === 'paragraph').length;
  let support = '';
  if (supportMode === 'target' || supportMode === 'free') {
    support = `<section class="rko-widget rko-widget--card rko-support-card" id="support">
        <h2 class="rko-widget__title">Поддержать проект</h2>
        ${fundraising(p, { large: true })}
        <form data-rko-demo novalidate>
          <label for="supportSum">Сумма, ₽</label>
          <div class="btn-group btn-group-sm rko-sums" role="group" aria-label="Быстрый выбор суммы">
            ${[500, 1000, 3000].map((s) => `<button type="button" class="btn btn-outline-dark" data-rko-sum="${s}">${rub(s)}</button>`).join('')}
          </div>
          <input class="form-control" id="supportSum" type="number" min="100" step="100" value="1000" inputmode="numeric">
          <button class="btn btn-primary btn-block" type="submit">Поддержать проект</button>
        </form>
        ${p.slug === '350' ? '<p class="rko-support-card__note">За вклад от 1 000 ₽ — книга с автографом автора.</p>' : ''}
      </section>`;
  } else if (supportMode === 'closed') {
    support = `<section class="rko-widget rko-widget--card" id="support">
        <h2 class="rko-widget__title">Проект завершён</h2>
        <p class="rko-cut mt-0">Состояние макета: у завершённого проекта форма поддержки скрыта.</p>
      </section>`;
  }
  const body = `${pageHead(p.title, { meta: `${statusBadge(p.status)}${p.direction ? `<span>${esc(p.direction)}</span>` : ''}` })}
<div class="container rko-content">
  ${linkTabs(tabs, 0, 'Разделы проекта')}
  <div class="row">
    <div class="col-lg-8">
      <article class="rko-article">
        ${renderBlocks(blocks, { limit })}
        ${total > limit ? '<p class="rko-cut">В макете показано начало описания проекта.</p>' : ''}
      </article>
    </div>
    <aside class="col-lg-4 rko-aside">
      <div>
      ${support}
      <section class="rko-widget rko-widget--card">
        <h2 class="sr-only">Сведения о проекте</h2>
        <div class="rko-project__plate">${imgTag(p.image, `Эмблема проекта: ${p.title}`, 'img-fluid')}</div>
        <dl class="rko-facts">
          <dt>Статус</dt><dd>${esc(p.status)}</dd>
          ${p.direction ? `<dt>Направление</dt><dd>${esc(p.direction)}</dd>` : ''}
          ${p.site ? `<dt>Сайт</dt><dd><a ${linkAttrs(p.site)}>${esc(p.site.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a></dd>` : ''}
          ${docs.length ? `<dt>Документы</dt><dd>${docs.map((x) => `<a href="#" data-rko-demo>${esc(x.label)}</a>`).join('<br>')}</dd>` : ''}
        </dl>
      </section>
      </div>
    </aside>
  </div>
</div>`;
  return { file, title: p.title, active: 'projects', crumb: [['Проекты', 'projects.html'], [p.title]], body };
}
export const project = () => projectPage(D.projects.find((p) => p.slug === 'gagarincy'), { file: 'project.html', supportMode: 'free', limit: 22 });
export const projectFundraising = () => projectPage(D.projects.find((p) => p.slug === '350'), { file: 'project-fundraising.html', supportMode: 'target', limit: 40 });
export const projectCollecting = () => projectPage(D.projects.find((p) => p.slug === 'rusleo'), { file: 'project-collecting.html', supportMode: 'target', limit: 18 });
export const projectCompleted = () => projectPage(D.projects.find((p) => p.slug === '342'), { file: 'project-completed.html', supportMode: 'closed', limit: 18 });

// ---------------------------------------------------------------- 19 Состав РКО
export function users() {
  const body = `${pageHead('Состав РКО')}
<div class="container rko-content">
  <div class="rko-toolbar d-flex flex-wrap align-items-center">
    ${linkTabs(D.userGroups.map((g) => [g, '#']), 0, 'Группы участников')}
    <form class="rko-toolbar__side ml-md-auto" data-rko-demo role="search">
      <label class="sr-only" for="userSearch">Найти по имени</label>
      <input class="form-control form-control-sm" id="userSearch" type="search" placeholder="Найти по имени">
    </form>
  </div>
  <div class="rko-people rko-people--grid">
    <div class="row">
      ${D.users.map((u) => `<div class="col-sm-6 col-lg-4">${person(u)}</div>`).join('\n')}
    </div>
  </div>
  ${pagination(1, 10, 'Страницы состава')}
</div>`;
  return { file: 'users.html', title: 'Состав РКО', active: 'users', crumb: [['Состав РКО']], body };
}

// ---------------------------------------------------------------- 20 Профиль
export function profile() {
  const data = source('profile');
  const field = (k) => clean(data.fields.find((f) => f.key === k)?.value || '');
  const bio = clean(data.fields.find((f) => !f.key)?.value || '');
  const [bioText, contact] = bio.split(/\s*Контакты:\s*/);
  const lists = data.blocks.filter((b) => b.type === 'list').flatMap((b) => b.items);
  const count = (name) => +(lists.find((i) => i.startsWith(name))?.match(/\d+/)?.[0] || 0);
  const info = Object.fromEntries(lists.filter((i) => i.includes(': ')).map((i) => i.split(': ')));
  const photo = data.blocks.filter((b) => b.type === 'image')[1]?.src;
  const own = D.articles.filter((a) => /Гапонов/.test(a.author)).slice(0, 3);
  const body = `<div class="rko-pagehead rko-pagehead--profile">
  <div class="container">
    <div class="media align-items-center">
      ${imgTag(photo, '', 'rko-person__photo rko-person__photo--128')}
      <div class="media-body">
        <h1 class="rko-h1 rko-h1--long">${esc(data.title.replace(/\.$/, ''))}</h1>
        <div class="rko-pagehead__meta"><a href="department.html">${esc(field('Отделение:'))}</a><span>Регистрация: ${esc(info['Регистрация'] || '')}</span></div>
      </div>
    </div>
  </div>
</div>
<div class="container rko-content">
  ${linkTabs([['Профиль', '#'], ['Проекты', '#', count('Проекты')], ['Материалы', '#', count('Материалы')]], 0, 'Разделы профиля')}
  <div class="row">
    <div class="col-lg-8">
      <article class="rko-article">
        <h2>Биография</h2>
        ${bioText.split(/(?<=\.)\s+(?=[А-ЯЁ])/).map((s) => `<p>${esc(s)}</p>`).join('')}
      </article>
      <section class="rko-subsection">
        ${sectionHead('Материалы автора', [[`Все материалы: ${count('Материалы')}`, '#']])}
        <ul class="list-unstyled rko-minilist rko-minilist--wide">
          ${own.map((a) => `<li class="rko-mini"><a class="rko-mini__title" href="${a.href}">${esc(a.title)}</a></li>`).join('')}
        </ul>
      </section>
    </div>
    <aside class="col-lg-4 rko-aside">
      <section class="rko-widget rko-widget--card">
        <h2 class="rko-widget__title">Сведения</h2>
        <dl class="rko-facts">
          <dt>Отделение</dt><dd><a href="department.html">${esc(field('Отделение:'))}</a></dd>
          ${contact ? `<dt>Электронная почта</dt><dd><a href="mailto:${esc(contact)}">${esc(contact)}</a></dd>` : ''}
          <dt>Многодетность</dt><dd>${esc(field('Многодетность:'))}</dd>
          ${info['По приглашению'] ? `<dt>Пригласил</dt><dd><a href="profile.html">${esc(info['По приглашению'])}</a></dd>` : ''}
        </dl>
      </section>
      ${widget('Проекты', `<ul class="list-unstyled rko-minilist">${D.projects.slice(0, 3).map((p) => `<li class="rko-mini"><div class="rko-meta">${statusBadge(p.status)}</div><a class="rko-mini__title" href="${p.href}">${esc(short(p.title, 70))}</a></li>`).join('')}</ul>${sampleNote('Пример наполнения: список проектов участника подставляет CMS.')}`, [`Все проекты: ${count('Проекты')}`, '#'])}
    </aside>
  </div>
</div>`;
  return { file: 'profile.html', title: data.title, active: 'users', crumb: [['Состав РКО', 'users.html'], [data.title.replace(/\.$/, '')]], body };
}

// ---------------------------------------------------------------- 21 Материалы — категории
export function articleCategories() {
  const body = `${pageHead('Материалы', { lead: D.INTRO.articles })}
<div class="container rko-content">
  <div class="rko-tiles">
    ${D.articleCategories.map((c) => `<a class="rko-tile" href="articles-list.html" data-rko-icon="${categoryIcon(c)}"><span class="rko-tile__icon">${icon(categoryIcon(c))}</span><span class="rko-tile__title">${esc(c.replace(/\.$/, ''))}</span></a>`).join('\n    ')}
  </div>
</div>`;
  return { file: 'articles.html', title: 'Материалы', active: 'articles', crumb: [['Материалы']], body };
}

function categoriesWidget(active = 'Публикации') {
  return widget('Разделы материалов', `<div class="list-group list-group-flush rko-sidenav">
    ${D.articleCategories.slice(0, 12).map((c) => `<a class="list-group-item list-group-item-action${c === active ? ' active' : ''}" href="articles-list.html"${c === active ? ' aria-current="page"' : ''}>${esc(short(c.replace(/\.$/, ''), 46))}</a>`).join('')}
  </div>`, ['Все разделы', 'articles.html']);
}

// ---------------------------------------------------------------- 22 Материалы — список статей
export function articlesList() {
  const body = `${pageHead('Публикации', { lead: D.articlesIntro })}
<div class="container rko-content">
  <div class="row">
    <div class="col-lg-8">
      <div class="rko-rows rko-rows--text">
        ${D.articles.map((a) => `<article class="rko-row">
          <h2 class="rko-row__title"><a href="${a.href}">${esc(a.title)}</a></h2>
          <div class="rko-meta">${a.author ? `<span>${esc(a.author)}</span>` : ''}${a.tag ? `<a class="rko-tag" href="project.html">${esc(a.tag)}</a>` : ''}</div>
        </article>`).join('\n')}
      </div>
      ${pagination(1, 12, 'Страницы раздела')}
    </div>
    <aside class="col-lg-4 rko-aside">
      ${categoriesWidget()}
    </aside>
  </div>
</div>`;
  return { file: 'articles-list.html', title: 'Публикации', active: 'articles', crumb: [['Материалы', 'articles.html'], ['Публикации']], body };
}

// ---------------------------------------------------------------- 23 Материалы — статья
export function article() {
  const data = source('article');
  const a = D.articles[0];
  const blocks = data.blocks.filter((b) => !(b.type === 'heading' && b.text.startsWith('#')));
  const body = `${pageHead(data.title, { meta: `<span>${esc(a.author)}</span><a class="rko-tag" href="project.html">${esc(a.tag)}</a>` })}
<div class="container rko-content">
  <div class="row">
    <div class="col-lg-8">
      <article class="rko-article">
        ${renderBlocks(blocks, { limit: 22 })}
        <p class="rko-cut">В макете показано начало статьи.</p>
      </article>
    </div>
    <aside class="col-lg-4 rko-aside">
      ${categoriesWidget()}
    </aside>
  </div>
</div>`;
  return { file: 'article.html', title: data.title, active: 'articles', crumb: [['Материалы', 'articles.html'], ['Публикации', 'articles-list.html'], [data.title]], body };
}

// ---------------------------------------------------------------- 24 Библиотека — список книг
export function library() {
  const body = `${pageHead('Библиотека', { lead: D.INTRO.library })}
<div class="container rko-content">
  <div class="row">
    <aside class="col-lg-3 rko-aside rko-aside--left">
      <div class="d-lg-none mb-3">
        <label class="sr-only" for="libraryCategory">Раздел библиотеки</label>
        <select class="custom-select" id="libraryCategory">
          <option selected>Все разделы</option>
          ${LIBRARY_CATEGORIES.map((c) => `<option>${esc(c)}</option>`).join('')}
        </select>
      </div>
      <nav class="d-none d-lg-block" aria-label="Разделы библиотеки">
        <div class="list-group list-group-flush rko-sidenav">
          <a class="list-group-item list-group-item-action active" href="library.html" aria-current="page">Все разделы</a>
          ${LIBRARY_CATEGORIES.map((c) => `<a class="list-group-item list-group-item-action" href="library.html">${esc(c)}</a>`).join('\n          ')}
        </div>
      </nav>
    </aside>
    <div class="col-lg-9">
      <form class="rko-toolbar form-row align-items-center" data-rko-demo role="search">
        <div class="col-12 col-sm mb-2 mb-sm-0">
          <label class="sr-only" for="bookSearch">Название или автор</label>
          <input class="form-control" id="bookSearch" type="search" placeholder="Название или автор">
        </div>
        <div class="col-12 col-sm-auto">
          <label class="sr-only" for="bookSort">Порядок</label>
          <select class="custom-select" id="bookSort"><option selected>Сначала новые</option><option>По названию</option><option>По автору</option></select>
        </div>
      </form>
      <ul class="list-unstyled rko-books">
        ${D.books.map((b) => bookRow(b, 2)).join('\n')}
      </ul>
      ${pagination(1, 33, 'Страницы библиотеки')}
    </div>
  </div>
</div>`;
  return { file: 'library.html', title: 'Библиотека', active: 'library', crumb: [['Библиотека']], body };
}

// ---------------------------------------------------------------- 25 Библиотека — страница книги
export function book() {
  const data = source('book');
  const field = (k) => clean(data.fields.find((f) => f.key === k)?.value || '');
  const size = field('Файл:').replace(/^Скачать\s*/, '');
  const cover = data.blocks.find((b) => b.type === 'image')?.src;
  const body = `<div class="container rko-content rko-content--top">
  <div class="row">
    <div class="col-sm-4 col-lg-3 mb-4">
      <div class="rko-bookcover">${imgTag(cover, `Обложка: ${data.title}`, 'img-fluid')}</div>
    </div>
    <div class="col-sm-8 col-lg-6">
      <h1 class="rko-h1 rko-h1--long">${esc(data.title)}</h1>
      <p class="rko-bookauthor">${esc(field('Автор:'))}</p>
      <div class="rko-bookfile d-flex flex-wrap align-items-center">
        <a class="btn btn-primary btn-lg" href="#" data-rko-demo>Скачать книгу</a>
        <span class="rko-bookfile__size">${esc(size)}</span>
      </div>
      <article class="rko-article">
        <p>${esc(clean(data.fields.find((f) => !f.key)?.value))}</p>
      </article>
    </div>
    <aside class="col-lg-3 rko-aside mt-5 mt-lg-0">
      ${widget('В этом разделе', `<ul class="list-unstyled rko-minilist">${D.books.slice(0, 4).map((b) => `<li class="rko-mini"><a class="rko-mini__title" href="${b.href}">${esc(short(b.title, 60))}</a><div class="rko-meta"><span>${esc(b.author)}</span></div></li>`).join('')}</ul>`, ['Вся библиотека', 'library.html'])}
    </aside>
  </div>
</div>`;
  return { file: 'book.html', title: data.title, active: 'library', crumb: [['Библиотека', 'library.html'], [data.title]], body };
}

// ---------------------------------------------------------------- 26 Типовая страница с вкладками
export function tabsPage() {
  const data = source('tabs');
  const counts = Object.fromEntries(data.blocks.find((b) => b.type === 'list').items.map((t) => { const m = t.match(/^(.*?)\s*(\d+)?$/); return [m[1], m[2] ? +m[2] : null]; }));
  const text = renderBlocks(data.blocks.filter((b) => b.type !== 'list'), { limit: 20 });
  const body = `${pageHead(data.title)}
<div class="container rko-content">
  ${contentTabs('squad', [
    { key: 'info', title: 'Информация', html: `<div class="row"><div class="col-lg-8"><article class="rko-article">${text}<p class="rko-cut">В макете показано начало текста.</p></article></div></div>` },
    { key: 'members', title: 'Участники', count: counts['Участники'], html: `<div class="rko-people rko-people--grid"><div class="row">${D.squad.map((p) => `<div class="col-sm-6 col-lg-4">${person({ ...p, href: 'profile.html' })}</div>`).join('')}</div></div><p class="rko-cut">В макете показаны трое из ${counts['Участники']} участников.</p>` },
    { key: 'news', title: 'Новости', count: counts['Новости'], html: `<div class="row"><div class="col-lg-8"><div class="rko-rows">${D.news.slice(0, 4).map((n) => newsRow(n, { h: 2 })).join('')}</div>${sampleNote('Пример наполнения: в макете показаны общие новости сайта.')}${pagination(1, 7, 'Страницы новостей')}</div></div>` },
  ])}
</div>`;
  return { file: 'tabs.html', title: data.title, active: 'about', crumb: [['Об обществе', 'about.html'], ['Первый отряд']], body };
}

