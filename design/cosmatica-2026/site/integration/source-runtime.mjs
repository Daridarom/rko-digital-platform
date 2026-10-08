import {createRichBlocks,createArticle,createEvent,createProject} from './rich-renderer.mjs';

/* The content is static, reviewed separately, and contains no executable HTML. */
const qs=new URLSearchParams(location.search);
const slug=qs.get('p')||'home';
const ref=qs.get('ref')||'';
const blocked=new Set(['login','register','restore','search','search-results','donate']);
const body=document.querySelector('#main');
const el=(tag,cls='',value=null)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!=null)n.textContent=String(value);return n;};
const localImage=value=>typeof value==='string'&&value.startsWith('assets/source/')?value:null;
function listingHref(item,index){
 const info=index[item?.url];if(!info||info.status!=='ready')return null;
 if(info.alias){
  const slug=info.file?.split('/').pop()?.replace('.json','');
  return slug?'view.html?p='+encodeURIComponent(slug):null;
 }
 const id=info.file?.replace('.json','');
 return id&&/^[a-f0-9]{18}$/.test(id)?'view.html?p='+encodeURIComponent(info.type||'article')+'&ref='+id:null;
}
function heading(data){
 const title=data.title||'Раздел';
 const long=title.length>=76;
 const extra=title.length>=135;
 const box=el('div','source-headline'+(long?' source-long-title':'')+(extra?' source-extra-long-title':''));
 const h1=el('h1');
 // A long event title may include a source hashtag naming its parent programme.
 // Keep every word but distinguish the programme visually from the event name.
 const suffixAt=extra ? title.indexOf('#',35) : -1;
 if(suffixAt>35){
  h1.append(document.createTextNode(title.slice(0,suffixAt).trimEnd()+' '));
  h1.append(el('span','source-title-suffix',title.slice(suffixAt).trimStart()));
 }else h1.textContent=title;
 box.append(el('p','eyebrow','РУССКОЕ КОСМИЧЕСКОЕ ОБЩЕСТВО'),h1);
 if(data.intro)box.append(el('p','source-intro',data.intro));
 return box;
}
function facts(data){
 const rows=(data.fields||[]).filter(f=>f.value && f.value.length<=350 && (f.key||'').length<=90);
 if(!rows.length)return null;
 const box=el('dl','source-details');
 rows.forEach(f=>box.append(el('dt','',f.key||'Сведения'),el('dd','',f.value)));
 return box;
}
function listView(data,index){
 if(!data.cards?.length)return null;
 const sec=el('section','source-listing source-listing--'+(data.slug||'section'));
 const top=el('div','source-filterbar');
 const lab=el('label','source-filterlabel','Поиск в разделе');
 const input=el('input','source-filter-input');
 input.type='search';input.placeholder='Название, тема или город';input.setAttribute('aria-label','Поиск по материалам раздела');
 lab.append(input);
 const count=el('output','source-filter-count','Материалов: '+data.cards.length);count.setAttribute('aria-live','polite');
 top.append(lab,count);sec.append(top);
 const grid=el('div','source-grid');const rows=[];
 for(const card of data.cards){
  const href=listingHref(card,index);
  const item=el(href?'a':'article','source-card'+(localImage(card.image)?' source-card--media':''));
  if(href)item.href=href;
  const media=localImage(card.image);
  if(media){
   const wrap=el('div','source-card-media'),image=el('img');
   image.src=media;image.loading='lazy';image.alt=card.title||'';
   image.addEventListener('error',()=>wrap.remove());
   wrap.append(image);item.append(wrap);
  }
  const inner=el('div','source-card-copy');
  const heading=el('h3','',card.title||'Материал');heading.title=card.title||'Материал';inner.append(heading);
  if(card.description && card.description!==card.title)inner.append(el('p','',card.description));
  if(href)inner.append(el('span','source-card-arrow','Подробнее →'));
  item.append(inner);grid.append(item);
  rows.push([item,(card.title+' '+(card.description||'')).toLocaleLowerCase('ru')]);
 }
 input.addEventListener('input',()=>{
  let visible=0;const q=input.value.trim().toLocaleLowerCase('ru');
  rows.forEach(([item,text])=>{item.hidden=!!q&&!text.includes(q);if(!item.hidden)visible++;});
  count.textContent='Найдено: '+visible;
 });
 sec.append(grid);return sec;
}
function getRich(data,type,index){
 // Reconnect approved legacy hyperlinks to local records; never send users
 // back to the old CMS or make an unsupported destination clickable.
 const blocks=(data.blocks||[])
  .filter(x=>x.type!=='image'||localImage(x.src))
  .map(block=>!Array.isArray(block.spans)?block:{
   ...block,spans:block.spans.map(span=>{
    if(!span.href)return span;
    const href=listingHref({url:span.href.split('#')[0]},index);
    return {...span,href:href||null};
   })
  });
 data={...data,blocks};
 const src=window.COSMATICA_CONTENT||{};
 if(type==='article'||type==='news-item'){
  const author=(data.fields||[]).find(f=>/автор/i.test(f.key||''))?.value||'';
  return createArticle({...data,author});
 }
 if(type==='poster-item'){
  const info=src['poster-item']||{};
  const fact=label=>info.facts?.find(f=>f.label===label)?.value||'';
  return createEvent({...data,startsAt:fact('Даты'),venue:fact('Место'),
    format:fact('Формат'),program:[],
    files:(data.documents||[]).map(f=>({name:f.label,format:f.type}))});
 }
 if(type==='project'){
  const id=qs.get('id');
  const variant=(id?src.project?.variants?.[id]:null)
    ||Object.values(src.project?.variants||{}).find(v=>v.sourceUrl===data.sourceUrl)||{};
  const target=variant.fundraising?.target;
  const funded=Number.isFinite(target)&&target>0;
  return createProject({...data,status:variant.status||'Проект РКО',
   direction:variant.direction||'',mission:variant.mission||'',
   goals:variant.goal?[variant.goal]:[],team:variant.team||[],
   files:(data.documents||[]).map(f=>({name:f.label,format:f.type})),
   fundraising:{mode:variant.fundraising?.enabled?(funded?'active':'not_configured'):'none',
    raised:Number.isFinite(variant.fundraising?.raised)?variant.fundraising.raised:null,
    target:funded?target:null}});
 }
 const article=el('article','source-rich-body');article.append(createRichBlocks(blocks));return article;
}
function gallery(data){
 const images=[...new Set((data.images||[]).filter(localImage))];
 const inText=new Set((data.blocks||[]).filter(b=>b.type==='image').map(b=>b.src));
 const additional=images.filter(x=>!inText.has(x));
 if(!additional.length)return null;
 const view=el('details','source-gallery-disclosure');
 view.append(el('summary','','Дополнительные фотографии ('+additional.length+')'));
 const grid=el('div','source-gallery');
 for(const path of additional){
  const figure=el('figure','source-gallery-item'),image=el('img');
  image.src=path;image.loading='lazy';image.alt='Иллюстрация раздела';
  image.addEventListener('error',()=>figure.remove());
  figure.append(image);grid.append(figure);
 }
 view.append(grid);return view;
}
function documents(data){
 if(!data.documents?.length)return null;
 const section=el('section','source-documents');section.append(el('h2','','Документы'));
 for(const doc of data.documents){
  const file=localImage(doc.localUrl);
  const a=el(file?'a':'div','source-document'+(file?'':' source-document-static'),doc.label||'Документ');
  if(file)a.href=file;
  section.append(a);
 }
 return section;
}
function notFound(){
 const section=el('section','section source-page source-not-found');
 const content=el('div','shell');
 content.append(el('h1','','Материал не найден'),
  el('p','','В опубликованном каталоге нет материала по этому адресу. Проверьте ссылку или воспользуйтесь поиском.'));
 const back=el('a','source-document','Вернуться к разделам');
 back.href='index.html';content.append(back);section.append(content);
 body.replaceChildren(section);document.title='Материал не найден — РКО';
}
async function run(){
 if(!body||blocked.has(slug)||qs.get('layout')==='full')return;
 if(ref&&!/^[a-f0-9]{18}$/.test(ref)){notFound();return;}
 let file=ref?'linked/'+ref+'.json':'source/'+slug+'.json';
 const indexResult=await fetch('data/linked-index.json');
 const index=indexResult.ok?await indexResult.json():{};
 const mapResponse=await fetch('integration/page-map.json');
 if(mapResponse.ok){
  const manifest=await mapResponse.json();
  for(const entry of manifest.entries||[]){
   if(entry.slug==='search-results')continue;
   index[entry.sourceUrl]={status:'ready',alias:true,
    file:'source/'+entry.slug+'.json',type:entry.slug};
  }
 }
 if(!ref){
  const item=qs.get('item');
  if(item){
   let dest=null;
   try{dest=new URL(item,'https://cosmatica.org/').href;}catch{}
   const hit=dest&&index[dest];
   if(!hit||hit.status!=='ready'){notFound();return;}
   file=hit.alias?hit.file:'linked/'+hit.file;
  } else if(slug==='project'){
   const id=qs.get('id')||'gagarincy';
   if(id!=='gagarincy'){
    const variant=window.COSMATICA_CONTENT?.project?.variants?.[id];
    if(variant&&!variant.sourceUrl)return; // Intentional demo-only variant: keep the original interactive template.
    if(!variant?.sourceUrl){notFound();return;}
    const hit=index[variant.sourceUrl];
    if(!hit||hit.status!=='ready'){notFound();return;}
    file=hit.alias?hit.file:'linked/'+hit.file;
   }
  }
 }
 const response=await fetch('data/'+file+'?v=contentqa61');
 if(!response.ok){notFound();return;}
 const data=await response.json();
 if(!Array.isArray(data.blocks)||!Array.isArray(data.cards)){notFound();return;}
 if(ref&&data.slug!==slug){notFound();return;}
 if(['about','direction'].includes(slug)&&!data.blocks.length&&!data.cards.length){notFound();return;}
 const section=el('section','section source-page source-page--'+(data.slug||slug)),inner=el('div','shell');
 inner.append(heading(data));
 const info=facts(data);if(info)inner.append(info);
 const cards=listView(data,index);if(cards)inner.append(cards);
 if(data.blocks.length){
  if(cards)inner.append(el('h2','source-section-title','Содержание раздела'));
  inner.append(getRich(data,data.slug||slug,index));
 }
 const photos=gallery(data);if(photos)inner.append(photos);
 const docs=documents(data);if(docs)inner.append(docs);
 section.append(inner);
 if(slug==='home'&&!ref){
  const more=el('details','source-home-archive');
  more.append(el('summary','','Дополнительные материалы главной страницы'),section);
  body.append(more);
 }else if(slug==='calendar'&&!ref)body.append(section);
 else{
  const crumbs=el('nav','crumbs');crumbs.setAttribute('aria-label','Путь по сайту');
  const start=el('a','','Главная');start.href='index.html';
  crumbs.append(start,document.createTextNode(' → '),el('span','',data.title||'Раздел'));
  body.replaceChildren(crumbs,section);
 }
 document.title=(data.title||'Русское космическое общество')+' — РКО';
}
try{await run();}catch(error){
 console.error('Local editorial content',String(error));
 // Preserve a functioning original template instead of showing unrelated content.
}
