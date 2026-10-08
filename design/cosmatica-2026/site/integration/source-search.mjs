const params=new URLSearchParams(location.search);
if(params.get('p')==='search-results'){
 const root=document.querySelector('.search-section .shell');
 const query=(params.get('q')||'').trim();
 const norm=s=>String(s||'').normalize('NFKC').toLocaleLowerCase('ru');
 const terms=norm(query).split(/\s+/).filter(Boolean);
 const make=(tag,cls='',text='')=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text)x.textContent=text;return x;};
 if(root){
  try{
   const r=await fetch('data/search-index.json');
   if(!r.ok)throw Error('Search index');
   const data=await r.json();
   if(!Array.isArray(data.records))throw Error('Search schema');
   const results=[];
   if(terms.length){
    for(const item of data.records){
     const hay=norm(item.title)+' '+norm(item.text);
     if(!terms.every(w=>hay.includes(w)))continue;
     results.push({...item,rank:terms.reduce((n,w)=>n+(norm(item.title).includes(w)?6:1),0)});
    }
    results.sort((a,b)=>b.rank-a.rank||a.title.localeCompare(b.title,'ru'));
   }
   const heading=root.querySelector('.search-heading')||root.appendChild(make('h2','search-heading'));
   heading.textContent=query?'Найдено материалов: '+results.length:'Введите поисковый запрос';
   root.querySelector('.search-grid')?.remove();
   root.querySelector('.search-empty')?.remove();
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
    const nav=make('nav','source-search-pages');nav.setAttribute('aria-label','Страницы результатов');
    for(let p=Math.max(1,page-2);p<=Math.min(max,page+2);p++){
     const a=make('a',page===p?'active':'',String(p));
     a.href='view.html?p=search-results&q='+encodeURIComponent(query)+'&page='+p;
     if(page===p)a.setAttribute('aria-current','page');nav.append(a);
    }
    root.append(nav);
   }
  }catch(e){
   root.append(make('p','search-empty','Поиск временно недоступен.'));
   console.error('Local search',String(e));
  }
 }
}
