/* No network requests, trackers or personal-data storage. Only theme preference persists. */
(() => {
'use strict';
const D=window.COEVO, $=(q,p=document)=>p.querySelector(q), $$=(q,p=document)=>[...p.querySelectorAll(q)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sphere=id=>D.spheres.find(s=>s.id===id), level=id=>D.levels.find(l=>l.id===id);
const pending=D.programs.map(p=>p.id), routes=['home','about','programs','nirma','matrix','materials','events','participate'];
const titles={home:'Соэволюция — портал целостного развития РКО',about:'О портале — Соэволюция',programs:'Программы — Соэволюция',nirma:'Миссия НИРМА — Конструкторы будущего',matrix:'Матрица гармонии — Соэволюция',materials:'Практики и материалы — Соэволюция',events:'События и результаты — Соэволюция',participate:'Команда и участие — Соэволюция',notfound:'Раздел не найден — Соэволюция'};
const media=matchMedia('(prefers-color-scheme:dark)'), mobile=matchMedia('(max-width:880px)');
let mode='system', selectedSphere='all', selectedLevel='all', query='', matrixView=innerWidth<881?'list':'matrix', current='home', previousFocus=null;
try{const s=localStorage.getItem('cosmatica-orbit-mode');if(['light','dark','system'].includes(s))mode=s}catch(e){}
function applyTheme(){const dark=mode==='dark'||mode==='system'&&media.matches;document.documentElement.dataset.mode=dark?'dark':'light';$('#theme-select').value=mode;$('#theme-meta').content=dark?'#070a20':'#f6f6f2'}
$('#theme-select').addEventListener('change',e=>{mode=e.target.value;try{localStorage.setItem('cosmatica-orbit-mode',mode)}catch(e){}applyTheme()});media.addEventListener('change',applyTheme);applyTheme();
function menu(open,focus=false){$('#nav').classList.toggle('open',open);$('#menu-button').setAttribute('aria-expanded',String(open));$('#menu-button').textContent=open?'Закрыть':'Меню';if(focus)$('#menu-button').focus()}
$('#menu-button').addEventListener('click',()=>menu($('#menu-button').getAttribute('aria-expanded')!=='true'));mobile.addEventListener('change',()=>menu(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#nav').classList.contains('open'))menu(false,true);if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch()}});
const feature=`<div class="program-feature"><div class="program-copy"><span class="pill ready">Первая подробно представленная программа</span><h3>Миссия НИРМА</h3><p>Конструкторы будущего. Исследовательские сборы, где знакомство с природой, творческие мастерские и общественные роли становятся частью одного маршрута.</p><div class="tags"><span class="pill">8–16 лет</span><span class="pill">Тульская область</span><span class="pill">Описание программы · 2026</span></div><a class="text-link" href="#/nirma">Познакомиться с программой ↗</a></div><div class="program-art"><span class="art-index">МИССИЯ / 01</span><div class="art-type">Конструк­торы<br><span>будущего.</span></div><span class="art-foot">ИССЛЕДОВАНИЕ · ПРАКТИКА · СОЗИДАНИЕ</span></div></div>`;
$$('[data-program-feature]').forEach(x=>x.innerHTML=feature);
$$('[data-program-cards]').forEach(x=>x.innerHTML=D.programs.map((p,i)=>`<article class="card program-small"><span class="pill">Описание в разработке</span><h3>${esc(p.name)}</h3><p>${esc(p.text)}</p><a class="text-link" href="#/${p.id}">О направлении <span aria-hidden="true">↗</span></a></article>`).join(''));
$('#research-directions').innerHTML=D.directions.map((d,i)=>`<article class="card nirma-detail"><span class="step-number">0${i+1} / НАПРАВЛЕНИЕ</span><h3>${esc(d.name)}</h3><p>${esc(d.study)}</p><div class="card-label">Практика</div><p style="margin-top:0">${esc(d.practice)}</p><div class="card-label">Предусмотренный продукт</div><p style="margin-top:0">${esc(d.product)}</p></article>`).join('');

function enhanceMatrixMeaning(){
  const page=$('[data-page="matrix"]');
  if(!page)return;
  const heading=$('.page-heading',page), body=$('.page-body',page);
  $('.eyebrow',heading).textContent='Маршрутный лист «Миссия НИРМА» · Конструкторы будущего 2026';
  $('h1',heading).innerHTML='Связи и уровни.<br><span class="red">Целостный маршрут.</span>';
  $('.lead',heading).textContent='Сетка строится на пересечении четырёх видов взаимосвязей и четырёх уровней погружения. Задача маршрута — не собрать отдельные занятия, а связать знание, действие, творчество и исследование в единую картину мира.';
  const intro=document.createElement('section');
  intro.className='matrix-meaning';
  intro.innerHTML=`
    <div class="wide-note"><strong>Как читать исходную схему.</strong> По горизонтали идут четыре сферы взаимосвязей: «Человек и природа», «Человек сам с собой», «Человек и человек», «Человек и общество». По вертикали — информативный, практический, творческий и исследовательский уровни. В маршрутном листе размещены 23 активности; некоторые связывают сразу несколько сфер.</div>
    <div class="grid2" style="margin-bottom:28px">
      <article class="card"><span class="step-number">ГОРИЗОНТАЛЬ / СВЯЗИ</span><h3>Где происходит развитие</h3><p><b>Человек и природа</b> — взаимодействие с живой и материальной средой.</p><p><b>Человек сам с собой</b> — внутренняя гармония тела, внимания и разума.</p><p><b>Человек и человек</b> — эмпатия, дружба и командное взаимодействие.</p><p><b>Человек и общество</b> — культура, смыслы, роли и участие в общем деле.</p></article>
      <article class="card"><span class="step-number">ВЕРТИКАЛЬ / УРОВНИ</span><h3>Как углубляется опыт</h3><p><b>Информативный</b> — получить знания и смыслы.</p><p><b>Практический</b> — проверить знание в действии и сформировать навык.</p><p><b>Творческий</b> — создать новое и выйти за рамки готовой инструкции.</p><p><b>Исследовательский</b> — соединить уровни, осмыслить опыт и управлять процессом.</p></article>
    </div>
    <div class="section-head" style="margin-top:42px"><div><p class="eyebrow">Пять принципов построения программы</p><h2>Матрица — не таблица ради таблицы.</h2></div><p>Она задаёт условия, при которых программа остаётся целостной и не замыкается только на теории или одном типе активности.</p></div>
    <div class="grid3" style="margin-bottom:38px">
      <article class="card"><span class="step-number">01</span><h3>Живая природа</h3><p>Деятельность связывается с реальным взаимодействием с природой, а не только с виртуальной или кабинетной средой.</p></article>
      <article class="card"><span class="step-number">02</span><h3>Вся система связей</h3><p>Программа охватывает отношения человека с природой, обществом, самим собой и другими людьми.</p></article>
      <article class="card"><span class="step-number">03</span><h3>Все уровни освоения</h3><p>Знать недостаточно: опыт проходит через практику, творчество и исследовательское осмысление.</p></article>
      <article class="card"><span class="step-number">04</span><h3>Выход наружу</h3><p>Результаты связываются с внешними группами, специалистами и большим миром, а не остаются внутри одной команды.</p></article>
      <article class="card"><span class="step-number">05</span><h3>Инициатива и соразвитие</h3><p>Структура задаёт маршрут, но оставляет пространство для инициативы, уникальных способностей и горизонтального взаимодействия.</p></article>
      <article class="card"><span class="step-number">СМЫСЛ</span><h3>Целостное мировоззрение</h3><p>Каждое событие связывается с ответственностью, сонастроенностью с природой и способностью видеть последствия собственных действий.</p></article>
    </div>
    <div class="section-head" style="margin-bottom:24px"><div><p class="eyebrow">Веб-реконструкция исходного маршрутного листа</p><h2>23 активности в их исходных связях.</h2></div><p>Ниже сохранены номера и размещение из предоставленной схемы. Интерактивность добавлена только для удобства просмотра.</p></div>`;
  body.insertBefore(intro, body.firstChild);

  const style=document.createElement('style');
  style.textContent=`
    .matrix-meaning .card b{color:var(--text);font-weight:650}.matrix-meaning .card p{line-height:1.55}
    html[data-mode="light"] .matrix-board .matrix-col[style*="grid-column:2"],html[data-mode="light"] .matrix-board .matrix-cell[style*="grid-column:2"]{background:#dff3e4}
    html[data-mode="light"] .matrix-board .matrix-col[style*="grid-column:3"],html[data-mode="light"] .matrix-board .matrix-cell[style*="grid-column:3"]{background:#eedced}
    html[data-mode="light"] .matrix-board .matrix-col[style*="grid-column:4"],html[data-mode="light"] .matrix-board .matrix-cell[style*="grid-column:4"]{background:#e0eef8}
    html[data-mode="light"] .matrix-board .matrix-col[style*="grid-column:5"],html[data-mode="light"] .matrix-board .matrix-cell[style*="grid-column:5"]{background:#fae2d0}
    html[data-mode="light"] .matrix-board .matrix-cell[style*="span 2"]{background:linear-gradient(90deg,#eedced 0 50%,#e0eef8 50%)}
    html[data-mode="light"] .matrix-board .matrix-cell[style*="span 3"]{background:linear-gradient(90deg,#dff3e4 0 33.33%,#eedced 33.33% 66.66%,#e0eef8 66.66%)}
    html[data-mode="dark"] .matrix-board .matrix-col[style*="grid-column:2"],html[data-mode="dark"] .matrix-board .matrix-cell[style*="grid-column:2"]{background:#102b25}
    html[data-mode="dark"] .matrix-board .matrix-col[style*="grid-column:3"],html[data-mode="dark"] .matrix-board .matrix-cell[style*="grid-column:3"]{background:#2a1b2b}
    html[data-mode="dark"] .matrix-board .matrix-col[style*="grid-column:4"],html[data-mode="dark"] .matrix-board .matrix-cell[style*="grid-column:4"]{background:#14283a}
    html[data-mode="dark"] .matrix-board .matrix-col[style*="grid-column:5"],html[data-mode="dark"] .matrix-board .matrix-cell[style*="grid-column:5"]{background:#362319}
    .matrix-board .matrix-col{font-weight:700}.matrix-board .matrix-label b{font-size:13px;letter-spacing:.04em}.matrix-board .activity{background:color-mix(in srgb,var(--surface) 88%,transparent)}
    @media(max-width:650px){.matrix-meaning .grid2,.matrix-meaning .grid3{grid-template-columns:1fr!important}.matrix-meaning .section-head{margin-top:30px!important}}
  `;
  document.head.append(style);
}
enhanceMatrixMeaning();

function filters(){
$('#sphere-filters').innerHTML=[{id:'all',short:'Все сферы'},...D.spheres].map(s=>`<button type="button" class="filter" data-sphere="${s.id}" aria-pressed="${s.id===selectedSphere}">${esc(s.short)}</button>`).join('');
$('#level-filters').innerHTML=[{id:'all',name:'Все уровни'},...D.levels].map(s=>`<button type="button" class="filter" data-level="${s.id}" aria-pressed="${s.id===selectedLevel}">${esc(s.name)}</button>`).join('');
}
function matching(){const q=query.trim().toLocaleLowerCase('ru');return D.activities.filter(a=>(selectedSphere==='all'||a.s.includes(selectedSphere))&&(selectedLevel==='all'||a.l===selectedLevel)&&(!q||[a.name,a.desc||'',a.id,a.note||''].join(' ').toLocaleLowerCase('ru').includes(q)))}
function activityButton(a){return `<button class="activity" type="button" data-activity="${a.id}"><small>${String(a.id).padStart(2,'0')}</small><span>${esc(a.name)}</span></button>`}
function renderMatrix(){
const activities=matching(), ids=new Set(activities.map(a=>a.id));
$('#matrix-count').textContent=`${activities.length} из 23 активностей · НИРМА`;
$('#view-matrix').setAttribute('aria-pressed',String(matrixView==='matrix'));$('#view-list').setAttribute('aria-pressed',String(matrixView==='list'));
$('#matrix-scroll').hidden=matrixView!=='matrix';$('#activity-list').hidden=matrixView!=='list';$('.matrix-mobile-hint').hidden=matrixView!=='matrix';
let html='<div class="matrix-label" style="grid-column:1;grid-row:1"><b>СВЯЗИ →</b><br>УРОВНИ ↓</div>';
D.spheres.forEach((s,i)=>{html+=`<div class="matrix-col" style="grid-column:${i+2};grid-row:1">${esc(s.name)}</div>`});
D.levels.forEach((l,i)=>{html+=`<div class="matrix-label" style="grid-column:1;grid-row:${i<3?i+2:6}${i===2?' / span 2':''}"><b>${esc(l.name.toUpperCase())}</b></div>`});
const cell=(col,row,span,items)=>`<div class="matrix-cell" style="grid-column:${col}${span>1?' / span '+span:''};grid-row:${row}">${items.filter(a=>ids.has(a.id)).map(activityButton).join('')}</div>`;
D.spheres.forEach((s,i)=>{['info','practice'].forEach((l,j)=>{html+=cell(i+2,j+2,1,D.activities.filter(a=>a.s.includes(s.id)&&a.l===l))})});
// Creative level uses two subrows, exactly one spanning theatre block.
html+=cell(2,'4 / span 2',1,D.activities.filter(a=>a.s[0]==='nature'&&a.l==='creative'));
html+=cell(3,4,1,D.activities.filter(a=>[11,12].includes(a.id)));
html+=cell(4,4,1,[]);html+=cell(3,5,2,D.activities.filter(a=>a.id===15));
html+=cell(5,'4 / span 2',1,D.activities.filter(a=>a.s[0]==='society'&&a.l==='creative'));
html+=cell(2,6,3,D.activities.filter(a=>a.id===23));html+=cell(5,6,1,D.activities.filter(a=>a.id===22));
$('#matrix-board').innerHTML=html;
$('#activity-list').innerHTML=activities.length?activities.map(a=>`<button type="button" class="activity-tile" data-activity="${a.id}"><small>НИРМА / ${String(a.id).padStart(2,'0')}</small><h3>${esc(a.name)}</h3><span class="muted">${esc(a.s.map(s=>sphere(s).short).join(' + '))}<br>${esc(level(a.l).name)}</span></button>`).join(''):'<p class="no-results">Ничего не найдено. Измените запрос или сбросьте фильтры.</p>';
}
function filterLocation(){const p=new URLSearchParams();if(selectedSphere!=='all')p.set('scope',selectedSphere);if(selectedLevel!=='all')p.set('level',selectedLevel);history.replaceState(null,'','#/matrix'+(p.size?'?'+p:''))}
function resetFilters(){selectedSphere='all';selectedLevel='all';query='';$('#activity-search').value='';filters();renderMatrix();filterLocation()}
$('#reset-filters').addEventListener('click',resetFilters);
$('#sphere-filters').addEventListener('click',e=>{const b=e.target.closest('[data-sphere]');if(!b)return;selectedSphere=b.dataset.sphere;$$('[data-sphere]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderMatrix();filterLocation()});
$('#level-filters').addEventListener('click',e=>{const b=e.target.closest('[data-level]');if(!b)return;selectedLevel=b.dataset.level;$$('[data-level]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderMatrix();filterLocation()});
$('#activity-search').addEventListener('input',e=>{query=e.target.value;renderMatrix()});
$('#view-matrix').addEventListener('click',()=>{matrixView='matrix';renderMatrix()});$('#view-list').addEventListener('click',()=>{matrixView='list';renderMatrix()});
function openDialog(d){previousFocus=document.activeElement;if(!d.open)d.showModal()}
function showActivity(id){const a=D.activities.find(a=>a.id===Number(id));if(!a)return;const search=$('#search-dialog');if(search.open)search.close();$('#activity-dialog-title').textContent=`НИРМА / активность ${String(a.id).padStart(2,'0')}`;$('#activity-dialog-body').innerHTML=`<h3>${esc(a.name)}</h3><div class="tags">${a.s.map(s=>`<span class="pill">${esc(sphere(s).name)}</span>`).join('')}<span class="pill ready">${esc(level(a.l).name)}</span></div><p>${esc(a.desc||'Активность указана в маршрутном листе НИРМЫ. Отдельный подробный сценарий этого занятия в переданном комплекте не представлен.')}</p>${a.note?`<p class="editorial-note">${esc(a.note)}</p>`:''}<span class="source">Название, номер и место в матрице: исходный маршрутный лист, PDF, с. 1.${a.source?' Описание: '+esc(a.source):''}</span>`;openDialog($('#activity-dialog'))}
$$('.dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target.closest('[data-close]'))d.close();if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}});d.addEventListener('close',()=>{if(previousFocus&&document.contains(previousFocus)&&!previousFocus.closest('[hidden],dialog:not([open])')&&!$$('.dialog').some(x=>x.open))previousFocus.focus()})});
document.addEventListener('click',e=>{const a=e.target.closest('[data-activity]');if(a)showActivity(a.dataset.activity)});
const searchPages=[['about','О портале'],['matrix','Матрица гармонии'],['programs','Программы'],['nirma','Миссия НИРМА — Конструкторы будущего'],['materials','Практики и материалы'],['events','События и результаты. ЭКОДВИЖ'],['participate','Команда и участие'],...D.programs.map(p=>[p.id,p.name])];
function renderSearch(){const q=$('#global-search').value.trim().toLocaleLowerCase('ru');const pages=searchPages.filter(p=>!q||p[1].toLocaleLowerCase('ru').includes(q));const acts=q?D.activities.filter(a=>[a.name,a.note||''].join(' ').toLocaleLowerCase('ru').includes(q)):[];$('#search-count').textContent=`Найдено: ${pages.length+acts.length}`;$('#search-results').innerHTML=pages.map(p=>`<a class="search-result" href="#/${p[0]}" data-search-link>${esc(p[1])}<small>Раздел портала ↗</small></a>`).join('')+acts.map(a=>`<button type="button" class="search-result" data-activity="${a.id}">${esc(a.name)}<small>НИРМА · активность ${a.id}</small></button>`).join('')||'<p class="small muted">Ничего не найдено. Попробуйте «НИРМА», «матрица» или «астрономия».</p>'}
function openSearch(){menu(false);$('#global-search').value='';renderSearch();openDialog($('#search-dialog'));$('#global-search').focus()}
$$('[data-search]').forEach(b=>b.addEventListener('click',openSearch));$('#global-search').addEventListener('input',renderSearch);$('#search-results').addEventListener('click',e=>{if(e.target.closest('[data-search-link]'))$('#search-dialog').close()});
function route(initial=false){if(location.hash==='#main'){const m=$('#main');m.focus({preventScroll:true});return}const [raw,search='']=(location.hash.replace(/^#\/?/,'')||'home').split('?');const key=raw||'home',params=new URLSearchParams(search);let page=routes.includes(key)?key:pending.includes(key)?'pending':'notfound';$$('[data-page]').forEach(p=>p.hidden=p.dataset.page!==page);current=key;document.title=titles[page]||`${D.programs.find(p=>p.id===key)?.name||'Программа'} — Соэволюция`;$$('[data-nav]').forEach(a=>{const active=a.dataset.nav===key||a.dataset.nav==='programs'&&(key==='nirma'||page==='pending');if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});menu(false);if(page==='pending'){const p=D.programs.find(p=>p.id===key);$('#pending-title').textContent=p.name;$('#pending-crumb').textContent=p.name;$('#pending-lead').textContent=p.text}
if(page==='matrix'){selectedSphere=D.spheres.some(s=>s.id===params.get('scope'))?params.get('scope'):'all';selectedLevel=D.levels.some(l=>l.id===params.get('level'))?params.get('level'):'all';query='';$('#activity-search').value='';filters();renderMatrix()}
if(!initial)window.scrollTo({top:0,behavior:'instant'});if(!initial){const h=$(`[data-page="${page}"] h1`);if(h){h.tabIndex=-1;h.focus({preventScroll:true})}}if(page==='nirma'&&['directions','route','journal','life','festival'].includes(params.get('section'))){requestAnimationFrame(()=>$('#nirma-'+params.get('section')).scrollIntoView({behavior:initial||matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'}))}
}
window.addEventListener('hashchange',()=>route(false));route(true);
// Exposed read-only data is useful for author review and regression tests.
window.coevoTest={activityIds:()=>D.activities.map(a=>a.id),matchingIds:()=>matching().map(a=>a.id),currentPage:()=>current};
})();
