import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.SITE_URL||'http://127.0.0.1:8768/design/cosmatica-2026/site/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const stats={pages:0,screenshots:0};
const article={
 type:'article',title:'Исследование: развёрнутая публикация',author:'Редакция РКО',publishedAt:'2026-10-08',
 blocks:Array.from({length:125},(_,i)=>i%5===0?{type:'heading',text:'Раздел '+(i/5+1),level:2}:
 {type:'paragraph',text:('Текст научной публикации с проверкой адаптивной вёрстки и переноса форматирования. ').repeat(5),
 spans:[{text:('Текст научной публикации ').repeat(8),marks:['bold']},{text:('Длинный материал для переноса. ').repeat(8),marks:['italic']}]})
};
const event={type:'poster-item',title:'Конференция: проверка программы',startsAt:'8 октября 2026',
 venue:'Зал проведения конференции',format:'Смешанный',organizer:'РКО',
 blocks:[{type:'heading',text:'Содержание',level:2},{type:'paragraph',text:'Подробное описание конференции.'}],
 program:Array.from({length:22},(_,i)=>({type:'paragraph',text:'Выступление '+(i+1)})),files:[{name:'Программа',format:'PDF'}]};
const project={type:'project',title:'Тестовый проект РКО',status:'Действующий',direction:'Образование',
 mission:'Развитие детского и научного творчества',goals:['Первое направление','Второе направление'],
 blocks:Array.from({length:24},(_,i)=>({type:'paragraph',text:'Содержание проекта '+(i+1)})),
 team:['Организатор','Участники'],files:[{name:'Положение',format:'PDF'}],
 fundraising:{mode:'active',target:100000,raised:45000}};
for(const [slug,record] of [['article',article],['poster-item',event],['project',project]]){
 for(const [device,width,height] of [['desktop',1440,960],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript((arg)=>{window.COSMATICA_MIGRATED_PAGES={[arg.slug]:arg.record}}, {slug,record});
  await page.goto(base+'view.html?p='+slug+'&layout=full',{waitUntil:'networkidle'});
  const main=page.locator('#main');
  await page.locator('.rich-cms-heading h1').waitFor();
  const result=await main.evaluate(root=>({
   text:root.innerText.length,scroll:document.documentElement.scrollWidth-document.documentElement.clientWidth,
   title:root.querySelector('.rich-cms-heading h1')?.textContent,
   paragraphCount:root.querySelectorAll('.rich-blocks p').length,
   toc:root.querySelectorAll('.rich-toc-link').length,
   facts:root.querySelectorAll('.rich-metric').length,
   externalLinks:[...root.querySelectorAll('a[href]')].filter(a=>new URL(a.href).origin!==location.origin).length
  }));
  assert.equal(result.scroll<=3,true,slug+'/'+device+' overflow '+result.scroll);
  assert.equal(result.externalLinks,0,slug+'/'+device+' external link');
  assert.equal(errors.length,0,slug+'/'+device+' JS errors: '+errors.join('; '));
  assert.equal(result.title,record.title);
  if(slug==='article'){assert.equal(result.paragraphCount,100);assert.equal(result.toc,25);assert(result.text>15000);}
  if(slug==='poster-item'){assert.equal(result.paragraphCount>=22,true);assert(result.facts>=3);}
  if(slug==='project'){assert.equal(result.paragraphCount>=24,true);assert.equal(await page.locator('.rich-progress[aria-valuenow="45"]').count(),1);}
  if(device==='mobile'){
   await mkdir('qa/screenshots',{recursive:true});
   await page.screenshot({path:'qa/screenshots/rich-'+slug+'.png'});
   stats.screenshots++;
  }
  stats.pages++;console.log('PASS rich',slug,device,JSON.stringify(result));
  await page.close();
 }
}
await browser.close();
console.log('RICH SUMMARY',stats);
