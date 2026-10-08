import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,
 ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),
 args:['--no-sandbox','--disable-dev-shm-usage']});
const base=process.env.SITE_URL||'http://127.0.0.1:8768/design/cosmatica-2026/site/';
let checks=0;
try{
 for(const width of [320,390,1440]){
  for(const slug of ['about','direction','news']){
   const page=await browser.newPage({viewport:{width,height:900}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'view.html?p='+slug,{waitUntil:'domcontentloaded'});
   await page.locator('.source-page').waitFor({timeout:20000});
   const data=await page.evaluate(()=>{
    const main=document.querySelector('main');
    return {heading:main.querySelector('h1')?.textContent||'',
      chars:main.innerText.length,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      cards:main.querySelectorAll('.source-card').length,
      names:[...main.querySelectorAll('.source-card h3')].map(x=>x.textContent),
      photos:main.querySelectorAll('.source-listing--direction img').length,
      date:main.querySelector('.source-card-date')?.textContent||'',
      cardTopic:main.querySelector('.source-card-topic')?.textContent||''};
   });
   assert(data.heading,'Missing page title');
   assert(data.overflow<=3,'Overflow '+slug+'/'+width);
   assert.equal(errors.length,0,'JS '+errors.join(';'));
   if(slug==='about')assert(data.chars>7500,'Manifesto truncated '+data.chars);
   if(slug==='direction'){
    assert(data.cards>=35,'Missing management members '+data.cards);
    // A person may hold several distinct positions; do not delete those source entries.
    assert(new Set(data.names).size>=30,'Too few distinct management members');
    assert(data.photos>=34,'Missing portraits '+data.photos);
    const expanded=page.locator('.source-card-more summary').first();
    if(await expanded.count()){await expanded.click();assert(await expanded.locator('..').getAttribute('open')!==null);}
   }
   if(slug==='news'){
    assert(data.cards>=15,'Incomplete current news page');
    assert(!data.names[0].includes('#'),'Duplicate project text in title');
    assert(data.cardTopic.length>0,'Project association lost');
    assert(/^\d{2}\.\d{2}\.\d{4}/.test(data.date),'Publication date missing');
   }
   if(width===390)await page.screenshot({path:'qa/screenshots/refined-'+slug+'.png'});
   console.log('PASS',slug,width,JSON.stringify({chars:data.chars,cards:data.cards,photos:data.photos}));
   checks++;
   await page.close();
  }
 }
}finally{await browser.close();}
console.log('EDITORIAL_REGRESSIONS',checks);
