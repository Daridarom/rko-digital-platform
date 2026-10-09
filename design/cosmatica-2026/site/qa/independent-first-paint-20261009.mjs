import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.SITE_URL||'http://127.0.0.1:8776/';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
const cases=[['archive', 'view.html?p=archive&section=all', 'source-runtime.mjs'],
 ['news','view.html?p=news','source-runtime.mjs'],
 ['search','view.html?p=search-results&q=космос','source-search.mjs'],
 ['empty-search','view.html?p=search-results','source-search.mjs']];
let checks=0;
try{
 for(const [name,route,block] of cases){
  const p=await browser.newPage({viewport:{width:390,height:844}});
  await p.route('**/integration/'+block+'*',r=>r.abort());
  await p.goto(new URL(route,base).href,{waitUntil:'domcontentloaded'});
  const stat=await p.evaluate(()=>({
   cards:document.querySelectorAll('main .card, main .source-card').length,
   loading:document.querySelector('main .source-loading')?.innerText||document.querySelector('main .search-pending')?.innerText,
   main:document.querySelector('main')?.innerText.slice(0,310),
   h1:document.querySelector('main h1')?.innerText||'',
   overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}));
  assert.equal(stat.cards,0,name+' synthetic cards shown');
  assert(stat.loading?.includes('архив'),name+' no content loading explanation');
  assert.equal(stat.overflow,0,name+' overflow');
  if(name==='archive')assert(stat.h1.includes('архив'),name+' falsely shows homepage');
  checks++;console.log('FIRST_PAINT_CLEAN',name,JSON.stringify(stat));
  await p.close();
 }
 for(const width of [320,390,768,1440]){
  const p=await browser.newPage({viewport:{width,height:844}});
  const js=[];p.on('pageerror',e=>js.push(e.message));
  const response=await p.goto(base+'view.html?p=search-results&q=космос',{waitUntil:'domcontentloaded'});
  assert.equal(response?.status(),200);
  await p.locator('.search-grid .card').first().waitFor({timeout:22000});
  const s=await p.evaluate(()=>({
    count:document.querySelectorAll('.search-grid .card').length,
    pending:document.querySelectorAll('.search-pending').length,
    heading:document.querySelector('.search-heading')?.innerText,
    sections:document.querySelector('#searchSection')?.value,
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    h1Count:document.querySelectorAll('main h1').length}));
  assert(s.count>0&&s.count<=20,'invalid search results');
  assert.equal(s.pending,0,'loading label not removed');
  assert.equal(s.overflow,0,'search overflow');
  assert.equal(s.h1Count,1,'multiple search h1');
  assert.deepEqual(js,[],'JS errors on search');
  checks++;console.log('REAL_SEARCH_OK',width,JSON.stringify(s));
  await p.close();
 }
 const p=await browser.newPage({viewport:{width:390,height:844}});
 await p.goto(base+'view.html?p=archive&section=all',{waitUntil:'domcontentloaded'});
 await p.locator('main .source-card').first().waitFor({timeout:16000});
 const a=await p.evaluate(()=>({
 cards:document.querySelectorAll('main .source-card').length,
 categories:document.querySelectorAll('main .source-archive-category').length,
 loading:document.querySelectorAll('main .source-loading').length,
 title:document.querySelector('main h1')?.innerText,
 overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
 }));
 assert.equal(a.cards,15,'archive page size');
 assert.equal(a.loading,0,'archive loader remained');
 assert.equal(a.overflow,0,'archive page overflow');
 checks++;console.log('REAL_ARCHIVE_OK',JSON.stringify(a));
 await p.close();
}finally{await browser.close()}
console.log('INDEPENDENT_FIRST_PAINT_QA',checks,'PASS');
