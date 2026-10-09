import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const base=process.env.SITE_URL||'http://127.0.0.1:8892/';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
let checks=0;
try{
 for(const width of [320,390,768,1440]){
  for(const [route,type] of [
   ['index.html','home'],
   ['view.html?p=articles','categories'],
   ['view.html?p=partners','partners'],
   ['view.html?p=news-item&ref=a886e9c067f72de12e','article']]){
   for(const variant of ['orbit','construct','poster']){
    const query=variant==='orbit'?'':(route.includes('?')?'&':'?')+'design='+variant;
    const url=base+route+query;
    const page=await browser.newPage({viewport:{width,height:900}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});
    if(type!=='home')await page.locator('main .source-page h1').waitFor({timeout:15000});
    if(['categories','partners'].includes(type))await page.locator('main .source-card').first().waitFor({timeout:15000});
    const state=await page.evaluate(()=>{
      const title=document.querySelector('main h1');
      const head=title?getComputedStyle(title):null;
      const cards=[...document.querySelectorAll('main .card,main .source-card')];
      const button=document.querySelector('.hero-actions .primary')||document.querySelector('main .primary')||document.querySelector('.icon-btn');
      return {title:title?.innerText.slice(0,70),weight:head?.fontWeight,size:parseFloat(head?.fontSize||0),font:head?.fontFamily,
       cards:cards.length,radius:cards.length?parseFloat(getComputedStyle(cards[0]).borderTopLeftRadius):null,
       buttonRadius:button?parseFloat(getComputedStyle(button).borderTopLeftRadius):null,
       bodyFont:getComputedStyle(document.body).fontFamily,
       red:getComputedStyle(document.documentElement).getPropertyValue('--red').trim(),
       overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
       design:document.documentElement.dataset.rkoDesign||'orbit'};
    });
    assert(state.title,'missing heading '+type);
    assert.equal(state.overflow,0,'horizontal overflow '+JSON.stringify({type,width,variant,state}));
    assert(state.bodyFont.includes('RKO Inter'),'Local Orbit Light font not restored');
    assert.equal(state.red,'#98161f','Orbit palette not applied');
    if(variant==='orbit'||variant==='construct')assert.equal(state.weight,'800','bold Orbit heading lost');
    if(variant==='poster')assert(state.font.includes('Russo One'),'poster font not enabled');
    if(variant!=='orbit'&&state.cards>0)assert.equal(state.radius,0,'rectangular concept not applied');
    if(variant==='orbit'&&state.cards>0)assert(state.radius>=12,'unexpected default card shape');
    if(type==='home'){
      assert(state.size>=44&&state.size<=85,'wrong heading size '+width+'='+state.size);
      assert(state.buttonRadius>=15,'buttons must remain rounded');
    }
    assert.deepEqual(errors,[],type+' JS exceptions '+errors.join(';'));
    console.log('ORBIT_STYLE_OK',type,width,variant,JSON.stringify({h1:state.size,weight:state.weight,cards:state.cards,radius:state.radius}));
    checks++;
    await page.close();
   }
  }
 }
}finally{await browser.close()}
console.log('ORBIT_STYLE_QA',checks,'PASS');
