import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const BASE=process.env.SITE_URL||'http://127.0.0.1:8772/';
const chrome=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
let checks=0;
const news='view.html?p=news-item&ref=a886e9c067f72de12e';
const project='view.html?p=project&ref=68f882978fda38c429';
try{
 for(const width of [320,390,768,1440]){
  for(const [kind,path] of [['news',news],['project',project]]){
   const page=await chrome.newPage({viewport:{width,height:852}});
   const errors=[];
   page.on('pageerror',x=>errors.push(x.message));
   await page.goto(new URL(path,BASE).href,{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('.source-page h1').waitFor({timeout:16000});
   const data=await page.evaluate(()=>{
    const title=document.querySelector('.source-headline h1');
    const header=document.querySelector('.site-header');
    const docs=[...document.querySelectorAll('main .source-document')];
    const toc=[...document.querySelectorAll('main .rich-toc')];
    const body=document.querySelector('.rich-body');
    return {
     h1:title?.innerText||'',h1font:Math.round(parseFloat(getComputedStyle(title).fontSize)),
     headerPosition:getComputedStyle(header).position,
     docCount:docs.length,docLinks:docs.filter(x=>x.tagName==='A'&&x.href.length>0).length,
     docHref:docs[0]?.getAttribute('href')||'',
     headings:[...document.querySelectorAll('.source-documents h2,main .rich-section > h2')].map(x=>x.textContent),
     tocCount:toc.length,
     summary:document.querySelector('.source-headline .source-intro')?.innerText||'',
     details:document.querySelector('.source-details')?.innerText||'',
     wall:document.body.innerText.includes('Стена проекта'),
     maxWidth:document.documentElement.scrollWidth-document.documentElement.clientWidth,
     textLen:body?.innerText.length||0,
     firstImage:document.querySelector('main .rich-blocks img')?.getAttribute('src'),
    }
   });
   assert(data.h1.length>15,'missing article title');
   assert.equal(data.maxWidth,0,'horizontal overflow '+path+' '+width);
   assert(data.textLen>200,'missing article body '+path+' '+width);
   if(width<=640)assert.equal(data.headerPosition,'relative','header overlays article on '+width);
   else assert.equal(data.headerPosition,'sticky','desktop nav regression');
   if(kind==='news'){
    assert.equal(data.tocCount,0,'single-heading TOC');
    assert(data.summary.includes('Система Чартаева'),'missing intro');
    assert(!data.details.includes('Сведения'),'unnamed metadata leaked');
    if(width===390)assert(data.h1font<=31,'title too large on mobile');
   }else{
    assert.equal(data.docCount,1,'duplicate project PDF');
    assert.equal(data.docLinks,1,'unclickable document');
    assert.equal(data.docHref,'assets/source/b2384db3edb24a6f58ebd12b.pdf','document should use archived local PDF');
    assert(!data.wall,'empty project wall');
    assert.equal(data.headings.filter(s=>s==='Документы').length,1,'duplicate documents heading');
   }
   assert.deepEqual(errors,[],'JS errors '+path+': '+errors.join(';'));
   console.log('READABILITY_OK',kind,width,JSON.stringify(data));
   checks++;
   if(width===390&&kind==='news'){
    await page.evaluate(()=>window.scrollTo({top:700,behavior:'instant'}));
    const top=await page.evaluate(()=>({scroll:window.scrollY,headerBottom:Math.round(document.querySelector('.site-header').getBoundingClientRect().bottom)}));
    assert(top.scroll>400 && top.headerBottom<0,'header overlays scrolled content');
    const btn=page.locator('.menu-btn');
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await btn.click();
    assert.equal(await btn.getAttribute('aria-expanded'),'true','mobile menu not open');
    assert(await page.locator('.mobile-drawer.open a').count()>5,'mobile menu links missing');
    assert.equal(await page.evaluate(()=>getComputedStyle(document.body).overflow),'hidden','mobile backdrop scroll not locked');
    await btn.click();
    assert.equal(await btn.getAttribute('aria-expanded'),'false','mobile menu close');
    assert.notEqual(await page.evaluate(()=>getComputedStyle(document.body).overflow),'hidden','mobile scrolling not restored');
    console.log('MOBILE_SCROLL_AND_MENU_OK',JSON.stringify(top));
    checks++;
   }
   await page.close();
  }
 }
}finally{await chrome.close()}
console.log('SCREENSHOT_REGRESSIONS',checks,'PASS');
