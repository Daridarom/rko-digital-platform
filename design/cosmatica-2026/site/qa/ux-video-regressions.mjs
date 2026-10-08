import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.SITE_URL||'http://127.0.0.1:8781/design/cosmatica-2026/site/';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),args:['--no-sandbox']});
let checks=0;const failures=[];
try{
 for(const width of [320,390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const go=async key=>{await page.goto(base+(key==='home'?'index.html':'view.html?p='+key),{waitUntil:'domcontentloaded'});await page.locator('main').waitFor();if(key==='departments'||key==='library')await page.locator('.source-page .source-card').first().waitFor({timeout:15000});};
  try{
   await go('home');
   const home=await page.evaluate(()=>({extra:document.querySelectorAll('.source-home-archive').length,
     intro:document.querySelectorAll('.home-hero').length,
     archive:document.querySelectorAll('.home-archive-link a[href*="p=archive"]').length,
     scroll:document.documentElement.scrollWidth-document.documentElement.clientWidth,
     sections:document.querySelectorAll('main > section').length}));
   assert.equal(home.extra,0,'Legacy homepage dump still visible '+width);
   assert.equal(home.intro,1);assert.equal(home.archive,1);
   assert(home.scroll<=3);checks++;
   await go('departments');
   assert.equal(await page.locator('.source-page .source-rich-body').count(),0,'Duplicate region list '+width);
   assert(await page.locator('.source-page .source-card').count()>5,'Missing department cards');checks++;
   await go('library');
   assert.equal(await page.locator('.source-gallery-disclosure').count(),0,'Gallery of uncaptained thumbnails below books '+width);
   assert(await page.locator('.source-listing--library .source-card').count()>3);
   // Only visible lazy images should be loaded. Scroll and decode before assessing
   // image reliability; checking seven offscreen covers immediately is a false alarm.
   const imgs=page.locator('.source-listing--library .source-card-media img');
   for(let i=0;i<Math.min(5,await imgs.count());i++){
    const img=imgs.nth(i);
    await img.scrollIntoViewIfNeeded();
    await img.evaluate(async el=>{try{await el.decode();}catch{}});
   }
   const pics=await imgs.evaluateAll(xs=>xs.slice(0,5).map(x=>({loaded:x.complete&&x.naturalWidth>0,ratio:x.getBoundingClientRect().height/Math.max(1,x.getBoundingClientRect().width)})));
   assert(pics.filter(x=>x.loaded).length>=4,'Book cover thumbnails failed after entering viewport '+JSON.stringify(pics));
   checks++;
   await go('login');
   assert.equal(await page.locator('.auth-mode-nav a').count(),2);
   assert.equal(await page.locator('.auth-mode-nav a[aria-current="page"]').innerText(),'Вход');
   assert(await page.locator('.auth-explainer').innerText().then(t=>t.includes('официальном сайте РКО')));
   await page.locator('.auth-mode-nav a[href*="p=register"]').click();
   assert.equal(await page.locator('.auth-mode-nav a[aria-current="page"]').innerText(),'Регистрация');
   checks++;
   const over=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert(over<=3,'Page overflow '+width+': '+over);
   assert.equal(errors.length,0,'Page JS '+errors.slice(0,3));
   if(width===390){
    for(const target of ['home','library','departments','login']){
     await go(target);
     await page.screenshot({path:'qa/screenshots/video-review-'+target+'-390.png',fullPage:false});
    }
   }
  }catch(e){failures.push(width+': '+e.message);}
  await page.close();
 }
}finally{await browser.close();}
console.log('VIDEO_UX_REGRESSION',JSON.stringify({checks,failed:failures.length,resolutions:4,errors:failures}));
if(failures.length)process.exitCode=1;
