#!/usr/bin/env python3
"""Write source-availability evidence: no private data, no guessed pages."""
from pathlib import Path
from collections import Counter,defaultdict
import csv,json
ROOT=Path(__file__).resolve().parent.parent
archive=ROOT/'data/archive'
inv=json.loads((archive/'inventory.json').read_text())
catalog=json.loads((archive/'catalog-report.json').read_text())
states=('not_found_404','forbidden_403','soft_missing_no_public_profile','network_error')
rows=[r for r in inv['records'] if r.get('availability') in states]
with (archive/'unavailable-urls.csv').open('w',encoding='utf-8-sig',newline='') as stream:
 writer=csv.writer(stream)
 writer.writerow(['Исходный URL','Тип','Статус','Источник'])
 for r in rows:writer.writerow([r['url'],r['kind'],r['availability'],'; '.join(r.get('sources',[]))])
counts=Counter(r.get('availability','available') for r in inv['records'])
kinds=defaultdict(Counter)
for row in rows:kinds[row['availability']][row['kind']]+=1
label={'not_found_404':'HTTP 404 на оригинальном сайте','forbidden_403':'HTTP 403 на оригинальном сайте',
       'soft_missing_no_public_profile':'Вместо материала открывается общая страница',
       'network_error':'Сетевая ошибка: доступность не подтверждена'}
lines=['# РКО: расхождения между числом адресов и доступных страниц','',
       'Сверка 8 октября 2026 года. Основание: XML-карты, публичные архивы',
       'и ссылки внутри публичных каталогов cosmatica.org.','',
       f"- Уникальных обнаруженных URL: **{len(inv['records'])}**.",
       f"- Подготовлено доступных публичных редакционных страниц: **{catalog['renderable']}**.",
       f"- Разница: **{len(inv['records'])-catalog['renderable']}**.",
       f"- Служебные URL за пределами редакционного архива: **{catalog['nonEditorial']}**.",
       '',
       '| Причина | Адресов |','|---|---:|']
for code in states:lines.append(f"| {label[code]} | {counts[code]} |")
lines+=['','## Распределение ошибок по типам']
for code in states:
 if not counts[code]:continue
 lines.extend(['',f"### {label[code]}"])
 for kind,n in kinds[code].most_common():lines.append(f"- {kind}: {n}")
lines+=['','## Как трактовать результаты','',
 '1. HTTP 404 означает отсутствие публичной страницы в момент проверки. Ссылка',
 '   остаётся в реестре, но вместо неё нельзя создавать фиктивный материал.',
 '2. HTTP 403 и сетевые ошибки требуют отдельной проверки с администратором РКО.',
 '   Закрытый контент не запрашивался и не переносился.',
 '3. GitHub хранит публичный визуальный прототип. Функции входа, платежей и сервера',
 '   должны быть реализованы Павлом при интеграции с работающей CMS.',
 '4. Книжные файлы остаются на исходном сервере РКО.',
 '5. Полный перечень проблемных URL: data/archive/unavailable-urls.csv.',
 '']
(ROOT/'integration/ORIGIN_ACCESS_REPORT.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('SOURCE_ACCESS_REPORT',json.dumps({'found':len(inv['records']),
 'renderable':catalog['renderable'],'nonEditorial':catalog['nonEditorial'],
 'statuses':dict(counts),'problemRows':len(rows)},ensure_ascii=False))
