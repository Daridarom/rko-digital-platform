import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeCmsPage,resolveLegacyRoute,normalizeBlocks,safeAsset,validateNormalizedPage} from './cms-adapter.mjs';

const manifest=JSON.parse(readFileSync(new URL('./page-map.json',import.meta.url),'utf8'));
test('Every approved template is traceable to exactly one original source page',()=>{
  assert.equal(manifest.entries.length,32);
  assert.equal(new Set(manifest.entries.map(r=>r.slug)).size,32);
  for(const [i,entry] of manifest.entries.entries()){
    assert.equal(entry.id,i+1);
    assert(entry.sourceUrl.startsWith('https://cosmatica.org/'));
    assert(entry.requiredFields.length>=3,entry.slug);
    assert(entry.demoRoute);
    if(entry.status==='CONTENT_VERIFIED'){
      assert(entry.signoff && entry.signoff.reviewer && entry.signoff.date,
        'Verified content requires a named reviewer and sign-off date: '+entry.slug);
    }
  }
  assert.equal(manifest.entries[30].slug,'search');
  assert.equal(manifest.entries[31].slug,'search-results');
});

test('Resolve actual legacy URLs; never guess unknown content',()=>{
  for(const x of manifest.entries.slice(0,30)){
    const found=resolveLegacyRoute(x.sourceUrl,manifest);
    assert.equal(found?.slug,x.slug,x.sourceUrl);
  }
  assert.equal(resolveLegacyRoute('https://cosmatica.org/search',manifest)?.slug,'search');
  assert.equal(resolveLegacyRoute('https://cosmatica.org/search?q=Гагарин',manifest)?.slug,'search-results');
  assert.equal(resolveLegacyRoute('https://cosmatica.org/projects/unknown-id',manifest),null);
  assert.equal(resolveLegacyRoute('https://cosmatica.org/non-existent',manifest),null);
  assert.equal(resolveLegacyRoute('https://example.org/projects/gagarincy',manifest),null);
});

test('Preserve rich content blocks without executable asset URLs',()=>{
  const blocks=normalizeBlocks([
    {type:'heading',level:1,text:' Тема '},
    {type:'paragraph',text:' Полный текст '},
    {type:'image',src:'javascript:alert(1)',alt:'bad'},
    {type:'image',src:'/uploads/photo.jpg',alt:'Иллюстрация'},
    {type:'list',items:['Раз','Два']},
    {type:'quote',text:' Цитата '},
  ]);
  assert.deepEqual(blocks.map(x=>x.type),['heading','paragraph','image','list','quote']);
  assert.equal(blocks[0].level,2);
  assert.equal(blocks[1].text,'Полный текст');
  assert.equal(safeAsset('//other.test/image.png'),null);
  assert.equal(safeAsset('assets/rko-mark.svg'),'assets/rko-mark.svg');
});

test('Project funding state is explicit and never fabricated',()=>{
  const item={id:'7',title:'Проект',mission:'Общее дело',fundraising:{enabled:true,target:200000,raised:15000},blocks:[{type:'paragraph',text:'Описание'}]};
  const open=normalizeCmsPage('project',item);
  assert.equal(open.fundraising.mode,'active');
  assert.equal(open.fundraising.target,200000);
  assert.deepEqual(validateNormalizedPage(open),[]);
  const closed=normalizeCmsPage('project',{...item,fundraising:{enabled:false}});
  assert.equal(closed.fundraising.mode,'none');
  const invalid=normalizeCmsPage('project',{...item,fundraising:{enabled:true,target:0}});
  assert.deepEqual(validateNormalizedPage(invalid),['active fundraiser needs a positive target']);
});

test('Article must retain all long-form blocks to pass readiness',()=>{
  const empty=normalizeCmsPage('article',{id:5,title:'Статья',blocks:[]});
  assert.deepEqual(validateNormalizedPage(empty),['article has no content blocks']);
  const complete=normalizeCmsPage('article',{id:5,title:'Статья',blocks:[{type:'paragraph',text:'Основное содержание'}]});
  assert.deepEqual(validateNormalizedPage(complete),[]);
});

test('Event must preserve temporal metadata',()=>{
  const item=normalizeCmsPage('poster-item',{title:'Конференция',date:'2026-10-10T10:00:00',program:[{type:'heading',text:'Программа'}]});
  assert.equal(item.program.length,1);
  assert.deepEqual(validateNormalizedPage(item),[]);
});


test('Keep inline bold, link position, whitespace, and tabular data',()=>{
  const blocks=normalizeBlocks([
    {type:'paragraph',text:'Сильная мысль',spans:[
      {text:'Сильная',marks:['bold']},
      {text:' '},
      {text:'мысль',href:'https://cosmatica.org/about'}
    ],links:[{text:'Подробнее',url:'https://cosmatica.org/about'}]},
    {type:'table',rows:[['Год','Мероприятия'],['2026','5']]}
  ]);
  assert.equal(blocks.length,2);
  assert.equal(blocks[0].spans.map(x=>x.text).join(''),'Сильная мысль');
  assert.deepEqual(blocks[0].spans[0].marks,['bold']);
  assert.equal(blocks[0].spans[2].href,'https://cosmatica.org/about');
  assert.equal(blocks[0].links.length,1);
  assert.equal(blocks[1].type,'table');
  assert.equal(blocks[1].rows[1][0],'2026');
});
