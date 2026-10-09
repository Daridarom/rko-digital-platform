import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.SITE_URL||'http://127.0.0.1:8892/';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
let passed=0;
try{
 for(const variant of ['construct','poster']){
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'index.html?design='+variant,{waitUntil:'domcontentloaded'});
  await page.locator('.menu-btn').click();
  await page.locator('.mobile-drawer a[href*="articles"]').first().click();
  await page.waitForURL(u=>u.searchParams.get('p')==='articles',{timeout:16000});
  assert.equal(new URL(page.url()).searchParams.get('design'),variant);
  await page.locator('main .source-card').first().waitFor({timeout:15000});
  assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('main .source-card')).borderTopLeftRadius),'0px');
  assert.deepEqual(errors,[]);
  console.log('PREVIEW_NAV_OK',variant,page.url());
  passed++;
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.goto(base+'index.html',{waitUntil:'domcontentloaded'});
 await page.locator('.theme-btn').click();
 await page.waitForTimeout(450); // Respect the existing 200ms color transition.
 const state=await page.evaluate(()=>({isDark:document.body.classList.contains('dark'),background:getComputedStyle(document.body).backgroundColor,customBg:getComputedStyle(document.body).getPropertyValue('--bg').trim(),htmlBg:getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),primary:getComputedStyle(document.querySelector('.hero-actions .primary')).backgroundColor}));
 console.log('DARK_DIAGNOSTIC',JSON.stringify(state));
 assert(state.isDark&&state.background!=='rgb(246, 246, 242)');
 assert(state.primary!=='rgb(152, 22, 31)');
 console.log('DARK_ORBIT_OK',JSON.stringify(state));passed++;
 await page.close();
}finally{await browser.close()}
console.log('ORBIT_PREVIEW_NAVIGATION_QA',passed,'PASS');
