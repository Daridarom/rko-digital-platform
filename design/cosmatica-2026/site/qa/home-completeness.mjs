import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.SITE_URL||'http://127.0.0.1:18769/design/cosmatica-2026/site/';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),args:['--no-sandbox']});
let total=0;
for(const width of [320,390,768,1440]){
 const page=await browser.newPage({viewport:{width,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let r=await page.goto(base,{waitUntil:'load',timeout:30000});
 await page.locator('.home-topic').first().waitFor();
 await page.waitForTimeout(250);
 assert.equal(r.status(),200);
 const metrics=await page.evaluate(()=>({
  titles:[...document.querySelectorAll('main section h2')].map(x=>x.textContent.trim()),
  cardLinks:[...document.querySelectorAll('main .home-topic,main .home-event,main .grid a.card')].map(x=>({title:x.querySelector('h3,strong')?.textContent.trim(),href:x.getAttribute('href')})),
  overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
  broken:[...document.images].filter(x=>x.complete&&!x.naturalWidth).map(x=>x.src),
  hasDirectReports:[...document.querySelectorAll('main a[href*="ref="]')].length
 }));
 for(let expected of ['Новости Общества','Афиша и календарь','Живые инициативы','Люди и устройство РКО','Материалы и библиотека','Летопись РКО'])assert(metrics.titles.includes(expected),width+' missing section '+expected);
 assert.equal(metrics.overflow,0,width+' overflow');
 assert.deepEqual(metrics.broken,[],width+' broken images');
 assert.deepEqual(errors,[],width+' page errors');
 for(let target of ['about-info','direction','collegium','contacts','users','tabs','donate','calendar'])assert(await page.locator('main a[href*="p='+target+'"]').count()>=1,width+' missing '+target);
 for(let id of ['gagarincy','sns','rusleo'])assert(await page.locator('main a.card[href*="id='+id+'"]').count()===1,width+' project missing '+id);
 assert(metrics.hasDirectReports>=2,width+' no original chronicle articles');
 for(let l of metrics.cardLinks)assert(l.href,width+' unlinked card: '+l.title);
 if(width===390){
   let links=await page.locator('main a[href]').evaluateAll(els=>[...new Set(els.map(a=>a.href))].filter(x=>x.includes('view.html?p=')));
   let fails=[];
   for(let u of links){let resp=await page.request.get(u,{timeout:20000});if(resp.status()!==200)fails.push({u,status:resp.status()})}
   assert.deepEqual(fails,[],'Missing routes');
   console.log('INTERNAL_LINK_TARGETS',links.length,'OK');
 }
 console.log('HOME_COMPLETE',width,'sections',metrics.titles.length,'cards',metrics.cardLinks.length,'reports',metrics.hasDirectReports);
 total++;await page.close();
}
await browser.close();
console.log('HOME_COMPLETE_TEST',total,'widths PASS');
