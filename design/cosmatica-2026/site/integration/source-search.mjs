const params=new URLSearchParams(location.search);
// Category choice is available before the first search, not only on results.
if(params.get('p')==='search'){
 const form=document.querySelector('#searchForm');
 if(form){
  try{
   const reply=await fetch('data/archive/sections.json?v=archive75');
   if(reply.ok){
    const categories=await reply.json();
    const label=document.createElement('label');
    label.className='search-category-label';
    label.textContent='Раздел';
    const select=document.createElement('select');
    select.className='search-category-select';select.id='searchSection';select.name='section';
    for(const item of categories){
     if(!item.count)continue;
     const option=document.createElement('option');
     option.value=item.key;
     option.textContent=item.title+' ('+item.count.toLocaleString('ru')+')';
     select.append(option);
    }
    label.append(select);form.insertBefore(label,form.querySelector('button'));
   }
  }catch(err){console.warn('Search category options unavailable',String(err));}
 }
}
if(params.get('p')==='search-results'){
 const root=document.querySelector('.search-section .shell');
 const query=(params.get('q')||'').trim();
 const norm=s=>String(s||'').normalize('NFKC').toLocaleLowerCase('ru');
 const terms=norm(query).split(/\s+/).filter(Boolean);
 const make=(tag,cls='',text='')=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text)x.textContent=text;return x;};
 if(root){
  try{
   const first=await fetch('data/archive/search-index.json?v=archive75');
   const r=first.ok?first:await fetch('data/search-index.json?v=contentqa61');
   if(!r.ok)throw Error('Search index');
   const data=await r.json();
   if(!Array.isArray(data.records))throw Error('Search schema');
   const sectionsResponse=await fetch('data/archive/sections.json?v=archive75');
   const sections=sectionsResponse.ok?await sectionsResponse.json():[];
   const category=params.get('section')||'all';
   const current=sections.some(s=>s.key===category)?category:'all';
   const form=root.querySelector('#searchForm');
   if(form&&!form.querySelector('#searchSection')){
    const wrapper=make('label','search-category-label','Раздел');
    const dropdown=make('select','search-category-select');
    dropdown.id='searchSection';dropdown.name='section';
    for(const section of sections){if(!section.count)continue;
     const option=make('option','',section.title+' ('+section.count.toLocaleString('ru')+')');
     option.value=section.key;option.selected=section.key===current;dropdown.append(option);
    }
    wrapper.append(dropdown);
    form.insertBefore(wrapper,form.querySelector('button'));
   }
   const results=[];
   let matchedIds=null;
   if(terms.length&&data.sharded&&terms.every(t=>t.length>=3&&t.length<=80)){
    const keys=[...new Set(terms.map(t=>t.codePointAt(0).toString(16)))];
    const loaded=await Promise.all(keys.map(async key=>{
     const response=await fetch('data/archive/search-shards/'+key+'.json?v=archive75');
     return [key,response.ok?await response.json():{}];
    }));
    const byKey=Object.fromEntries(loaded);
    for(const term of terms){
     const group=byKey[term.codePointAt(0).toString(16)]||{};
     const ids=new Set();
     for(const [word,posts] of Object.entries(group)){
      if(word.startsWith(term))for(const id of posts)ids.add(id);
     }
     if(matchedIds===null)matchedIds=ids;
     else matchedIds=new Set([...matchedIds].filter(x=>ids.has(x)));
     if(matchedIds.size===0)break;
    }
   }
   if(terms.length){
    const candidates=matchedIds===null?data.records:[...(matchedIds||[])].map(id=>data.records[id]).filter(Boolean);
    for(const item of candidates){
     if(current!=='all'&&!(item.sections||[]).includes(current))continue;
     const rank=terms.reduce((n,w)=>n+(norm(item.title).includes(w)?6:1),0);
     if(matchedIds===null&&!terms.every(w=>(norm(item.title)+' '+norm(item.text)).includes(w)))continue;
     results.push({...item,rank});
    }
    const publicId=item=>Number(item.url?.match(/\/(\d+)-/)?.[1]||0);
    // After lexical relevance, prioritise newer public records over alphabetic order.
    results.sort((a,b)=>b.rank-a.rank||publicId(b)-publicId(a)||a.title.localeCompare(b.title,'ru'));
   }
   const heading=root.querySelector('.search-heading')||root.appendChild(make('h2','search-heading'));
   const label=sections.find(s=>s.key===current)?.title||'Все разделы';
   heading.textContent=query?'Найдено материалов: '+results.length+(current!=='all'?' · '+label:''):'Введите поисковый запрос';
   // Replace the fixture's results before showing the real full-text index.
   root.querySelectorAll(':scope > .grid:not(.search-grid), :scope > .empty-state, :scope > .search-grid, :scope > .search-empty, :scope > .source-search-pages, :scope > .search-pending').forEach(node=>node.remove());
   const size=20,max=Math.max(1,Math.ceil(results.length/size));
   const page=Math.max(1,Math.min(max,Number(params.get('page'))||1));
   const shown=results.slice((page-1)*size,page*size);
   const grid=make('div','grid search-grid');
   const kind={'news-item':'Новость','article':'Статья','book':'Книга','project':'Проект','poster-item':'Мероприятие','profile':'Участник'};
   for(const item of shown){
    if(!/^(?:index\.html|view\.html\?p=)/.test(item.route))continue;
    const card=make('a','card');card.href=item.route;
    card.append(make('span','tag',kind[item.type]||'Раздел'));
    card.append(make('h3','',item.title));
    if(item.summary)card.append(make('p','',item.summary));
    grid.append(card);
   }
   if(shown.length)root.append(grid);
   else root.append(make('p','search-empty',
       query?'В опубликованных материалах совпадений нет. Попробуйте другой запрос.':'Введите слово или фразу.'));
   if(max>1){
    const nav=make('nav','source-search-pages');nav.setAttribute('aria-label','Страницы результатов поиска');
    const overview=make('span','source-page-summary','Страница '+page+' из '+max);
    nav.append(overview);
    const addPage=(label,number,selected=false)=>{
     const a=make('a',selected?'active':'',label);
     a.href='view.html?p=search-results&q='+encodeURIComponent(query)+'&section='+encodeURIComponent(current)+'&page='+number;
     if(selected)a.setAttribute('aria-current','page');
     nav.append(a);
    };
    if(page>1){addPage('« Первая',1);addPage('‹ Назад',page-1);}
    for(let p=Math.max(1,page-2);p<=Math.min(max,page+2);p++)addPage(String(p),p,page===p);
    if(page<max){addPage('Вперёд ›',page+1);addPage('Последняя »',max);}
    root.append(nav);
   }
  }catch(e){
   root.querySelectorAll(':scope > .search-pending, :scope > .grid, :scope > .empty-state').forEach(node=>node.remove());
   root.append(make('p','search-empty','Поиск временно недоступен.'));
   console.error('Local search',String(e));
  }
 }
}
