import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.SITE_URL||'http://127.0.0.1:8768/design/cosmatica-2026/site/';
const samples=new Map();
for(const name of readdirSync('data/linked').filter(x=>x.endsWith('.json')).sort()){
 const row=JSON.parse(readFileSync('data/linked/'+name,'utf8'));
 for(const block of row.blocks||[]){
  if(block.type==='video'&&!samples.has(block.platform))samples.set(block.platform,{row,block,ref:name.slice(0,-5)});
 }
}
assert(samples.size>=7,'Missing source video providers');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),args:['--no-sandbox']});
let passed=0;
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route(/https:\/\//,route=>route.abort());
  for(const [provider,info] of samples){
   await page.goto(base+'view.html?p='+info.row.slug+'&ref='+info.ref,{waitUntil:'domcontentloaded'});
   await page.locator('.source-page h1').waitFor();
   const details=page.locator('details.rich-video');
   const links=await details.evaluateAll(els=>els.map(el=>el.querySelector('.rich-video-source')?.href||''));
   const expected=info.block.sourceUrl;
   const pos=links.indexOf(expected);
   assert(pos>=0,provider+' original link missing');
   const widget=details.nth(pos);
   assert.equal(await widget.locator('iframe').count(),0,'Video loaded before click');
   await widget.locator('summary').click();
   const frame=widget.locator('iframe');
   await frame.waitFor({state:'attached'});
   const src=await frame.getAttribute('src');
   if(provider==='youtube')assert(src.includes(info.block.videoId),'Wrong YouTube player');
   else assert.equal(src,info.block.embedUrl,'Video origin changed');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert(overflow<=3,'Horizontal overflow at '+provider+'/'+width);
   await widget.locator('summary').click();
   await widget.locator('iframe').waitFor({state:'detached',timeout:7000});
   assert.equal(await widget.locator('iframe').count(),0,'Player persisted after close');
   passed++;
  }
  await page.close();
 }
}finally{await browser.close();}
console.log('ORIGINAL_VIDEO_EMBEDS',JSON.stringify({providers:[...samples.keys()],resolutions:2,passed}));
