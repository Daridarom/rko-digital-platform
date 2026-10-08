/**
 * Rich page renderer: shared semantic, XSS-resistant DOM layer.
 * No innerHTML, no network, no auth/payment writes.
 * Used in three full-content templates: article, event and project.
 */
const node=(name,className='',value=null)=>{
 const el=document.createElement(name);
 if(className)el.className=className;
 if(value!=null)el.textContent=String(value);
 return el;
};
const safeSource=s=>{
 if(typeof s!=='string'||!s.trim())return null;
 try{
  const u=new URL(s,location.href);
  return (u.origin===location.origin || u.protocol==='https:') ? u.href : null;
 }catch{return null;}
};
const approvedVideo=(b)=>{
 if(!b||b.type!=='video')return null;
 if(b.platform==='youtube'&&/^[a-zA-Z0-9_-]{11}$/.test(b.videoId||'')){
  return {embed:'https://www.youtube-nocookie.com/embed/'+b.videoId,
          source:'https://www.youtube.com/watch?v='+b.videoId,provider:'YouTube'};
 }
 try{
  const u=new URL(b.embedUrl),h=u.hostname.toLowerCase(),p=u.pathname;
  if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
  let allowed=false;
  if(['cosmovid.ru','radovid.ru','bkvid.ru'].includes(h)){
   allowed=/^\/videos\/embed\/[a-f0-9-]{36}\/?$/i.test(p);
  }else if(h==='rutube.ru'){
   allowed=/^\/play\/embed\/[a-zA-Z0-9_-]{12,}\/?$/.test(p);
  }else if(['vkvideo.ru','vk.com','vk.ru'].includes(h)){
   allowed=p==='/video_ext.php'&&/^-?\d+$/.test(u.searchParams.get('oid')||'')&&
    /^\d+$/.test(u.searchParams.get('id')||'');
  }else if(h==='video.nikatv.ru'){
   allowed=/^\/video\/[a-zA-Z0-9_-]+\/?$/.test(p);
  }
  return allowed?{embed:u.href,source:u.href,provider:h}:null;
 }catch{return null;}
};
export function createRichBlocks(blocks=[], options={}){
 const wrap=node('div','rich-blocks');
 for(const b of blocks){
  if(!b || typeof b!=='object')continue;
  let element=null;
  if(b.type==='heading'){
   const level=Math.max(2,Math.min(4,Number(b.level)||2));
   element=node('h'+level,'rich-heading',b.text||'');
   if(options.onHeading)options.onHeading(element);
  }else if(b.type==='paragraph'||b.type==='quote'){
   element=node(b.type==='quote'?'blockquote':'p','rich-'+b.type);
   if(Array.isArray(b.spans)&&b.spans.length){
    for(const part of b.spans){
     let child=document.createTextNode(String(part.text??''));
     for(const mark of part.marks||[]){
      if(!['bold','italic','underline','code','sup','sub'].includes(mark))continue;
      const tag={bold:'strong',italic:'em',underline:'u',code:'code',sup:'sup',sub:'sub'}[mark];
      const outer=node(tag);outer.append(child);child=outer;
     }
     const destination=part.href&&safeSource(part.href);
     if(destination){
      const a=node('a');a.href=destination;
      if(new URL(destination).origin!==location.origin){
       a.target='_blank';a.rel='noopener noreferrer';a.referrerPolicy='no-referrer';
       a.dataset.contentExternal='true';
      }
      a.append(child);element.append(a);
     }else element.append(child);
    }
   }else element.textContent=String(b.text||'');
  }else if(b.type==='list'){
   element=node(b.ordered?'ol':'ul','rich-list');
   for(const text of b.items||[])element.append(node('li','',text));
  }else if(b.type==='table'){
   element=node('div','rich-table-wrap');
   const table=node('table','rich-table');
   (b.rows||[]).forEach((row,i)=>{
    const tr=node('tr');
    (row||[]).forEach(cell=>tr.append(node(i===0?'th':'td','',cell)));
    table.append(tr);
   });
   element.append(table);
  }else if(b.type==='image'){
   const src=safeSource(b.src||'');
   if(!src)continue;
   element=node('figure','rich-figure');
   const img=node('img');img.src=src;img.alt=String(b.alt||'');img.loading='lazy';
   img.addEventListener('error',()=>element.replaceChildren(node('figcaption','rich-image-unavailable','Исходное изображение временно недоступно')));
   element.append(img);
   if(b.caption)element.append(node('figcaption','',b.caption));
  }else if(b.type==='video'&&approvedVideo(b)){
   // Nothing is downloaded, and no external player is requested until opened.
   const video=approvedVideo(b);
   element=node('details','rich-video');
   const summary=node('summary','',b.title||'Смотреть видео');
   const frameWrap=node('div','rich-video-frame');
   const source=node('a','rich-video-source','Открыть исходное видео ↗');
   source.href=video.source;
   source.target='_blank';source.rel='noopener noreferrer';
   source.referrerPolicy='no-referrer';source.dataset.contentExternal='true';
   element.append(summary,frameWrap,source);
   element.addEventListener('toggle',()=>{
    if(element.open&&!frameWrap.firstChild){
     const frame=node('iframe');
     frame.src=video.embed;
     frame.title=b.title||'Видео РКО';
     frame.loading='lazy';frame.referrerPolicy='no-referrer';
     frame.setAttribute('allow','encrypted-media; picture-in-picture; fullscreen');
     frame.setAttribute('allowfullscreen','');
     frameWrap.append(frame);
    }else if(!element.open)frameWrap.replaceChildren();
   });
  }else if(b.type==='file'){
   element=node('div','rich-file');
   element.append(node('span','',b.name||'Документ'));
   if(b.format)element.append(node('small','',b.format));
  }else if(b.type==='separator')element=node('hr','rich-rule');
  if(element)wrap.append(element);
 }
 return wrap;
}
const section=(title,blocks,anchor)=>{
 const box=node('section','rich-section');
 if(anchor)box.id=anchor;
 if(title)box.append(node('h2','',title));
 box.append(createRichBlocks(blocks));
 return box;
};
const tag=(title,value)=>{
 const article=node('div','rich-metric');
 article.append(node('small','',title),node('b','',value));
 return article;
};
const link=(title,href)=>{const a=node('a','rich-local-link',title);a.href=href;return a;};
function buildToc(blocks){
 const aside=node('nav','rich-toc');
 aside.setAttribute('aria-label','Содержание');
 aside.append(node('strong','','Содержание'));
 let count=0;
 const mapped=blocks.map(b=>{
  if(b.type==='heading'){
   const key='rich-section-'+(++count);
   const a=link(b.text,key?'#'+key:'#');
   a.className='rich-toc-link';aside.append(a);
   return {...b,anchor:key};
  }
  return b;
 });
 return {aside,blocks:mapped};
}
function renderMapped(blocks){
 const root=node('div','rich-blocks');
 for(const block of blocks){
  const fragment=createRichBlocks([block]);
  if(block.anchor)fragment.firstElementChild.id=block.anchor;
  root.append(...fragment.childNodes);
 }
 return root;
}
export function createArticle(record){
 const layout=node('div','rich-layout rich-article-layout');
 const content=node('article','rich-body');
 if(record.author||record.publishedAt){
  const row=node('div','rich-meta');
  if(record.author)row.append(tag('Автор',record.author));
  if(record.publishedAt)row.append(tag('Дата',record.publishedAt));
  content.append(row);
 }
 const {aside,blocks}=buildToc(record.blocks||[]);
 content.append(renderMapped(blocks));
 layout.append(content,aside);
 return layout;
}
export function createEvent(record){
 const layout=node('div','rich-layout rich-event-layout');
 const main=node('article','rich-body');
 const details=node('aside','rich-event-facts');
 const values=[['Дата и время',record.startsAt],['Окончание',record.endsAt],['Место',record.venue],['Формат',record.format],['Организатор',record.organizer]];
 values.filter(x=>x[1]).forEach(x=>details.append(tag(x[0],x[1])));
 if(record.program?.length)main.append(section('Программа',record.program,'rich-program'));
 main.append(section('О мероприятии',record.blocks||[],'rich-description'));
 if(record.participants?.length)main.append(section('Участники',[{type:'list',items:record.participants}],'rich-participants'));
 if(record.files?.length)main.append(section('Материалы',record.files.map(x=>({type:'file',name:x.name,format:x.format})),'rich-files'));
 layout.append(main,details);
 return layout;
}
export function createProject(record){
 const layout=node('div','rich-layout rich-project-layout');
 const main=node('article','rich-body');
 const aside=node('aside','rich-project-aside');
 const funding=record.fundraising||{mode:'none'};
 aside.append(tag('Статус',record.status||'Информация о проекте'));
 if(record.direction)aside.append(tag('Направление',record.direction));
 if(funding.mode==='active' && Number.isFinite(funding.target) && funding.target>0){
  const fundraiser=node('div','rich-fundraiser');
  fundraiser.append(tag('Собрано',new Intl.NumberFormat('ru-RU').format(funding.raised||0)+' ₽'));
  fundraiser.append(tag('Цель',new Intl.NumberFormat('ru-RU').format(funding.target)+' ₽'));
  const bar=node('div','rich-progress');bar.setAttribute('role','progressbar');
  bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','100');
  const n=Math.min(100,Math.max(0,Math.round((funding.raised||0)/funding.target*100)));
  bar.setAttribute('aria-valuenow',String(n));
  const span=node('span');span.style.width=n+'%';bar.append(span);fundraiser.append(bar);
  aside.append(fundraiser);
 }else if(funding.mode==='completed')aside.append(tag('Сбор', 'Завершён'));
 if(record.mission)main.append(section('Миссия проекта',[{type:'paragraph',text:record.mission}],'rich-mission'));
 if(record.goals?.length)main.append(section('Цели', [{type:'list',items:record.goals}], 'rich-goals'));
 if(record.blocks?.length)main.append(section('Деятельность и развитие',record.blocks,'rich-about'));
 if(record.team?.length)main.append(section('Участники',[{type:'list',items:record.team.map(x=>typeof x==='string'?x:(x.name||''))}],'rich-team'));
 if(record.files?.length)main.append(section('Документы',record.files.map(x=>({type:'file',name:x.name,format:x.format})),'rich-files'));
 if(record.news?.length)main.append(section('Новости проекта',[{type:'list',items:record.news.map(x=>x.title||x)}],'rich-news'));
 if(record.events?.length)main.append(section('Мероприятия', [{type:'list',items:record.events.map(x=>x.title||x)}],'rich-events'));
 layout.append(aside,main);
 return layout;
}
