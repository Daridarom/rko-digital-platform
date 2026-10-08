import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,
 ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),
 args:['--no-sandbox','--disable-dev-shm-usage']});
const base=process.env.SITE_URL||'http://127.0.0.1:8768/design/cosmatica-2026/site/';
const failures=[];
let checks=0;
async function verify(slug,width,height){
 const page=await browser.newPage({viewport:{width,height}});
 const errs=[];page.on('pageerror',err=>errs.push(err.message));
 try{
  const target=slug==='home'?'index.html':'view.html?p='+slug+(slug==='search-results'?'&q=Гагарин':'');
  await page.goto(base+target,{waitUntil:'domcontentloaded',timeout:25000});
  if(['news','poster','projects','library','users','partners'].includes(slug)){
   await page.locator('.source-card').first().waitFor({timeout:16000});
  }
  if(slug==='search-results')await page.getByText('Найдено материалов:',{exact:false}).first().waitFor({timeout:16000});
  const x=await page.evaluate(()=>{
   const box=selector=>{
    const item=document.querySelector(selector);
    if(!item)return null;
    const rect=item.getBoundingClientRect();
    const style=getComputedStyle(item);
    return {x:rect.x,y:rect.y,w:rect.width,h:rect.height,right:rect.right,display:style.display,
      objectFit:style.objectFit,font:parseFloat(style.fontSize),clamp:style.webkitLineClamp};
   };
   return {window:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,
    heading:document.querySelector('main h1')?.textContent?.slice(0,80),
    search:box('.header-actions .search-link'),searchIcon:box('.header-actions .search-icon'),
    menu:box('.header-actions .menu-btn'),brand:box('.brand'),logo:box('.brand-emblem'),
    title:box('.brand strong'),firstCard:box('.source-card'),poster:box('.source-card-media'),
    image:box('.source-card-media img'),cardTitle:box('.source-card h3'),
    catalogCount:document.querySelectorAll('.source-card').length,
    searchLists:document.querySelectorAll('.search-section .shell > .grid').length,
    totalSearchCards:document.querySelectorAll('.search-grid .card').length,
    externalLinks:[...document.querySelectorAll('a[href]')].filter(a=>new URL(a.href).origin!==location.origin).filter(a=>!(a.dataset.originalDownload==='cosmatica'&&/^https:\/\/cosmatica\.org\/files\/download\/\d+\/[a-f0-9]+$/i.test(a.href))).filter(a=>!(a.dataset.contentExternal==='true'&&a.href.startsWith('https://')&&a.target==='_blank'&&a.rel.includes('noopener'))).length};
  });
  assert(x.heading,slug+' missing heading');
  assert(x.scroll-x.window<=3,slug+'/'+width+' horizontal overflow '+JSON.stringify(x));
  assert.equal(errs.length,0,slug+'/'+width+' page errors '+errs.join(' | '));
  assert.equal(x.externalLinks,0,slug+'/'+width+' external user link');
  if(width<=980){
   assert(x.menu?.w<=72,slug+'/'+width+' menu too wide '+x.menu?.w);
   assert(x.search?.w<=44,slug+'/'+width+' header search too wide '+x.search?.w);
   assert(x.searchIcon?.w>=16,slug+'/'+width+' search icon invisible');
   assert(x.brand?.right<=x.search.x+2,slug+'/'+width+' brand overlaps search');
  }
  if(slug==='poster'&&width<=640){
   assert(x.catalogCount>=3,'Events list incomplete');
   assert(x.poster?.w>=x.firstCard.w-4,'Poster is narrow: '+JSON.stringify(x));
   assert(Math.abs(x.poster?.y-x.firstCard.y)<5,'Poster not on top of card');
   assert(x.image?.objectFit==='contain','Poster image is cropped');
   assert(x.cardTitle?.clamp==='3','Title not visually clamped');
   const src=await page.locator('.source-card-media img').first().evaluate(img=>({natural:img.naturalWidth,complete:img.complete}));
   assert(src.natural>0&&src.complete,'Poster image failed to load');
  }
  if(slug==='search-results'){
   assert.equal(x.searchLists,1,'Duplicate search result grids present');
   assert(x.totalSearchCards>0,'Full-index search is empty');
  }
  if(width===390&&['poster','news','projects','library','search-results'].includes(slug)){
   mkdirSync('qa/screenshots',{recursive:true});
   await page.screenshot({path:'qa/screenshots/mobile-refined-'+slug+'.png',fullPage:false});
  }
  checks++;
  console.log('PASS',slug,width,JSON.stringify({catalog:x.catalogCount,headerSearch:x.search?.w,menu:x.menu?.w,media:x.poster?.w,results:x.totalSearchCards}));
 }catch(err){failures.push(slug+'/'+width+': '+err.message);console.error('FAIL',slug,width,err.message);}
 finally{await page.close();}
}
for(const [width,height] of [[320,740],[390,844],[768,960],[960,720],[1440,960]]){
 for(const slug of ['home','news','poster','projects','library','users','partners','search','search-results']){
  await verify(slug,width,height);
 }
}
const mobile=await browser.newPage({viewport:{width:390,height:844}});
try{
 await mobile.goto(base+'view.html?p=poster',{waitUntil:'domcontentloaded'});
 await mobile.locator('.source-card').first().waitFor();
 const initial=await mobile.locator('.source-card:not([hidden])').count();
 await mobile.locator('.source-filter-input').fill('Тропа');
 const filtered=await mobile.locator('.source-card:not([hidden])').count();
 assert(initial>=3&&filtered>=1&&filtered<initial,'Catalog search does not filter');
 checks++;console.log('PASS catalog filter',initial,filtered);
 const btn=mobile.locator('.menu-btn');
 const before=await mobile.locator('main').evaluate(el=>el.getBoundingClientRect().top);
 await btn.click();
 assert.equal(await btn.getAttribute('aria-expanded'),'true');
 assert.equal(await mobile.locator('.mobile-drawer.open').count(),1);
 const after=await mobile.locator('main').evaluate(el=>el.getBoundingClientRect().top);
 assert.equal(Math.round(before),Math.round(after),'Menu pushes content');
 await mobile.keyboard.press('Escape');
 assert.equal(await btn.getAttribute('aria-expanded'),'false');
 checks++;console.log('PASS mobile menu');
 await mobile.locator('.search-link').click();
 await mobile.locator('#searchInput').waitFor();
 await mobile.locator('#searchInput').fill('Гагарин');
 await mobile.locator('#searchForm button').click();
 await mobile.getByText('Найдено материалов:',{exact:false}).first().waitFor();
 assert.equal(await mobile.locator('.search-section .shell > .grid').count(),1);
 checks++;console.log('PASS global search header/form/results');
} catch(err){failures.push('interactions: '+err.message);console.error('FAIL interactions',err.message);}
finally{await mobile.close();}
await browser.close();
console.log('MOBILE_REFINEMENT_QA',JSON.stringify({checks,failures:failures.length}));
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
