import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.SITE_URL || 'http://127.0.0.1:8768/design/cosmatica-2026/site/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let count=0;
try{
for(const [name,width,height] of [['320px',320,740],['390px',390,844],['430px',430,932],['desktop',1440,960]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 try{
  await page.goto(base+'index.html',{waitUntil:'load',timeout:25000});
  const s=await page.evaluate(()=>{
   const b=q=>{const el=document.querySelector(q);if(!el)return null;const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width,font:parseFloat(getComputedStyle(el).fontSize)}};
   return {screen:document.documentElement.clientWidth,totalWidth:document.documentElement.scrollWidth,title:b('.home-hero h1'),text:b('.home-hero .lede'),buttons:b('.home-hero .hero-actions'),mark:b('.hero-mark')};
  });
  assert(s.title&&s.text&&s.mark,'Missing hero elements at '+name);
  assert(s.totalWidth-s.screen<=3,'Horizontal overflow at '+name+': '+JSON.stringify(s));
  if(width<=430){
   assert(s.title.font<=44,'Oversized mobile heading at '+name+': '+s.title.font);
   assert(s.text.font<=16,'Oversized body copy at '+name+': '+s.text.font);
   assert(s.mark.top < height-100,'Symbol below fold at '+name+': '+s.mark.top);
   assert(s.buttons.bottom<s.mark.top,'Symbol overlaps hero actions at '+name);
  }
  fs.mkdirSync('qa/screenshots',{recursive:true});
  await page.screenshot({path:'qa/screenshots/home-'+name+'.png',fullPage:false});
  count++;console.log('PASS',name,JSON.stringify(s));
 } finally {await page.close();}
}
} finally {await browser.close();}
console.log('PASS responsive home',count,'viewports');
