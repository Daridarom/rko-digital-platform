const ROUTES = window.COSMATICA_ROUTES || [];
const CONTENT = window.COSMATICA_CONTENT || {};
const query = new URLSearchParams(location.search);
const slug = query.get('p') || 'home';
const route = ROUTES.find((item) => item.slug === slug) || ROUTES[0];
const data = CONTENT[route.slug] || {};

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

const href = (target) => target === 'home' ? 'index.html' : 'view.html?p=' + encodeURIComponent(target);
const routeBySlug = (target) => ROUTES.find((item) => item.slug === target);

function header() {
  return `
    <header class="site-header">
      <div class="shell topline">
        <a class="brand" href="index.html">
          <span class="brand-emblem"><img src="assets/rko-mark.svg" alt="Герб РКО «Прорыв»"></span>
          <span>
            <strong>Русское космическое общество</strong>
            <small>Наука · культура · проекты · будущее</small>
          </span>
        </a>
        <div class="header-actions">
          <a class="icon-btn search-link" href="${href('search')}">⌕&nbsp; Поиск</a>
          <a class="text-login" href="${href('login')}">Войти</a>
          <a class="join-btn" href="${href('register')}">Присоединиться</a>
          <button class="icon-btn theme-btn" type="button" aria-label="Сменить тему">☾</button>
          <button class="icon-btn menu-btn" type="button">Меню</button>
        </div>
      </div>
      <nav class="shell main-nav">
        <a href="${href('about')}">Об обществе</a>
        <a href="${href('news')}">Новости</a>
        <a href="${href('departments')}">Отделения</a>
        <a href="${href('projects')}">Проекты</a>
        <a href="${href('articles')}">Материалы</a>
        <a href="${href('partners')}">Партнёры</a>
        <a href="${href('library')}">Библиотека</a>
      </nav>
      <div class="mobile-drawer shell">
        <a href="${href('about')}">Об обществе</a>
        <a href="${href('news')}">Новости</a>
        <a href="${href('departments')}">Отделения</a>
        <a href="${href('projects')}">Проекты</a>
        <a href="${href('articles')}">Материалы</a>
        <a href="${href('partners')}">Партнёры</a>
        <a href="${href('library')}">Библиотека</a>
        <a href="${href('poster')}">Мероприятия</a>
        <a href="${href('login')}">Войти</a>
        <a href="${href('register')}">Присоединиться</a>
      </div>
    </header>
  `;
}

function footer() {
  return `
    <footer class="footer">
      <div class="shell footer-grid">
        <div><b>Русское космическое общество</b><p>Человек. Земля. Космос.</p></div>
        <div><b>Общество</b><p><a href="${href('about')}">Об РКО</a></p><p><a href="${href('direction')}">Органы управления</a></p></div>
        <div><b>Деятельность</b><p><a href="${href('projects')}">Проекты</a></p><p><a href="${href('poster')}">Мероприятия</a></p></div>
        <div><b>Знания</b><p><a href="${href('articles')}">Материалы</a></p><p><a href="${href('library')}">Библиотека</a></p></div>
      </div>
    </footer>
  `;
}

function pageHero(kicker = 'Раздел') {
  const titleClass = route.title.length > 90 ? 'title-xxl' : route.title.length > 58 ? 'title-xl' : '';
  return `
    <div class="shell crumbs"><a href="index.html">Главная</a> → ${esc(route.name)}</div>
    <section class="shell page-hero ${titleClass}">
      <p class="eyebrow">${esc(kicker)}</p>
      <h1>${esc(route.title)}</h1>
      <p class="lede">${esc(route.intro)}</p>
    </section>
  `;
}

function sectionCards(cards, label = 'Материал') {
  const normalized = (cards || []).map((card) => typeof card === 'string' ? {title: card} : card);
  return `
    <div class="grid">
      ${normalized.map((card, index) => `
        <article class="card">
          <span class="tag">${esc(card.meta || card.status || label + ' ' + String(index + 1).padStart(2, '0'))}</span>
          <h3>${esc(card.title || card.name || '')}</h3>
          ${card.text || card.note || card.role ? `<p>${esc(card.text || card.note || card.role)}</p>` : ''}
        </article>
      `).join('')}
    </div>
  `;
}

