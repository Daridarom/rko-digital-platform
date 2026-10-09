// Подготовка содержимого из выгрузки действующего сайта (../site/data). Ничего не выдумываем:
// если поля в источнике нет, оно остаётся пустым и шаблон показывает состояние «без этого поля».
import fs from 'node:fs';
import path from 'node:path';
import { source, linked, clean, splitTag, ROOT } from './core.mjs';

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
export function ruDate(ddmmyyyy, { year = true } = {}) {
  const m = String(ddmmyyyy || '').match(/^(\d\d)\.(\d\d)\.(\d{4})$/);
  if (!m) return '';
  return `${+m[1]}\u00a0${MONTHS[+m[2] - 1]}${year ? `\u00a0${m[3]}` : ''}`;
}
export const dateParts = (ddmmyyyy) => {
  const m = String(ddmmyyyy || '').match(/^(\d\d)\.(\d\d)\.(\d{4})$/);
  return m ? { day: +m[1], month: MONTHS_SHORT[+m[2] - 1], monthFull: MONTHS[+m[2] - 1], year: m[3], iso: `${m[3]}-${m[2]}-${m[1]}` } : null;
};

// Вводные строки разделов — те же, что участники уже видели в прежнем прототипе (../site/routes.js).
const routesSrc = fs.readFileSync(path.join(ROOT, '..', 'site', 'routes.js'), 'utf8').replace(/^window\.COSMATICA_ROUTES=/, 'return ');
export const INTRO = Object.fromEntries(new Function(routesSrc)().map((r) => [r.slug, clean(r.intro)]));

// ---------- Новости
const home = source('home');
const homeNewsText = clean(home.blocks.find((b) => b.type === 'paragraph' && b.text.startsWith('Новости'))?.text || '');
const newsRaw = source('news').cards.map((c) => {
  const title = clean(c.links?.[0]?.title || splitTag(c.title).title);
  const tagLink = (c.links || []).find((l) => l.title.startsWith('#'));
  const tag = tagLink ? clean(tagLink.title).slice(1) : splitTag(c.title).tag;
  const when = c.description.match(/^(\d\d\.\d\d\.\d{4}) (\d\d:\d\d)/);
  return { title, tag, date: when?.[1] || '', time: when?.[2] || '', image: c.image, href: 'news-item.html', teaser: '' };
});
// Анонсы есть только у новостей, выведенных на главной: вырезаем текст между соседними заголовками.
newsRaw.forEach((n, i) => {
  const start = homeNewsText.indexOf(n.title);
  if (start === -1) return;
  const from = start + n.title.length;
  const next = newsRaw[i + 1] ? homeNewsText.indexOf(newsRaw[i + 1].title, from) : -1;
  n.teaser = clean(homeNewsText.slice(from, next === -1 ? undefined : next));
  if (n.teaser.length > 220) n.teaser = '';
});
export const news = newsRaw;

// ---------- Мероприятия
export const events = source('poster').cards.map((c) => {
  const title = clean(c.links?.[0]?.title || splitTag(c.title).title);
  const tag = splitTag(c.title).tag;
  const date = c.description.match(/(\d\d\.\d\d\.\d{4})\s*$/)?.[1] || '';
  const category = clean(c.description).split(' ')[0];
  return { title, tag, date, category, image: c.image, href: 'poster-item.html' };
});
export const eventFilters = source('poster').categories;
export const eventCategories = source('poster').blocks.filter((b) => b.type === 'list')[1]?.items || [];

// ---------- Проекты
export const projects = source('projects').cards.map((c) => {
  const detail = linked(c.url) || {};
  const field = (key) => clean(detail.fields?.find((f) => f.key === key)?.value || '');
  const collected = c.description.match(/собрано:\s*(\d+)\s*руб/);
  const tabs = detail.blocks?.find((b) => b.type === 'list')?.items || [];
  const lead = clean(detail.fields?.find((f) => !f.key)?.value || '');
  const slug = c.url.split('/').pop();
  return {
    slug, title: clean(c.title), date: c.description.match(/(\d\d\.\d\d\.\d{4})\s*$/)?.[1] || '',
    image: c.image, status: field('Статус:').replace('Завершенный', 'Завершённый'), direction: field('Направление:'), site: field('Сайт:'),
    collected: collected ? +collected[1] : null, support: /Поддержать проект/.test(c.description),
    tabs, lead, detail,
    href: { 350: 'project-fundraising.html', 342: 'project-completed.html', rusleo: 'project-collecting.html' }[slug] || 'project.html',
  };
});
// Цель сбора известна только для одного проекта — из текста новости о нём («необходимо собрать 250 000 рублей»).
projects.find((p) => p.slug === '350').target = 250000;
export const projectFilters = source('projects').categories;

// ---------- Состав, советы, партнёры, отделения
export const users = source('users').cards.map((c) => ({
  name: clean(c.links?.[0]?.title || c.title), department: clean(c.links?.[1]?.title || ''), image: c.image, href: 'profile.html',
}));
export const userGroups = source('users').categories;

export const councils = source('collegium').cards.map((c) => ({
  title: clean(c.title), text: clean(c.description).slice(clean(c.title).length).trim(), image: c.image, href: 'collegium-item.html',
}));

export const partners = source('partners').cards.map((c) => {
  let text = clean(c.description).slice(clean(c.title).length).trim();
  const site = text.match(/(?:Сайт:\s*)?(https?:\/\/\S+)\s*$/);
  if (site) text = text.slice(0, site.index).trim();
  return { title: clean(c.title), text, site: site?.[1] || '', image: c.image, href: 'partner.html' };
});

