import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.SITE_URL || 'http://127.0.0.1:8768/design/cosmatica-2026/site/';
const routes=['home','news','news-item','poster','poster-item','calendar','about','about-info','direction','collegium','collegium-item','partners','partner','contacts','departments','department','projects','project','users','profile','articles','articles-list','article','library','book','tabs','donate','login','restore','register','search','search-results'];
const browser=await chromium.launch({headless:true,
 ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),args:['--no-sandbox']});
const errors=[];
let checks=0;
async function inspect(page,slug,device){
 const errs=[];
 page.on('pageerror',error=>errs.push(error.message));
 const url=base+(slug==='home'?'index.html':'view.html?p='+slug+(slug==='search-results'?'&q=%D0%93%D0%B0%D0%B3%D0%B0%D1%80%D0%B8%D0%BD':''));
 await page.goto(url,{waitUntil:'load',timeout:25000});
 await page.locator('main').waitFor();
 const stats=await page.evaluate(()=>{
  const w=document.documentElement.clientWidth;
  return {bodyW:document.documentElement.scrollWidth,w,h1:document.querySelector('h1')?.textContent.trim(),
   broken:[...document.images].filter(x=>x.complete&&!x.naturalWidth).map(x=>x.src),
   external:[...document.querySelectorAll('a[href]')].filter(a=>{const u=new URL(a.href);return /^https?:/.test(u.protocol)&&u.origin!==location.origin}).filter(a=>!(a.dataset.originalDownload==='cosmatica'&&/^https:\/\/cosmatica\.org\/files\/download\/\d+\/[a-f0-9]+$/i.test(a.href))).filter(a=>!(a.dataset.contentExternal==='true'&&a.href.startsWith('https://')&&a.target==='_blank'&&a.rel.includes('noopener'))).map(x=>x.href),
   fake:[...document.querySelectorAll('main a[href="#"]')].map(x=>x.textContent.trim())};
 });
 assert(stats.h1,'H1 is empty on '+slug);
 assert(stats.bodyW-stats.w<=3,'Horizontal overflow '+slug+' '+device+' '+JSON.stringify(stats));
 assert.equal(stats.broken.length,0,'Broken images on '+slug+' '+device+':'+JSON.stringify(stats.broken));
 assert.equal(stats.external.length,0,'External links on '+slug+' '+device+':'+JSON.stringify(stats.external));
 assert.equal(errs.length,0,'JS exceptions '+slug+' '+device+':'+errs.join('; '));
 checks++;
 await page.close();
}
for(const [device,width,height] of [['desktop',1440,960],['mobile',390,844]]){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
 for(const route of routes){
  const page=await context.newPage();
  try{await inspect(page,route,device)}
  catch(e){errors.push(e.message);console.error('FAIL',device,route,e.message.slice(0,330))}
 }
 await context.close();
}
async function test(name,route,fn){
 const page=await browser.newPage({viewport:{width:390,height:844}});
 try{
  await page.goto(base+'view.html?p='+route,{waitUntil:'load'});
  await fn(page);checks++;
  console.log('PASS',name);
 }catch(e){errors.push(name+': '+e.message);console.error('FAIL',name,e.message.slice(0,500))}
 finally{await page.close()}
}
await test('compact search','search-results&q=Гагарин',async page=>{
 const coords=await page.evaluate(()=>{
  const a=document.querySelector('#searchInput').getBoundingClientRect();
  const b=document.querySelector('#searchForm button').getBoundingClientRect();
  return {sameRow:Math.abs(a.y-b.y)<12,width:a.width,hero:document.querySelector('.page-hero h1')?.textContent,lede:document.querySelector('.page-hero .lede')?.textContent}
 });
 assert(coords.sameRow,'search submit button not inline');
 assert(coords.width<290,'search field is too wide');
 assert(coords.lede.includes('Гагарин'),'search description does not reflect query');
});
await test('mobile menu overlay','projects',async page=>{
 const initial=await page.locator('main').evaluate(x=>x.getBoundingClientRect().top);
 await page.locator('.menu-btn').click();
 assert.equal(await page.locator('.mobile-drawer').evaluate(x=>getComputedStyle(x).position),'fixed');
 assert.equal(await page.locator('.menu-btn').getAttribute('aria-expanded'),'true');
 const after=await page.locator('main').evaluate(x=>x.getBoundingClientRect().top);
 assert.equal(Math.round(initial),Math.round(after),'menu pushes page down');
 await page.mouse.click(5,800);
 assert.equal(await page.locator('.menu-btn').getAttribute('aria-expanded'),'false');
});
await test('auth demo, no submission','login',async page=>{
 await page.locator('input[type="email"]').fill('demo@example.org');
 await page.locator('input[type="password"]').fill('example-only-password');
 await page.locator('.demo-auth button[type="submit"]').click();
 assert((await page.locator('.form-feedback').innerText()).includes('не выполняется'));
});
await test('donation demo, no payment','donate',async page=>{
 await page.locator('.demo-amount[data-amount="3000"]').click();
 await page.locator('.demo-pledge-submit').click();
 assert((await page.locator('.demo-pledge .form-feedback').innerText()).includes('3 000') || (await page.locator('.demo-pledge .form-feedback').innerText()).includes('3 000'));
});
for(const id of ['gagarincy','rusleo','sns','chotv','slovo','books_reprint','sport']){
 await test('project '+id,'project&id='+id,async page=>{
  assert((await page.locator('main').innerText()).length>400,'project lacks content');
  assert.equal(await page.locator('a[href^="https://cosmatica.org"]:not([data-original-download="cosmatica"])').count(),0,'unapproved source link retained');
 });
}
await browser.close();
console.log('RESULT',checks,'checks',errors.length,'errors');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
// Extended 5-width mobile header, cards and search regression suite.
await import('./mobile-refinement.mjs');
