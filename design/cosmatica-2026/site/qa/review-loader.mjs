import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.SITE_URL || 'http://127.0.0.1:8768/design/cosmatica-2026/site/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let count=0;
try{
 for(const slug of ['article','poster-item','project']){
  for(const [name,width,height] of [['desktop',1440,960],['mobile',390,844]]){
   const page=await browser.newPage({viewport:{width,height}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'view.html?p='+slug+'&layout=full&review=1',{waitUntil:'networkidle'});
   const upload=page.locator('.rich-review-panel input[type="file"]');
   await upload.waitFor();
   const fake={
    type:slug,title:'Проверяемый полный материал',sourceHash:'fixture-hash',sourceUrl:'https://cosmatica.org/',
    blocks:[
     {type:'heading',level:2,text:'Раздел 1'},
     ...Array.from({length:110},(_,i)=>({type:'paragraph',text:'Тестовый содержательный абзац '+i+'. '+('Подробный материал для проверки переноса длинных текстов. ').repeat(3)})),
     {type:'list',ordered:true,items:['Первый пункт','Второй пункт']},
     {type:'table',rows:[['Параметр','Значение'],['Год','2026']]}
    ],editorialReviewed:false,rightsVerified:false
   };
   const bytes=Buffer.from(JSON.stringify(fake));
   await upload.setInputFiles({name:'content.json',mimeType:'application/json',buffer:bytes});
   await page.waitForFunction(()=>document.querySelector('.rich-review-status')?.textContent.includes('Материал загружен'));
   const result=await page.evaluate(()=>{
    const root=document.querySelector('.rich-cms-page');
    return {h1:root?.querySelector('h1')?.textContent,paragraphs:root?.querySelectorAll('.rich-layout .rich-blocks p').length,
    table:root?.querySelectorAll('.rich-layout table').length,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    status:root?.querySelector('.rich-review-status')?.textContent,external:[...root.querySelectorAll('a')].filter(a=>new URL(a.href).origin!==location.origin).length};
   });
   assert.equal(result.h1,'Проверяемый полный материал',slug+'/'+name);
   assert.equal(result.paragraphs,110,slug+'/'+name+' lost paragraphs');
   assert.equal(result.table,1,slug+'/'+name+' lost table');
   assert.equal(result.external,0,slug+'/'+name+' opens outside domain');
   assert(result.overflow<=3,slug+'/'+name+' overflow '+result.overflow);
   assert.equal(errors.length,0,slug+'/'+name+' '+errors.join(';'));
   count++;
   console.log('PASS review',slug,name,result.paragraphs,'paragraphs');
   await page.close();
  }
 }
 // Never silently display a different type of export.
 const p=await browser.newPage();
 await p.goto(base+'view.html?p=article&layout=full&review=1',{waitUntil:'networkidle'});
 await p.locator('.rich-review-panel input[type="file"]').setInputFiles({name:'wrong.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({type:'project',title:'wrong',blocks:[{type:'paragraph',text:'hello'}]}))});
 await p.waitForFunction(()=>document.querySelector('.rich-review-status')?.textContent.includes('Невозможно загрузить'));
 assert((await p.locator('.rich-review-status').innerText()).includes('не соответствует'));
 await p.close();count++;
 console.log('RESULT',count,'review-loader checks');
}finally{await browser.close()}
