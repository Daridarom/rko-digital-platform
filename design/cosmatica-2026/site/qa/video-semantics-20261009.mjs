import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const base=process.env.SITE_URL||'http://127.0.0.1:8775/';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
let checks=0;
try{
 for(const width of [320,390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'view.html?p=articles',{waitUntil:'domcontentloaded',timeout:25000});
  await page.locator('.source-card--section').first().waitFor({timeout:15000});
  const result=await page.evaluate(()=>{
   const cards=[...document.querySelectorAll('.source-listing--articles .source-card')];
   const grid=document.querySelector('.source-listing--articles .source-grid');
   return {
    count:cards.length,anchors:cards.filter(el=>el.tagName==='A'&&el.href).length,
    categories:cards.filter(el=>el.dataset.kind==='articles-list').length,
    labeled:cards.filter(el=>el.querySelector('.source-card-kind')?.textContent.trim()==='Раздел').length,
    long:cards.filter(el=>el.classList.contains('source-card--section-long')).length,
    cols:getComputedStyle(grid).gridTemplateColumns.split(' ').length,
    heading:document.querySelector('.source-listing--articles .source-content-group-title')?.innerText,
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    examples:cards.slice(0,5).map(el=>el.querySelector('h3')?.textContent)
   }
  });
  assert.equal(result.count,18,'taxonomy items');
  assert.equal(result.anchors,18,'clickable taxonomy');
  assert.equal(result.categories,18,'all categories classified');
  assert.equal(result.labeled,18,'taxonomy must be labeled Раздел');
  assert.equal(result.overflow,0,'page horizontal overflow');
  assert.equal(result.cols,width<=350?1:width<981?2:3,'responsive grid');
  assert(!result.heading?.includes('Тексты и исследования'),'navigation groups mislabeled');
  assert.deepEqual(errors,[],'JavaScript errors');
  if(width===390){
   await page.locator('.source-card--section').first().click();
   await page.waitForTimeout(450);
   const pageTitle=await page.locator('.source-headline h1').innerText();
   assert(pageTitle.length>3&&!pageTitle.includes('Материал не найден'),'taxonomy links open actual pages');
   console.log('CATEGORY_DETAIL_OK',pageTitle);
   checks++;
  }
  console.log('MATERIALS_SECTIONS_OK',width,JSON.stringify(result));
  checks++;
  await page.close();
 }
 for(const [ref,expected] of [['57fb61677c0cdc2af8','Действующий'],['ff6b4be9f85bdb0ecf','Завершенный'],['d9b30f6d29715c031d','Перспективный']]){
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'view.html?p=project&ref='+ref,{waitUntil:'domcontentloaded',timeout:25000});
  await page.locator('.rich-project-aside').waitFor({timeout:16000});
  const result=await page.evaluate(()=>{
   const aside=document.querySelector('.rich-project-aside');
   const tags=[...aside.querySelectorAll('.rich-metric')].map(e=>e.innerText);
   const fields=document.querySelector('.source-details')?.innerText||'';
   const original=document.querySelector('.source-headline h1')?.innerText||'';
   return {tags,fields,original,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
  });
  assert(result.tags.some(x=>x.includes('Статус')&&x.includes(expected)),ref+' source status incorrect');
  assert(!result.tags.some(x=>x.includes('Проект РКО')),ref+' fabricated project status');
  assert(!/Статус:\s*\n|Направление:\s*\n/i.test(result.fields),ref+' repeated status metadata');
  assert.equal(result.overflow,0,'project horizontal overflow');
  assert.deepEqual(errors,[],'project JS error');
  checks++;console.log('PROJECT_STATUS_OK',ref,expected);
  await page.close();
 }
}finally{await browser.close();}
console.log('VIDEO_SEMANTICS_QA',checks,'PASS');
