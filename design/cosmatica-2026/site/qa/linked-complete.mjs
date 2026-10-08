import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.SITE_URL||'http://127.0.0.1:8768/design/cosmatica-2026/site/';
const all=Object.values(JSON.parse(readFileSync('data/linked-index.json','utf8')))
 .filter(x=>x.status==='ready'&&!x.alias);
assert(all.length>=156,'The previously approved linked records must remain present');
const extras=new Map();
for(const item of all.slice(156)){
 const n=extras.get(item.type)||[];
 if(n.length<12){n.push(item);extras.set(item.type,n);}
}
const links=[...all.slice(0,156),...[...extras.values()].flat()];
assert(links.length>=156,'Cross-section browser sample unexpectedly small');
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
    external:[...document.querySelectorAll('a[href]')].filter(a=>new URL(a.href).origin!==location.origin)
      .filter(a=>!(a.dataset.originalDownload==='cosmatica'&&
       /^https:\/\/cosmatica\.org\/files\/download\/\d+\/[a-f0-9]+$/i.test(a.href)))
      .filter(a=>!(a.dataset.contentExternal==='true'&&a.href.startsWith('https://')&&
        a.target==='_blank'&&a.rel.includes('noopener')))
      .map(a=>a.href)
   }));
   assert(view.overflow<=3,'overflow '+id+': '+view.overflow);
   assert.equal(view.external.length,0,'unapproved external link '+id+': '+view.external.join(','));
   passed++;
  }catch(e){errors.push(info.type+'/'+id+': '+e.message);}
 }
 await page.close();
}
await Promise.all(Array.from({length:4},()=>worker()));
await context.close();await browser.close();
console.log('ALL_LINKED_BROWSERS',JSON.stringify({checked:links.length,passed,errors:errors.length}));
if(errors.length){errors.slice(0,30).forEach(e=>console.error('FAIL',e));process.exitCode=1;}
