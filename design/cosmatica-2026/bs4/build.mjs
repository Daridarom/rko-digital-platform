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

const written = [];
for (const build of builders) {
  const p = build();
  const html = page(p).replace(/__BUILD__/g, stamp).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(path.join(ROOT, p.file), html);
  written.push(p.file);
}
const images = flushImages();
console.log(`Страниц: ${written.length}. Картинок: ${images.count} (${(images.bytes / 1048576).toFixed(1)} МБ). Версия: ${stamp}.`);
