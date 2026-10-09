// Поддержка, вход и регистрация, поиск.
import { esc, clean, source, renderBlocks, linked, rub } from './core.mjs';
import { pageHead } from './layout.mjs';
import * as D from './data.mjs';
import { projectCard, sectionHead, short, plural } from './parts.mjs';

const DEMO_NOTE = '<p class="rko-demo-note">Это макет: данные никуда не отправляются.</p>';

// ---------------------------------------------------------------- 27 Поддержать РКО
export function donate() {
  const data = source('donate');
  const [motto1, motto2, ...text] = data.blocks;
  const need = D.projects.filter((p) => p.support && p.status !== 'Завершённый');
  const volunteers = linked('https://cosmatica.org/articles/1190-priglashaem-dobrovolcev-v-russkoe-kosmicheskoe-obschestvo.html');
  const volunteerText = clean((volunteers?.blocks || []).find((b) => b.type === 'paragraph' && b.text.startsWith('У нас множество'))?.text || 'Любой человек может быть полезен в Общем Деле.');
  const body = `${pageHead('Поддержать РКО', { lead: `${clean(motto1.text)} ${clean(motto2.text)}` })}
<div class="container rko-content">
  <div class="row">
    <div class="col-lg-7">
      <article class="rko-article">
        ${renderBlocks(text)}
      </article>
    </div>
    <div class="col-lg-5 mt-4 mt-lg-0">
      <section class="rko-widget rko-widget--card rko-support-card" id="support">
        <h2 class="rko-widget__title">Поддержать деятельность Общества</h2>
        <form data-rko-demo novalidate>
          <label for="donateSum">Сумма, ₽</label>
          <div class="btn-group rko-sums" role="group" aria-label="Быстрый выбор суммы">
            ${[500, 1000, 3000, 5000].map((s) => `<button type="button" class="btn btn-outline-dark" data-rko-sum="${s}">${rub(s)}</button>`).join('')}
          </div>
          <input class="form-control form-control-lg" id="donateSum" type="number" min="100" step="100" value="1000" inputmode="numeric">
          <button class="btn btn-support btn-lg btn-block" type="submit">Поддержать РКО</button>
        </form>
        ${DEMO_NOTE}
      </section>
    </div>
  </div>
  <section class="rko-subsection">
    ${sectionHead('Проекты, которым нужна поддержка', [['Все проекты', 'projects.html#support']])}
    <div class="row">
      ${need.slice(0, 3).map((p) => projectCard(p)).join('\n')}
    </div>
  </section>
  <section class="rko-subsection">
    <div class="row">
      <div class="col-md-6 mb-4">
        <div class="rko-contact">
          <h2 class="rko-contact__title">Помочь делом</h2>
          <p>${esc(volunteerText)}</p>
          <a class="rko-more" href="article.html">Стать добровольцем</a>
        </div>
      </div>
      <div class="col-md-6 mb-4">
        <div class="rko-contact">
          <h2 class="rko-contact__title">Вступить в Общество</h2>
          <p>Кто может стать членом и участником РКО и как подать заявление.</p>
          <a class="rko-more" href="article.html">О вступлении в РКО</a>
        </div>
      </div>
    </div>
  </section>
</div>`;
  return { file: 'donate.html', title: 'Поддержать РКО', active: '', crumb: [['Поддержать РКО']], body };
}

// ---------------------------------------------------------------- 28–30 Вход, восстановление, регистрация
function authShell(active, inner) {
  return `<div class="container rko-content rko-content--top">
  <div class="row justify-content-center">
    <div class="col-md-8 col-lg-5">
      <div class="card rko-auth">
        <div class="card-body">
          <ul class="nav nav-pills nav-fill rko-auth__switch" aria-label="Личный кабинет">
            <li class="nav-item"><a class="nav-link${active === 'login' ? ' active' : ''}" href="login.html"${active === 'login' ? ' aria-current="page"' : ''}>Вход</a></li>
            <li class="nav-item"><a class="nav-link${active === 'register' ? ' active' : ''}" href="register.html"${active === 'register' ? ' aria-current="page"' : ''}>Регистрация</a></li>
          </ul>
          ${inner}
          ${DEMO_NOTE}
        </div>
      </div>
    </div>
  </div>
</div>`;
}

