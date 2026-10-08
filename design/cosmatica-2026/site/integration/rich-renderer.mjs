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
     // Preview never sends readers away from the approved demo.
     if(destination && new URL(destination).origin===location.origin){
      const a=node('a');a.href=destination;a.append(child);element.append(a);
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
   element.append(img);
   if(b.caption)element.append(node('figcaption','',b.caption));
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