function textSections(sections) {
  return (sections || []).map((section) => `
    <section class="article-section">
      <h2>${esc(section.title)}</h2>
      <p>${esc(section.body)}</p>
    </section>
  `).join('');
}

function filterTabs(filters) {
  return filters?.length ? `
    <div class="tabs">
      ${filters.map((item, index) => `<span class="tab ${index === 0 ? 'active' : ''}">${esc(item)}</span>`).join('')}
    </div>
  ` : '';
}

function renderHome() {
  const news = CONTENT.news?.cards?.slice(0, 3) || [];
  const projects = CONTENT.projects?.cards?.slice(0, 3) || [];
  return `
    <main id="main">
      <section class="shell home-hero">
        <div class="hero-copy">
          <p class="eyebrow">РУССКОЕ КОСМИЧЕСКОЕ ОБЩЕСТВО</p>
          <h1>Человек.<br>Земля.<br><span>Космос.</span></h1>
          <p class="lede">Пространство Русского космического общества для людей, знаний и проектов, которые соединяют научную мысль, культуру, образование и образ будущего.</p>
          <div class="hero-actions">
            <a class="primary" href="${href('about')}">Узнать о РКО</a>
            <a class="secondary" href="${href('projects')}">Смотреть проекты</a>
          </div>
        </div>
        <div class="hero-identity">
          <div class="hero-mark"><img src="assets/rko-mark.svg" alt="Герб РКО «Прорыв»"></div>
          <div class="identity-caption">
            <b>Прорыв к космическому будущему</b>
            <p>Официальная символика РКО используется без изменения композиции и пропорций.</p>
          </div>
        </div>
      </section>
      <section class="section soft">
        <div class="shell">
          <div class="section-head"><div><p class="eyebrow">СЕЙЧАС В РКО</p><h2>Главное на этой неделе</h2></div><a class="section-link" href="${href('news')}">Все новости →</a></div>
          ${sectionCards(news, 'Новости')}
        </div>
      </section>
      <section class="section">
        <div class="shell">
          <div class="section-head"><div><p class="eyebrow">ПРОЕКТЫ</p><h2>Живые инициативы</h2></div><a class="section-link" href="${href('projects')}">Все проекты →</a></div>
          ${sectionCards(projects, 'Проект')}
        </div>
      </section>
      <section class="section soft">
        <div class="shell">
          <div class="section-head"><div><p class="eyebrow">ЗНАНИЯ</p><h2>Материалы и библиотека</h2></div><p>Исследования, публикации, книги и образовательные материалы.</p></div>
          <div class="grid two">
            <a class="card" href="${href('articles')}"><span class="tag">Материалы</span><h3>Публикации и исследования</h3><p>Научные, общественные и образовательные направления.</p></a>
            <a class="card" href="${href('library')}"><span class="tag">Библиотека</span><h3>Книги и наследие</h3><p>Русский космизм, космонавтика, методические материалы.</p></a>
          </div>
        </div>
      </section>
    </main>
  `;
}

