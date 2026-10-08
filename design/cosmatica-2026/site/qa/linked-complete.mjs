import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.SITE_URL||'http://127.0.0.1:8768/design/cosmatica-2026/site/';
const links=Object.values(JSON.parse(readFileSync('data/linked-index.json','utf8')))
 .filter(x=>x.status==='ready'&&!x.alias);
assert.equal(links.length,156,'The approved 156 linked records must remain present');
const browser=await chromium.launch({headless:true,
 ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),
 args:['--no-sandbox','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:390,height:844}});
const errors=[];let passed=0;
const queue=[...links];
const normalize=s=>String(s||'').replace(/\u200b/g,'').replace(/\s+/g,' ').trim();
async function worker(){
 const page=await context.newPage();
 while(queue.length){
  const info=queue.shift();const id=info.file.slice(0,-5);
  const record=JSON.parse(readFileSync('data/linked/'+info.file,'utf8'));
  let exception=null;page.once('pageerror',e=>{exception=e.message;});
  try{
   await page.goto(base+'view.html?p='+info.type+'&ref='+id,
    {waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('.source-page h1').waitFor({timeout:20000});
   const actual=await page.locator('.source-page h1').innerText();
   assert.equal(normalize(actual),normalize(record.title),'wrong title '+id);
   assert.equal(exception,null,'JS '+id);
   const view=await page.evaluate(()=>({
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    external:[...document.querySelectorAll('a[href]')].filter(a=>new URL(a.href).origin!==location.origin).length
   }));
   assert(view.overflow<=3,'overflow '+id+': '+view.overflow);
   assert.equal(view.external,0,'external link '+id);
   passed++;
  }catch(e){errors.push(info.type+'/'+id+': '+e.message);}
 }
 await page.close();
}
await Promise.all(Array.from({length:4},()=>worker()));
await context.close();await browser.close();
console.log('ALL_LINKED_BROWSERS',JSON.stringify({checked:links.length,passed,errors:errors.length}));
if(errors.length){errors.slice(0,30).forEach(e=>console.error('FAIL',e));process.exitCode=1;}
