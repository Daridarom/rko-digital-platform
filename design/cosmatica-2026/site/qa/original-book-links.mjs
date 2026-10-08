import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {chromium} from 'playwright';
const root=process.cwd();
const base=process.env.SITE_URL||'http://127.0.0.1:8768/design/cosmatica-2026/site/';
const files=[...readdirSync('data/source').map(x=>'data/source/'+x),...readdirSync('data/linked').map(x=>'data/linked/'+x)].filter(x=>x.endsWith('.json'));
const books=files.map(file=>({file,record:JSON.parse(readFileSync(file,'utf8'))})).filter(x=>x.record.slug==='book');
const valid=url=>/^https:\/\/cosmatica\.org\/files\/download\/\d+\/[a-f0-9]+$/i.test(url||'');
let checked=0;
for(const {file,record} of books){
 for(const doc of record.documents||[]){
  assert(valid(doc.url),'Invalid original book download URL '+file+': '+doc.url);
  assert(!doc.localUrl,'Book file must not be copied in GitHub '+file);
  checked++;
 }
}
const browser=await chromium.launch({headless:true,
 ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),
 args:['--no-sandbox','--disable-dev-shm-usage']});
let pageTests=0;
try{
 for(const {file,record} of books.filter(x=>x.record.documents?.length).slice(0,20)){
  const id=file.split('/').pop().slice(0,-5);
  const url=file.startsWith('data/source/')?base+'view.html?p=book':base+'view.html?p=book&ref='+id;
  const page=await browser.newPage();
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('.source-page').waitFor();
  const anchors=await page.locator('a[data-original-download="cosmatica"]').evaluateAll(links=>links.map(x=>x.href));
  assert.deepEqual(anchors,(record.documents||[]).map(x=>x.url),'Book download targets changed '+file);
  pageTests++;await page.close();
 }
}finally{await browser.close();}
console.log('BOOK_SERVER_LINKS',JSON.stringify({books:books.length,documents:checked,verifiedPages:pageTests}));
