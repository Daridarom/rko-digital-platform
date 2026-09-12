(()=>{
if(!document.querySelector('link[data-inner-qa]')){const q=document.createElement('link');q.rel='stylesheet';q.href='inner-qa.css';q.dataset.innerQa='true';document.head.appendChild(q)}
const p=new URLSearchParams(location.search);let m=p.get('mode')||localStorage.getItem('cosmatica-orbit-mode')||'light';
const apply=x=>{m=x==='dark'?'dark':'light';document.body.classList.toggle('dark',m==='dark');document.querySelectorAll('[data-mode]').forEach(b=>{const a=b.dataset.mode===m;b.classList.toggle('active',a);b.setAttribute('aria-pressed',String(a))});localStorage.setItem('cosmatica-orbit-mode',m);const u=new URL(location.href);u.searchParams.set('mode',m);history.replaceState({},'',u)};
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>apply(b.dataset.mode)));apply(m);

const top=document.querySelector('.toprow');const nav=document.querySelector('.nav');const theme=document.querySelector('.theme-switch');
if(top){
 const searchBtn=document.createElement('button');searchBtn.className='top-action search-open';searchBtn.type='button';searchBtn.setAttribute('aria-label','Открыть поиск');searchBtn.innerHTML='<span aria-hidden="true">⌕</span><em>Поиск</em>';
 top.insertBefore(searchBtn,theme||null);
 const menuBtn=document.createElement('button');menuBtn.className='top-action mobile-menu-open';menuBtn.type='button';menuBtn.setAttribute('aria-label','Открыть меню');menuBtn.innerHTML='<span aria-hidden="true">☰</span>';
 top.appendChild(menuBtn);
}

const links=[
 ['Главная — Орбита','prototype.html?theme=orbit','Главная'],['Новости и статьи','news.html','Новости'],['Проекты РКО','projects.html','Проекты'],['Библиотека РКО','library.html','Библиотека'],['Региональные отделения','department.html','Отделения'],['UI-kit «Орбита»','ui-kit.html','Система']
];
const overlay=document.createElement('div');overlay.className='app-overlay';overlay.innerHTML=`<div class="search-panel" role="dialog" aria-modal="true" aria-label="Поиск по прототипу"><div class="search-head"><b>Поиск по «Орбите»</b><button class="close-x" aria-label="Закрыть">×</button></div><input class="search-input" type="search" placeholder="Новости, проекты, библиотека…" autocomplete="off"><div class="search-results"></div><div class="search-hint">Прототип: поиск показывает структуру будущего интерфейса.</div></div>`;document.body.appendChild(overlay);
const input=overlay.querySelector('.search-input');const results=overlay.querySelector('.search-results');
const render=q=>{const term=(q||'').trim().toLowerCase();const found=links.filter(x=>!term||x.join(' ').toLowerCase().includes(term));results.innerHTML=found.length?found.map(x=>`<a href="${x[1]}${x[1].includes('?')?'&':'?'}mode=${m}"><span>${x[0]}</span><small>${x[2]}</small></a>`).join(''):`<div class="empty-state"><b>Ничего не найдено</b><p>Попробуйте более общий запрос или перейдите в один из основных разделов.</p></div>`};render('');
const openSearch=()=>{overlay.classList.add('open');document.body.classList.add('no-scroll');setTimeout(()=>input.focus(),20)};const closeSearch=()=>{overlay.classList.remove('open');document.body.classList.remove('no-scroll')};
document.querySelector('.search-open')?.addEventListener('click',openSearch);overlay.querySelector('.close-x')?.addEventListener('click',closeSearch);overlay.addEventListener('click',e=>{if(e.target===overlay)closeSearch()});input.addEventListener('input',e=>render(e.target.value));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSearch();if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch()}});

const drawer=document.createElement('div');drawer.className='mobile-drawer';drawer.innerHTML=`<div class="drawer-card"><div class="drawer-head"><b>Разделы</b><button class="close-x" aria-label="Закрыть меню">×</button></div>${links.map(x=>`<a href="${x[1]}${x[1].includes('?')?'&':'?'}mode=${m}"><span>${x[0]}</span><b>→</b></a>`).join('')}</div>`;document.body.appendChild(drawer);
const closeDrawer=()=>{drawer.classList.remove('open');document.body.classList.remove('no-scroll')};document.querySelector('.mobile-menu-open')?.addEventListener('click',()=>{drawer.classList.add('open');document.body.classList.add('no-scroll')});drawer.querySelector('.close-x')?.addEventListener('click',closeDrawer);drawer.addEventListener('click',e=>{if(e.target===drawer)closeDrawer()});
})();