export function login() {
  const body = authShell('login', `<h1 class="rko-auth__title">Представьтесь, пожалуйста</h1>
          <form data-rko-demo novalidate autocomplete="off">
            <div class="form-group">
              <label for="loginEmail">E-mail</label>
              <input class="form-control form-control-lg" id="loginEmail" type="email" autocomplete="off">
            </div>
            <div class="form-group">
              <label for="loginPassword">Пароль</label>
              <input class="form-control form-control-lg" id="loginPassword" type="password" autocomplete="off">
            </div>
            <div class="custom-control custom-checkbox mb-3">
              <input class="custom-control-input" id="loginRemember" type="checkbox">
              <label class="custom-control-label" for="loginRemember">Запомнить меня</label>
            </div>
            <button class="btn btn-primary btn-lg btn-block" type="submit">Войти</button>
          </form>
          <p class="rko-auth__links"><a href="restore.html">Забыли пароль?</a></p>`);
  return { file: 'login.html', title: 'Вход', active: '', crumb: [['Вход']], body };
}

export function restore() {
  const text = clean(source('restore').blocks[0].text); // текст действующего сайта, без правок
  const body = authShell('', `<h1 class="rko-auth__title">Восстановление пароля</h1>
          <p>${esc(text)}</p>
          <form data-rko-demo novalidate autocomplete="off">
            <div class="form-group">
              <label for="restoreEmail">E-mail</label>
              <input class="form-control form-control-lg" id="restoreEmail" type="email" autocomplete="off">
            </div>
            <button class="btn btn-primary btn-lg btn-block" type="submit">Выслать инструкцию</button>
          </form>
          <p class="rko-auth__links"><a href="login.html">Вернуться ко входу</a></p>`);
  return { file: 'restore.html', title: 'Восстановление пароля', active: '', crumb: [['Вход', 'login.html'], ['Восстановление пароля']], body };
}

export function register() {
  const body = authShell('register', `<h1 class="rko-auth__title">Регистрация</h1>
          <form data-rko-demo novalidate autocomplete="off">
            <div class="form-group">
              <label for="regName">Фамилия, имя, отчество</label>
              <input class="form-control form-control-lg" id="regName" type="text" autocomplete="off">
            </div>
            <div class="form-group">
              <label for="regEmail">E-mail</label>
              <input class="form-control form-control-lg" id="regEmail" type="email" autocomplete="off">
            </div>
            <div class="form-row">
              <div class="form-group col-sm-6">
                <label for="regPassword">Пароль</label>
                <input class="form-control form-control-lg" id="regPassword" type="password" autocomplete="off">
              </div>
              <div class="form-group col-sm-6">
                <label for="regPassword2">Повторите пароль</label>
                <input class="form-control form-control-lg" id="regPassword2" type="password" autocomplete="off">
              </div>
            </div>
            <div class="custom-control custom-checkbox mb-3">
              <input class="custom-control-input" id="regAgree" type="checkbox">
              <label class="custom-control-label" for="regAgree">Принимаю <a href="article.html">правила сайта</a> и даю согласие на обработку персональных данных</label>
            </div>
            <button class="btn btn-primary btn-lg btn-block" type="submit">Зарегистрироваться</button>
          </form>
          <p class="rko-auth__links">Уже зарегистрированы? <a href="login.html">Войти</a></p>`);
  return { file: 'register.html', title: 'Регистрация', active: '', crumb: [['Регистрация']], body };
}

