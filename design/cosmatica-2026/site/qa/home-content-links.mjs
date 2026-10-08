import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.SITE_URL || 'http://127.0.0.1:8770/';
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_BIN ? {executablePath: process.env.CHROME_BIN} : {}),
  args: ['--no-sandbox']
});
let checked = 0;
try {
  const page = await browser.newPage({viewport: {width: 390, height: 844}});
  await page.goto(base, {waitUntil: 'domcontentloaded'});
  await page.waitForTimeout(400);
  const grouped = await page.evaluate(() => {
    const sections = [...document.querySelectorAll('main section')];
    const links = name => {
      const section = sections.find(s => s.querySelector('h2')?.textContent.trim() === name);
      return section ? [...section.querySelectorAll('.grid a.card')].map(a => ({
        title: a.querySelector('h3')?.textContent.trim(),
        url: a.href
      })) : [];
    };
    return {
      news: links('Новости Общества'),
      events: links('Афиша и календарь'),
      projects: links('Живые инициативы'),
      chronicle: links('Летопись РКО'),
      books: window.COSMATICA_CONTENT?.library?.links || []
    };
  });
  assert.equal(grouped.news.length, 3);
  assert.equal(grouped.events.length, 3);
  assert.equal(grouped.projects.length, 3);
  assert.equal(grouped.chronicle.length, 2);
  assert.equal(grouped.books.length, 7);
  const all = [
    ...grouped.news, ...grouped.events, ...grouped.projects, ...grouped.chronicle,
    ...grouped.books.map((url,i)=>({title:'Книга '+i, url:new URL(url,base).href}))
  ];
  for (const item of all) {
    assert(item.url && item.url.startsWith(base), 'Non-local card: '+item.title);
    const resp = await page.goto(item.url, {waitUntil:'domcontentloaded', timeout:25000});
    await page.waitForTimeout(300);
    const text = await page.locator('main').innerText();
    assert.equal(resp.status(), 200, 'HTTP '+resp.status()+' for '+item.title);
    assert(!text.includes('Материал не найден'), 'Broken material: '+item.title);
    assert(text.length>150, 'Empty destination: '+item.title);
    checked++;
  }
  await page.close();
  console.log('HOME_CONTENT_LINKS', checked, 'destinations PASS');
} finally {
  await browser.close();
}
