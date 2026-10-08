import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.SITE_URL||'http://127.0.0.1:8768/design/cosmatica-2026/site/';
const index=JSON.parse(readFileSync('data/linked-index.json','utf8'));
const catalog=JSON.parse(readFileSync('data/archive/catalog-report.json','utf8'));
const byKind=new Map();
for(const x of Object.values(index)){
 if(x.status!=='ready'||x.alias||!x.file?.endsWith('.json'))continue;
 const rec=JSON.parse(readFileSync('data/linked/'+x.file,'utf8'));
 const k=rec.originalKind||rec.slug;
 if(!byKind.has(k))byKind.set(k,[]);
 byKind.get(k).push({ref:x.file.slice(0,-5),type:x.type,title:rec.title,chars:rec.sourceTextCharacters||0});
}
const sample=[];
for(const [kind,rows] of byKind){
 rows.sort((a,b)=>a.ref.localeCompare(b.ref));
 const count=Math.min(25,rows.length),step=rows.length/count;
 for(let n=0;n<count;n++)sample.push({...rows[Math.floor(n*step)],kind});
}
console.log('BROWSER_SAMPLE_START',JSON.stringify({sample:sample.length,kinds:byKind.size,archive:catalog.renderable}));
const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:390,height:844}});
const queue=[...sample];const failures=[];let passed=0;
async function worker(){
 const page=await context.newPage();
 await page.route('**/*',route=>{
  const url=route.request().url();
  if(url.startsWith('https://')&&!url.includes('127.0.0.1'))return route.abort();
  return route.continue();
 });
 while(queue.length){
  const item=queue.shift();let issue=null;
  const onError=e=>{issue ||= e.message;};
  page.on('pageerror',onError);
  try{
   await page.goto(base+'view.html?p='+encodeURIComponent(item.type)+'&ref='+item.ref,{waitUntil:'domcontentloaded',timeout:20000});
   await page.locator('.source-page h1').waitFor({timeout:8000});
   const state=await page.evaluate(()=>({
    h1:document.querySelector('.source-page h1')?.textContent?.replace(/\s+/g,' ').trim(),
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    text:document.querySelector('.source-page')?.innerText?.length||0,
    media:[...document.querySelectorAll('.rich-video iframe')].length
   }));
   const expected=item.title.replace(/\s+/g,' ').trim();
   assert.equal(state.h1,expected,'title mismatch');
   assert(state.overflow<=3,'horizontal scrolling: '+state.overflow);
   assert(state.text>=(item.chars>300?80:20),'empty editorial content');
   assert.equal(state.media,0,'video must not load until clicked');
   assert(!issue,'JavaScript error: '+issue);passed++;
  }catch(e){failures.push(item.kind+'/'+item.ref+' '+e.message);}
  page.off('pageerror',onError);
 }
 await page.close();
}
await Promise.all(Array.from({length:4},worker));
await context.close();await browser.close();
console.log('ARCHIVE_BROWSER_SAMPLE',JSON.stringify({passed,sampled:sample.length,failed:failures.length,kinds:byKind.size}));
for(const msg of failures.slice(0,25))console.error('FAIL',msg);
if(failures.length)process.exitCode=1;
