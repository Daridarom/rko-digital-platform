(function(){
'use strict';
var qs=new URLSearchParams(location.search);
var current=qs.get('p')||'home';
document.body.classList.add('page-'+current);
var CONTENT=window.COSMATICA_CONTENT||{};
var routes=window.COSMATICA_ROUTES||[];
function urlFor(type,params){
 var search=new URLSearchParams(Object.assign({p:type},params||{}));
 return 'view.html?'+search.toString();
}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
function classify(url,link){
 var parsed;
 try{parsed=new URL(url,location.href)}catch(e){return null}
 if(parsed.origin===location.origin)return parsed.pathname+parsed.search+parsed.hash;
 if(!parsed.hostname.endsWith('cosmatica.org'))return null;
 var path=parsed.pathname;
 var match;
 if(/^\/news\/.+/.test(path))return urlFor('news-item',{item:path});
 if(path==='/poster/calendar')return urlFor('calendar');
 if(/^\/poster\/.+/.test(path))return urlFor('poster-item',{item:path});
 if(/^\/collegium\/.+/.test(path))return urlFor('collegium-item',{item:path});
 if(/^\/partners\/.+/.test(path))return urlFor('partner',{item:path});
 if(/^\/departments\/.+/.test(path))return urlFor('department',{item:path});
 if(/^\/library\/.+/.test(path))return urlFor('book',{item:path});
 if(/^\/articles\/.+/.test(path))return path.endsWith('.html')?urlFor('article',{item:path}):urlFor('articles-list');
 if(/^\/users\/.+/.test(path))return urlFor('profile',{item:path});
 if(path==='/projects/donate_rko')return urlFor('donate');
 if(path==='/about/contacts')return urlFor('contacts');
 if(path==='/about/informacija')return urlFor('about-info');
 if(/^\/projects\/.+/.test(path)){
   var variants=CONTENT.project&&CONTENT.project.variants||{};
   match=Object.values(variants).find(function(v){try{return new URL(v.sourceUrl).pathname===path}catch(e){return false}});
   return match ? urlFor('project',{id:match.id}) : null;
 }
 if(/^\/auth\/login/.test(path))return urlFor('login');
 if(/^\/auth\/restore/.test(path))return urlFor('restore');
 if(/^\/auth\/register/.test(path))return urlFor('register');
 if(/^\/first-squad/.test(path))return urlFor('tabs');
 if(/^\/files\/download/.test(path))return null;
 var prefix=path.split('/')[1];
 if(routes.some(function(r){return r.slug===prefix}))return urlFor(prefix);
 return null; // Never disguise an unknown legacy destination as the About page.
}
function removeLink(a){
 var node=document.createElement(a.classList.contains('card')?'article':'span');
 node.className=a.className+(a.classList.contains('card')?' resource-card':' resource-label');
 node.innerHTML=a.innerHTML;
 Array.from(node.querySelectorAll('a')).forEach(function(n){n.replaceWith(document.createTextNode(n.textContent))});
 var p=node.querySelector('p');
 if(p && /Открыть (документ|внешнюю)/i.test(p.textContent))p.textContent='Материал проекта';
 a.replaceWith(node);
}
function cleanLinks(){
 document.querySelectorAll('a[href]').forEach(function(a){
  var raw=a.getAttribute('href')||'';
  if(!/^https?:\/\//i.test(raw))return;
  var local=classify(raw,a);
  if(local){a.setAttribute('href',local);a.removeAttribute('target');a.removeAttribute('rel');}
  else removeLink(a);
 });
 document.querySelectorAll('.project-source').forEach(function(el){el.remove()});
}
cleanLinks();
function setupMenu(){
 var btn=document.querySelector('.menu-btn'),drawer=document.querySelector('.mobile-drawer');
 if(!btn||!drawer)return;
 drawer.setAttribute('aria-label','Навигация');
 drawer.id='mobile-menu';
 btn.setAttribute('aria-controls','mobile-menu');btn.setAttribute('aria-expanded','false');
 var backdrop=document.createElement('button');
 backdrop.type='button';backdrop.className='menu-backdrop';backdrop.setAttribute('aria-label','Закрыть меню');
 document.querySelector('.site-header').appendChild(backdrop);
 function setState(){
  var open=drawer.classList.contains('open');
  backdrop.classList.toggle('open',open);
  document.body.classList.toggle('menu-open',open);
  btn.setAttribute('aria-expanded',String(open));
  btn.textContent=open?'Закрыть':'Меню';
 }
 function close(){drawer.classList.remove('open');setState()}
 btn.addEventListener('click',setState);
 backdrop.addEventListener('click',close);
 drawer.querySelectorAll('a').forEach(function(a){a.addEventListener('click',close)});
 document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
 window.addEventListener('resize',function(){if(innerWidth>980)close()});
}
setupMenu();
function setupSearch(){
 var header=document.querySelector('.page-hero'),lede=header&&header.querySelector('.lede');
 var term=(qs.get('q')||'').trim();
 if(current==='search-results'&&lede)lede.textContent=term?'Результаты по запросу «'+term+'».':'Введите поисковый запрос.';
 var form=document.getElementById('searchForm');
 if(form){
  form.style.maxWidth='620px';
  var input=form.querySelector('input');
  if(input){input.placeholder='Поиск по сайту';input.setAttribute('enterkeyhint','search')}
 }
}
setupSearch();
function showDemoMessage(root,message){
 var el=root.querySelector('.form-feedback');
 if(!el){el=document.createElement('p');el.className='form-feedback';el.setAttribute('role','status');root.appendChild(el)}
 el.textContent=message;
}
function setupAuth(){
 var card=document.querySelector('.auth-card');
 if(!card)return;
 var wrapper=card.querySelector('.form');
 if(!wrapper)return;
 var form=document.createElement('form');
 form.className=wrapper.className+' demo-auth';
 form.setAttribute('data-mode',current);
 form.noValidate=false;
 Array.from(wrapper.children).forEach(function(child){form.appendChild(child)});
 wrapper.replaceWith(form);
 form.querySelectorAll('input').forEach(function(input,i){
  input.disabled=false;input.required=true;
  input.id='account-'+i;
  var label=input.parentElement&&input.parentElement.querySelector('label');
  if(label)label.setAttribute('for',input.id);
  var field=label?label.textContent.trim():'';
  if(/e-mail/i.test(field)){input.type='email';input.name='email';input.autocomplete='email'}
  else if(/парол/i.test(field)){
   input.type='password';
   input.name=current==='register'&&/повтор/i.test(field)?'confirm':'password';
   input.minLength=8;
   input.autocomplete=current==='register'?'new-password':'current-password';
  } else {input.type='text';input.name='name';input.autocomplete='name'}
 });
 var action=form.querySelector('a.primary');
 if(action){
  var button=document.createElement('button');
  button.className=action.className;button.type='submit';
  button.textContent=(window.COSMATICA_CONTENT[current]||{}).actions?.[0]||'Продолжить';
  action.replaceWith(button);
 }
 card.querySelectorAll('.form-note').forEach(function(e){e.remove()});
 form.addEventListener('submit',function(e){
  e.preventDefault();
  if(!form.reportValidity())return;
  var pass=form.querySelector('[name="password"]'),confirm=form.querySelector('[name="confirm"]');
  if(pass&&confirm&&pass.value!==confirm.value){showDemoMessage(form,'Пароли не совпадают.');return;}
  var texts={login:'Проверка формы завершена. В демонстрации авторизация не выполняется.',
   restore:'Адрес принят для проверки формы. Письмо не отправлялось.',
   register:'Проверка формы завершена. Учётная запись не создавалась.'};
  showDemoMessage(form,texts[current]||'Демонстрация завершена.');
  form.reset();
 });
}
setupAuth();
function setupDonations(){
 var grid=document.querySelector('main .support-grid');
 if(grid){
  var existing=document.querySelector('main .support-grid ~ a.primary');
  if(existing)existing.remove();
  var panel=document.createElement('section');
  panel.className='demo-pledge';
  panel.innerHTML='<h2>Выберите сумму поддержки</h2>'+
    '<div class="demo-amounts" role="group" aria-label="Сумма">'+
      [1000,3000,5000].map(function(n,i){return '<button class="demo-amount '+(i===0?'active':'')+'" type="button" data-amount="'+n+'" aria-pressed="'+(i===0?'true':'false')+'">'+n.toLocaleString('ru-RU')+' ₽</button>'}).join('')+
    '</div><label for="demo-other">Другая сумма</label><input id="demo-other" type="number" min="1" step="1" inputmode="numeric" placeholder="Сумма, ₽">'+
    '<button type="button" class="primary demo-pledge-submit">Продолжить</button><p class="form-feedback" role="status"></p>';
  grid.after(panel);
  var sum=1000;
  panel.querySelectorAll('[data-amount]').forEach(function(b){b.addEventListener('click',function(){
   sum=Number(b.dataset.amount);
   panel.querySelector('#demo-other').value='';
   panel.querySelectorAll('[data-amount]').forEach(function(x){x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))})
  })});
  panel.querySelector('#demo-other').addEventListener('input',function(e){
   sum=Number(e.target.value);
   panel.querySelectorAll('[data-amount]').forEach(function(b){b.classList.remove('active');b.setAttribute('aria-pressed','false')});
  });
  panel.querySelector('.demo-pledge-submit').addEventListener('click',function(){
   showDemoMessage(panel,sum>0?'Выбрана сумма '+sum.toLocaleString('ru-RU')+' ₽. В демонстрации перевод средств не выполняется.':'Укажите сумму больше нуля.');
  });
 }
 var side=document.querySelector('.support-mini');
 if(side){
  var action=side.querySelector('a.primary');
  if(action){var b=document.createElement('button');b.className=action.className;b.type='button';b.textContent='Поддержать проект';action.replaceWith(b);
   b.addEventListener('click',function(){showDemoMessage(side,'Поддержка проекта выбрана. В демонстрации перевод средств не выполняется.')});
  }
  var last=side.querySelector('.fundraising-summary small');
  if(last)last.textContent='Опубликованные показатели проекта.';
 }
}
setupDonations();
function setupFirstSquad(){
 if(current!=='tabs')return;
 var tabs=Array.from(document.querySelectorAll('main .tabs .tab'));
 var article=document.querySelector('.article');
 if(!article||!tabs.length)return;
 var selected=Math.max(0,Math.min(2,Number(qs.get('tab')||0)));
 var initial=article.innerHTML;
 var panels=[
  initial,
  '<h2>Участники Первого Отряда</h2><p>Первый Отряд объединяет членов Русского космического общества, принимающих дополнительные обязательства в Общем Деле.</p><p>В составе — '+(CONTENT.tabs?.tabs?.[1]?.count||15)+' участников.</p>',
  '<h2>Новости Первого Отряда</h2><p>Публикации Первого Отряда собраны в разделе новостей РКО.</p><a class="secondary" href="'+urlFor('news')+'">Открыть новости</a>'
 ];
 tabs.forEach(function(a,i){a.href=urlFor('tabs',{tab:i});a.classList.toggle('active',i===selected);a.removeAttribute('target');});
 article.innerHTML=panels[selected];
}
setupFirstSquad();
function applyDetail(){
 var item=qs.get('item');
 if(!item)return;
 var lookup=[].concat(CONTENT.news?.cards||[],CONTENT.partners?.cards||[],CONTENT.collegium?.cards||[],CONTENT['articles-list']?.cards||[],CONTENT.poster?.events||[]);
 var entry=lookup.find(function(x){if(!x.url)return false;try{return new URL(x.url,location.href).pathname===item}catch(e){return false}});
 if(current==='book'){
  var name=item.startsWith('/')?'':item;
  if(name&&CONTENT.library?.books.includes(name)&&name!==CONTENT.library.books[0]){
    var title=document.querySelector('.page-hero h1'),author=document.querySelector('.book-layout .eyebrow'),cover=document.querySelector('.real-book-cover'),desc=document.querySelector('.book-layout .article p:not(.eyebrow)');
    if(title)title.textContent=name;
    if(author)author.remove();
    if(cover)cover.remove();
    if(desc)desc.textContent='Книга из библиотеки Русского космического общества. Описание и библиографические данные приведены в структуре библиотечного каталога.';
    document.title=name+' — Русское космическое общество';
  }
  return;
 }
 if(current==='department'){
  var index=(CONTENT.departments?.links||[]).findIndex(function(url){try{return new URL(url,location.href).pathname===item}catch(e){return false}});
  if(index>0){
   var region=CONTENT.departments.regions[index];var nameNode=document.querySelector('.page-hero h1');
   if(nameNode)nameNode.textContent=region;
   var content=document.querySelector('.project-layout');
   if(content)content.innerHTML='<article class="article"><h2>'+esc(region)+'</h2><p>Региональное отделение Русского космического общества. Деятельность объединяет людей, проекты и события региона.</p></article>';
   document.title=region+' — РКО';
  }
  return;
 }
 if(!entry){
  // Unknown content must not show a different article just because it shares a template.
  var stale=document.querySelector('.article-layout article');
  if(stale)stale.innerHTML='<h2>Материал</h2><p>Содержимое этой публикации подключается из базы сайта.</p>';
  var description=document.querySelector('.page-hero .lede');
  if(description)description.textContent='Карточка будет заполнена из исходной базы материалов.';
  return;
 }
 var head=document.querySelector('.page-hero h1'),lede=document.querySelector('.page-hero .lede');
 if(head)head.textContent=entry.title||entry.name||head.textContent;
 if(lede)lede.textContent=entry.text||entry.description||lede.textContent;
 var article=document.querySelector('.article-layout article');
 if(article){
  article.innerHTML='<h2>Об этом материале</h2><p>'+esc(entry.text||entry.description||'Материал Русского космического общества.')+'</p>';
 }
 document.title=(entry.title||entry.name||'Материал')+' — РКО';
}
applyDetail();
function clearExtraActions(){
 document.querySelectorAll('main a[href^="#project-materials"]').forEach(function(a){
  if(!a.classList.contains('card'))return;
  var el=document.createElement('article');el.className=a.className+' resource-card';el.innerHTML=a.innerHTML;
  var p=el.querySelector('p');if(p&&/открыть/i.test(p.textContent))p.textContent='Материал проекта';
  a.replaceWith(el);
 });
}
clearExtraActions();
})();