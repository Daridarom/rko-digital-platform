import {createArticle,createEvent,createProject} from './rich-renderer.mjs';

/**
 * Optional full-structure preview for three demanding CMS templates.
 * Production integration supplies window.COSMATICA_MIGRATED_PAGES.
 * The page never infers editorial completeness from shortened fixtures.
 */
const query=new URLSearchParams(location.search);
const kind=query.get('p')||'';
if(['article','poster-item','project'].includes(kind) && query.get('layout')==='full'){
 const content=window.COSMATICA_CONTENT||{};
 const catalog=window.COSMATICA_MIGRATED_PAGES||{};
 const title=window.COSMATICA_ROUTES?.find(x=>x.slug===kind)?.title||'';
 const normalized=catalog[kind] || await fullRecord(kind,query,content) || fallback(kind,content,title,query);
 const root=document.querySelector('#main');
 if(root && normalized){
  const shell=document.createElement('section');
  shell.className='section rich-cms-page';
  const inner=document.createElement('div');
  inner.className='shell';
  const heading=document.createElement('div');
  heading.className='rich-cms-heading';
  const intro=document.createElement('p');
  intro.className='eyebrow';
  intro.textContent=kind==='article'?'ПУБЛИКАЦИЯ':kind==='poster-item'?'МЕРОПРИЯТИЕ':'ПРОЕКТ';
  const h1=document.createElement('h1');
  h1.textContent=normalized.title||title;
  heading.append(intro,h1);
  if(normalized.intro){
   const lead=document.createElement('p');
   lead.className='lede';lead.textContent=normalized.intro;
   heading.append(lead);
  }
  inner.append(heading);
  const renderer=kind==='article'?createArticle:kind==='poster-item'?createEvent:createProject;
  inner.append(renderer(normalized));
  shell.append(inner);
  const crumbs=root.querySelector('.crumbs');
  const old=[...root.children];
  root.replaceChildren(...(crumbs?[crumbs]:[]),shell);
  // Do not silently overwrite every page: only 3 matching routes and an explicit preview flag.
  // The existing view remains available as the default until editorial approval.
  document.title=normalized.title+' — Русское космическое общество';
 }
}

async function fullRecord(type,query,content){
 let path='source/'+type+'.json';
 const ref=query.get('ref');
 if(ref&&/^[a-f0-9]{18}$/.test(ref))path='linked/'+ref+'.json';
 else if(type==='project'&&(query.get('id')||'gagarincy')!=='gagarincy'){
  const id=query.get('id');
  const item=content.project?.variants?.[id];
  if(!item?.sourceUrl)return null;
  try{
   const r=await fetch('data/linked-index.json');
   if(!r.ok)return null;
   const map=await r.json(),node=map[item.sourceUrl];
   if(!node||node.status!=='ready')return null;
   path=node.alias?node.file:'linked/'+node.file;
  }catch{return null;}
 }
 try{
  const r=await fetch('data/'+path,{cache:'no-cache'});
  if(!r.ok)return null;
  const data=await r.json();
  if(!Array.isArray(data.blocks))return null;
  data.blocks=data.blocks.filter(b=>b.type!=='image'||(typeof b.src==='string'&&b.src.startsWith('assets/source/')));
  if(type==='article')return data;
  if(type==='poster-item'){
   const info=content['poster-item']||{};
   const fact=label=>info.facts?.find(x=>x.label===label)?.value||'';
   return {...data,startsAt:fact('Даты'),venue:fact('Место'),format:fact('Формат'),program:[],
    files:(data.documents||[]).map(x=>({name:x.label,format:x.type||''}))};
  }
  if(type==='project'){
   const id=query.get('id')||'gagarincy';
   const item=content.project?.variants?.[id]||{};
   const goal=item.fundraising?.target,valid=Number.isFinite(goal)&&goal>0;
   return {...data,status:item.status||'Проект РКО',direction:item.direction||'',
    mission:item.mission||'',goals:item.goal?[item.goal]:[],
    files:(data.documents||[]).map(x=>({name:x.label,format:x.type||''})),
    fundraising:{mode:item.fundraising?.enabled?(valid?'active':'not_configured'):'none',
      target:valid?goal:null,raised:item.fundraising?.raised||null}};
  }
  return data;
 }catch{return null;}
}

function fallback(type,all,title,query){
 const blocks=rows=>(rows||[]).flatMap(row=>[
  {type:'heading',level:2,text:row.title},
  {type:'paragraph',text:row.body}
 ]);
 if(type==='article'){
  const data=all.article||{};
  return {title,author:data.author||'',publishedAt:data.date||'',intro:data.intro||'',
   blocks:blocks(data.sections)};
 }
 if(type==='poster-item'){
  const data=all['poster-item']||{};
  const fact=label=>data.facts?.find(f=>f.label===label)?.value||'';
  return {title,startsAt:fact('Даты'),venue:fact('Место'),format:fact('Формат'),
    organizer:data.organizer||'',intro:data.intro||'',blocks:blocks(data.sections),
    program:(data.program||[]).map(x=>({type:'paragraph',text:x})),
    files:(data.documents||[]).map(x=>({name:x.label,format:x.type}))};
 }
 if(type==='project'){
  const projectId=query.get('id')||'gagarincy';
  const p=all.project?.variants?.[projectId];
  if(!p)return null;  // Never fall back to a different project.
  const funding=p.fundraising||{};
  const hasGoal=Number.isFinite(funding.target) && funding.target>0;
  return {title:p.name,status:p.status,direction:p.direction,mission:p.mission,
   goals:p.goal?[p.goal]:[],intro:p.fullName,
   blocks:blocks(p.sections).concat(p.history?[{type:'paragraph',text:p.history}]:[]),
   team:p.team||[],files:p.documents?.map(x=>({name:x.label,format:x.type}))||[],
   news:[],events:[],
   fundraising:{mode:funding.enabled?(hasGoal?'active':'not_configured'):'none',
     raised:funding.raised??null,target:funding.target??null}};
 }
 return null;
}
