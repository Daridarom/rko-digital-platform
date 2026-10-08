#!/usr/bin/env python3
"""Evidence-based source snapshot coverage; does not equate templates with full CMS."""
import json
from pathlib import Path
site=Path(__file__).resolve().parent.parent
entries=json.loads((site/'integration/page-map.json').read_text())['entries']
report=[];issues=[]
for e in entries:
    if e['slug']=='search-results': continue
    f=site/'data/source'/(e['slug']+'.json')
    if not f.exists(): issues.append('Missing '+e['slug']);continue
    d=json.loads(f.read_text())
    ev=d.get('sourceEvidence',{})
    original=int(ev.get('sourceTextCharacters') or 0)
    stored=int(ev.get('storedTextCharacters') or 0)
    stored+=sum(len(cell) for block in d['blocks'] if block.get('type')=='table' for row in block.get('rows',[]) for cell in row)
    stored+=sum(len(c.get('title',''))+len(c.get('description','')) for c in d['cards'])
    stored+=sum(len(f.get('key',''))+len(f.get('value','')) for f in d.get('fields',[]))
    count=len(d.get('blocks',[]))+len(d.get('cards',[]))
    if e['sourceUrl'].rstrip('/')!=d['sourceUrl'].rstrip('/'):
        issues.append('Source mismatch: '+e['slug'])
    if original>500 and count==0:
        issues.append('Empty page '+e['slug'])
    if original>2000 and stored/original<.5:
        issues.append('Possible truncation '+e['slug'])
    report.append({'slug':e['slug'],'title':d['title'],'http':ev.get('http'),
       'sourceChars':original,'extractedChars':stored,'coverage':round(stored/max(1,original),2),
       'blocks':len(d.get('blocks',[])),'cards':len(d.get('cards',[]))})
lines=['# Сверка редакционной полноты с исходными 31 страницами','',
 'Проверка локального редакционного архива 08.10.2026. Число символов — только индикатор для редактора. Данные CMS могут быть представлены карточками, таблицами и дополнительными документами; процент НЕ является измерением полной миграции архива.','','| Страница | Блоки | Карточки | Текст источника | Сохранённый текст | Индикатор |','|---|---:|---:|---:|---:|---:|']
for x in report:
 lines.append('| '+x['slug']+' | '+str(x['blocks'])+' | '+str(x['cards'])+' | '+str(x['sourceChars'])+' | '+str(x['extractedChars'])+' | '+str(x['coverage'])+' |')
lines+=['','## Риски','','Проверка не гарантирует сохранения всех исходных URL, скрытых страниц, авторизации и динамического архива.','']
lines+=['- '+s for s in issues] if issues else ['Нет автоматических ошибок по указанным правилам; ручная редакционная приёмка необходима.']
(site/'qa/SOURCE_FIDELITY_2026-10-08.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({'pages':len(report),'issues':issues,'flagsUnder50':[x['slug'] for x in report if x['sourceChars']>2000 and x['coverage']<.5]},ensure_ascii=False))
if issues:raise SystemExit(1)
