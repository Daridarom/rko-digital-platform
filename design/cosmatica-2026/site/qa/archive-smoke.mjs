import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';

const base=process.env.SITE_URL||'http://127.0.0.1:8768/design/cosmatica-2026/site/';
const sections=JSON.parse(readFileSync('data/archive/sections.json','utf8')).filter(x=>x.count);
assert(sections.length>=8,'Missing archive sections');
const browse=['all','news','library','articles','projects','poster','users','glossary','departments','collegium'];
const selected=browse.filter(x=>sections.some(s=>s.key===x&&s.count));
const browser=await chromium.launch({headless:true,
 ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),
 args:['--no-sandbox','--disable-dev-shm-usage']});
const errs=[];
let passed=0,clicks=0;
try{
 for(const width of [320,390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  page.on('pageerror',err=>errs.push('JS width '+width+': '+err.message));
  for(const key of selected){
   const source=sections.find(s=>s.key===key);
   const url=base+'view.html?p=archive&section='+key+'&page=1';
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.locator('.source-page--archive h1').waitFor({timeout:20000});
   const m=await page.evaluate(()=>({
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    title:document.querySelector('.source-page--archive h1')?.textContent,
    count:document.querySelectorAll('.source-page--archive .source-card').length,
    links:[...document.querySelectorAll('.source-page--archive .source-card')].map(x=>x.getAttribute('href')),
    nav:document.querySelectorAll('.source-archive-category').length,
    total:document.querySelector('.source-archive-summary')?.textContent||''
   }));
   assert(m.title===source.title,'Incorrect archive title '+key+' '+width);
   assert(m.overflow<=3,'Overflow '+key+' '+width+' '+m.overflow);
   assert(m.count>0&&m.count<=15,'Wrong cards per page '+key+' '+width+' '+m.count);
   assert.equal(m.links.filter(x=>!x||!x.startsWith('view.html?p=')).length,0,'Nonlocal archive card link '+key);
   assert(m.nav>=8,'Archive categories missing '+key);
   assert(m.total.includes(String(source.pages)),'Pager total incorrect '+key);
   passed++;
   if(width===390&&(key==='all'||key==='library'||key==='news'))
    await page.screenshot({path:'qa/screenshots/archive-'+key+'-390.png'});
   if(source.pages>1){
    await page.locator('.source-archive-pages a').last().click();
    await page.locator('.source-page--archive h1').waitFor();
    assert(new URL(page.url()).searchParams.get('page')===String(source.pages),'Last page navigation failed '+key);
    await page.locator('.source-archive-pages a').first().click();
    assert(new URL(page.url()).searchParams.get('page')==='1','First page navigation failed '+key);
    clicks++;
   }
  }
  await page.close();
 }
}finally{await browser.close();}
console.log('ARCHIVE_BROWSING',JSON.stringify({widths:4,sections:selected.length,passed,pagination:clicks,errors:errs.length}));
if(errs.length){errs.slice(0,10).forEach(x=>console.error(x));process.exitCode=1;}
