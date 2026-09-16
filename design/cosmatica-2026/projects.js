(()=>{
const projects=Array.isArray(window.COSMATICA_PROJECTS)?window.COSMATICA_PROJECTS:[];
const facets=Array.isArray(window.COSMATICA_FACETS)?window.COSMATICA_FACETS:[];
const meta=window.COSMATICA_PROJECT_META||{};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const escapeHtml=(value='')=>String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

const state={status:'current',facet:'all',query:''};
const grid=$('#projectGrid');
const count=$('#catalogCount');
const context=$('#filterContext');
const search=$('#projectSearch');
const facetWrap=$('#facetFilters');
const statusWrap=$('#statusFilters');
const projectDialog=$('#projectDialog');
const passportDialog=$('#passportDialog');
const projectDialogBody=$('#projectDialogBody');
const projectDialogTitle=$('#projectDialogTitle');
const passportForm=$('#projectPassportForm');
const passportPreview=$('#passportPreview');
const formMessage=$('#formMessage');
const DRAFT_KEY='cosmatica-project-passport-draft-v2';

const facetLabel=id=>facets.find(f=>f.id===id)?.label||id;
const projectMatchesFacet=(p,id)=>id==='all'||p.facet===id||(p.extraFacets||[]).includes(id);
const projectMatchesStatus=(p,id)=>{
  if(id==='all') return true;
  if(id==='current') return p.status==='strategic'||p.status==='active';
  return p.status===id;
};
const searchable=p=>[
  p.title,p.statusLabel,p.facetLabel,p.territory,p.summary,p.forms,p.trail,p.future,p.predecessor,p.successor,
  ...(p.related||[]),...(p.extraFacets||[]).map(facetLabel)
].filter(Boolean).join(' ').toLowerCase();

function visibleProjects(){
  const q=state.query.trim().toLowerCase();
  return projects.filter(p=>projectMatchesStatus(p,state.status)&&projectMatchesFacet(p,state.facet)&&(!q||searchable(p).includes(q)));
}

function facetCounts(){
  const result={};
  facets.forEach(f=>result[f.id]=projects.filter(p=>projectMatchesStatus(p,state.status)&&projectMatchesFacet(p,f.id)).length);
  return result;
}

function renderFacets(){
  if(!facetWrap) return;
  const counts=facetCounts();
  facetWrap.innerHTML=`<button class="facet-chip ${state.facet==='all'?'active':''}" data-facet="all">Все грани <small>${projects.filter(p=>projectMatchesStatus(p,state.status)).length}</small></button>`+
    facets.map(f=>`<button class="facet-chip ${state.facet===f.id?'active':''}" data-facet="${f.id}">${escapeHtml(f.label)} <small>${counts[f.id]||0}</small></button>`).join('');
  $$('[data-facet]',facetWrap).forEach(btn=>btn.addEventListener('click',()=>{state.facet=btn.dataset.facet;render();}));
}

function cardTemplate(p){
  const futureMissing=/не снят|не подтвержд|требует/i.test(p.future||'');
  return `<article class="project-card-v2" data-project="${escapeHtml(p.id)}">
    <div class="project-card-top">
      <span class="project-status">${escapeHtml(p.statusLabel)}</span>
      <span class="project-facet">${escapeHtml(p.facetLabel)}</span>
    </div>
    <div>
      <h3>${escapeHtml(p.title)}</h3>
      <div class="project-meta-line">${escapeHtml(p.territory)}</div>
    </div>
    <p class="summary">${escapeHtml(p.summary)}</p>
    <div class="project-signal"><b>Что формирует</b><span>${escapeHtml(p.forms)}</span></div>
    <div class="project-signal"><b>Подтверждённый след</b><span>${escapeHtml(p.trail)}</span></div>
    <div class="project-signal ${futureMissing?'missing':''}"><b>Вектор к 2117</b><span>${escapeHtml(p.future)}</span></div>
    <div class="project-card-actions"><button type="button" data-open-project="${escapeHtml(p.id)}">Открыть паспорт</button></div>
  </article>`;
}

function renderContext(){
  if(!context) return;
  const bits=[];
  if(state.status!=='current'){
    const label=$(`[data-status="${state.status}"]`,statusWrap)?.textContent?.trim();
    if(label) bits.push(label);
  }
  if(state.facet!=='all') bits.push(facetLabel(state.facet));
  if(state.query) bits.push(`поиск: «${state.query}»`);
  context.innerHTML=bits.length?`Фильтр: ${escapeHtml(bits.join(' · '))} <button type="button" id="resetFilters">Сбросить</button>`:`По умолчанию показаны стратегические инициативы и действующие проекты. Реализованные этапы и перспективы доступны отдельными фильтрами.`;
  $('#resetFilters')?.addEventListener('click',()=>{state.status='current';state.facet='all';state.query='';if(search)search.value='';render();});
}

function render(){
  renderFacets();
  $$('[data-status]',statusWrap).forEach(btn=>btn.classList.toggle('active',btn.dataset.status===state.status));
  const list=visibleProjects();
  if(count) count.textContent=`${list.length} ${decl(list.length,['проект','проекта','проектов'])}`;
  if(grid) grid.innerHTML=list.length?list.map(cardTemplate).join(''):`<div class="empty-catalog"><b>По этому фильтру проектов не найдено.</b><p>Сбросьте фильтры или попробуйте другой запрос.</p></div>`;
  renderContext();
  $$('[data-open-project]',grid).forEach(btn=>btn.addEventListener('click',()=>openProject(btn.dataset.openProject)));
}

function decl(n,forms){
  const n10=n%10,n100=n%100;
  if(n10===1&&n100!==11)return forms[0];
  if(n10>=2&&n10<=4&&(n100<12||n100>14))return forms[1];
  return forms[2];
}

$$('[data-status]',statusWrap).forEach(btn=>btn.addEventListener('click',()=>{state.status=btn.dataset.status;render();}));
search?.addEventListener('input',e=>{state.query=e.target.value;render();});

function openProject(id){
  const p=projects.find(x=>x.id===id);if(!p||!projectDialog)return;
  projectDialogTitle.textContent=p.title;
  const extra=(p.extraFacets||[]).map(facetLabel).filter(Boolean);
  projectDialogBody.innerHTML=`
    <div class="passport-public">
      <div class="passport-block"><span class="label">Статус</span><p>${escapeHtml(p.statusLabel)}</p></div>
      <div class="passport-block"><span class="label">Территория</span><p>${escapeHtml(p.territory)}</p></div>
      <div class="passport-block wide"><span class="label">Смысл</span><p>${escapeHtml(p.summary)}</p></div>
      <div class="passport-block"><span class="label">Связь с НС-2117</span><p><b>${escapeHtml(p.facetLabel)}</b>${extra.length?`<br><small>Дополнительно: ${escapeHtml(extra.join(' · '))}</small>`:''}</p></div>
      <div class="passport-block"><span class="label">Что формирует</span><p>${escapeHtml(p.forms)}</p></div>
      <div class="passport-block wide"><span class="label">Подтверждённый след</span><p>${escapeHtml(p.trail)}</p></div>
      <div class="passport-block wide"><span class="label">Куда идёт / вектор к 2117</span><p>${escapeHtml(p.future)}</p></div>
    </div>
    <h3 style="margin:26px 0 12px">Траектория дела</h3>
    <div class="relation-track">
      <div class="relation-node"><b>Предшественник</b>${escapeHtml(p.predecessor||'Не снято')}</div>
      <div class="relation-arrow">→</div>
      <div class="relation-node current"><b>Сейчас</b>${escapeHtml(p.title)}</div>
      <div class="relation-arrow">→</div>
      <div class="relation-node"><b>Продолжение</b>${escapeHtml(p.successor||'Не снято')}</div>
    </div>
    <div class="passport-block" style="margin-top:16px"><span class="label">Связанные проекты</span><div class="related-list">${(p.related||[]).map(x=>`<span>${escapeHtml(x)}</span>`).join('')||'<span>Не снято</span>'}</div></div>
    <div class="passport-block" style="margin-top:16px"><span class="label">Как включиться</span><p>${escapeHtml(p.participation||'Требует уточнения')}</p></div>
    <div class="dialog-actions">
      <button class="orbit-btn primary" type="button" data-passport-from="${escapeHtml(p.id)}">Предложить связь / обновление</button>
      <button class="orbit-btn ghost" type="button" data-close-project>Закрыть</button>
    </div>`;
  $('[data-close-project]',projectDialogBody)?.addEventListener('click',()=>projectDialog.close());
  $('[data-passport-from]',projectDialogBody)?.addEventListener('click',()=>{projectDialog.close();openPassport(p);});
  projectDialog.showModal();
}

$$('[data-close-dialog]').forEach(btn=>btn.addEventListener('click',()=>btn.closest('dialog')?.close()));
[projectDialog,passportDialog].forEach(dialog=>dialog?.addEventListener('click',e=>{if(e.target===dialog)dialog.close();}));

function openPassport(prefill){
  if(!passportDialog||!passportForm)return;
  if(prefill){
    setField('title',prefill.title);
    setField('meaning',prefill.summary);
    setField('status',prefill.status==='active'?'Действующий':prefill.status==='realized'?'Реализованный этап':prefill.status==='perspective'?'Перспективный':'Стратегическая инициатива');
    setField('territory',prefill.territory);
    setField('facet',prefill.facet);
    setField('forms',prefill.forms);
    setField('future',prefill.future);
    setField('trail',prefill.trail);
    setField('related',(prefill.related||[]).join(', '));
    setField('join',prefill.participation);
    setField('sources',prefill.evidence);
    setField('predecessor',prefill.predecessor);
    setField('successor',prefill.successor);
  }
  updatePreview();
  passportDialog.showModal();
}

$$('[data-open-passport]').forEach(btn=>btn.addEventListener('click',()=>openPassport()));

function setField(name,value){const el=passportForm?.elements?.namedItem(name);if(el&&value!=null)el.value=value;}
function getField(name){const el=passportForm?.elements?.namedItem(name);return el?String(el.value||'').trim():'';}
function currentPassport(){
  return {
    title:getField('title'),meaning:getField('meaning'),status:getField('status'),territory:getField('territory'),facet:getField('facet'),forms:getField('forms'),future:getField('future'),trail:getField('trail'),related:getField('related'),join:getField('join'),
    sources:getField('sources'),fact:getField('fact'),predecessor:getField('predecessor'),successor:getField('successor'),repeat:getField('repeat'),stable:getField('stable'),role:getField('role'),maturity:getField('maturity'),
    sphereOrganizers:getField('sphereOrganizers'),spherePartners:getField('spherePartners'),sphereParticipants:getField('sphereParticipants'),sphereLocal:getField('sphereLocal'),sphereWider:getField('sphereWider'),
    offer:getField('offer'),needs:getField('needs'),gaps:getField('gaps')
  };
}

function updatePreview(){
  if(!passportPreview)return;
  const p=currentPassport();
  passportPreview.innerHTML=`<div class="preview-kicker">Предпросмотр публичной карточки</div><h3>${escapeHtml(p.title||'Название проекта')}</h3><p>${escapeHtml(p.meaning||'Коротко: ради чего существует проект и что в нём происходит.')}</p>
    <div class="preview-row"><b>Статус</b><span>${escapeHtml(p.status||'Не указан')}</span></div>
    <div class="preview-row"><b>Территория</b><span>${escapeHtml(p.territory||'Не указана')}</span></div>
    <div class="preview-row"><b>Связь с НС-2117</b><span>${escapeHtml(facetLabel(p.facet)||'Не выбрана')}</span></div>
    <div class="preview-row"><b>Что формирует</b><span>${escapeHtml(p.forms||'Не заполнено')}</span></div>
    <div class="preview-row"><b>Подтверждённый след</b><span>${escapeHtml(p.trail||'Не заполнено')}</span></div>
    <div class="preview-row"><b>Куда идёт</b><span>${escapeHtml(p.future||'Не заполнено')}</span></div>`;
}
passportForm?.addEventListener('input',updatePreview);
passportForm?.addEventListener('submit',e=>e.preventDefault());

function passportMarkdown(p){
  const facet=facetLabel(p.facet)||p.facet||'Не выбрана';
  return `# Паспорт проекта\n\n## Публичный слой\n- Название: ${p.title||'—'}\n- Смысл: ${p.meaning||'—'}\n- Статус: ${p.status||'—'}\n- Территория: ${p.territory||'—'}\n- Грань НС-2117: ${facet}\n- Что формирует: ${p.forms||'—'}\n- Куда идёт: ${p.future||'—'}\n- Подтверждённый след: ${p.trail||'—'}\n- Связанные проекты: ${p.related||'—'}\n- Как присоединиться: ${p.join||'—'}\n\n## Служебный слой\n- Источники / доказательства: ${p.sources||'—'}\n- Фактический ход: ${p.fact||'—'}\n- Предшественник: ${p.predecessor||'—'}\n- Наследник / продолжение: ${p.successor||'—'}\n- Повтор / сезонность: ${p.repeat||'—'}\n- Устойчивая форма: ${p.stable||'—'}\n- Рабочая роль: ${p.role||'—'}\n- Рабочая зрелость 0–3: ${p.maturity||'—'}\n\n### Пять сфер влияния\n1. Организаторы: ${p.sphereOrganizers||'—'}\n2. Соисполнители: ${p.spherePartners||'—'}\n3. Прямые участники: ${p.sphereParticipants||'—'}\n4. Ближний круг: ${p.sphereLocal||'—'}\n5. Более широкая среда: ${p.sphereWider||'—'}\n\n### Сетение\n- Что проект может дать: ${p.offer||'—'}\n- Что проекту нужно: ${p.needs||'—'}\n- Пробелы в данных: ${p.gaps||'—'}\n`;
}

$('#saveDraft')?.addEventListener('click',()=>{
  localStorage.setItem(DRAFT_KEY,JSON.stringify(currentPassport()));
  setMessage('Черновик сохранён в этом браузере.');
});
$('#loadDraft')?.addEventListener('click',()=>{
  try{
    const data=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');
    if(!data){setMessage('Сохранённого черновика пока нет.');return;}
    Object.entries(data).forEach(([k,v])=>setField(k,v));updatePreview();setMessage('Черновик восстановлен.');
  }catch{setMessage('Не удалось прочитать черновик.');}
});
$('#resetPassport')?.addEventListener('click',()=>{passportForm?.reset();updatePreview();setMessage('Форма очищена.');});
$('#copyPassport')?.addEventListener('click',async()=>{
  const text=passportMarkdown(currentPassport());
  try{await navigator.clipboard.writeText(text);setMessage('Паспорт скопирован. Его можно отправить в рабочий чат или внести в реестр.');}
  catch{
    const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();setMessage('Паспорт скопирован.');
  }
});
function setMessage(text){if(formMessage)formMessage.textContent=text;}

const source=$('#projectSourceNote');
if(source&&meta.sourceDate) source.innerHTML=`Пилотная механика · источник данных: аналитический срез <strong>${escapeHtml(meta.sourceDate)}</strong>. ${escapeHtml(meta.note||'')}`;

render();
})();