function renderList() {
  const cards = data.cards || route.items.map((title) => ({title: title.replace(/\s+#.*/, '')}));
  return `<main id="main">${pageHero('Материалы')}<section class="section"><div class="shell">${filterTabs(data.filters)}${sectionCards(cards)}</div></section></main>`;
}

function renderArticle() {
  const facts = data.facts || [];
  const lists = [
    data.books?.length ? {title: 'Издания', items: data.books} : null,
    data.program?.length ? {title: 'Программа', items: data.program} : null,
    data.audience?.length ? {title: 'Кто участвует', items: data.audience} : null,
    data.departments?.length ? {title: 'Структура', items: data.departments} : null
  ].filter(Boolean);

  return `
    <main id="main">
      ${pageHero(route.slug === 'poster-item' ? 'Мероприятие' : route.slug === 'partner' ? 'Партнёр' : route.slug === 'collegium-item' ? 'Совет РКО' : 'Материал')}
      <section class="section detail-intro">
        <div class="shell">
          ${facts.length ? `
            <div class="fact-grid">
              ${facts.map((fact) => `
                <article class="fact-card">
                  <span>${esc(fact.label)}</span>
                  <b>${esc(fact.value)}</b>
                </article>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </section>
      <div class="shell article-layout">
        <article class="article">
          ${textSections(data.sections || [{title: 'Содержание', body: route.intro}])}

          ${lists.map((list) => `
            <section class="article-section">
              <h2>${esc(list.title)}</h2>
              <ul class="detail-list detail-list-wide">
                ${list.items.map((item) => `<li>${esc(item)}</li>`).join('')}
              </ul>
            </section>
          `).join('')}

          ${data.contacts ? `
            <section class="article-section">
              <h2>Контакты</h2>
              <div class="contact-inline">
                <b>${esc(data.contacts.name || '')}</b>
                ${data.contacts.email ? `<span>${esc(data.contacts.email)}</span>` : ''}
                ${data.contacts.phone ? `<span>${esc(data.contacts.phone)}</span>` : ''}
              </div>
            </section>
          ` : ''}

          ${data.links?.length ? `
            <section class="article-section">
              <h2>Ссылки</h2>
              <div class="hero-actions">
                ${data.links.map((item) => `<a class="secondary" href="${esc(item.url)}">${esc(item.label)}</a>`).join('')}
              </div>
            </section>
          ` : ''}
        </article>
        <aside class="side-card">
          <h3>Связано</h3>
          <a href="${href('projects')}">Проекты</a>
          <a href="${href('articles-list')}">Публикации</a>
          <a href="${href('library')}">Библиотека</a>
          <a href="${href('users')}">Участники</a>
        </aside>
      </div>
    </main>
  `;
}

function renderEvents() {
  const events = data.events || [];
  return `
    <main id="main">
      ${pageHero('Календарь')}
      <section class="section"><div class="shell">
        ${filterTabs(data.filters)}
        <div class="event-list">
          ${events.map((event) => `
            <article class="event-row">
              <div class="event-date"><strong>${esc(event.date.split(' ')[0])}</strong><span>${esc(event.date.split(' ').slice(1).join(' '))}</span></div>
              <div><h3>${esc(event.title)}</h3><p>${esc(event.text)}</p></div>
              <a class="secondary" href="${href('poster-item')}">Подробнее</a>
            </article>
          `).join('')}
        </div>
      </div></section>
    </main>
  `;
}

function renderCalendar() {
  const eventDays = new Set([8, 18, 24]);
  const days = Array.from({length: 35}, (_, index) => index + 1);
  return `
    <main id="main">
      ${pageHero('Календарь')}
      <section class="section"><div class="shell">
        <div class="calendar-legend">${(data.legend || []).map((item) => `<span>${esc(item)}</span>`).join('')}</div>
        <div class="calendar-grid">
          ${days.map((day) => `<div class="day ${eventDays.has(day) ? 'event' : ''}"><b>${day}</b>${eventDays.has(day) ? '<small>Событие РКО</small>' : ''}</div>`).join('')}
        </div>
      </div></section>
    </main>
  `;
}

function renderDirection() {
  const groups = data.groups || [];
  return `
    <main id="main">
      ${pageHero('Структура РКО')}
      <section class="section"><div class="shell direction-groups">
        ${groups.map((group) => `
          <section class="direction-group">
            <div class="section-head"><h2>${esc(group.title)}</h2></div>
            <div class="grid">
              ${group.people.map((person) => `
                <article class="card">
                  <span class="tag">${esc(person.role)}</span>
                  <h3>${esc(person.name)}</h3>
                  <p>${esc(person.note)}</p>
                </article>
              `).join('')}
            </div>
          </section>
        `).join('')}
      </div></section>
    </main>
  `;
}

function renderDirectory() {
  return `<main id="main">${pageHero('Структура')}<section class="section"><div class="shell">${sectionCards(data.cards || route.items)}</div></section></main>`;
}

function renderContacts() {
  return `
    <main id="main">${pageHero('Связь')}
      <section class="section"><div class="shell grid">
        ${(data.contacts || []).map((item) => `<article class="card"><span class="tag">${esc(item.label)}</span><h3>${esc(item.value)}</h3></article>`).join('')}
      </div></section>
    </main>
  `;
}

function renderDepartments() {
  const alphabet = [...'АБВГДЕЖЗИКЛМНОПРСТУХЧЯ'];
  return `
    <main id="main">${pageHero('Территории')}
      <section class="section"><div class="shell">
        <div class="alphabet">${alphabet.map((letter) => `<button>${letter}</button>`).join('')}</div>
        ${sectionCards((data.regions || []).map((region) => ({title: region, text: 'Команда · проекты · события · контакты'})), 'Отделение')}
      </div></section>
    </main>
  `;
}

function renderDepartment() {
  const stats = Object.entries(data.stats || {});
  return `
    <main id="main">${pageHero('Региональное отделение')}
      <section class="section"><div class="shell project-layout">
        <aside class="project-side">
          <p class="eyebrow">МОСКВА</p>
          <div class="metric"><b>Создано</b><br><small>${esc(data.created)}</small></div>
          <div class="metric"><b>Телефон</b><br><small>${esc(data.phone)}</small></div>
          <div class="metric"><b>E-mail</b><br><small>${esc(data.email)}</small></div>
        </aside>
        <div class="article">
          <h2>Московское региональное отделение</h2>
          <p>Адрес: ${esc(data.address)}</p>
          <div class="grid two">
            ${stats.map(([label, value]) => `<article class="card"><span class="tag">${esc(label)}</span><h3>${esc(value)}</h3><p>Перейти в раздел отделения.</p></article>`).join('')}
          </div>
        </div>
      </div></section>
    </main>
  `;
}

function renderProjects() {
  return `
    <main id="main">${pageHero('Проекты РКО')}
      <section class="section"><div class="shell">
        ${filterTabs(data.filters)}
        <div class="grid">
          ${(data.cards || []).map((project, index) => `
            <article class="card project-card">
              <span class="tag">${esc(project.status)}</span>
              <h3>${esc(project.title)}</h3>
              <p>${esc(project.text)}</p>
              <a class="card-link" href="${index === 0 ? href('project') : '#'}">Подробнее →</a>
            </article>
          `).join('')}
        </div>
      </div></section>
    </main>
  `;
}

function renderProject() {
  const project = data.project || {};
  const fundraising = project.fundraising || {};
  return `
    <main id="main">
      ${pageHero('Проект РКО')}
      <section class="section project-overview">
        <div class="shell project-hero-grid">
          <div class="project-media">
            ${project.image ? `<img src="${esc(project.image)}" alt="${esc(project.name)}">` : ''}
          </div>
          <div class="project-summary">
            <p class="eyebrow">${esc(project.status)}</p>
            <h2>${esc(project.name)}</h2>
            <p class="lede project-lede">${esc(project.mission)}</p>
            <div class="project-stats">
              ${Object.entries(project.stats || {}).map(([label, value]) => `<div><b>${esc(value)}</b><span>${esc(label)}</span></div>`).join('')}
            </div>
          </div>
        </div>
      </section>

      <section class="section soft">
        <div class="shell project-layout">
          <aside class="project-side">
            <p class="eyebrow">ПРОЕКТ</p>
            <div class="metric"><b>Статус</b><br><small>${esc(project.status)}</small></div>
            ${Object.entries(project.stats || {}).map(([label, value]) => `<div class="metric"><b>${esc(label)}</b><br><small>${esc(value)}</small></div>`).join('')}
            ${fundraising.enabled ? `
              <div class="support-mini">
                <b>${esc(fundraising.label)}</b>
                <p>${esc(fundraising.note)}</p>
                <input class="support-input" type="number" min="1" placeholder="Сумма, ₽">
                <button class="primary" type="button">Поддержать</button>
              </div>
            ` : ''}
          </aside>
          <div>
            <div class="tabs">${(project.tabs || []).map((tab, index) => `<span class="tab ${index === 0 ? 'active' : ''}">${esc(tab)}</span>`).join('')}</div>
            <article class="article">
              <h2>Смысл проекта</h2>
              <p>${esc(project.mission)}</p>
              <h2>Цель</h2>
              <p>${esc(project.goal)}</p>
              ${textSections(project.sections)}
            </article>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="shell">
          <div class="section-head"><div><p class="eyebrow">УЧАСТИЕ</p><h2>Для кого и как участвовать</h2></div></div>
          <div class="grid three-detail">
            <article class="card"><span class="tag">Аудитории</span><h3>Кому подходит</h3><ul class="detail-list">${(project.audiences || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul></article>
            <article class="card"><span class="tag">Наука</span><h3>Направления</h3><ul class="detail-list">${(project.science || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul></article>
            <article class="card"><span class="tag">Форматы</span><h3>Как включиться</h3><ul class="detail-list">${(project.participation || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul></article>
          </div>
        </div>
      </section>

      <section class="section soft">
        <div class="shell">
          <div class="section-head"><div><p class="eyebrow">МАТЕРИАЛЫ</p><h2>Документы и внешние площадки</h2></div></div>
          <div class="grid two">
            ${(project.documents || []).map((doc) => `<article class="card"><span class="tag">${esc(doc.type)}</span><h3>${esc(doc.label)}</h3><p>Документ проекта.</p></article>`).join('')}
            ${(project.links || []).map((item) => `<a class="card" href="${esc(item.url)}"><span class="tag">Ссылка</span><h3>${esc(item.label)}</h3><p>Открыть внешнюю площадку проекта.</p></a>`).join('')}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="shell">
          <div class="section-head"><div><p class="eyebrow">СВЯЗАНО</p><h2>Новости и мероприятия проекта</h2></div></div>
          <div class="grid two">
            <a class="card" href="${href('news')}"><span class="tag">Новости · ${esc(project.stats?.Новости || 0)}</span><h3>Новости проекта</h3><p>Хроника, результаты и обновления.</p></a>
            <a class="card" href="${href('poster')}"><span class="tag">Мероприятия · ${esc(project.stats?.Мероприятия || 0)}</span><h3>События проекта</h3><p>Ближайшие и прошедшие мероприятия.</p></a>
          </div>
        </div>
      </section>
    </main>
  `;
}

function renderPeople() {
  return `
    <main id="main">${pageHero('Люди РКО')}
      <section class="section"><div class="shell">
        ${filterTabs(data.filters)}
        <div class="people-grid">
          ${(data.people || []).map((person) => `<article class="person"><div class="avatar"></div><b>${esc(person)}</b><small>Участник РКО</small></article>`).join('')}
        </div>
      </div></section>
    </main>
  `;
}

function renderProfile() {
  return `
    <main id="main">${pageHero('Профиль участника')}
      <section class="section"><div class="shell project-layout">
        <aside class="profile-photo-card">
          <img src="${esc(data.image)}" alt="${esc(route.title)}">
          <b>${esc(route.title)}</b><small>Участник РКО</small>
        </aside>
        <div class="article">
          ${textSections(data.sections)}
          <div class="grid two">
            <article class="card"><span class="tag">Проекты</span><h3>${esc(data.projectCount)}</h3><p>Связанные проекты и инициативы.</p></article>
            <article class="card"><span class="tag">Данные</span><h3>Профиль участника</h3><p>Биографические сведения публикуются только при наличии подтверждённых данных.</p></article>
          </div>
        </div>
      </div></section>
    </main>
  `;
}

function renderCategories() {
  return `<main id="main">${pageHero('Материалы')}<section class="section"><div class="shell">${sectionCards((data.categories || []).map((title) => ({title})), 'Категория')}</div></section></main>`;
}

function renderLibrary() {
  return `<main id="main">${pageHero('Библиотека РКО')}<section class="section"><div class="shell">${sectionCards((data.books || []).map((title) => ({title})), 'Книга')}</div></section></main>`;
}

function renderBook() {
  return `
    <main id="main">${pageHero('Библиотека')}
      <section class="section"><div class="shell book-layout">
        <div class="real-book-cover"><img src="${esc(data.image)}" alt="Обложка книги"></div>
        <div class="article">
          <p class="eyebrow">${esc(data.authors)}</p>
          <h2>О книге</h2>
          <p>${esc(data.description)}</p>
          <div class="hero-actions">
            <a class="primary" href="https://cosmatica.org/library/498-filosofskie-voprosy-sovremennogo-estestvoznanija-sinergetiki-i-ustoichivogo-razvitija.html">Скачать · ${esc(data.fileSize)}</a>
            <a class="secondary" href="${href('library')}">К библиотеке</a>
          </div>
        </div>
      </div></section>
    </main>
  `;
}

function renderTabs() {
  return `
    <main id="main">${pageHero('Первый Отряд')}
      <section class="section"><div class="shell">
        <div class="tabs">${(data.tabs || []).map((tab, index) => `<span class="tab ${index === 0 ? 'active' : ''}">${esc(tab.name)}${tab.count ? ' · ' + esc(tab.count) : ''}</span>`).join('')}</div>
        <article class="article">${textSections(data.sections)}</article>
      </div></section>
    </main>
  `;
}

function renderDonate() {
  return `
    <main id="main">${pageHero('Поддержка')}
      <section class="section"><div class="shell">
        <div class="article donate-intro"><p>${esc(data.lead)}</p></div>
        <div class="support-grid">
          ${(data.options || []).map((option, index) => `<article class="support-card"><p class="eyebrow">0${index + 1}</p><h3>${esc(option.title)}</h3><p>${esc(option.text)}</p></article>`).join('')}
        </div>
        <div class="amounts"><button>1 000 ₽</button><button>3 000 ₽</button><button>5 000 ₽</button><button>Другая сумма</button></div>
        <a class="primary" href="#">Поддержать</a>
      </div></section>
    </main>
  `;
}

function renderAuth() {
  const labels = data.fields || [];
  const action = data.actions?.[0] || 'Продолжить';
  return `
    <main id="main"><div class="auth-wrap shell">
      <section class="auth-card">
        <p class="eyebrow">ЛИЧНЫЙ КАБИНЕТ</p>
        <h1 class="auth-title">${esc(route.title)}</h1>
        <p class="lede auth-lede">${esc(route.intro)}</p>
        <form class="form">
          ${labels.map((label) => `<div class="field"><label>${esc(label)}</label><input ${/парол/i.test(label) ? 'type="password"' : ''}></div>`).join('')}
          <button class="primary" type="button">${esc(action)}</button>
        </form>
        ${data.actions?.slice(1).length ? `<div class="auth-links">${data.actions.slice(1).map((item) => `<a href="#">${esc(item)}</a>`).join('')}</div>` : ''}
      </section>
    </div></main>
  `;
}

function renderSearch() {
  const isResults = route.type === 'search-results';
  return `
    <main id="main">${pageHero('Поиск')}
      <section class="section search-section"><div class="shell">
        <form class="search-box" id="searchForm">
          <input id="searchInput" value="${isResults ? esc(data.query) : ''}" placeholder="${esc((CONTENT.search || {}).placeholder || 'Что найти?')}">
          <button class="primary" type="submit">Найти</button>
        </form>
        ${isResults ? sectionCards(data.results || [], 'Результат') : `
          <div class="empty-state">
            <p>Введите слово или фразу, чтобы найти материалы, проекты, людей и события.</p>
            <div class="search-hints">${((CONTENT.search || {}).hints || []).map((item) => `<span>${esc(item)}</span>`).join('')}</div>
          </div>
        `}
      </div></section>
    </main>
  `;
}

let main;
switch (route.slug) {
  case 'home': main = renderHome(); break;
  case 'news': case 'about-info': case 'articles-list': main = renderList(); break;
  case 'news-item': case 'poster-item': case 'about': case 'collegium-item': case 'partner': case 'article': main = renderArticle(); break;
  case 'poster': main = renderEvents(); break;
  case 'calendar': main = renderCalendar(); break;
  case 'direction': main = renderDirection(); break;
  case 'collegium': case 'partners': main = renderDirectory(); break;
  case 'contacts': main = renderContacts(); break;
  case 'departments': main = renderDepartments(); break;
  case 'department': main = renderDepartment(); break;
  case 'projects': main = renderProjects(); break;
  case 'project': main = renderProject(); break;
  case 'users': main = renderPeople(); break;
  case 'profile': main = renderProfile(); break;
  case 'articles': main = renderCategories(); break;
  case 'library': main = renderLibrary(); break;
  case 'book': main = renderBook(); break;
  case 'tabs': main = renderTabs(); break;
  case 'donate': main = renderDonate(); break;
  case 'login': case 'restore': case 'register': main = renderAuth(); break;
  case 'search': case 'search-results': main = renderSearch(); break;
  default: main = renderList();
}

document.title = route.title + ' — Русское космическое общество';
document.querySelector('#site').innerHTML = header() + main + footer();

if (localStorage.getItem('rko-theme') === 'dark') document.body.classList.add('dark');
document.querySelector('.theme-btn')?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('rko-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});
document.querySelector('.menu-btn')?.addEventListener('click', () => document.querySelector('.mobile-drawer')?.classList.toggle('open'));
document.querySelector('#searchForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = document.querySelector('#searchInput')?.value.trim();
  location.href = value ? href('search-results') : href('search');
});