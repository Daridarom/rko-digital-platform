import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.SITE_URL||'http://127.0.0.1:8772/';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),args:['--no-sandbox']});
let checks=0, failures=[];
try{
 for(const width of [320,390,768,1440]){
  for(const route of ['view.html?p=partners','view.html?p=archive&section=partners']){
   const page=await browser.newPage({viewport:{width,height:900}});
   const errs=[];page.on('pageerror',e=>errs.push(e.message));
   await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:25000});
   await page.locator('main .source-card').first().waitFor({timeout:16000});
   await page.waitForTimeout(500);
   await page.evaluate(async()=>{
    const images=[...document.querySelectorAll('main .source-card img')];
    for(const img of images)img.loading='eager';
    await Promise.all(images.map(img=>img.decode().catch(()=>null)));
   });
   const info=await page.evaluate(()=>{
    const cards=[...document.querySelectorAll('main .source-card')];
    const grid=document.querySelector('.source-grid');
    return {total:cards.length,linked:cards.filter(c=>c.tagName==='A'&&c.getAttribute('href')).length,
      cols:getComputedStyle(grid).gridTemplateColumns.split(' ').length,
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      images:cards.map(c=>({src:c.querySelector('img')?.getAttribute('src'),w:Math.round(c.querySelector('img')?.getBoundingClientRect().width||0),
          natural:c.querySelector('img')?.naturalWidth||0})),
      titles:cards.map(c=>c.querySelector('h3')?.innerText.trim()),
      media:cards.map(c=>Math.round(c.querySelector('.source-card-media')?.getBoundingClientRect().width||0))
    };
   });
   try {
    assert.equal(info.total,13,route+' cards');
    assert.equal(info.linked,13,route+' clickable');
    assert.equal(info.cols,width>=790?2:1,route+' columns');
    assert(info.overflow<=2,route+' horizontal overflow '+info.overflow);
    assert(info.titles.every(Boolean),route+' blank titles');
    assert(info.images.every(x=>x.w<=75),route+' logos oversized '+JSON.stringify(info.images));
    assert(info.images.every(x=>x.natural>=100),route+' blurred/missing low-res logos '+JSON.stringify(info.images));
    assert.equal(errs.length,0,route+' JS errors '+errs);
    checks++;
    console.log('PARTNERS_OK',width,route,'cards',info.total,'columns',info.cols,'logos',info.images.length,'max_logo_width',Math.max(...info.images.map(x=>x.w)));
   }catch(e){failures.push(e.message);console.error('PARTNERS_FAIL',e.message);}
   if(width===390&&route.includes('section=partners')){
      const href=await page.locator('main .source-card').first().getAttribute('href');
      await page.goto(new URL(href,base).href,{waitUntil:'domcontentloaded'});
      await page.waitForTimeout(250);
      const title=await page.locator('main h1').innerText();
      assert(title.length>5&&!title.includes('Материал не найден'),'Partner card destination');
      checks++;console.log('PARTNER_DETAIL_OK',title.slice(0,70));
   }
   await page.close();
  }
 }
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto(base+'view.html?p=archive&section=library',{waitUntil:'domcontentloaded'});
 await page.locator('.source-card').first().waitFor();
 const photos=await page.locator('.source-card img[src*="book-covers/"]').count();
 assert(photos>0,'Nested local book cover images are not recognized');
 checks++; console.log('BOOK_COVERS_OK',photos,'nested book-cover images recognized on catalog page');
 await page.close();
}finally{await browser.close();}
assert.deepEqual(failures,[],'Partner mobile regressions');
console.log('PARTNERS_AND_BOOKS_QA',checks,'PASS');
