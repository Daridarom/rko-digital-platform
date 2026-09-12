(() => {
  if (!document.querySelector('link[data-orbit-mode]')) {
    const css = document.createElement('link'); css.rel='stylesheet'; css.href='orbit-mode.css'; css.dataset.orbitMode='true'; document.head.appendChild(css);
  }
  if (!document.querySelector('link[data-orbit-polish]')) {
    const polish = document.createElement('link'); polish.rel='stylesheet'; polish.href='orbit-polish.css'; polish.dataset.orbitPolish='true'; document.head.appendChild(polish);
  }

  /* Единая формулировка: рекомендуемое направление — «Орбита». */
  document.title = 'Косматика 2026 — Орбита';
  const setMeta=(selector,value)=>{const el=document.querySelector(selector); if(el) el.setAttribute('content',value)};
  setMeta('meta[name="description"]','Рекомендуемое визуальное направление портала Русского космического общества — «Орбита» со светлым и тёмным режимами.');
  setMeta('meta[property="og:title"]','Косматика 2026 — рекомендуемое направление «Орбита»');
  setMeta('meta[property="og:description"]','Светлый и тёмный режимы «Орбиты» и альтернативные визуальные направления одного макета портала РКО.');
  setMeta('meta[name="twitter:title"]','Косматика 2026 — Орбита');
  setMeta('meta[name="twitter:description"]','Рекомендуемое визуальное направление портала РКО со светлым и тёмным режимами.');

  const themes={orbit:{cls:'theme-orbit',label:'ОРБИТА · вариант 1',color:'#f6f6f2'},noosphere:{cls:'theme-noosphere',label:'НООСФЕРА · вариант 2',color:'#050711'},institute:{cls:'theme-institute',label:'КОСМИЧЕСКИЙ ИНСТИТУТ · вариант 3',color:'#f1ede3'}};
  document.querySelectorAll('[data-theme="orbit"]').forEach(el=>el.setAttribute('aria-label','Вариант 1 — Орбита, рекомендуемое направление'));
  document.querySelectorAll('[data-theme="noosphere"]').forEach(el=>el.setAttribute('aria-label','Вариант 2 — Ноосфера'));
  document.querySelectorAll('[data-theme="institute"]').forEach(el=>el.setAttribute('aria-label','Вариант 3 — Космический институт'));
  document.querySelectorAll('[data-theme="synthesis"] span').forEach(el=>el.textContent='Орбита 2');
  document.querySelectorAll('[data-theme="synthesis"]').forEach(el=>el.setAttribute('aria-label','Вариант 4 — Орбита 2, UX-эксперимент'));
  document.querySelectorAll('.review-tabs button').forEach((el,i)=>{const b=el.querySelector('b'); if(b)b.textContent=String(i+1)});
  document.querySelectorAll('.quick-search kbd').forEach(el=>el.remove());

  /* Спорный арт «Космоздрав» явно обозначаем как концептуальный. */
  document.querySelectorAll('.feature-card').forEach(card=>{const h=card.querySelector('h3'); if(h?.textContent.includes('Космоздрав')){const tag=card.querySelector('.tag'); const p=card.querySelector('p'); if(tag)tag.textContent='Концептуальная иллюстрация'; if(p)p.textContent='Образный визуал проекта; не документальная фотография.';}});
  const note=document.querySelector('.visual-note small'); if(note) note.textContent='Мотивы официальной символики используются в интерфейсе, но не заменяют и не изменяют сам герб';

  const params=new URLSearchParams(location.search); const requested=params.get('theme'); if(requested==='synthesis'){location.replace('orbit2.html');return;}
  let theme=requested||localStorage.getItem('cosmatica-theme'); if(!themes[theme])theme='orbit';
  const reviewInner=document.querySelector('.review-bar__inner'); let modeSwitch=document.querySelector('.orbit-mode-switch');
  if(reviewInner&&!modeSwitch){modeSwitch=document.createElement('div');modeSwitch.className='orbit-mode-switch';modeSwitch.setAttribute('aria-label','Режим оформления Орбиты');modeSwitch.innerHTML='<button type="button" data-orbit-mode="light" aria-label="Светлый режим">Светлая</button><button type="button" data-orbit-mode="dark" aria-label="Тёмный режим">Тёмная</button>';const tabs=reviewInner.querySelector('.review-tabs');reviewInner.insertBefore(modeSwitch,tabs||null);}
  let orbitMode=params.get('mode')||localStorage.getItem('cosmatica-orbit-mode')||'light'; if(!['light','dark'].includes(orbitMode))orbitMode='light';

  const applyOrbitMode=(mode,updateUrl=true)=>{orbitMode=mode==='dark'?'dark':'light';document.body.classList.toggle('orbit-mode-dark',theme==='orbit'&&orbitMode==='dark');document.querySelectorAll('[data-orbit-mode]').forEach(btn=>{const active=btn.dataset.orbitMode===orbitMode;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});if(theme==='orbit')document.querySelector('meta[name="theme-color"]')?.setAttribute('content',orbitMode==='dark'?'#070a20':'#f7f7f3');localStorage.setItem('cosmatica-orbit-mode',orbitMode);if(updateUrl&&theme==='orbit'){const url=new URL(location.href);url.searchParams.set('mode',orbitMode);history.replaceState({},'',url);}};
  const applyTheme=(name,updateUrl=true)=>{if(name==='synthesis'){location.href='orbit2.html';return;}theme=themes[name]?name:'orbit';const selected=themes[theme];document.body.classList.remove('theme-orbit','theme-noosphere','theme-institute','theme-synthesis','orbit-mode-dark');document.body.classList.add(selected.cls);const badge=document.getElementById('prototypeBadge');if(badge)badge.textContent=selected.label;document.querySelectorAll('[data-theme]').forEach(btn=>{const active=btn.dataset.theme===theme;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});localStorage.setItem('cosmatica-theme',theme);if(updateUrl){const url=new URL(location.href);url.searchParams.set('theme',theme);if(theme==='orbit')url.searchParams.set('mode',orbitMode);else url.searchParams.delete('mode');history.replaceState({},'',url);}applyOrbitMode(orbitMode,false);if(theme!=='orbit')document.querySelector('meta[name="theme-color"]')?.setAttribute('content',selected.color);};
  applyTheme(theme,false);applyOrbitMode(orbitMode,false);
  document.querySelectorAll('[data-theme]').forEach(btn=>btn.addEventListener('click',()=>applyTheme(btn.dataset.theme)));
  document.querySelectorAll('[data-orbit-mode]').forEach(btn=>btn.addEventListener('click',()=>applyOrbitMode(btn.dataset.orbitMode)));

  const menu=document.getElementById('mainNav');const toggle=document.querySelector('.menu-toggle');if(menu&&toggle){toggle.addEventListener('click',()=>{const open=menu.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'Закрыть':'Меню';});menu.addEventListener('click',e=>{if(e.target.closest('a')&&innerWidth<=760){menu.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.textContent='Меню';}});}
  const palette=document.getElementById('commandPalette');const openPalette=()=>{if(!palette)return;palette.showModal();setTimeout(()=>palette.querySelector('input')?.focus(),20);};document.querySelectorAll('[data-open-palette]').forEach(btn=>btn.addEventListener('click',openPalette));document.querySelectorAll('[data-close-palette]').forEach(btn=>btn.addEventListener('click',()=>palette?.close()));document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette();}if(e.key==='Escape'&&palette?.open)palette.close();});palette?.addEventListener('click',e=>{if(e.target===palette)palette.close();});
  const progress=document.getElementById('scrollProgress');const updateProgress=()=>{const max=document.documentElement.scrollHeight-innerHeight;const value=max>0?(scrollY/max)*100:0;if(progress)progress.style.width=`${Math.min(100,Math.max(0,value))}%`;};addEventListener('scroll',updateProgress,{passive:true});addEventListener('resize',updateProgress);updateProgress();
})();
