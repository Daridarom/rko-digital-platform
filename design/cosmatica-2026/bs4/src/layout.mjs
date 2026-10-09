// Сквозные блоки: <head>, шапка с двухуровневым меню, хлебные крошки, заголовок страницы, подвал.
import { esc, clean } from './core.mjs';

// Структура меню повторяет действующий cosmatica.org (снята 09.10.2026).
export const MENU = [
  { key: 'about', title: 'Об обществе', href: 'about.html', items: [
    ['Информация', 'about-info.html'], ['Символика', 'about.html'], ['Документы', 'about-info.html'],
    ['Органы управления', 'direction.html'], ['Высший Совет РКО', 'collegium.html'],
    ['Партнёры', 'partners.html'], ['Контакты', 'contacts.html'], ['Первый отряд', 'tabs.html'],
  ] },
  { key: 'news', title: 'Новости', href: 'news.html', items: [['Мероприятия', 'poster.html']] },
  { key: 'departments', title: 'Отделения', href: 'departments.html' },
  { key: 'projects', title: 'Проекты', href: 'projects.html', items: [
    ['Стратегические инициативы', 'projects.html#strategy'], ['Действующие', 'projects.html#current'],
    ['Завершённые', 'projects.html#completed'], ['Перспективные', 'projects.html#planned'],
  ] },
  { key: 'users', title: 'Состав РКО', href: 'users.html' },
  { key: 'articles', title: 'Материалы', href: 'articles.html', items: [
    'Конференции', 'Публикации', 'Медиа', 'Газета', 'Космонавтика', 'Фантастика РКО', 'Издания',
    'Конкурсные работы', 'Научная школа', 'Ближе к космосу', 'Мир Героев', 'Глоссарий',
  ].map((t) => [t, 'articles-list.html']) },
  { key: 'library', title: 'Библиотека', href: 'library.html', wide: true, items: [
    'Устойчивое развитие', 'Основания русского космизма', 'Космонавтика', 'Научное наследие П.Г.Кузнецова',
    'Монографии', 'Учебно-методические пособия', 'Детская литература', 'Фантастика',
    'Синтез междисциплинарных знаний', 'Издательство РКО', 'Астрономия', 'Образование', 'Философия',
    'Природопользование', 'Авиация, воздухоплавание',
  ].map((t) => [t, 'library.html']) },
];
export const LIBRARY_CATEGORIES = MENU.find((m) => m.key === 'library').items.map((i) => i[0]);
export const ARTICLE_CATEGORIES = MENU.find((m) => m.key === 'articles').items.map((i) => i[0]);

const ICON_SEARCH = '<svg class="rko-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.5 15.5 5 5"></path></svg>';

