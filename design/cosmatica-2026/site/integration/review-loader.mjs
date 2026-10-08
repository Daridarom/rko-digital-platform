import {normalizeCmsPage,validateNormalizedPage} from './cms-adapter.mjs';
import {createArticle,createEvent,createProject} from './rich-renderer.mjs';

const q=new URLSearchParams(location.search);
const slug=q.get('p')||'';
if(q.get('review')==='1' && q.get('layout')==='full' && ['article','poster-item','project'].includes(slug)){
  const page=document.querySelector('.rich-cms-page');
  if(page){
    const panel=document.createElement('section');panel.className='rich-review-panel';
    const title=document.createElement('h2');title.textContent='Проверка полного содержимого';
    const note=document.createElement('p');note.textContent='Выберите локальный JSON, созданный экспортёром Cosmatica. Файл обрабатывается только в этом браузере: на GitHub и сервер он не отправляется.';
    const chooser=document.createElement('input');chooser.type='file';chooser.accept='.json,application/json';chooser.setAttribute('aria-label','Загрузить экспорт страницы');
    const output=document.createElement('p');output.className='rich-review-status';output.setAttribute('role','status');
    const details=document.createElement('dl');details.className='rich-review-evidence';
    panel.append(title,note,chooser,output,details);
    page.querySelector('.shell')?.prepend(panel);

    chooser.addEventListener('change',async()=>{
      const file=chooser.files?.[0];
      if(!file)return;
      output.textContent='Проверка файла…';
      details.replaceChildren();
      try{
        if(file.size>12_000_000)throw Error('Файл превышает установленный лимит просмотра (12 МБ).');
        const input=JSON.parse(await file.text());
        if(!input || input.type!==slug)throw Error('Тип данных не соответствует открытой странице: ожидается '+slug+'.');
        if(input.editorialReviewed===true && !input.reviewedBy)throw Error('Для подтверждённого материала необходимо указать редактора.');
        const pageData=normalizeCmsPage(slug,input);
        if(slug==='project'){
          // The export is raw editorial content. Do not invent funding figures.
          pageData.fundraising={mode:'none',target:null,raised:null};
        }
        const warn=validateNormalizedPage(pageData);
        if(!Array.isArray(pageData.blocks) || !pageData.blocks.length)throw Error('Файл не содержит пригодных блоков текста.');
        if(!pageData.title)throw Error('Нет заголовка страницы.');
        const render=slug==='article'?createArticle:slug==='poster-item'?createEvent:createProject;
        const next=render(pageData);
        const old=page.querySelector('.rich-layout');
        if(!old)throw Error('Шаблон страницы не загружен.');
        old.replaceWith(next);
        const h=page.querySelector('.rich-cms-heading h1');
        if(h)h.textContent=pageData.title;
        document.title=pageData.title+' — РКО · проверка';
        const results=[
          ['Источник',input.sourceUrl||'не указан'],
          ['Блоки',pageData.blocks.length],
          ['Контрольная сумма',String(input.sourceHash||'не указана').slice(0,16)],
          ['Редакторская проверка',input.editorialReviewed===true?'отмечена в исходном файле':'не выполнена'],
          ['Права на материалы',input.rightsVerified===true?'отмечены в исходном файле':'не подтверждены']
        ];
        for(const [key,value] of results){
          const dt=document.createElement('dt');dt.textContent=key;
          const dd=document.createElement('dd');dd.textContent=String(value);
          details.append(dt,dd);
        }
        output.textContent='Материал загружен для сверки. '+pageData.blocks.length+' блоков. '+(warn.length?'Требуется проверка полей: '+warn.join('; '):'Структура принята.');
      }catch(err){
        output.textContent='Невозможно загрузить: '+(err instanceof Error?err.message:String(err));
      }
    });
  }
}
