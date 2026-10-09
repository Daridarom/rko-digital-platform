#!/usr/bin/env node
// Сборка статических макетов: node build.mjs
// Читает выгрузку действующего сайта из ../site/data и пишет готовые .html рядом с этим файлом.
// Зависимостей нет. Готовые страницы лежат в репозитории, запускать сборку для просмотра не нужно.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT, flushImages } from './src/core.mjs';
import { page } from './src/layout.mjs';
import * as society from './src/pages-society.mjs';
import * as activity from './src/pages-activity.mjs';
import * as service from './src/pages-service.mjs';
import { reviewMap } from './src/pages-review.mjs';
import { ICONS, iconFile } from './src/icons.mjs';

const builders = [
  society.home, society.newsList, society.newsItem, society.poster, society.posterItem, society.calendar,
  society.about, society.aboutInfo, society.direction, society.collegium, society.collegiumItem,
  society.partnersList, society.partner, society.contacts,
  activity.departments, activity.department, activity.projectsList, activity.project,
  activity.projectFundraising, activity.projectCollecting, activity.projectCompleted, activity.users, activity.profile,
  activity.articleCategories, activity.articlesList, activity.article, activity.library, activity.book,
  activity.tabsPage,
  service.donate, service.login, service.restore, service.register, service.search, service.searchResults,
  reviewMap,
];

// Метка версии для сброса кэша стилей и скриптов: меняется только вместе с их содержимым.
const stamp = crypto.createHash('sha1')
  .update(fs.readFileSync(path.join(ROOT, 'assets/css/rko-theme.css')))
  .update(fs.readFileSync(path.join(ROOT, 'assets/js/rko.js')))
  .update(fs.readFileSync(path.join(ROOT, 'assets/js/rko-review.js')))
  .digest('hex').slice(0, 8);

// Название Общества пишется с заглавных букв во всех падежах — и в подписях макета, и в текстах выгрузки.
const NAME = /Русск(ое|ого|ому|им|ом)(\s+)космическ(ое|ого|ому|им|ом)(\s+)[Оо]бществ(о|а|у|ом|е)(?![а-яё])/g;
const properName = (html) => html.replace(NAME, 'Русск$1$2Космическ$3$4Обществ$5');

const written = [];
for (const build of builders) {
  const p = build();
  const html = properName(page(p)).replace(/__BUILD__/g, stamp).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(path.join(ROOT, p.file), html);
  written.push(p.file);
}
const images = flushImages();
const iconDir = path.join(ROOT, 'assets', 'img', 'icons');
fs.rmSync(iconDir, { recursive: true, force: true });
fs.mkdirSync(iconDir, { recursive: true });
for (const name of Object.keys(ICONS)) fs.writeFileSync(path.join(iconDir, `${name}.svg`), iconFile(name));
console.log(`Страниц: ${written.length}. Картинок: ${images.count} (${(images.bytes / 1048576).toFixed(1)} МБ). Версия: ${stamp}.`);
