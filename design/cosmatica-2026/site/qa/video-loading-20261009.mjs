import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.SITE_URL||'http://127.0.0.1:8774/';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
let checks=0;
try{
 for(const slug of ['partners','collegium','users','library','departments','news']){
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.route('**/integration/source-runtime.mjs*',r=>r.abort());
  await page.goto(base+'view.html?p='+slug,{waitUntil:'domcontentloaded',timeout:25000});
  const found=await page.evaluate(()=>({
   loading:!!document.querySelector('#main .source-loading[role="status"]'),
   fixture:document.querySelector('#main')?.textContent?.includes('Материал 01'),
   cards:document.querySelectorAll('#main .card,#main .source-card').length
  }));
  assert(found.loading&&!found.fixture&&found.cards===0,slug+' fixture visible while waiting: '+JSON.stringify(found));
  checks++;console.log('LOADING_NO_FIXTURE_OK',slug);
  await page.close();
 }
 for(const width of [320,390,768,1440]){
  for(const [slug,total] of [['collegium',19],['users',24],['library',15],['partners',13]]){
   const page=await browser.newPage({viewport:{width,height:852}});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(base+'view.html?p='+slug,{waitUntil:'domcontentloaded',timeout:25000});
   await page.locator('#main .source-card').first().waitFor({timeout:15000});
   const info=await page.evaluate(async()=>{
    const cards=[...document.querySelectorAll('#main .source-card')];
    const ims=[...document.querySelectorAll('#main .source-card img')];
    ims.forEach(i=>i.loading='eager');
    await Promise.all(ims.map(i=>i.decode().catch(()=>{})));
    await new Promise(res=>setTimeout(res,200));
    return {count:cards.length,cols:getComputedStyle(document.querySelector('.source-grid')).gridTemplateColumns.split(' ').length,
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      fixture:document.querySelector('#main').innerText.includes('Материал 01'),
      iconCards:cards.filter(c=>c.classList.contains('source-card--text')).length,
      oversized:ims.filter(i=>i.naturalWidth>0&&i.naturalHeight>0&&Math.max(i.naturalWidth,i.naturalHeight)<=96&&Math.max(i.getBoundingClientRect().width,i.getBoundingClientRect().height)>96).length};
   });
   assert.equal(info.count,total,slug+' cards count');
   assert.equal(info.overflow,0,slug+' overflow '+width);
   assert(!info.fixture,slug+' synthetic card');
   assert.equal(info.oversized,0,slug+' tiny images enlarged');
   if(['collegium','users'].includes(slug))assert(info.iconCards>=total-2,slug+' low-quality images not text-formatted');
   assert.deepEqual(errors,[],slug+' JS errors');
   checks++;console.log('ARCHIVE_VIDEO_LOADED_OK',slug,width,'textcards',info.iconCards);
   await page.close();
  }
 }
}finally{await browser.close()}
console.log('VIDEO_LOADING_QA',checks,'PASS');