// ---------------------------------------------------------------- 31–32 Поиск: до запроса и с результатами
function searchForm(value = '') {
  return `<form class="rko-search" action="search-results.html" method="get" role="search">
    <label class="sr-only" for="searchQuery">Поисковый запрос</label>
    <div class="input-group input-group-lg">
      <input class="form-control" id="searchQuery" name="q" type="search" value="${esc(value)}" placeholder="Например: устойчивое развитие" autocomplete="off">
      <div class="input-group-append"><button class="btn btn-primary" type="submit">Найти</button></div>
    </div>
    <div class="form-row rko-search__options">
      <div class="col-sm-auto">
        <label class="sr-only" for="searchType">Как искать</label>
        <select class="custom-select custom-select-sm" id="searchType" name="type"><option value="words" selected>Все слова</option><option value="exact">Точная фраза</option></select>
      </div>
      <div class="col-sm-auto">
        <label class="sr-only" for="searchDate">Период</label>
        <select class="custom-select custom-select-sm" id="searchDate" name="date"><option value="all" selected>За всё время</option><option value="w">За неделю</option><option value="m">За месяц</option><option value="y">За год</option></select>
      </div>
    </div>
  </form>`;
}

export function search() {
  const body = `${pageHead('Поиск')}
<div class="container rko-content">
  <div class="row">
    <div class="col-lg-8">
      ${searchForm()}
      <div class="rko-search__hint">
        <h2 class="rko-h2 rko-h2--sm">Где ищет сайт</h2>
        <div class="rko-chips">
          ${source('search').blocks.find((b) => b.type === 'list').items.map((t) => `<span class="rko-chip rko-chip--static">${esc(t.replace(/\s*\d+$/, ''))}</span>`).join('')}
        </div>
      </div>
    </div>
  </div>
</div>`;
  return { file: 'search.html', title: 'Поиск', active: '', crumb: [['Поиск']], body };
}

export function searchResults() {
  const data = source('search');
  const groups = data.blocks.find((b) => b.type === 'list').items.map((t) => { const m = t.match(/^(.*?)\s*(\d+)$/); return [m[1], +m[2]]; });
  const total = groups.reduce((s, g) => s + g[1], 0);
  const titles = data.blocks.filter((b) => b.type === 'heading').map((b) => clean(b.text));
  // Фрагменты берём из самих найденных страниц, как это делает поиск на сайте.
  const join = linked('https://cosmatica.org/o-vstuplenii-v-rjady-rko.html');
  const snippets = [
    short((join?.blocks || []).filter((b) => b.type === 'paragraph').slice(0, 3).map((b) => clean(b.text)).join(' '), 200),
    clean(source('tabs').blocks.find((b) => b.type === 'paragraph' && b.text.startsWith('Первый Отряд учреждён'))?.text),
  ];
  const mark = (t) => esc(t).replace(/РКО/g, '<mark>РКО</mark>');
  const body = `${pageHead('Поиск')}
<div class="container rko-content">
  <div class="row">
    <div class="col-lg-8">
      ${searchForm('РКО')}
    </div>
  </div>
  <p class="rko-search__total">По запросу «РКО» ${plural(total, ['найдена', 'найдены', 'найдено'])} ${total.toLocaleString('ru-RU')} ${plural(total, ['страница', 'страницы', 'страниц'])} в ${groups.length} разделах.</p>
  <ul class="nav nav-tabs rko-tabs" aria-label="Разделы результатов">
    ${groups.map(([t, n], i) => `<li class="nav-item"><a class="nav-link${i === 0 ? ' active' : ''}" href="#"${i === 0 ? ' aria-current="page"' : ''}>${esc(t)} <span class="rko-tabs__count">${n.toLocaleString('ru-RU')}</span></a></li>`).join('\n    ')}
  </ul>
  <div class="row">
    <div class="col-lg-8">
      <div class="rko-rows rko-rows--text">
        ${titles.map((t, i) => `<article class="rko-row">
          <h2 class="rko-row__title"><a href="${i === 0 ? 'article.html' : 'tabs.html'}">${mark(t)}</a></h2>
          <p class="rko-row__text">${mark(snippets[i] || '')}</p>
        </article>`).join('\n')}
      </div>
    </div>
  </div>
</div>`;
  return { file: 'search-results.html', title: 'Результаты поиска', active: '', crumb: [['Поиск', 'search.html'], ['РКО']], body };
}

