import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

const base=process.env.SITE_URL||'http://127.0.0.1:8768/design/cosmatica-2026/site/';
const meta=JSON.parse(readFileSync('data/archive/search-index.json','utf8'));
const byUrl=new Map(meta.records.map(r=>[r.route,r]));
const pages=[
 ['news','news'],['departments','departments'],['partners','partners'],
 ['collegium','collegium'],['projects','projects'],['library','library'],
 ['articles-list','articles']
];
const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),args:['--no-sandbox']});
let checked=0;
const issues=[];
try{
 for(const width of [320,390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  page.on('pageerror',e=>issues.push('JS '+width+' '+e.message));
  for(const [kind] of pages){
   await page.goto(base+'view.html?p='+kind,{waitUntil:'domcontentloaded'});
   await page.locator('.source-page').waitFor();
   const stats=await page.evaluate(()=>({
    cards:document.querySelectorAll('.source-card').length,
    extra:document.querySelectorAll('.source-page .source-rich-body').length,
    details:document.querySelectorAll('.source-page .source-listing-intro').length,
    headings:[...document.querySelectorAll('.source-listing-intro h2,.source-listing-intro h3')].map(x=>x.textContent),
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    cardFont:getComputedStyle(document.querySelector('.source-card h3')).fontSize,
    textFont:document.querySelector('.source-card p')?getComputedStyle(document.querySelector('.source-card p')).fontSize:null,
   }));
   assert(stats.cards>0,'No listing cards '+kind+'/'+width);
   assert.equal(stats.extra,0,'Mirrored content below cards '+kind+'/'+width);
   assert.equal(stats.headings.length,0,'Repeated listing headings '+kind+'/'+width);
   assert(stats.overflow<=3,'Horizontal overflow '+kind+'/'+width+' '+stats.overflow);
   assert(parseFloat(stats.cardFont)>=16,'Small listing title '+kind+'/'+width);
   if(stats.textFont&&width<=390)assert(parseFloat(stats.textFont)>=13,'Small card body '+kind+'/'+width);
   checked++;
  }
  for(const section of ['news','articles','library']){
   await page.goto(base+'view.html?p=archive&section='+section+'&page=1',{waitUntil:'domcontentloaded'});
   await page.locator('.source-filterbar-global input').waitFor();
   await page.locator('.source-filterbar-global input').fill('косм');
   await page.locator('.source-filterbar-global button').click();
   await page.locator('#searchSection').waitFor();
   assert.equal(new URL(page.url()).searchParams.get('section'),section,'Archive scoped search '+section);
   assert.equal(await page.locator('#searchSection').inputValue(),section,'Category not selected '+section);
   const routes=await page.locator('.search-grid a.card').evaluateAll(a=>a.map(x=>x.getAttribute('href')));
   assert(routes.length>0,'No result for scope '+section);
   for(const route of routes)assert((byUrl.get(route)?.sections||[]).includes(section),'Wrong result category '+section+' '+route);
   assert(await page.locator('.search-category-select').isVisible(),'Invisible category filter');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert(overflow<=3,'Search overflow '+section+'/'+width);
   checked++;
  }
  if(width===390){
   await page.goto(base+'view.html?p=news',{waitUntil:'domcontentloaded'});
   await page.screenshot({path:'qa/screenshots/ux-news-mobile-390.png',fullPage:true});
   await page.goto(base+'view.html?p=archive&section=news',{waitUntil:'domcontentloaded'});
   await page.screenshot({path:'qa/screenshots/ux-archive-mobile-390.png',fullPage:true});
   await page.goto(base+'view.html?p=search-results&q=косм&section=news',{waitUntil:'domcontentloaded'});
   await page.screenshot({path:'qa/screenshots/ux-search-mobile-390.png',fullPage:true});
  }
  await page.close();
 }
}finally{await browser.close();}
console.log('LISTING_UX_SCOPED_SEARCH',JSON.stringify({checks:checked,errors:issues.length,index:meta.count}));
if(issues.length){issues.forEach(x=>console.error(x));process.exitCode=1;}
