import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.SITE_URL||'http://127.0.0.1:8775/';
const b=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
let checks=0;
try{
 for(const id of ['sns','chotv','gagarincy']){
  const page=await b.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'view.html?p=project&id='+id,{waitUntil:'domcontentloaded',timeout:25000});
  await page.locator('.rich-project-aside').waitFor({timeout:14000});
  const links=await page.evaluate(()=>[...document.querySelectorAll('main a[href]')]
   .filter(a=>a.protocol==='https:'&&new URL(a.href).origin!==location.origin)
   .map(a=>({href:a.href,mark:a.dataset.contentExternal,rel:a.rel,target:a.target,referrer:a.referrerPolicy})));
  assert(links.length>0,id+' no source links');
  assert(links.every(x=>x.mark==='true'&&x.target==='_blank'&&x.rel.includes('noopener')&&x.rel.includes('noreferrer')),id+' external source not safe '+JSON.stringify(links));
  assert(links.every(x=>!x.href.startsWith('https://cosmatica.org/redirect?')),id+' obsolete CMS redirect '+JSON.stringify(links));
  assert.deepEqual(errors,[],'JS errors in '+id);
  checks++;console.log('PUBLIC_LINKS_OK',id,links.map(x=>x.href).join(' | ').slice(0,1000));
  await page.close();
 }
}finally{await b.close()}
console.log('PUBLIC_LINKS_QA',checks,'PASS');
