import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
const base=process.env.SITE_URL||'http://127.0.0.1:8768/design/cosmatica-2026/site/';
const source=JSON.parse(readFileSync('integration/page-map.json','utf8')).entries;
const links=JSON.parse(readFileSync('data/linked-index.json','utf8'));
const browser=await chromium.launch({headless:true,
 ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),
 args:['--no-sandbox','--disable-dev-shm-usage']});
const problems=[];
let checked=0;
async function test(slug,device,width,height,href,full,expectedTitle=null){
 const page=await browser.newPage({viewport:{width,height}});
 const js=[];page.on('pageerror',error=>js.push(error.message));
 try{
  await page.goto(base+href,{waitUntil:'domcontentloaded',timeout:25000});
  if(full)await page.locator('.source-page').waitFor({state:'attached',timeout:18000});
  const result=await page.evaluate(()=>{
   const main=document.querySelector('#main');
   return {
    title:main?.querySelector('h1')?.textContent.trim(),
    chars:main?.innerText.length||0,
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    original:!!main?.querySelector('.source-page'),
    headingSize:parseFloat(getComputedStyle(main?.querySelector('.source-headline h1')||main?.querySelector('h1')).fontSize),
    programmeTitle:!!main?.querySelector('.source-title-suffix'),
    external:[...document.querySelectorAll('a[href]')].filter(a=>new URL(a.href).origin!==location.origin).filter(a=>!(a.dataset.originalDownload==='cosmatica'&&/^https:\/\/cosmatica\.org\/files\/download\/\d+\/[a-f0-9]+$/i.test(a.href))).length,
    broken:[...document.querySelectorAll('img')].filter(i=>i.complete&&!i.naturalWidth&&i.src.includes('/assets/source/')).length
   };
  });
  assert(result.title,'No heading');
  assert(result.overflow<=3,'Horizontal scroll '+result.overflow);
  assert.equal(result.external,0,'External user links');
  assert.equal(result.broken,0,'Missing local media');
  assert.equal(js.length,0,'JavaScript errors '+js.join('; '));
  if(full)assert(result.original,'Missing full editorial view');
  if(expectedTitle){
   const norm=v=>String(v).replace(/\u200b/g,'').replace(/\s+/g,' ').trim();
   assert.equal(norm(result.title),norm(expectedTitle),'Wrong linked content loaded');
  }
  if(['article','project','poster-item'].includes(slug)&&!href.includes('ref=')){
   if(device==='mobile')assert(result.headingSize<=35,'Oversized mobile title '+result.headingSize);
   else assert(result.headingSize<=49,'Oversized desktop title '+result.headingSize);
   if(slug==='poster-item')assert(result.programmeTitle,'Event programme part is not distinguished');
  }
  const minimum={article:44000,project:20000,'poster-item':11000};
  if(minimum[slug]&&href.indexOf('ref=')===-1&&href.indexOf('id=')===-1)
   assert(result.chars>minimum[slug],'Full text was truncated: '+result.chars);
  if(device==='mobile'&&['article','project','poster-item','projects','departments'].includes(slug)){
   mkdirSync('qa/screenshots',{recursive:true});
   await page.screenshot({path:'qa/screenshots/editorial-'+slug+'.png'});
  }
  checked++;
  console.log('PASS',slug,device,result.chars);
 }catch(e){problems.push(slug+' '+device+': '+e.message);console.error('FAIL',slug,device,e.message);}
 finally{await page.close();}
}
for(const [device,width,height] of [['desktop',1440,960],['mobile',390,844]]){
 for(const x of source){
  const slug=x.slug;
  const url=slug==='home'?'index.html':'view.html?p='+slug+(slug==='search-results'?'&q=Гагарин':'');
  const needs=!['donate','login','register','restore','search','search-results'].includes(slug);
  await test(slug,device,width,height,url,needs);
 }
}
const ready=Object.values(links).filter(x=>x.status==='ready'&&!x.alias&&/^[a-f0-9]{18}\.json$/.test(x.file));
assert(ready.length>=140,'Linked archive unexpectedly small: '+ready.length);
// Sample every category rather than merely the first entries (which are books).
const counts=new Map(),samples=[];
for(const info of ready){
 const n=counts.get(info.type)||0;
 if(n>=2)continue;
 counts.set(info.type,n+1);
 samples.push(info);
}
assert(counts.size>=5,'Too few linked content types were exercised: '+counts.size);
for(const x of samples){
 const record=JSON.parse(readFileSync('data/linked/'+x.file,'utf8'));
 await test('linked-'+x.type,'mobile',390,844,
  'view.html?p='+x.type+'&ref='+x.file.slice(0,-5),true,record.title);
}
console.log('LINKED_COVERAGE',JSON.stringify(Object.fromEntries(counts)));
const p=await browser.newPage({viewport:{width:390,height:844}});
await p.goto(base+'view.html?p=departments');
await p.locator('.source-card').first().waitFor();
const n=await p.locator('.source-card:not([hidden])').count();
await p.locator('.source-filter-input').fill('Москва');
const filtered=await p.locator('.source-card:not([hidden])').count();
assert(n>=20&&filtered>0&&filtered<n,'Department filter not functional');checked++;
await p.goto(base+'view.html?p=search-results&q=Гагарин');
await p.getByText('Найдено материалов:',{exact:false}).first().waitFor({timeout:18000});
const matches=await p.locator('.search-grid .card').count();
assert(matches>=1,'Full-content search returned zero');checked++;
await p.close();
await browser.close();
console.log('EDITORIAL_CI',JSON.stringify({checked,errors:problems.length}));
if(problems.length)process.exit(1);
