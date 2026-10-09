#!/usr/bin/env node
// Проверка макетов. Запуск из папки bs4:
//   node qa/check.mjs            — только разбор файлов (без браузера)
//   node qa/check.mjs --browser  — плюс проверка в Chromium (нужен пакет playwright и локальный сервер,
//                                  адрес задаётся переменной BASE_URL, по умолчанию http://127.0.0.1:8768/design/cosmatica-2026/bs4/)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();
const problems = [];
const fail = (page, text) => problems.push(`${page}: ${text}`);
let checks = 0;
const ok = (cond, page, text) => { checks += 1; if (!cond) fail(page, text); };

// ---------- 1. Разбор файлов
ok(pages.length === 36, 'набор', `ожидалось 36 страниц, найдено ${pages.length}`);
for (const file of pages) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  ok((html.match(/<h1[\s>]/g) || []).length === 1, file, 'на странице должен быть ровно один H1');
  ok(html.includes('assets/vendor/bootstrap-4.6.2.min.css'), file, 'не подключён Bootstrap 4.6.2');
  ok(html.indexOf('bootstrap-4.6.2.min.css') < html.indexOf('rko-theme.css'), file, 'тема должна идти после Bootstrap');
  ok(!/<p class="eyebrow"|rko-eyebrow/.test(html), file, 'над заголовком не должно быть надписи-ярлыка');
  // Правка Аркона от 09.10.2026: «Поддержать» из шапки убрана; ссылка остаётся в подвале
  ok(!/donate\.html/.test(html.match(/<header class="rko-header">[\s\S]*?<\/header>/)?.[0] || 'donate.html'), file, 'в шапке не должно быть кнопки «Поддержать»');
  ok(/<footer[\s\S]*href="donate\.html">Поддержать РКО<\/a>/.test(html), file, 'в подвале должна остаться ссылка «Поддержать РКО»');
  // Правка Аркона от 09.10.2026: название с заглавных, новый девиз в шапке
  ok(!/Русск[а-яё]+\s+космическ[а-яё]+\s+[Оо]бществ|Русск[а-яё]+\s+Космическ[а-яё]+\s+обществ/.test(html), file, 'название Общества должно быть с заглавных букв');
  const headerHtml = html.match(/<header class="rko-header">[\s\S]*?<\/header>/)?.[0] || '';
  ok(headerHtml.includes('<strong>Русское Космическое Общество</strong>') && headerHtml.includes('Будущее не определено — будущее определяет!') && !headerHtml.includes('Наука, культура, проекты, будущее'), file, 'в шапке должны быть название с заглавных и новый девиз');
  ok((html.match(/class="nav-item dropdown/g) || []).length === 5, file, 'в меню должно быть 5 разделов с подпунктами');
  if (file !== 'index.html') ok(/<ol class="breadcrumb">/.test(html) && /<nav class="rko-crumbs"[^>]*>\s*<div class="container">/.test(html), file, 'хлебные крошки должны стоять внутри .container');
  ok(!/__BUILD__|undefined|\[object Object\]|NaN/.test(html.replace(/<script[\s\S]*?<\/script>/g, '')), file, 'в разметке остался служебный мусор');
  // Ссылки и файлы
  for (const m of html.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)) {
    const target = m[1];
    if (/^(https?:|mailto:|tel:)/.test(target)) continue;
    ok(fs.existsSync(path.join(ROOT, target)), file, `нет файла ${target}`);
  }
  // Ничего не грузим со сторонних серверов
  for (const m of html.matchAll(/<(?:script|link|img|iframe)[^>]+(?:src|href)="(https?:[^"]+)"/g)) fail(file, `сторонний ресурс ${m[1]}`);
  // Типовые подписи только в виджетах: в основных списках их быть не должно
  ok(!/<span class="tag">|>Новость \d+<|>КНИГА<|>РАЗДЕЛ</.test(html), file, 'в списке осталась подпись типа материала');
}
// Правки по отклику группы от 09.10.2026
const homeHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
ok(!/rko-fund|Поддержать проект|rko-project__btn/.test(homeHtml), 'index.html', 'на главной в карточках проектов не должно быть сбора и кнопки поддержки');
ok((homeHtml.match(/class="card rko-project/g) || []).length === 3, 'index.html', 'на главной должно быть три карточки проектов');
const tilesHtml = fs.readFileSync(path.join(ROOT, 'articles.html'), 'utf8');
const tiles = tilesHtml.match(/<a class="rko-tile"[\s\S]*?<\/a>/g) || [];
ok(tiles.length === 18 && tiles.every((t) => /<svg class="rko-ico"/.test(t)), 'articles.html', 'у каждого раздела материалов должна быть иконка');
ok(new Set(tiles.map((t) => t.match(/data-rko-icon="([^"]+)"/)?.[1])).size === 18 && !/data-rko-icon="folder"/.test(tilesHtml), 'articles.html', 'иконки разделов должны быть разными и подобранными, без запасной «папки»');
ok(fs.readdirSync(path.join(ROOT, 'assets/img/icons')).filter((f) => f.endsWith('.svg')).length === 19, 'иконки', 'в assets/img/icons должно быть 19 файлов');
const partnerHtml = fs.readFileSync(path.join(ROOT, 'partner.html'), 'utf8');
ok((partnerHtml.match(/class="media rko-partner__mini/g) || []).length === 6, 'partner.html', 'в блоке «Другие партнёры» должно быть 6 карточек');

const css = fs.readFileSync(path.join(ROOT, 'assets/css/rko-theme.css'), 'utf8');
ok((css.match(/{/g) || []).length === (css.match(/}/g) || []).length, 'rko-theme.css', 'непарные фигурные скобки');
ok(!/url\(["']?https?:/.test(css), 'rko-theme.css', 'стили не должны ссылаться на сторонние серверы');
// aspect-ratio в Safari на айфоне растягивал блок картинки проекта и сдвигал её вправо (09.10.2026)
ok(!/aspect-ratio\s*:/.test(css.replace(/\/\*[\s\S]*?\*\//g, '')), 'rko-theme.css', 'пропорции картинок задаются через .embed-responsive, без aspect-ratio');

// ---------- 2. Браузер
if (process.argv.includes('--browser')) {
  const { chromium } = await import(process.env.PLAYWRIGHT_PATH || 'playwright');
  const base = process.env.BASE_URL || 'http://127.0.0.1:8768/design/cosmatica-2026/bs4/';
  const browser = await chromium.launch();
  const widths = [320, 390, 768, 1024, 1440];
  for (const design of ['sharp', 'hybrid']) {
    for (const width of widths) {
      const ctx = await browser.newContext({ viewport: { width, height: 800 } });
      for (const file of pages) {
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
        page.on('requestfailed', (r) => errors.push(`не загрузилось: ${r.url()}`));
        page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`); });
        await page.goto(`${base}${file}?design=${design}`, { waitUntil: 'networkidle' });
        const info = await page.evaluate(async () => {
          await document.fonts.ready;
          for (const i of document.images) i.loading = 'eager';
          window.scrollTo(0, document.body.scrollHeight);
          await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = r; i.onerror = r; setTimeout(r, 5000); }))));
          const h1 = document.querySelector('h1');
          const crumb = document.querySelector('.breadcrumb');
          const join = [...document.querySelectorAll('.rko-header .btn-primary')].find((b) => b.offsetParent);
          const support = [...document.querySelectorAll('.rko-header__support')].find((b) => b.offsetParent);
          const card = document.querySelector('.card, .rko-widget--card, .rko-tile, .rko-event');
          let joinOffset = null;
          if (join) {
            const range = document.createRange(); range.selectNodeContents(join);
            const t = range.getBoundingClientRect(); const b = join.getBoundingClientRect();
            joinOffset = Math.abs((t.top + t.bottom) / 2 - (b.top + b.bottom) / 2);
          }
          return {
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            broken: [...document.images].filter((i) => !i.complete || !i.naturalWidth).map((i) => i.getAttribute('src')),
            h1Font: getComputedStyle(h1).fontFamily.split(',')[0].replace(/"/g, ''),
            russo: document.fonts.check('16px "Russo One"'),
            inter: document.fonts.check('16px "RKO Inter"'),
            crumbLeft: crumb ? Math.round(crumb.getBoundingClientRect().left) : null,
            mainLeft: Math.round((document.querySelector('.rko-pagehead .container > *, .rko-content > .row > div > *, .rko-hero .col-lg-6 > *')?.getBoundingClientRect().left) ?? -1),
            joinOffset,
            supportVisible: !!support || [...document.querySelectorAll('.rko-header a[href="donate.html"]')].some((a) => a.offsetParent),
            mottoCentered: getComputedStyle(document.querySelector('.rko-header__motto')).textAlign === 'center',
            radius: card ? getComputedStyle(card).borderTopLeftRadius : null,
            smallText: [...document.querySelectorAll('main *')].filter((el) => el.childElementCount === 0 && el.textContent.trim() && parseFloat(getComputedStyle(el).fontSize) < 11 && el.offsetParent).length,
            // Скругления: в «Чётком» варианте их не должно быть ни у одного видимого элемента страницы
            rounded: [...document.querySelectorAll('header *, main *, footer *')].filter((el) => el.offsetParent && !el.closest('svg') && ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius'].some((k) => parseFloat(getComputedStyle(el)[k]) > 0)).map((el) => el.className || el.tagName).slice(0, 3),
            // Крошки: ссылка не должна вылезать из своего пункта
            crumbOverlap: [...document.querySelectorAll('.breadcrumb-item a')].filter((a) => a.getBoundingClientRect().right - a.parentElement.getBoundingClientRect().right > 1).length,
            // Вкладки на компьютере не обрезаются; на телефоне обрезанные помечены затуханием
            tabsCut: [...document.querySelectorAll('.rko-tabs')].filter((t) => t.scrollWidth - t.clientWidth > 4 && !t.classList.contains('is-cut')).length,
            // Девиз виден на любой ширине: под названием на компьютере, отдельной строкой на телефоне
            mottoVisible: [...document.querySelectorAll('.rko-header small, .rko-header__motto')].filter((el) => el.offsetParent && el.textContent.includes('будущее определяет')).length,
            navHeight: innerWidth >= 992 ? document.querySelector('.rko-nav').getBoundingClientRect().height : 0,
            // Карточки «Другие партнёры» должны быть в рамке; иконки разделов — видимыми
            // Картинка не выходит за свою рамку, рамка — за свою карточку (сдвиг на айфоне, 09.10.2026)
            imgOut: [...document.querySelectorAll('main img')].filter((i) => { const r = i.getBoundingClientRect(); const p = i.parentElement.getBoundingClientRect(); return r.width > 0 && (r.left < p.left - 1 || r.right > p.right + 1 || r.right > document.documentElement.clientWidth + 1); }).map((i) => i.getAttribute('src')).slice(0, 3),
            boxOut: [...document.querySelectorAll('.embed-responsive')].filter((b) => { const r = b.getBoundingClientRect(); const p = b.parentElement.getBoundingClientRect(); return r.width > p.width + 1 || Math.abs(r.height / r.width - 0.5625) > 0.02; }).length,
            miniNoFrame: [...document.querySelectorAll('.rko-partner__mini')].filter((el) => parseFloat(getComputedStyle(el).borderTopWidth) < 1).length,
            iconHidden: [...document.querySelectorAll('.rko-tile .rko-ico')].filter((el) => el.getBoundingClientRect().width < 20).length,
          };
        });
        const tag = `${file} [${design}, ${width}px]`;
        ok(info.overflow <= 0, tag, `горизонтальная прокрутка ${info.overflow}px`);
        ok(info.broken.length === 0, tag, `не загрузились картинки: ${info.broken.join(', ')}`);
        ok(errors.length === 0, tag, `ошибки: ${[...new Set(errors)].slice(0, 3).join(' | ')}`);
        ok(info.h1Font === 'Russo One' && info.russo, tag, `заголовок набран не плакатным шрифтом (${info.h1Font})`);
        ok(info.inter, tag, 'основной шрифт не загрузился');
        if (info.crumbLeft != null && info.mainLeft >= 0 && !/login|restore|register/.test(file)) ok(Math.abs(info.crumbLeft - info.mainLeft) <= 1, tag, `крошки не по сетке: ${info.crumbLeft}px против ${info.mainLeft}px`);
        if (info.joinOffset != null) ok(info.joinOffset <= 1.5, tag, `текст кнопки «Присоединиться» смещён на ${info.joinOffset.toFixed(1)}px`);
        ok(!info.supportVisible, tag, 'кнопка «Поддержать» не должна быть в шапке');
        if (width < 992) ok(info.mottoCentered, tag, 'девиз на телефоне должен стоять по центру');
        if (info.radius) ok(design === 'sharp' ? info.radius === '0px' : info.radius !== '0px', tag, `скругление блока ${info.radius} не соответствует варианту`);
        ok(info.smallText === 0, tag, `текст мельче 11px: ${info.smallText} элементов`);
        if (design === 'sharp') ok(info.rounded.length === 0, tag, `скруглённые элементы в «Чётком» варианте: ${info.rounded.join(' | ')}`);
        ok(info.crumbOverlap === 0, tag, 'пункты хлебных крошек наезжают друг на друга');
        ok(info.tabsCut === 0, tag, 'вкладки обрезаны без признака прокрутки');
        ok(info.navHeight < 60, tag, `меню не помещается в одну строку (${Math.round(info.navHeight)}px)`);
        ok(info.mottoVisible === 1, tag, `девиз в шапке должен быть виден ровно один раз (сейчас ${info.mottoVisible})`);
        ok(info.imgOut.length === 0, tag, `картинка выходит за свою рамку: ${info.imgOut.join(', ')}`);
        ok(info.boxOut === 0, tag, 'блок картинки шире карточки или не в пропорции 16:9');
        ok(info.miniNoFrame === 0, tag, 'карточки других партнёров без рамки');
        ok(info.iconHidden === 0, tag, 'иконки разделов не видны');
        await page.close();
      }
      await ctx.close();
    }
  }

  // Поведение
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  let page = await mobile.newPage();
  await page.goto(`${base}news.html`, { waitUntil: 'networkidle' });
  ok(!(await page.isVisible('#rkoNav')), 'телефон', 'меню должно быть закрыто при загрузке');
  await page.click('.rko-toggler'); await page.waitForTimeout(500);
  ok(await page.isVisible('#rkoNav .nav-link >> text=Библиотека'), 'телефон', 'меню не открылось');
  await page.click('#rkoNav-library'); await page.waitForTimeout(300);
  ok(await page.isVisible('.dropdown-item >> text=Монографии'), 'телефон', 'подразделы не раскрылись');
  const nav = await page.evaluate(() => document.querySelector('#rkoNav .nav-link').getBoundingClientRect().left);
  ok(nav >= 14, 'телефон', `пункты меню прижаты к краю (${nav}px)`);
  await mobile.close();
  // Самый узкий экран: название и кнопка «Меню» помещаются в одну строку
  const tiny = await browser.newContext({ viewport: { width: 320, height: 640 } });
  page = await tiny.newPage();
  await page.goto(`${base}news.html`, { waitUntil: 'networkidle' });
  const top = await page.evaluate(() => ({ h: document.querySelector('.rko-header__top').getBoundingClientRect().height, label: !!document.querySelector('.rko-toggler__label').offsetParent }));
  ok(top.h < 70 && top.label, 'экран 320px', `шапка: высота ${Math.round(top.h)}px, подпись «Меню» ${top.label ? 'видна' : 'скрыта'}`);
  await tiny.close();
  // Главная: три слова заголовка трёх разных цветов и новый текст под ним
  const heroCtx = await browser.newContext({ viewport: { width: 390, height: 800 } });
  page = await heroCtx.newPage();
  await page.goto(`${base}index.html`, { waitUntil: 'networkidle' });
  const hero = await page.evaluate(() => ({ colors: [...document.querySelectorAll('.rko-hero__word')].map((w) => getComputedStyle(w).color), lead: document.querySelector('.rko-hero__lead').textContent }));
  ok(hero.colors.length === 3 && new Set(hero.colors).size === 3, 'главная', `цвета слов заголовка: ${hero.colors.join(' / ')}`);
  ok(hero.lead === 'Русское Космическое Общество сключает труд, науку, культуру, образование и проектную деятельность, с целью созидания ноосферно-космического будущего.', 'главная', 'текст под заголовком должен дословно совпадать с формулировкой Аркона');
  await heroCtx.close();

  const desk = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  page = await desk.newPage();
  await page.goto(`${base}index.html`, { waitUntil: 'networkidle' });
  await page.hover('.rko-nav .nav-item.dropdown >> nth=0');
  ok(await page.isVisible('.dropdown-item >> text=Органы управления'), 'компьютер', 'выпадающее меню не открывается наведением');
  // Каждое выпадающее меню целиком помещается на экране при 992, 1024, 1200 и 1280 px
  for (const w of [992, 1024, 1200, 1280]) {
    await page.setViewportSize({ width: w, height: 800 });
    for (let i = 0; i < 5; i += 1) {
      await page.hover(`.rko-nav .nav-item.dropdown >> nth=${i}`);
      await page.waitForTimeout(80);
      const box = await page.evaluate((n) => { const m = document.querySelectorAll('.rko-nav .nav-item.dropdown')[n].querySelector('.dropdown-menu'); const r = m.getBoundingClientRect(); return { left: r.left, right: r.right, vw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth, shown: getComputedStyle(m).display !== 'none' }; }, i);
      ok(box.shown && box.left >= 0 && box.right <= box.vw && box.sw <= box.vw, `меню ${i + 1} [${w}px]`, `выпадающий список выходит за экран: ${Math.round(box.left)}…${Math.round(box.right)} при ширине ${box.vw}`);
    }
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.mouse.move(5, 700); // убрать указатель с меню, иначе открытый список перекроет вкладки
  await page.goto(`${base}projects.html`, { waitUntil: 'networkidle' });
  const all = await page.locator('#projectGrid > [data-rko-item]:not(.d-none)').count();
  await page.click('.rko-tabs >> text=Завершённые');
  const done = await page.locator('#projectGrid > [data-rko-item]:not(.d-none)').count();
  ok(all === 12 && done === 1, 'проекты', `фильтр по типам: всего ${all}, завершённых ${done}`);
  await page.click('.rko-tabs >> text=Ждут поддержки');
  ok((await page.locator('#projectGrid > [data-rko-item]:not(.d-none)').count()) === 3, 'проекты', 'фильтр «Ждут поддержки» должен показать 3 проекта');
  // Пункт меню «Проекты → Действующие» на самой странице проектов тоже переключает вкладку
  await page.hover('.rko-nav .nav-item.dropdown >> nth=2');
  await page.click('.rko-nav .dropdown-item >> text=Действующие'); await page.waitForTimeout(200);
  await page.mouse.move(5, 700);
  ok((await page.locator('.rko-tabs .nav-link.active').innerText()).trim() === 'Действующие', 'проекты', 'переход из меню по типу проекта не переключает вкладку');
  await page.goto(`${base}tabs.html`, { waitUntil: 'networkidle' });
  await page.click('#squad-members-tab'); await page.waitForTimeout(400);
  ok(await page.isVisible('#squad-members .rko-person'), 'вкладки', 'вкладка «Участники» не переключается');
  await page.goto(`${base}donate.html`, { waitUntil: 'networkidle' });
  await page.click('[data-rko-sum="3000"]');
  ok((await page.inputValue('#donateSum')) === '3000', 'поддержка', 'быстрый выбор суммы не работает');
  await page.click('.rko-support-card button[type="submit"]');
  ok(page.url().endsWith('donate.html'), 'поддержка', 'форма макета не должна никуда отправлять');
  await page.click('.rko-review [data-design="hybrid"]');
  ok((await page.evaluate(() => getComputedStyle(document.querySelector('.btn-primary')).borderTopLeftRadius)) !== '0px', 'переключатель', 'вариант «Гибрид» не включился');
  await page.goto(`${base}search.html`, { waitUntil: 'networkidle' });
  await page.fill('#searchQuery', 'РКО'); await page.press('#searchQuery', 'Enter'); await page.waitForLoadState('networkidle');
  ok(page.url().includes('search-results.html'), 'поиск', 'форма поиска не ведёт на страницу результатов');
  await desk.close();
  await browser.close();
}

console.log(`Проверок: ${checks}. Замечаний: ${problems.length}.`);
if (problems.length) { console.log(problems.slice(0, 60).join('\n')); process.exit(1); }
