import {createRichBlocks,createArticle,createEvent,createProject} from './rich-renderer.mjs?v=archive69';

/* The content is static, reviewed separately, and contains no executable HTML. */
const qs=new URLSearchParams(location.search);
const slug=qs.get('p')||'home';
const ref=qs.get('ref')||'';
const blocked=new Set(['login','register','restore','search','search-results']);
const body=document.querySelector('#main');
const el=(tag,cls='',value=null)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!=null)n.textContent=String(value);return n;};
const localImage=value=>{
 if(typeof value!=='string')return null;
 if(/^assets\/source\/[a-z0-9._-]+\.(?:webp|png|jpe?g|gif|svg)$/i.test(value))return value;
 // Preserve the exact public image source, including externally hosted images
 // on the original RKO pages. Reject private networks, credentials and scripts.
 try{
  const uri=new URL(value);
  if(uri.protocol!=='https:'||uri.username||uri.password||uri.port)return null;
  if(!uri.hostname.includes('.')||/^(?:localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2[0-9]|3[01])\.)/i.test(uri.hostname))return null;
  return uri.href;
 }catch{return null;}
};
const originalDownload=value=>{
 if(typeof value!=='string')return null;
 try{const uri=new URL(value);return uri.protocol==='https:'&&uri.hostname==='cosmatica.org'&&/^\/files\/download\/\d+\/[a-z0-9]+$/i.test(uri.pathname)?uri.href:null;}catch{return null;}
};
function listingHref(item,index){
 if(item?.href&&/^view\.html\?p=[a-z0-9-]+(?:&(?:ref=[a-f0-9]{18}|id=[a-z0-9_-]+))?$/.test(item.href))return item.href;
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
 const count=el('output','source-filter-count',(data.slug==='archive'?'На странице: ':'Материалов: ')+data.cards.length);count.setAttribute('aria-live','polite');
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
  // Source card text sometimes combines title, #project, date and a comment counter.
  // Keep full source data for filtering, but present these as separate readable fields.
  const raw=String(card.title||'Материал').replace(/\u200b/g,'').trim();
  const project=raw.match(/\s+#([^#]+)$/);
  const title=project?raw.slice(0,project.index).trim():raw;
  const heading=el('h3','',title);heading.title=title;inner.append(heading);
  const description=String(card.description||'').replace(/\u200b/g,'').trim();
  let summary=description.replace(raw,'').trim();
  if(summary===description)summary=summary.replace(title,'').trim();
  const date=summary.match(/\b\d{2}\.\d{2}\.\d{4}(?:\s+\d{2}:\d{2})?\b/);
  if(date)summary=summary.replace(date[0],'').trim();
  summary=summary.replace(/(?:^|\s)0$/,'').trim();
  if(project)inner.append(el('span','source-card-topic',project[1].trim()));
  if(date)inner.append(el('span','source-card-date',date[0]));
  const preview=summary?el('p','',summary):null;
  if(preview)inner.append(preview);
  if(!href&&description.length>180){
    const more=el('details','source-card-more');
    more.append(el('summary','','Полное описание'),el('p','',description));
    more.addEventListener('toggle',()=>{if(preview)preview.hidden=more.open;});
    inner.append(more);
  }
  if(href)inner.append(el('span','source-card-arrow','Подробнее →'));
  item.append(inner);grid.append(item);
  rows.push([item,(card.title+' '+(card.description||'')).toLocaleLowerCase('ru')]);
 }
 input.addEventListener('input',()=>{
  let visible=0;const q=input.value.trim().toLocaleLowerCase('ru');
  rows.forEach(([item,text])=>{item.hidden=!!q&&!text.includes(q);if(!item.hidden)visible++;});
  count.textContent=(data.slug==='archive'?'Найдено на странице: ':'Найдено: ')+visible;
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
    if(href)return {...span,href};
    // Keep intentional HTTPS references to independent public websites.
    // Links back to the old RKO CMS must resolve locally or stay plain text.
    try{const uri=new URL(span.href);
     if(uri.protocol==='https:'&&uri.hostname!=='cosmatica.org'&&uri.hostname!=='www.cosmatica.org')
      return {...span,href:uri.href};
    }catch{}
    return {...span,href:null};
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
 const inText=new Set([...(data.blocks||[]).filter(b=>b.type==='image').map(b=>b.src),...(data.cards||[]).map(c=>c.image)]);
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
  const file=data.slug==='book'?(originalDownload(doc.url)):(localImage(doc.localUrl)||originalDownload(doc.url));
  const a=el(file?'a':'div','source-document'+(file?'':' source-document-static'),doc.label||'Документ');
  if(file){a.href=file;if(file.startsWith('https://')){a.rel='noopener noreferrer';a.setAttribute('data-original-download','cosmatica');}}
  section.append(a);
 }
 return section;
}
async function renderArchive(){
 const sectionName=(qs.get('section')||'all').trim();
 const sectionsResponse=await fetch('data/archive/sections.json?v=archive1');
 if(!sectionsResponse.ok){notFound();return;}
 const sections=await sectionsResponse.json();
 const selected=sections.find(x=>x.key===sectionName);
 if(!selected){notFound();return;}
 const requested=Number(qs.get('page')||1);
 if(!Number.isSafeInteger(requested)||requested<1||requested>selected.pages){notFound();return;}
 const pageResponse=await fetch('data/archive/catalog/'+sectionName+'/'+requested+'.json?v=archive1');
 if(!pageResponse.ok){notFound();return;}
 const data=await pageResponse.json();
 if(data.slug!=='archive'||data.archiveSection!==sectionName||!Array.isArray(data.cards)){notFound();return;}
 const link=(key,n=1)=>'view.html?p=archive&section='+encodeURIComponent(key)+'&page='+n;
 const wrapper=el('section','section source-page source-page--archive');
 const container=el('div','shell');
 container.append(heading(data));
 const categories=el('nav','source-archive-categories');
 categories.setAttribute('aria-label','Разделы публичного архива');
 for(const cat of sections){
  if(!cat.count)continue;
  const a=el('a','source-archive-category'+(sectionName===cat.key?' active':''),
   cat.title+' ('+cat.count.toLocaleString('ru')+')');
  a.href=link(cat.key);
  if(sectionName===cat.key)a.setAttribute('aria-current','page');
  categories.append(a);
 }
 container.append(categories);
 const summary=el('p','source-archive-summary','Материалов в текущей версии архива: '+data.total.toLocaleString('ru')+
   ' · Страница '+requested+' из '+data.pageCount);
 container.append(summary);
 const grid=listView(data,{});
 if(grid)container.append(grid);
 else container.append(el('p','source-archive-empty',
   'В этой версии каталога пока нет сохранённых публичных материалов.'));
 if(data.pageCount>1){
  const pages=el('nav','source-search-pages source-archive-pages');
  pages.setAttribute('aria-label','Страницы архива');
  const add=(label,num,current=false)=>{
   const a=el('a',current?'active':'',label);a.href=link(sectionName,num);
   if(current)a.setAttribute('aria-current','page');
   pages.append(a);
  };
  if(requested>1){add('« Первая',1);add('‹',requested-1);}
  for(let n=Math.max(1,requested-2);n<=Math.min(data.pageCount,requested+2);n++)add(String(n),n,n===requested);
  if(requested<data.pageCount){add('›',requested+1);add('Последняя »',data.pageCount);}
  container.append(pages);
 }
 wrapper.append(container);
 const breadcrumb=el('nav','crumbs');
 breadcrumb.setAttribute('aria-label','Путь по сайту');
 const home=el('a','','Главная');home.href='index.html';
 breadcrumb.append(home,document.createTextNode(' → '),el('span','',data.title));
 body.replaceChildren(breadcrumb,wrapper);
 document.title=data.title+' — Архив РКО';
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
 if(slug==='donate'){
  const source=await fetch('data/source/donate.json?v=fullarchive67');
  if(source.ok){
   const content=await source.json();
   const intro=body.querySelector('.donate-intro');
   if(intro&&Array.isArray(content.blocks)&&content.blocks.length){
    intro.replaceChildren(createRichBlocks(content.blocks));
   }
  }
  return;
 }
 if(slug==='archive'){await renderArchive();return;}
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
 if(!ref&&!qs.has('item')){
  const archiveSections={news:'news',poster:'poster',projects:'projects',library:'library',users:'users',
   'articles-list':'articles',articles:'articles',departments:'departments',partners:'partners',
   collegium:'collegium','about-info':'about'};
  const section=archiveSections[slug];
  if(section){const a=el('a','source-document source-archive-all-link','Все материалы раздела →');
   a.href='view.html?p=archive&section='+section;inner.append(a);}
 }
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
