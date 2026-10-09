import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const base=process.env.SITE_URL||'http://127.0.0.1:8893/';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
const assets=[
 'assets/fonts/inter-cyrillic-variable.woff2',
 'assets/fonts/inter-latin-variable.woff2',
 'assets/fonts/russo-one-regular.ttf',
 'assets/fonts/OFL-Inter.txt',
 'assets/fonts/OFL-Russo-One.txt',
];
let checked=0;
try {
 const probe=await browser.newPage();
 for(const asset of assets){
  const r=await probe.request.get(new URL(asset,base).href);
  assert.equal(r.status(),200,'missing font or license: '+asset);
  assert((await r.body()).byteLength>1200,'font resource is empty: '+asset);
  checked++;
 }
 await probe.close();
 for(const width of [320,390,768,1440]){
  for(const variant of ['orbit','construct','poster']){
   const page=await browser.newPage({viewport:{width,height:844}});
   let externalFonts=0;let errors=[];
   page.on('request',req=>{if(/fonts\.(?:googleapis|gstatic)\.com/.test(req.url()))externalFonts++});
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://fonts.googleapis.com/**',route=>route.abort());
   await page.route('https://fonts.gstatic.com/**',route=>route.abort());
   const suffix=variant==='orbit'?'':'?design='+variant;
   await page.goto(base+'index.html'+suffix,{waitUntil:'domcontentloaded',timeout:25000});
   await page.evaluate(()=>document.fonts.ready);
   const cdp=await page.context().newCDPSession(page);
   await cdp.send('DOM.enable');await cdp.send('CSS.enable');
   const documentNode=await cdp.send('DOM.getDocument');
   const fontsFor=async(selector)=>{
    const ref=await cdp.send('DOM.querySelector',{nodeId:documentNode.root.nodeId,selector});
    assert(ref.nodeId,'missing selector '+selector);
    return (await cdp.send('CSS.getPlatformFontsForNode',{nodeId:ref.nodeId})).fonts;
   };
   const headline=await fontsFor('.home-hero h1');
   const intro=await fontsFor('.home-hero .lede');
   assert(headline.every(f=>f.isCustomFont),'headline fell back to unbundled system font');
   assert(intro.every(f=>f.isCustomFont&&f.familyName==='Inter'),'body not using bundled Inter');
   const expected=variant==='poster'?'Russo One':'Inter';
   assert(headline.every(f=>f.familyName===expected),'wrong actual headline font '+variant+': '+JSON.stringify(headline));
   const state=await page.evaluate(()=>({
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    weight:getComputedStyle(document.querySelector('.home-hero h1')).fontWeight,
    resourceFaces:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family)
   }));
   assert.equal(state.overflow,0,'horizontal overflow width '+width+' '+variant);
   assert.equal(externalFonts,0,'external Google Fonts dependency remains');
   assert.deepEqual(errors,[],'browser JS errors');
   assert(state.resourceFaces.includes('RKO Inter'),'Inter webfont not loaded');
   if(variant==='poster')assert(state.resourceFaces.includes('Russo One'),'Russo One not loaded');
   console.log('ACTUAL_FONT_OK',width,variant,headline.map(f=>f.familyName).join(','),intro.map(f=>f.familyName).join(','));
   checked++;
   await cdp.detach();await page.close();
  }
 }
} finally {await browser.close();}
console.log('SELF_HOSTED_FONTS_QA',checked,'PASS');
