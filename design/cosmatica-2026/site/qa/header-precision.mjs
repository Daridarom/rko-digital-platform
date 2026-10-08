import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,
 ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),
 args:['--no-sandbox','--disable-dev-shm-usage']});
const base=process.env.SITE_URL||'http://127.0.0.1:8768/design/cosmatica-2026/site/';
const widths=[320,345,360,375,390,416,430,640,768,960];
let passed=0;
const failures=[];
for(const width of widths){
 const page=await browser.newPage({viewport:{width,height:850}});
 try{
  await page.goto(base+'view.html?p=poster',{waitUntil:'domcontentloaded'});
  const stats=await page.evaluate(()=>{
   const menu=document.querySelector('.header-actions .menu-btn');
   const search=document.querySelector('.header-actions .search-link');
   const brand=document.querySelector('.brand');
   const span=document.createElement('span');
   const style=getComputedStyle(menu);
   span.style.cssText='position:absolute;visibility:hidden;white-space:nowrap;font: '+style.font+';';
   span.textContent=menu.textContent.trim();
   document.body.append(span);
   const textWidth=span.getBoundingClientRect().width;
   span.remove();
   const m=menu.getBoundingClientRect(), s=search.getBoundingClientRect(), b=brand.getBoundingClientRect();
   return {menuWidth:m.width,menuHeight:m.height,textWidth,searchWidth:s.width,searchHeight:s.height,
    brandRight:b.right,searchLeft:s.left,scroll:document.documentElement.scrollWidth-document.documentElement.clientWidth};
  });
  assert(stats.menuWidth-stats.textWidth<=24,'Excessive menu width '+JSON.stringify(stats));
  assert(stats.menuWidth-stats.textWidth>=14,'Menu text too close to border '+JSON.stringify(stats));
  assert(stats.menuHeight>=44,'Menu tap target too short '+JSON.stringify(stats));
  assert(stats.searchWidth>=44&&stats.searchHeight>=44,'Search tap target too small '+JSON.stringify(stats));
  assert(Math.abs(stats.searchHeight-stats.menuHeight)<=2,'Header action height mismatch '+JSON.stringify(stats));
  assert(stats.brandRight<=stats.searchLeft+2,'Brand overlaps controls '+JSON.stringify(stats));
  assert(stats.scroll<=3,'Horizontal page overflow '+JSON.stringify(stats));
  await page.locator('.menu-btn').click();
  assert.equal(await page.locator('.menu-btn').getAttribute('aria-expanded'),'true');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.menu-btn').getAttribute('aria-expanded'),'false');
  if(width===390||width===416)await page.screenshot({path:'qa/screenshots/header-precise-'+width+'.png'});
  passed++;
  console.log('PASS',width,JSON.stringify(stats));
 }catch(error){failures.push({width,message:error.message});console.log('FAIL',width,error.message);}
 await page.close();
}
await browser.close();
console.log('HEADER_PRECISION',JSON.stringify({passed,total:widths.length,failures}));
if(failures.length)process.exitCode=1;
