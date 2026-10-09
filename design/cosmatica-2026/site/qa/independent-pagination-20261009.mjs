import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.SITE_URL||'http://127.0.0.1:8776/';
const b=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
let checks=0;
try{
 for(const [p,expected] of [[1,'1'],[5,'5'],[91,'91']]){
  const page=await b.newPage({viewport:{width:390,height:844}});
  const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(base+'view.html?p=search-results&q=космос&page='+p,{waitUntil:'domcontentloaded'});
  await page.locator('.source-search-pages').waitFor({timeout:17000});
  const nav=await page.evaluate(()=>{
   const root=document.querySelector('.source-search-pages');
   return {
    title:root?.querySelector('.source-page-summary')?.textContent,
    links:[...root.querySelectorAll('a')].map(a=>({text:a.textContent,href:a.getAttribute('href'),current:a.getAttribute('aria-current'),w:a.getBoundingClientRect().width,h:a.getBoundingClientRect().height})),
    total:document.querySelectorAll('.search-grid .card').length,
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
   };
  });
  assert(nav.title?.startsWith('Страница '+p+' из '),'result page count');
  assert(nav.total>0&&nav.total<=20,'search result page size');
  assert(nav.links.some(x=>x.text===expected&&x.current==='page'),'current result page');
  assert(nav.links.every(x=>x.w>=43&&x.h>=43),'tap targets less than 44px');
  assert.equal(nav.overflow,0,'search pager overflow');
  if(p===1){
   assert(nav.links.some(x=>x.text.includes('Последняя')),'missing last page shortcut');
   assert(nav.links.some(x=>x.text.includes('Вперёд')),'missing next page shortcut');
  }else if(p===91){
   assert(nav.links.some(x=>x.text.includes('Первая')),'missing first page shortcut');
   assert(!nav.links.some(x=>x.text.includes('Последняя')),'redundant last-page link');
  }else{
   assert(nav.links.some(x=>x.text.includes('Назад')),'missing back');
   assert(nav.links.some(x=>x.text.includes('Вперёд')),'missing forward');
  }
  assert.deepEqual(errs,[],'JS error');
  checks++;console.log('SEARCH_PAGER_OK',p,nav.title,'buttons',nav.links.map(x=>x.text).join(' / '));
  await page.close();
 }
 for(const width of [320,390]){
  const page=await b.newPage({viewport:{width,height:844}});
  await page.goto(base+'view.html?p=archive&section=all',{waitUntil:'domcontentloaded'});
  await page.locator('.source-archive-category').first().waitFor({timeout:16000});
  const geometry=await page.evaluate(()=>({
   categories:[...document.querySelectorAll('.source-archive-category')].map(a=>Math.round(a.getBoundingClientRect().height)),
   pages:[...document.querySelectorAll('.source-archive-pages a')].map(a=>Math.round(a.getBoundingClientRect().height)),
   overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
  }));
  assert(geometry.categories.every(x=>x>=44));
  assert(geometry.pages.every(x=>x>=44));
  assert.equal(geometry.overflow,0);
  checks++;console.log('ARCHIVE_TOUCH_TARGETS_OK',width);
  await page.close();
 }
}finally{await b.close()}
console.log('INDEPENDENT_PAGINATION_QA',checks,'PASS');
