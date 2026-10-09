import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.SITE_URL||'http://127.0.0.1:8776/';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
let checks=0;
try{
 for(const width of [320,390]){
  const page=await browser.newPage({viewport:{width,height:844}});
  await page.goto(base+'index.html',{waitUntil:'domcontentloaded'});
  const btn=page.locator('.menu-btn');
  await btn.click();
  assert.equal(await btn.getAttribute('aria-expanded'),'true');
  await page.locator('.mobile-drawer a').first().focus();
  await page.keyboard.press('Escape');
  const state=await page.evaluate(()=>({
   expanded:document.querySelector('.menu-btn').getAttribute('aria-expanded'),
   focus:document.activeElement.className,
   menuOpen:document.querySelector('.mobile-drawer').classList.contains('open'),
   hiddenScroll:getComputedStyle(document.body).overflow==='hidden'
  }));
  assert.equal(state.expanded,'false');
  assert(state.focus.includes('menu-btn'), 'focus must return to the menu button');
  assert(!state.menuOpen&&!state.hiddenScroll);
  checks++;console.log('KEYBOARD_MENU_OK',width,JSON.stringify(state));
  await page.close();
 }
 // No search query must not invent a search for RKO.
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto(base+'view.html?p=search-results',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(320);
 const title=await page.locator('#main h1').innerText();
 assert(!title.includes('Поиск: РКО'),'default synthetic RKO query');
 assert((await page.locator('main').innerText()).includes('Введите поисковый запрос'));
 console.log('EMPTY_SEARCH_NO_FAKE_QUERY_OK',title);
 checks++;
 await page.close();
 // Confirm graceful failure instead of leaving a spinner or fixture.
 const search=await browser.newPage({viewport:{width:390,height:844}});
 await search.route('**/data/archive/search-index.json*',r=>r.abort());
 await search.route('**/data/search-index.json*',r=>r.abort());
 await search.goto(base+'view.html?p=search-results&q=нетакогоматериала',{waitUntil:'domcontentloaded'});
 await search.locator('.search-empty').waitFor({timeout:14000});
 const failedSearch=await search.evaluate(()=>({
  message:document.querySelector('.search-empty')?.innerText,
  pending:document.querySelectorAll('.search-pending').length,
  fake:document.querySelectorAll('.search-grid .card').length
 }));
 assert.equal(failedSearch.pending,0);
 assert.equal(failedSearch.fake,0);
 assert(failedSearch.message?.includes('временно недоступен'));
 checks++;console.log('SEARCH_NETWORK_FAILURE_OK',JSON.stringify(failedSearch));
 await search.close();
 const archive=await browser.newPage({viewport:{width:390,height:844}});
 await archive.route('**/data/archive/catalog/all/1.json*',r=>r.abort());
 await archive.goto(base+'view.html?p=archive&section=all',{waitUntil:'domcontentloaded'});
 await archive.locator('main .source-loading').waitFor({timeout:14000});
 await archive.waitForTimeout(800);
 const failedArchive=await archive.locator('main').innerText();
 assert(failedArchive.includes('Не удалось загрузить материалы'),'archive failure message missing');
 assert(failedArchive.includes('Повторить загрузку'),'archive retry missing');
 checks++;console.log('ARCHIVE_NETWORK_FAILURE_OK',failedArchive.slice(0,140));
 await archive.close();
}finally{await browser.close()}
console.log('INDEPENDENT_ACCESSIBILITY_QA',checks,'PASS');
