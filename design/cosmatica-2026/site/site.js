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
  const chosen = route.slug === 'project' ? data.variants?.[query.get('id') || 'gagarincy'] : null;
  let shownTitle = chosen?.name || route.title;
  const shownIntro = chosen?.fullName || route.intro;
  if(route.slug==='search-results'){const term=(query.get('q') || 'РКО').trim();if(term)shownTitle='Поиск: '+term;}
  const titleClass = shownTitle.length > 90 ? 'title-xxl' : shownTitle.length > 58 ? 'title-xl' : '';
  return `
    <div class="shell crumbs"><a href="index.html">Главная</a> → ${esc(route.name)}</div>
    <section class="shell page-hero ${titleClass}">
      <p class="eyebrow">${esc(kicker)}</p>
      <h1>${esc(shownTitle)}</h1>
      <p class="lede">${esc(shownIntro)}</p>
    </section>
  `;
}

function sectionCards(cards, label = 'Материал') {
  const normalized = (cards || []).map((card) => typeof card === 'string' ? {title: card} : card);
  return `
    <div class="grid">
      ${normalized.map((card, index) => `
        ${card.url ? `<a class="card" href="${esc(card.url)}"${/^https?:\/\//.test(card.url) ? ' target="_blank" rel="noopener noreferrer"' : ''}>` : '<article class="card">'}
          <span class="tag">${esc(card.meta || card.status || label + ' ' + String(index + 1).padStart(2, '0'))}</span>
          <h3>${esc(card.title || card.name || '')}</h3>
          ${card.text || card.note || card.role ? `<p>${esc(card.text || card.note || card.role)}</p>` : ''}
        ${card.url ? '</a>' : '</article>'}
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

function filterTabs(filters){
 if(!filters?.length)return '';
 return `<div class="tabs" role="group" aria-label="Фильтры">
    ${filters.map((item,index)=>`<button class="tab ${index===0?'active':''}" type="button" data-filter="${esc(item)}" aria-pressed="${index===0?'true':'false'}">${esc(item)}</button>`).join('')}
 </div>`;
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

function renderEvents(){
  const monthNames=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  return `<main id="main">
    ${pageHero('Календарь')}
    <section class="section"><div class="shell">
      <div class="event-list">
        ${(data.events || []).map(event=>{
          const [day,month]=event.date.split('.');
          const url=event.url || href('poster-item');
          return `<article class="event-row">
            <div class="event-date"><strong>${esc(day)}</strong><span>${esc(monthNames[Number(month)-1] || '')}</span></div>
            <div><h3>${esc(event.title)}</h3><p>${esc(event.text)} · ${esc(event.date)}</p></div>
            <a class="secondary" href="${esc(url)}"${/^https?:\/\//.test(url)?' target="_blank" rel="noopener noreferrer"':''}>Подробнее</a>
          </article>`;
        }).join('')}
      </div>
    </div></section></main>`;
}

function renderCalendar(){
  const monthNames=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const selected=/^\d{4}-\d{2}$/.test(query.get('month') || '')?query.get('month'):(data.month || '2026-10');
  const [year,month]=selected.split('-').map(Number);
  const start=new Date(year,month-1,1);
  const offset=(start.getDay()+6)%7;
  const numberDays=new Date(year,month,0).getDate();
  const prev=new Date(year,month-2,1);
  const next=new Date(year,month,1);
  const ym=(d)=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  const realEvents=(data.events || []);
  const days=Array.from({length:offset+numberDays},(_,i)=>{
    const day=i-offset+1;
    if(day<1) return '<div class="day blank" aria-hidden="true"></div>';
    const iso=selected+'-'+String(day).padStart(2,'0');
    const todays=realEvents.filter(e=>e.dateISO===iso);
    return `<div class="day ${todays.length?'event':''}">
      <b>${day}</b>
      ${todays.map(e=>`<a href="${esc(e.url)}">${esc(e.title)}</a>`).join('')}
    </div>`;
  }).join('');
  return `<main id="main">${pageHero('Календарь')}
    <section class="section"><div class="shell">
      <div class="calendar-toolbar">
        <a class="secondary" href="${href('calendar')+'&month='+ym(prev)}" aria-label="Предыдущий месяц">←</a>
        <h2>${monthNames[month-1]} ${year}</h2>
        <a class="secondary" href="${href('calendar')+'&month='+ym(next)}" aria-label="Следующий месяц">→</a>
      </div>
      <div class="calendar-weekdays">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=>`<span>${d}</span>`).join('')}</div>
      <div class="calendar-grid">${days}</div>
      ${!realEvents.some(e=>e.dateISO.startsWith(selected)) ? '<p class="calendar-note">В текущем перечне РКО на этот месяц события не указаны.</p>':''}
      <p class="calendar-note"><a href="${href('poster')}">Все мероприятия РКО →</a></p>
    </div></section></main>`;
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
        ${sectionCards((data.regions || []).map((region,index) => ({title: region, text: 'Команда · проекты · события · контакты', url: data.links?.[index]})), 'Отделение')}
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
            <article class="card project-card" data-status="${esc(project.status)}">
              <span class="tag">${esc(project.status)}</span>
              <h3>${esc(project.title)}</h3>
              <p>${esc(project.text)}</p>
              <a class="card-link" href="${project.id ? href('project') + '&id=' + encodeURIComponent(project.id) : esc(project.sourceUrl || 'https://cosmatica.org/projects')}">Подробнее →</a>
            </article>
          `).join('')}
        </div>
      </div></section>
    </main>
  `;
}

function renderProject() {
  const project = data.variants?.[query.get('id') || 'gagarincy'] || data.variants?.gagarincy || {};
  const money = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
  const fundraising = project.fundraising || {};
  return `
    <main id="main">
      ${pageHero('Проект РКО')}
      <section class="section project-overview">
        <div class="shell project-hero-grid ${project.image ? '' : 'no-media'}">
          ${project.image ? `<div class="project-media"><img src="${esc(project.image)}" alt="${esc(project.name)}"></div>` : ''}
          <div class="project-summary">
            <p class="eyebrow">${esc(project.status)}</p>
            <h2>О проекте</h2>
            <p class="lede project-lede">${esc(project.mission)}</p>
            <p class="project-source"><a href="${esc(project.sourceUrl)}" target="_blank" rel="noopener noreferrer">Оригинальная страница проекта ↗</a></p>
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
                ${fundraising.raised != null && fundraising.target != null ? `<div class="fundraising-summary"><strong>${money(fundraising.raised)}</strong> из ${money(fundraising.target)}<small>Показатели исходной страницы на момент сбора данных. Актуальная сумма — на сайте проекта.</small></div>` : ""}
                <a class="primary" href="${esc(fundraising.actionUrl || project.sourceUrl)}" target="_blank" rel="noopener noreferrer">Поддержать на сайте РКО ↗</a>
              </div>
            ` : ''}
          </aside>
          <div>
            <nav class="tabs" aria-label="Разделы проекта">${(project.tabs || []).map((tab, index) => `<a class="tab ${index === 0 ? 'active' : ''}" href="${/новост|меропр/i.test(tab) ? '#project-activity' : /материал|полож|площад/i.test(tab) ? '#project-materials' : /участ|сотруднич|поддерж/i.test(tab) ? '#project-participation' : '#project-about'}">${esc(tab)}</a>`).join('')}</nav>
            <article class="article" id="project-about">
              <h2>Смысл проекта</h2>
              <p>${esc(project.mission)}</p>
              <h2>Цель</h2>
              <p>${esc(project.goal)}</p>
              ${textSections(project.sections)}
            </article>
          </div>
        </div>
      </section>

      <section class="section" id="project-participation">
        <div class="shell">
          <div class="section-head"><div><p class="eyebrow">УЧАСТИЕ</p><h2>Для кого и как участвовать</h2></div></div>
          <div class="grid three-detail">
            <article class="card"><span class="tag">Аудитории</span><h3>Кому подходит</h3><ul class="detail-list">${(project.audiences || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul></article>
            <article class="card"><span class="tag">Тематика</span><h3>Направления</h3><ul class="detail-list">${(project.science || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul></article>
            <article class="card"><span class="tag">Форматы</span><h3>Как включиться</h3><ul class="detail-list">${(project.participation || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul></article>
          </div>
        </div>
      </section>

      <section class="section soft" id="project-materials">
        <div class="shell">
          <div class="section-head"><div><p class="eyebrow">МАТЕРИАЛЫ</p><h2>Документы и внешние площадки</h2></div></div>
          <div class="grid two">
            ${(project.documents || []).map((doc) => `<a class="card" href="${esc(doc.url || project.sourceUrl)}" target="_blank" rel="noopener noreferrer"><span class="tag">${esc(doc.type)}</span><h3>${esc(doc.label)}</h3><p>Открыть документ ↗</p></a>`).join('')}
            ${(project.links || []).map((item) => `<a class="card" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer"><span class="tag">Ссылка</span><h3>${esc(item.label)}</h3><p>Открыть внешнюю площадку проекта.</p></a>`).join('')}
          </div>
        </div>
      </section>

      <section class="section" id="project-activity">
        <div class="shell">
          <div class="section-head"><div><p class="eyebrow">СВЯЗАНО</p><h2>Новости и мероприятия проекта</h2></div></div>
          <div class="grid two">
            <a class="card" href="${esc(project.newsUrl || project.sourceUrl)}" target="_blank" rel="noopener noreferrer"><span class="tag">Новости ${project.stats?.Новости ? '· ' + esc(project.stats.Новости) : ''} </span><h3>Новости проекта</h3><p>Хроника, результаты и обновления.</p></a>
            <a class="card" href="${esc(project.eventsUrl || project.sourceUrl)}" target="_blank" rel="noopener noreferrer"><span class="tag">Мероприятия ${project.stats?.Мероприятия ? '· ' + esc(project.stats.Мероприятия) : ''} </span><h3>События проекта</h3><p>Ближайшие и прошедшие мероприятия.</p></a>
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
          ${(data.people || []).map((person) => `<a class="person" href="${person===data.people?.[0] ? href('profile') : 'https://cosmatica.org/users'}"><div class="avatar"></div><b>${esc(person)}</b><small>Участник РКО</small></a>`).join('')}
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
  return `<main id="main">${pageHero('Материалы')}<section class="section"><div class="shell">${sectionCards((data.categories || []).map((title,index) => ({title, url: index===1 ? href('articles-list') : 'https://cosmatica.org'+(data.categoryLinks?.[index] || '/articles')})), 'Категория')}</div></section></main>`;
}

function renderLibrary() {
  return `<main id="main">${pageHero('Библиотека РКО')}<section class="section"><div class="shell">${sectionCards((data.books || []).map((title,index) => ({title, url: data.links?.[index] || 'https://cosmatica.org/library'})), 'Книга')}</div></section></main>`;
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
            <a class="primary" href="https://cosmatica.org/library/498-filosofskie-voprosy-sovremennogo-estestvoznanija-sinergetiki-i-ustoichivogo-razvitija.html" target="_blank" rel="noopener noreferrer">Читать и скачать на сайте РКО ↗</a>
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
        
        <a class="primary" href="https://cosmatica.org/projects/donate_rko" target="_blank" rel="noopener noreferrer">Поддержать на сайте РКО ↗</a>
      </div></section>
    </main>
  `;
}

function renderAuth(){
 const labels=data.fields || [];
 const action=data.actions?.[0] || 'Продолжить';
 const sourceUrl='https://cosmatica.org/auth/'+(route.slug==='register'?'register':route.slug==='restore'?'restore':'login');
 return `<main id="main"><div class="auth-wrap shell">
   <section class="auth-card">
     <p class="eyebrow">ЛИЧНЫЙ КАБИНЕТ</p>
     <h1 class="auth-title">${esc(route.title)}</h1>
     <p class="lede auth-lede">${esc(route.intro)}</p>
     <div class="form" aria-label="Поля для входа в личный кабинет">
       ${labels.map(label=>`<div class="field">
         <label>${esc(label)}</label>
         <input type="${/парол/i.test(label)?'password':'text'}" disabled placeholder="${esc(label)}">
       </div>`).join('')}
       <a class="primary" href="${esc(sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(action)} на сайте РКО ↗</a>
     </div>
     <p class="form-note">Вход, восстановление доступа и регистрация выполняются на действующем сайте РКО. </p>
     <div class="auth-links">
       <a href="${href('login')}">Вход</a>
       <a href="${href('restore')}">Восстановление пароля</a>
       <a href="${href('register')}">Регистрация</a>
     </div>
   </section>
 </div></main>`;
}

function renderSearch(){
 const resultsMode=route.type==='search-results';
 const term=String(query.get('q') || (resultsMode?'РКО':'')).trim();
 const index=[];
 const add=(title,url,kind,description)=>index.push({title,url,kind,description});
 ROUTES.forEach(x=>add(x.title,href(x.slug),x.name,x.intro));
 (CONTENT.news?.cards || []).forEach(x=>add(x.title,x.url || href('news'),'Новость',x.text || ''));
 (CONTENT.projects?.cards || []).forEach(x=>add(x.title,x.id?href('project')+'&id='+encodeURIComponent(x.id):x.sourceUrl || href('projects'),'Проект',x.text || ''));
 (CONTENT.library?.books || []).forEach((title,i)=>add(title,CONTENT.library?.links?.[i] || href('library'),'Книга','Библиотека РКО'));
 const filtered=term?index.filter(x=>[x.title,x.kind,x.description].some(v=>String(v).toLocaleLowerCase('ru').includes(term.toLocaleLowerCase('ru')))).slice(0,35):[];
 const rows=filtered.map(x=>`<a class="card" href="${esc(x.url)}"><span class="tag">${esc(x.kind)}</span><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p></a>`).join('');
 return `<main id="main">${pageHero('Поиск')}
  <section class="section search-section"><div class="shell">
    <form class="search-box" id="searchForm" role="search">
      <input id="searchInput" name="q" value="${esc(term)}" placeholder="${esc(CONTENT.search?.placeholder || 'Что найти?')}" aria-label="Поиск по сайту">
      <button class="primary" type="submit">Найти</button>
    </form>
    ${resultsMode ? `<h2 class="search-heading">${term ? 'Результаты поиска' : 'Введите поисковый запрос'}</h2>
      ${filtered.length ? `<div class="grid">${rows}</div>` : '<p class="empty-state">По запросу в представленных материалах ничего не найдено. Попробуйте другую формулировку.</p>'}
    ` : `<div class="empty-state"><p>Введите слово или фразу, чтобы найти материалы, проекты, людей и события.</p>
      <div class="search-hints">${(CONTENT.search?.hints || []).map(x=>`<a href="${href('search-results')+'&q='+encodeURIComponent(x)}">${esc(x)}</a>`).join('')}</div>
    </div>`}
  </div></section>
 </main>`;
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
document.querySelectorAll('.tabs [data-filter]').forEach(button=>button.addEventListener('click',()=>{
 const filter=button.getAttribute('data-filter');
 const all=[...document.querySelectorAll('.tabs [data-filter]')];
 all.forEach(b=>{const on=b===button;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
 const cards=[...document.querySelectorAll('.project-card')];
 if(cards.length){
  let visible=0;
  cards.forEach(card=>{
   const status=card.getAttribute('data-status') || '';
   const show=filter==='Актуальные'||filter==='Все'||(filter==='Действующие'&&/действующ/i.test(status))||(filter==='Ждут поддержки'&&/сбор/i.test(status))||(filter==='Стратегические'&&/стратег/i.test(status))||(filter==='Реализованные'&&/реализован/i.test(status))||(filter==='Перспективные'&&/перспектив/i.test(status));
   card.hidden=!show;if(show)visible++;
  });
  let empty=document.getElementById('filter-empty');
  if(!empty){empty=document.createElement('p');empty.id='filter-empty';empty.className='filter-empty';document.querySelector('.project-card')?.parentNode.after(empty);}
  empty.textContent=visible?'':'В этой категории сейчас нет представленных проектов.';
 }
}));
document.querySelector('.menu-btn')?.addEventListener('click', () => document.querySelector('.mobile-drawer')?.classList.toggle('open'));
document.querySelector('#searchForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = document.querySelector('#searchInput')?.value.trim();
  location.href = value ? href('search-results') + '&q=' + encodeURIComponent(value) : href('search');
});