import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

const report=JSON.parse(readFileSync('data/archive/recovery-report.json','utf8'));
const index=JSON.parse(readFileSync('data/linked-index.json','utf8'));
const base=process.env.SITE_URL||'http://127.0.0.1:8877/design/cosmatica-2026/site/';
assert.equal(report.recovered,11,'All formerly missing public articles must be captured');
const records=report.results.map(({url})=>{
 const info=index[url];
 assert(info?.status==='ready' && info.type==='article' && info.file,'Article missing from catalog '+url);
 const content=JSON.parse(readFileSync('data/linked/'+info.file,'utf8'));
 assert.equal(content.sourceUrl,url);
 assert(content.title && content.blocks?.length,'Empty article '+url);
 assert(!/cmsCore\\s+Object|db_pass|session_save_path/i.test(JSON.stringify(content)),
   'Backend diagnostics leaked into article '+url);
 return {ref:info.file.slice(0,-5), title:content.title,
   textChars:content.capturedBodyCharacters||0,
   videos:content.blocks.filter(block=>block.type==='video').length};
});
const browser=await chromium.launch({headless:true,
 ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),
 args:['--no-sandbox','--disable-dev-shm-usage']});
let passed=0;const failures=[];
try {
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:880}});
  await page.route('**/*',route=>{
   if(route.request().url().startsWith('https://'))return route.abort();
   return route.continue();
  });
  for(const item of records){
   const errors=[];const listener=err=>errors.push(err.message);
   page.on('pageerror',listener);
   try{
    await page.goto(base+'view.html?p=article&ref='+item.ref,
      {waitUntil:'domcontentloaded',timeout:25000});
    await page.locator('.source-page h1').waitFor({timeout:12000});
    const visible=await page.evaluate(()=>({
     title:document.querySelector('.source-page h1')?.textContent?.replace(/\s+/g,' ').trim(),
     text:document.querySelector('.source-page')?.innerText?.length||0,
     overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
     videos:document.querySelectorAll('.rich-video').length,
     iframes:document.querySelectorAll('.rich-video iframe').length
    }));
    assert.equal(visible.title,item.title.replace(/\s+/g,' ').trim());
    assert(visible.text>=Math.min(15000,Math.round(item.textChars*.55)),
      'Truncated article '+JSON.stringify(visible));
    assert(visible.overflow<=3,'Horizontal overflow '+JSON.stringify(visible));
    assert(visible.videos>=item.videos,'Missing videos '+JSON.stringify(visible));
    assert.equal(visible.iframes,0,'Videos must load only on activation');
    assert.equal(errors.length,0,'JS errors: '+errors.join('; '));
    passed++;
   }catch(e){failures.push({width,ref:item.ref,error:e.message.slice(0,260)})}
   page.off('pageerror',listener);
  }
  await page.close();
 }
}finally{await browser.close();}
console.log('RECOVERED_ARTICLES_BROWSER',JSON.stringify({passed,total:records.length*2,failures}));
if(failures.length)process.exitCode=1;
