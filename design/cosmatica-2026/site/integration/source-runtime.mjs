import {createRichBlocks,createArticle,createEvent,createProject} from './rich-renderer.mjs?v=vis1009';

/* The content is static, reviewed separately, and contains no executable HTML. */
const qs=new URLSearchParams(location.search);
const slug=qs.get('p')||'home';
const ref=qs.get('ref')||'';
const blocked=new Set(['login','register','restore','search','search-results']);
const body=document.querySelector('#main');
let imageGeometry={};
const imageGeometryReady=fetch('data/image-geometry.json?v=visualsystem1009')
 .then(response=>response.ok?response.json():null)
 .then(data=>{imageGeometry=data?.images||{};})
 .catch(()=>{imageGeometry={};});
const el=(tag,cls='',value=null)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!=null)n.textContent=String(value);return n;};
const localImage=value=>{
 if(typeof value!=='string')return null;
 if(/^assets\/source\/(?:book-covers\/)?[a-z0-9._-]+\.(?:webp|png|jpe?g|gif|svg)$/i.test(value))return value;
 // Preserve the exact public image source, including externally hosted images
 // on the original RKO pages. Reject private networks, credentials and scripts.
 try{
  const uri=new URL(value);
  if(uri.protocol!=='https:'||uri.username||uri.password||uri.port)return null;
  if(!uri.hostname.includes('.')||/^(?:localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2[0-9]|3[01])\.)/i.test(uri.hostname))return null;
  return uri.href;
 }catch{return null;}
};
const originalLocalDocument=value=>typeof value==='string'&&/^assets\/source\/[a-z0-9._-]+\.(?:pdf|docx?|odt|rtf|txt)$/i.test(value)?value:null;
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
 const title=String(data.title||'Раздел').replace(/[\u200b-\u200d\ufeff]/g,'').trim();
 const long=title.length>=55;
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
 const unnamedLead=(data.fields||[]).find(f=>!String(f.key||'').trim()&&String(f.value||'').trim().length>=30&&String(f.value||'').trim().length<=280);
 const lead=(String(data.intro||'').trim()||String(unnamedLead?.value||'').trim()).replace(/[\u200b-\u200d\ufeff]/g,'').trim();
 if(lead)box.append(el('p','source-intro',lead));
 return box;
}
function facts(data){
 const rows=(data.fields||[]).filter(f=>String(f.key||'').trim() && f.value && f.value.length<=350 && f.key.length<=90 && !(data.documents?.length&&/^файл\s*:?$/i.test(f.key.trim())));
 if(!rows.length)return null;
 const box=el('dl','source-details');
 rows.forEach(f=>{
  const dt=el('dt','',f.key||'Сведения'),dd=el('dd');
  const value=String(f.value||'').trim();
  let href=null;
  if(/^https:\/\/[^\s<>]+$/i.test(value)){
   try{const uri=new URL(value);if(!uri.username&&!uri.password)href=uri.href;}catch{}
  }else if(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(value))href='mailto:'+value;
  if(href){
   const a=el('a','source-meta-link',value);a.href=href;
   if(href.startsWith('https:')){a.target='_blank';a.rel='noopener noreferrer';}
   dd.append(a);
  }else dd.textContent=value;
  box.append(dt,dd);
 });
 return box;
}
function listView(data,index){
 if(!data.cards?.length)return null;
 const sec=el('section','source-listing source-listing--'+(data.slug||'section'));
 const across=data.slug==='archive';
 const top=el(across?'form':'div','source-filterbar'+(across?' source-filterbar-global':''));
 const lab=el('label','source-filterlabel',across?'Поиск по всему разделу':'Фильтр карточек на этой странице');
 const input=el('input','source-filter-input');
 input.type='search';input.placeholder=across?'Слово или фраза во всех материалах':'Название или тема';
 input.setAttribute('aria-label',across?'Поиск по всем материалам раздела':'Фильтр карточек на текущей странице');
 lab.append(input);
 const count=el('output','source-filter-count',across?'На странице: '+data.cards.length:'Показано: '+data.cards.length);count.setAttribute('aria-live','polite');
 top.append(lab);
 if(across){
  const btn=el('button','source-filter-submit','Найти');
  btn.type='submit';top.append(btn);
  top.addEventListener('submit',event=>{
   event.preventDefault();
   const q=input.value.trim();
   if(!q){input.focus();return;}
   location.href='view.html?p=search-results&q='+encodeURIComponent(q)+'&section='+encodeURIComponent(data.archiveSection||'all');
  });
 }else top.append(count);
 sec.append(top);
 const grid=el('div','source-grid');const rows=[];
 const groupByKind=across&&data.archiveSection==='all';
 const groupByPicture=(!across&&['articles','articles-list'].includes(data.slug))||(across&&data.archiveSection==='articles');
 const groups=new Map();
 const typeLabels={'news-item':'Новости','article':'Публикации и исследования',book:'Книги',project:'Проекты',
  department:'Региональные отделения',profile:'Участники',partner:'Партнёры',
  'poster-item':'Мероприятия','collegium-item':'Советы','articles-list':'Материалы','library':'Библиотека',
  'about-page':'Об обществе','glossary-item':'Глоссарий','newspaper':'Газета РКО'};
 const getGroup=card=>{
  if(!groupByKind&&!groupByPicture)return grid;
  const type=card.kind||card.type||'other';
  const key=groupByKind?type:(card.image?'media':'text');
  if(!groups.has(key)){
   const section=el('section','source-content-group');
   const headline=el('h2','source-content-group-title',
    groupByKind?(typeLabels[type]||'Другие материалы'):(key==='media'?'С иллюстрациями':'Тексты и исследования'));
   section.append(headline);
   const content=el('div','source-grid');
   section.append(content);groups.set(key,{section,headline,content});
  }
  return groups.get(key).content;
 };
 const textMark=(kind,caption)=>{
  const symbol={'news-item':'Н','article':'А','book':'К','project':'П','department':'РКО',
   'profile':'У','partner':'РКО','poster-item':'С','collegium-item':'С' }[kind]||'РКО';
  const wrap=el('div','source-card-identity');
  const logo=el('span','source-card-monogram',symbol);
  logo.setAttribute('aria-hidden','true');
  wrap.append(logo);
  return wrap;
 };
 for(const card of data.cards){
  const href=listingHref(card,index);
  const contextualKind={departments:'department',users:'profile',news:'news-item',
   partners:'partner',projects:'project',poster:'poster-item',
   articles:'article','articles-list':'article',library:'book',collegium:'collegium-item'};
  const kind=card.kind||card.type||contextualKind[data.slug]||'other';
  const media=localImage(card.image);
  const geometry=media?imageGeometry[media]:null;
  const tiny=!!geometry&&Math.max(geometry.w,geometry.h)<96;
  const missingCover=(!media||tiny)&&(data.slug==='library'||(data.slug==='archive'&&data.archiveSection==='library'&&kind==='book'));
  const item=el(href?'a':'article','source-card'+((media&&!tiny||missingCover)?' source-card--media':'')
   +(!media||tiny?' source-card--text':'')+(missingCover?' source-card--missing-cover':''));
  item.dataset.kind=kind;
  if(href)item.href=href;
  if(media&&!tiny){
   const wrap=el('div','source-card-media'),image=el('img');
   image.src=geometry?.thumbnail||media;
   if(geometry?.thumbnail){
    image.srcset=geometry.thumbnail+' 420w, '+media+' '+geometry.w+'w';
    image.sizes='(max-width:640px) 90vw, (max-width:1050px) 46vw, 33vw';
   }
   image.loading='lazy';image.decoding='async';image.alt=card.title||'';
   if(geometry&&Math.max(geometry.w,geometry.h)<260)item.classList.add('source-card--compact-art');
   image.addEventListener('load',()=>{
    const natural=Math.max(image.naturalWidth,image.naturalHeight);
    if(natural<96){
     item.classList.add('source-card--text');
     item.classList.remove('source-card--media');
     wrap.replaceWith(textMark(kind,card.title));
    }else if(natural<260)item.classList.add('source-card--compact-art');
   });
   image.addEventListener('error',()=>{
    item.classList.add('source-card--text');
    item.classList.remove('source-card--media');
    if(missingCover||kind==='book')wrap.replaceChildren(el('span','book-cover-placeholder','Обложка временно недоступна'));
    else wrap.replaceWith(textMark(kind,card.title));
   });
   wrap.append(image);item.append(wrap);
  }else if(missingCover){
   const wrap=el('div','source-card-media');
   wrap.append(el('span','book-cover-placeholder','Обложка не представлена'));
   item.append(wrap);
  }else item.append(textMark(kind,card.title));
  const inner=el('div','source-card-copy');
  // Source card text sometimes combines title, #project, date and a comment counter.
  // Keep full source data for filtering, but present these as separate readable fields.
  const raw=String(card.title||'Материал').replace(/\u200b/g,'').trim();
  const project=raw.match(/\s+#([^#]+)$/);
  const title=project?raw.slice(0,project.index).trim():raw;
  const heading=el('h3','',title);heading.title=title;
  const cardLabels={'news-item':'Новость',article:'Статья',book:'Книга',project:'Проект',
   department:'Отделение',profile:'Участник',partner:'Партнёр',
   'poster-item':'Мероприятие','collegium-item':'Совет',
   'about-page':'Об обществе','glossary-item':'Глоссарий'};
  const typeText=cardLabels[kind]||'Материал';
  inner.append(el('span','source-card-kind',typeText),heading);
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
  item.append(inner);getGroup(card).append(item);
  rows.push([item,(card.title+' '+(card.description||'')).toLocaleLowerCase('ru')]);
 }
 if(!across)input.addEventListener('input',()=>{
  let visible=0;const q=input.value.trim().toLocaleLowerCase('ru');
  rows.forEach(([item,text])=>{item.hidden=!!q&&!text.includes(q);if(!item.hidden)visible++;});
  for(const group of groups.values())group.section.hidden=![...group.content.children].some(item=>!item.hidden);
  count.textContent=(data.slug==='archive'?'Найдено на странице: ':'Найдено: ')+visible;
 });
 if(groups.size)for(const group of groups.values())sec.append(group.section);
 else sec.append(grid);
 return sec;
}
function listingIntroduction(data){
 // CMS listing templates embed copies of the same cards below their own list.
 // Render only genuinely introductory prose before the first repeated listing item.
 // All source blocks remain intact in JSON; detail pages supply full content.
 const cards=data.cards||[];
 if(!cards.length)return data.blocks||[];
 const headings=new Set(cards.map(c=>String(c.title||'').normalize('NFKC').trim().toLocaleLowerCase('ru')));
 const images=new Set(cards.map(c=>c.image).filter(Boolean));
 const lead=[];
 for(const block of data.blocks||[]){
  if(block.type==='image'){
   if(images.has(block.src)||lead.length===0)break;
   break;
  }
  if(block.type==='heading'){
   const value=String(block.text||'').normalize('NFKC').trim().toLocaleLowerCase('ru');
   if(headings.has(value)||lead.length>0)break;
   continue;
  }
  if(!['paragraph','quote','list'].includes(block.type))break;
  if(block.type==='list')break; // Legacy filter/pagination navigation, not editorial text.
  if(String(block.text||'').trim().length<25)continue;
  lead.push(block);
 }
 return lead;
}
function getRich(data,type,index){
 // Preserve original full text but expose navigable URLs and readable sections.
 const resolveHref=raw=>{
  if(/^mailto:[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(raw))return raw;
  try{
   const uri=new URL(raw);
   if(uri.protocol!=='https:'||uri.username||uri.password)return null;
   const local=listingHref({url:uri.origin+uri.pathname},index);
   return local||uri.href; // An unarchived public link remains an explicit original.
  }catch{return null;}
 };
 const autoLink=part=>{
  const text=String(part.text||'');
  if(part.href)return [{...part,href:resolveHref(part.href)}];
  const spans=[],pattern=/https?:\/\/[^\s<>«»"'\[\]]+|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
  let start=0,match;
  while((match=pattern.exec(text))){
   const original=match[0],clean=original.replace(/[.,;:!?)}\]]+$/g,'');
   const target=resolveHref(clean.includes('@')&&!clean.startsWith('http')?'mailto:'+clean:clean);
   if(!target)continue;
   if(match.index>start)spans.push({...part,text:text.slice(start,match.index),href:null});
   spans.push({...part,text:clean,href:target});
   start=match.index+clean.length;
   pattern.lastIndex=start;
  }
  if(start<text.length)spans.push({...part,text:text.slice(start),href:null});
  return spans.length?spans:[part];
 };
 const originals=(data.blocks||[]).filter(x=>(x.type!=='image'||localImage(x.src))
  &&!(type==='book'&&x.type==='image'&&x.src===(data.images||[])[0]));
 const numbered=originals.filter(b=>b.type==='paragraph'&&/^\s*\d{1,2}[.)]\s+[А-ЯЁ0-9\s,«»"\-:]{6,120}\s*$/.test(b.text||'')).length;
 const blocks=originals.map(block=>{
  if(block.type==='paragraph'&&numbered>=2&&/^\s*\d{1,2}[.)]\s+[А-ЯЁ0-9\s,«»"\-:]{6,120}\s*$/.test(block.text||'')){
   return {...block,type:'heading',level:2};
  }
  if(block.type==='list'){
   return {...block,items:(block.items||[]).map(item=>{
    const content=String(item||'');
    return {text:content,spans:autoLink({text:content})};
   })};
  }
  if(!['paragraph','quote'].includes(block.type))return block;
  const original=Array.isArray(block.spans)&&block.spans.length?block.spans:[{text:block.text||''}];
  return {...block,spans:original.flatMap(autoLink)};
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
  const publicBlocks=[...(data.blocks||[])];
  const last=publicBlocks.at(-1),beforeLast=publicBlocks.at(-2);
  if(beforeLast?.type==='heading'&&/^стена проекта\s*$/i.test(beforeLast.text||'')&&last?.type==='paragraph'&&/^нет записей\.?\s*$/i.test(last.text||''))publicBlocks.splice(-2);
  const target=variant.fundraising?.target;
  const funded=Number.isFinite(target)&&target>0;
  return createProject({...data,blocks:publicBlocks,status:variant.status||'Проект РКО',
   direction:variant.direction||'',mission:variant.mission||'',
   goals:variant.goal?[variant.goal]:[],team:variant.team||[],
   files:[], // Documents are rendered once below, as actual links.
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
 // One unrelated image is not a gallery. Listings already have cover art.
 if(additional.length<2)return null;
 const view=el('details','source-gallery-disclosure');
 view.append(el('summary','','Фотоматериалы к публикации · '+additional.length));
 const explanation=el('p','source-gallery-hint','Дополнительные изображения исходной публикации. Выберите изображение, чтобы открыть его полностью.');
 const grid=el('div','source-gallery');
 additional.forEach((path,i)=>{
  const figure=el('figure','source-gallery-item'),link=el('a','source-gallery-link'),image=el('img');
  link.href=path;link.target='_blank';link.rel='noopener noreferrer';
  link.setAttribute('aria-label','Открыть изображение '+(i+1)+' полностью');
  image.src=path;image.loading='lazy';image.alt='Иллюстрация '+(i+1)+' к материалу '+String(data.title||'РКО');
  image.addEventListener('error',()=>figure.remove());
  link.append(image);figure.append(link,el('figcaption','source-gallery-caption','Изображение '+(i+1)+' из '+additional.length));grid.append(figure);
 });
 view.append(explanation,grid);return view;
}
function documents(data){
 if(!data.documents?.length)return null;
 const section=el('section','source-documents');section.append(el('h2','','Документы'));
 for(const doc of data.documents){
  const file=originalLocalDocument(doc.localUrl)||originalDownload(doc.url);
  const a=el(file?'a':'div','source-document'+(file?'':' source-document-static'),doc.label||'Документ');
  if(file){a.href=file;if(file.startsWith('https://')){a.rel='noopener noreferrer';a.setAttribute('data-original-download','cosmatica');}}
  section.append(a);
 }
 return section;
}
async function renderArchive(){
 const sectionName=(qs.get('section')||'all').trim();
 const sectionsResponse=await fetch('data/archive/sections.json?v=archive75');
 if(!sectionsResponse.ok){notFound();return;}
 const sections=await sectionsResponse.json();
 const selected=sections.find(x=>x.key===sectionName);
 if(!selected){notFound();return;}
 const requested=Number(qs.get('page')||1);
 if(!Number.isSafeInteger(requested)||requested<1||requested>selected.pages){notFound();return;}
 const pageResponse=await fetch('data/archive/catalog/'+sectionName+'/'+requested+'.json?v=parityf7cd559');
 if(!pageResponse.ok){notFound();return;}
 const data=await pageResponse.json();
 if(data.slug!=='archive'||data.archiveSection!==sectionName||!Array.isArray(data.cards)){notFound();return;}
 const link=(key,n=1)=>'view.html?p=archive&section='+encodeURIComponent(key)+'&page='+n;
 const wrapper=el('section','section source-page source-page--archive source-page--archive-'+sectionName);
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
 await imageGeometryReady;
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
 const response=await fetch('data/'+file+'?v=mobileshot1008');
 if(!response.ok){notFound();return;}
 const data=await response.json();
 if(!Array.isArray(data.blocks)||!Array.isArray(data.cards)){notFound();return;}
 if(ref&&data.slug!==slug){notFound();return;}
 if(['about','direction'].includes(slug)&&!data.blocks.length&&!data.cards.length){notFound();return;}
 const section=el('section','section source-page source-page--'+(data.slug||slug)),inner=el('div','shell');
 inner.append(heading(data));
 const info=facts(data);
 const cover=(data.slug==='book'&&(!data.cards||!data.cards.length))?localImage((data.images||[])[0]):null;
 if(data.slug==='book'){
  const overview=el('section','book-detail-overview');
  const visual=el('figure','book-detail-cover'),img=el('img');
  if(cover){
   img.src=cover;img.loading='eager';img.alt='Обложка книги «'+String(data.title||'РКО')+'»';
   img.addEventListener('error',()=>{img.remove();visual.prepend(el('span','book-cover-placeholder','Обложка временно недоступна'));});
   visual.append(img,el('figcaption','','Обложка издания'));
  }else visual.append(el('span','book-cover-placeholder','Обложка не представлена'));
  const details=el('div','book-detail-metadata');
  if(info)details.append(info);
  details.append(el('p','book-detail-note','Файл книги хранится на сервере Русского космического общества.'));
  overview.append(visual,details);inner.append(overview);
 }else if(info)inner.append(info);
 const hasListing=Array.isArray(data.cards)&&data.cards.length>0;
 if(hasListing){
  const intro=listingIntroduction(data);
  if(intro.length){
   const about=el('section','source-listing-intro');
   about.append(createRichBlocks(intro));
   inner.append(about);
  }
 }
 await imageGeometryReady;
 const cards=listView(data,index);if(cards)inner.append(cards);
 if(!ref&&!qs.has('item')){
  const archiveSections={news:'news',poster:'poster',projects:'projects',library:'library',users:'users',
   'articles-list':'articles',articles:'articles',departments:'departments',partners:'partners',
   collegium:'collegium','about-info':'about'};
  const name=archiveSections[slug];
  if(name){const a=el('a','source-document source-archive-all-link','Все материалы раздела →');
   a.href='view.html?p=archive&section='+name;inner.append(a);}
 }
 // A listing is already the public archive representation. Do not render its
 // repeated headings, previews, thumbnails and expansion blocks a second time.
 if(!hasListing&&data.blocks.length){
  const content=getRich(data,data.slug||slug,index);
  const headings=[...content.querySelectorAll('h2,h3')].filter(h=>h.textContent.trim().length>3);
  if(headings.length>=5){
   const nav=el('nav','source-article-toc');
   nav.setAttribute('aria-label','Разделы материала');
   nav.append(el('p','source-article-toc-title','В этом материале'));
   const links=el('div','source-article-toc-links');
   headings.slice(0,24).forEach((h,i)=>{
    const id='content-heading-'+(i+1);h.id=id;
    const link=el('a','',''+h.textContent.trim());link.href='#'+id;
    links.append(link);
   });
   nav.append(links);inner.append(nav);
  }
  inner.append(content);
 }
 const photos=(!hasListing&&slug!=='home'&&!ref?gallery(data):!hasListing&&ref?gallery(data):null);if(photos)inner.append(photos);
 const docs=documents(data);if(docs)inner.append(docs);
 section.append(inner);
 if(slug==='home'&&!ref){
  // The historical homepage snapshot contains duplicate navigation, hundreds of
  // repeated listing titles and uncaptained images. Keep full source JSON for CMS
  // handoff but never append it as an unrelated giant accordion to the homepage.
  return;
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
 const pending=body?.querySelector('.source-loading');
 if(pending){
  const status=pending.querySelector('p');
  if(status)status.textContent='Не удалось загрузить материалы. Проверьте соединение и обновите страницу.';
  const retry=el('a','source-document','Повторить загрузку ↻');retry.href=location.href;
  pending.querySelector('.shell')?.append(retry);
 }
}