function head(title) {
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<meta name="theme-color" content="#f6f6f2">
<title>${esc(title)} · Русское Космическое Общество</title>
<script>/* только для просмотра макета: выбор варианта оформления */(function(){try{var q=new URLSearchParams(location.search).get('design'),s=q||localStorage.getItem('rko-design');if(s==='hybrid'||s==='sharp'){document.documentElement.setAttribute('data-design',s);if(q)localStorage.setItem('rko-design',s);}}catch(e){}})();</script>
<link rel="icon" href="assets/img/rko-mark.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/inter-cyrillic-variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/russo-one-regular.ttf" as="font" type="font/ttf" crossorigin>
<link rel="stylesheet" href="assets/vendor/bootstrap-4.6.2.min.css">
<link rel="stylesheet" href="assets/css/rko-theme.css?v=__BUILD__">
</head>`;
}

function navItem(item, active) {
  const isActive = item.key === active;
  if (!item.items) {
    return `<li class="nav-item${isActive ? ' active' : ''}"><a class="nav-link" href="${item.href}">${esc(item.title)}${isActive ? ' <span class="sr-only">(текущий раздел)</span>' : ''}</a></li>`;
  }
  const id = `rkoNav-${item.key}`;
  return `<li class="nav-item dropdown${isActive ? ' active' : ''}">
            <a class="nav-link" href="${item.href}">${esc(item.title)}</a>
            <a class="nav-link dropdown-toggle dropdown-toggle-split" href="#" id="${id}" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><span class="sr-only">Открыть подразделы: ${esc(item.title)}</span></a>
            <div class="dropdown-menu${item.wide ? ' rko-dropdown-wide' : ''}" aria-labelledby="${id}">
              ${item.items.map(([t, h]) => `<a class="dropdown-item" href="${h}">${esc(t)}</a>`).join('\n              ')}
            </div>
          </li>`;
}

function header(active) {
  return `<a class="sr-only sr-only-focusable rko-skip" href="#main">К содержанию</a>
<header class="rko-header">
  <div class="container">
    <div class="rko-header__top d-flex align-items-center">
      <a class="rko-brand d-flex align-items-center" href="index.html">
        <img class="rko-brand__mark" src="assets/img/rko-mark.svg" width="46" height="44" alt="Герб РКО «Прорыв»">
        <span class="rko-brand__text">
          <strong>Русское Космическое Общество</strong>
          <small class="d-none d-lg-block">Будущее не определено — будущее определяет!</small>
        </span>
      </a>
      <div class="rko-header__actions ml-auto d-flex align-items-center">
        <a class="btn btn-link rko-header__link d-none d-lg-inline-flex" href="search.html">${ICON_SEARCH}<span class="ml-1 d-none d-xl-inline">Поиск</span><span class="sr-only d-xl-none">Поиск</span></a>
        <a class="btn btn-link rko-header__link d-none d-lg-inline-flex" href="login.html">Войти</a>
        <a class="btn btn-support rko-header__support" href="donate.html">Поддержать<span class="d-none d-sm-inline">&nbsp;РКО</span></a>
        <a class="btn btn-primary d-none d-md-inline-flex" href="register.html">Присоединиться</a>
        <button class="navbar-toggler rko-toggler d-lg-none" type="button" data-toggle="collapse" data-target="#rkoNav" aria-controls="rkoNav" aria-expanded="false" aria-label="Открыть меню"><span class="rko-toggler__bars" aria-hidden="true"></span><span class="rko-toggler__label d-none d-sm-inline">Меню</span></button>
      </div>
    </div>
  </div>
  <nav class="navbar navbar-expand-lg rko-nav" aria-label="Основные разделы">
    <div class="container">
      <div class="collapse navbar-collapse" id="rkoNav">
        <ul class="navbar-nav">
          ${MENU.map((m) => navItem(m, active)).join('\n          ')}
        </ul>
        <ul class="navbar-nav rko-nav__aside ml-lg-auto">
          <li class="nav-item"><a class="nav-link" href="article.html">О вступлении в РКО</a></li>
          <li class="nav-item"><a class="nav-link" href="article.html">Добровольцы</a></li>
          <li class="nav-item d-lg-none"><a class="nav-link" href="search.html">Поиск</a></li>
          <li class="nav-item d-lg-none"><a class="nav-link" href="login.html">Войти</a></li>
        </ul>
        <div class="rko-nav__buttons d-md-none">
          <a class="btn btn-support btn-block" href="donate.html">Поддержать РКО</a>
          <a class="btn btn-primary btn-block" href="register.html">Присоединиться</a>
        </div>
      </div>
    </div>
  </nav>
</header>`;
}

function crumbs(list) {
  if (!list?.length) return '';
  const items = [['Главная', 'index.html'], ...list];
  return `<nav class="rko-crumbs" aria-label="Хлебные крошки">
  <div class="container">
    <ol class="breadcrumb">
      ${items.map(([t, h], i) => i === items.length - 1
        ? `<li class="breadcrumb-item active" aria-current="page">${esc(clean(t))}</li>`
        : `<li class="breadcrumb-item"><a href="${h}">${esc(clean(t))}</a></li>`).join('\n      ')}
    </ol>
  </div>
</nav>`;
}

// Заголовок страницы. Надписи «Русское Космическое Общество» над H1 нет — замечание Павла.
export function pageHead(title, { lead = '', meta = '', tag = '' } = {}) {
  const t = clean(title);
  const size = t.length > 110 ? ' rko-h1--xlong' : t.length > 55 ? ' rko-h1--long' : '';
  return `<div class="rko-pagehead">
  <div class="container">
    <h1 class="rko-h1${size}">${esc(t)}</h1>
    ${tag ? `<p class="rko-pagehead__tag">${tag}</p>` : ''}
    ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
    ${meta ? `<div class="rko-pagehead__meta">${meta}</div>` : ''}
  </div>
</div>`;
}

function footer() {
  return `<footer class="rko-footer">
  <div class="container">
    <div class="row">
      <div class="col-lg-4 mb-4">
        <a class="rko-brand rko-brand--footer d-flex align-items-center" href="index.html">
          <span class="rko-brand__plate"><img class="rko-brand__mark" src="assets/img/rko-mark.svg" width="46" height="44" alt="Герб РКО «Прорыв»"></span>
          <span class="rko-brand__text"><strong>Русское Космическое Общество</strong><small>Человек. Земля. Космос.</small></span>
        </a>
        <address class="rko-footer__address">
          107023, г. Москва, ул. Кржижановского, 21А<br>
          <a href="tel:+79219967296">+7 921 996-72-96</a> · <a href="mailto:info@cosmatica.org">info@cosmatica.org</a>
        </address>
      </div>
      <div class="col-6 col-md-3 col-lg-2 mb-4">
        <h2 class="rko-footer__title">Общество</h2>
        <ul class="list-unstyled">
          <li><a href="about.html">Об обществе</a></li>
          <li><a href="direction.html">Органы управления</a></li>
          <li><a href="collegium.html">Высший Совет</a></li>
          <li><a href="departments.html">Отделения</a></li>
          <li><a href="users.html">Состав РКО</a></li>
        </ul>
      </div>
      <div class="col-6 col-md-3 col-lg-2 mb-4">
        <h2 class="rko-footer__title">Деятельность</h2>
        <ul class="list-unstyled">
          <li><a href="news.html">Новости</a></li>
          <li><a href="poster.html">Мероприятия</a></li>
          <li><a href="projects.html">Проекты</a></li>
          <li><a href="partners.html">Партнёры</a></li>
        </ul>
      </div>
      <div class="col-6 col-md-3 col-lg-2 mb-4">
        <h2 class="rko-footer__title">Знания</h2>
        <ul class="list-unstyled">
          <li><a href="articles.html">Материалы</a></li>
          <li><a href="library.html">Библиотека</a></li>
          <li><a href="articles-list.html">Глоссарий</a></li>
        </ul>
      </div>
      <div class="col-6 col-md-3 col-lg-2 mb-4">
        <h2 class="rko-footer__title">Участие</h2>
        <ul class="list-unstyled">
          <li><a href="article.html">О вступлении в РКО</a></li>
          <li><a href="article.html">Добровольцы</a></li>
          <li><a href="donate.html">Поддержать РКО</a></li>
          <li><a href="contacts.html">Контакты</a></li>
        </ul>
      </div>
    </div>
    <div class="rko-footer__bottom d-flex flex-column flex-md-row align-items-md-center">
      <span>Русское Космическое Общество © 2017–2026</span>
      <ul class="list-inline rko-footer__social ml-md-auto mb-0">
        <li class="list-inline-item"><a href="https://vk.com/cosmatica" target="_blank" rel="noopener noreferrer">ВКонтакте</a></li>
        <li class="list-inline-item"><a href="https://ok.ru/group/55464677015766" target="_blank" rel="noopener noreferrer">Одноклассники</a></li>
        <li class="list-inline-item"><a href="https://t.me/RKO_cosmatica" target="_blank" rel="noopener noreferrer">Telegram</a></li>
      </ul>
    </div>
  </div>
</footer>`;
}

export function page({ title, active = '', crumb = [], body, bodyClass = '' }) {
  return `${head(title)}
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
${header(active)}
${crumbs(crumb)}
<main id="main">
${body}
</main>
${footer()}
<script src="assets/vendor/jquery-3.5.1.slim.min.js"></script>
<script src="assets/vendor/bootstrap-4.6.2.bundle.min.js"></script>
<script src="assets/js/rko.js?v=__BUILD__"></script>
<script src="assets/js/rko-review.js?v=__BUILD__"></script>
</body>
</html>
`;
}

// ---------- Мелкие повторяющиеся элементы
export function pagination(current = 1, total = 8, label = 'Страницы') {
  const nums = [1, 2, 3, '…', total];
  return `<nav aria-label="${esc(label)}" class="rko-pagination">
  <ul class="pagination">
    <li class="page-item${current === 1 ? ' disabled' : ''}"><a class="page-link" href="#"${current === 1 ? ' tabindex="-1" aria-disabled="true"' : ''}>Назад</a></li>
    ${nums.map((n) => n === '…'
      ? '<li class="page-item disabled"><span class="page-link">…</span></li>'
      : `<li class="page-item${n === current ? ' active' : ''}"${n === current ? ' aria-current="page"' : ''}><a class="page-link" href="#">${n}</a></li>`).join('\n    ')}
    <li class="page-item"><a class="page-link" href="#">Вперёд</a></li>
  </ul>
</nav>`;
}

// Вкладки-ссылки (переходы между подстраницами раздела в CMS).
export function linkTabs(items, activeIndex = 0, label = 'Подразделы') {
  return `<ul class="nav nav-tabs rko-tabs" aria-label="${esc(label)}">
  ${items.map(([t, h, count], i) => `<li class="nav-item"><a class="nav-link${i === activeIndex ? ' active' : ''}" href="${h || '#'}"${i === activeIndex ? ' aria-current="page"' : ''}>${esc(t)}${count != null ? ` <span class="rko-tabs__count">${count}</span>` : ''}</a></li>`).join('\n  ')}
</ul>`;
}

// Вкладки с содержимым на одной странице (Bootstrap tab).
export function contentTabs(id, items) {
  return `<ul class="nav nav-tabs rko-tabs" id="${id}" role="tablist">
  ${items.map((it, i) => `<li class="nav-item" role="presentation"><a class="nav-link${i === 0 ? ' active' : ''}" id="${id}-${it.key}-tab" data-toggle="tab" href="#${id}-${it.key}" role="tab" aria-controls="${id}-${it.key}" aria-selected="${i === 0}">${esc(it.title)}${it.count != null ? ` <span class="rko-tabs__count">${it.count}</span>` : ''}</a></li>`).join('\n  ')}
</ul>
<div class="tab-content rko-tab-content">
  ${items.map((it, i) => `<div class="tab-pane fade${i === 0 ? ' show active' : ''}" id="${id}-${it.key}" role="tabpanel" aria-labelledby="${id}-${it.key}-tab">
${it.html}
  </div>`).join('\n  ')}
</div>`;
}

export const widget = (title, html, more) => `<section class="rko-widget">
  <h2 class="rko-widget__title">${esc(title)}</h2>
  ${html}
  ${more ? `<a class="rko-more" href="${more[1]}">${esc(more[0])}</a>` : ''}
</section>`;