// Координаты центров регионов — только для схемы на макете; на сайте карту с метками подключает CMS.
const GEO = {
  'Москва': [55.75, 37.62], 'Санкт-Петербург': [59.94, 30.31], 'Новосибирская область': [55.03, 82.92],
  'Челябинская область': [55.16, 61.4], 'Республика Крым': [44.95, 34.1], 'Республика Хакасия': [53.72, 91.44],
  'Свердловская область': [56.84, 60.6], 'Псковская область': [57.82, 28.33], 'Краснодарский край': [45.04, 38.98],
  'Калужская область': [54.51, 36.26], 'Нижегородская область': [56.33, 44.0], 'Представительство в Беларуси': [53.9, 27.56],
  'Кемеровская область': [55.35, 86.09], 'Волгоградская область': [48.71, 44.51], 'Калининградская область': [54.71, 20.51],
  'Курганская область': [55.44, 65.34], 'Удмуртская республика': [56.85, 53.2], 'Донецкая республика': [48.0, 37.8],
  'Владимирская область': [56.13, 40.41], 'Костромская область': [57.77, 40.93], 'Представительство в Латвии': [56.95, 24.11],
  'Брянская область': [53.24, 34.37], 'Орловская область': [52.97, 36.07], 'Ростовская область': [47.23, 39.72],
  'Луганская республика': [48.57, 39.31], 'Тюменская область': [57.15, 65.53], 'Запорожская область': [47.84, 35.14],
  'Томская область': [56.49, 84.95], 'Республика Саха (Якутия). Представительство': [62.03, 129.73],
  'Алтайский край. Представительство': [53.35, 83.78],
};
export const departments = source('departments').cards.map((c) => {
  const title = clean(c.title);
  const abroad = /Беларус|Латви|Канад/.test(title);
  return { title, abroad, representation: /Представительство/.test(title), geo: GEO[title] || null, href: 'department.html' };
});

// ---------- Материалы и библиотека
export const articleCategories = source('articles').cards.map((c) => clean(c.title));
export const articles = source('articles-list').cards.map((c) => {
  const { title, tag } = splitTag(c.title);
  const author = clean(c.description).match(/(Авторы?|Автора|Составители редакторы):\s*(.+?)\s*Подробнее$/);
  return { title, tag, authorLabel: author ? author[1].replace('Автора', 'Автор') : '', author: author?.[2] || '', href: 'article.html' };
});
export const articlesIntro = clean(source('articles-list').blocks.find((b) => b.type === 'paragraph')?.text || '');

export const books = source('library').cards.map((c) => {
  const detail = linked(c.url) || {};
  const field = (key) => clean(detail.fields?.find((f) => f.key === key)?.value || '');
  const title = clean(c.title);
  return {
    title, author: field('Автор:') || clean(c.description).slice(title.length).trim(),
    annotation: clean(detail.fields?.find((f) => !f.key)?.value || ''),
    size: field('Файл:').replace(/^Скачать\s*/, ''), image: c.image, href: 'book.html',
  };
});

// ---------- Главная: летопись, первый отряд
export const reports = home.blocks.filter((b) => b.type === 'image' && /^Отчёт о деятельности/.test(b.alt))
  .map((b) => ({ title: clean(b.alt), year: b.alt.match(/\d{4}/)?.[0], image: b.src }));
const squadText = clean(home.blocks.find((b) => b.type === 'paragraph' && b.text.startsWith('Первый отряд'))?.text || '');
const squadImages = home.blocks.filter((b) => b.type === 'image' && /Кисурин|Задерей|Волчкова/.test(b.alt));
export const squad = squadImages.map((b, i) => {
  const name = clean(b.alt);
  const from = squadText.indexOf(name) + name.length;
  const next = squadImages[i + 1] ? squadText.indexOf(clean(squadImages[i + 1].alt)) : undefined;
  return { name, role: clean(squadText.slice(from, next)), image: b.src };
});
export const supportBanner = { image: 'assets/source/22d73e7ab5039388e9c695e4.webp', alt: 'Поддержи сбор средств на съёмки фильма-киноурока «Школьные ботаны-2: Русский Леонардо»' };

// ---------- Органы управления: дерево разделов из заголовков H2 → H3 → H4
export function directionTree() {
  const blocks = source('direction').blocks;
  const sections = [];
  let section = null; let group = null; let entry = null;
  const ensureGroup = () => { if (!group) { group = { title: '', entries: [] }; section.groups.push(group); } return group; };
  blocks.forEach((b, i) => {
    if (b.type === 'heading' && b.level === 2) {
      section = { title: clean(b.text), groups: [] }; sections.push(section); group = null; entry = null;
    } else if (b.type === 'heading' && b.level === 3) {
      group = { title: clean(b.text), entries: [] }; section.groups.push(group); entry = null;
    } else if (b.type === 'heading') {
      const next = blocks[i + 1];
      const isLabel = !next || next.type === 'heading';
      if (isLabel) { entry = { label: clean(b.text), name: '', image: null, text: [] }; ensureGroup().entries.push(entry); }
      else if (entry && entry.label && !entry.name && !entry.text.length) { entry.name = clean(b.text); }
      else { entry = { label: '', name: clean(b.text), image: null, text: [] }; ensureGroup().entries.push(entry); }
    } else if (entry && b.type === 'image') { entry.image = b.src; }
    else if (entry && b.type === 'paragraph') { const t = clean(b.text); if (t && t !== '.') entry.text.push(t); }
  });
  return sections;
}
