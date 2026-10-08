import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.SITE_URL||'http://127.0.0.1:8772/';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
let tests=0;
const cases=[
 ['archive-mixed','view.html?p=archive&section=all&page=276'],
 ['archive-articles','view.html?p=archive&section=articles'],
 ['departments','view.html?p=departments'],
 ['users','view.html?p=users'],
 ['news','view.html?p=news'],
 ['department-detail','view.html?p=department&ref=6efb69953f3fc0f727'],
 ['project-long','view.html?p=project&ref=68f882978fda38c429'],
 ['news-long','view.html?p=news-item&ref=a886e9c067f72de12e']
];
try{
 for(const width of [320,390,768,1440]){
  for(const [tag,route] of cases){
   const page=await browser.newPage({viewport:{width,height:844}});
   const errs=[];page.on('pageerror',e=>errs.push(e.message));
   await page.goto(new URL(route,base).href,{waitUntil:'domcontentloaded',timeout:25000});
   await page.locator('#main h1').waitFor({timeout:18000});
   if(['archive-mixed','archive-articles','departments','users','news'].includes(tag)){
    await page.locator('#main .source-card').first().waitFor({timeout:18000});
   }else{
    await page.locator('#main .rich-blocks').first().waitFor({timeout:18000});
   }
   const details=await page.evaluate(()=>{
    const cards=[...document.querySelectorAll('#main .source-card')];
    const groups=[...document.querySelectorAll('#main .source-content-group')];
    const images=[...document.querySelectorAll('#main .source-card img')];
    const text=[...document.querySelectorAll('#main .source-card--text')];
    const richAnchors=[...document.querySelectorAll('#main .rich-blocks a[href]')];
    const headings=[...document.querySelectorAll('#main .rich-blocks h2')];
    return {cards:cards.length,groups:groups.length,groupNames:groups.map(x=>x.querySelector('h2')?.innerText),
     missingInGroups:groups.length?cards.filter(c=>!c.closest('.source-content-group')).length:0,
     linkedCards:cards.filter(x=>x.tagName==='A').length,textCards:text.length,
     illustrations:images.length,realImages:images.filter(x=>x.src).length,
     largeIntrinsicThumbs:images.filter(x=>x.hasAttribute('srcset')).length,
     headline:document.querySelector('#main h1')?.textContent,
     richAnchors:richAnchors.length,anchorHrefs:richAnchors.slice(0,12).map(x=>x.getAttribute('href')),
     headings:headings.map(x=>x.textContent),bodyLength:(document.querySelector('.rich-body')||document.querySelector('.source-rich-body'))?.innerText.length||0,
     overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
     emptyCards:cards.filter(x=>!x.querySelector('h3')?.innerText).length
    };
   });
   try{
    assert.equal(details.overflow,0,'horizontal overflow '+tag+' '+width);
    assert.equal(details.emptyCards,0);
    assert.equal(errs.length,0,'page error '+tag+' '+errs.join('|'));
    if(tag==='archive-mixed'){
     assert(details.groups>1,'mixed archive not grouped');
     assert.equal(details.missingInGroups,0);
     assert.equal(details.cards,15);
     assert.equal(details.linkedCards,15);
    }
    if(tag==='archive-articles'){
     assert(details.groups>=1,'articles not grouped');
     assert(details.textCards>=1,'text cards missing');
    }
    if(tag==='departments'){
     assert(details.textCards>=15,'departments no readable identity cards');
     assert.equal(details.cards,31,'department count');
    }
    if(tag==='users'){
     assert(details.textCards>=0,'users');
     assert(details.cards>=15,'users count');
    }
    if(tag==='news')assert(details.cards>=15,'news cards missing');
    if(tag==='department-detail'){
      assert(details.bodyLength>10,'department info missing');
      assert(details.richAnchors>=1,'department email not clickable');
      assert(details.anchorHrefs.some(h=>h.startsWith('mailto:')),'department mailto unavailable');
    }
    if(tag==='project-long'){
      assert(details.headings.some(x=>x.includes('ОБЩИЕ ПОЛОЖЕНИЯ')),'project not sectioned');
      assert(details.headings.length>=6,'insufficient chapter blocks');
      assert(details.richAnchors>0,'project references not clickable');
    }
    if(tag==='news-long')assert(details.richAnchors>=0,'news document');
    tests++;console.log('CONTENT_SYSTEM_OK',tag,width,JSON.stringify(details).slice(0,600));
   }catch(err){console.error('CONTENT_SYSTEM_FAIL',tag,width,err.message,JSON.stringify(details).slice(0,1700));throw err}
   await page.close();
  }
 }
}finally{await browser.close()}
console.log('CONTENT_SYSTEM_TESTS',tests,'PASS');
