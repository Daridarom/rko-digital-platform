#!/usr/bin/env python3
"""Record public source URL coverage and unrecovered editorial URLs honestly."""
from pathlib import Path
from collections import Counter
import csv,json
root=Path(__file__).resolve().parent.parent
archive=root/'data/archive'
inventory=json.loads((archive/'inventory.json').read_text())['records']
index=json.loads((root/'data/linked-index.json').read_text())
catalog=json.loads((archive/'catalog-report.json').read_text())
blocked={'not_found_404','forbidden_403','soft_missing_no_public_profile'}
# The 5 non-editorial records are public UI endpoints, never expected in the
# editorial linked index. The catalog count is source of truth for their number.
problem=[r for r in inventory if r.get('availability') in blocked]
unresolved=[r for r in inventory if r.get('availability') not in blocked and
            r.get('kind')=='article' and r['url'] not in index]
assert len(unresolved)==catalog['unresolved'],(len(unresolved),catalog['unresolved'])
counts=Counter(r.get('availability','available') for r in inventory)
with (archive/'unavailable-urls.csv').open('w',newline='',encoding='utf-8-sig') as f:
    w=csv.writer(f,lineterminator="\n");w.writerow(['Исходный URL','Тип','Статус','Источник'])
    for r in problem:
        w.writerow([r['url'],r.get('kind',''),r['availability'],'; '.join(r.get('sources',[]))])
    for r in unresolved:
        w.writerow([r['url'],r['kind'],'unresolved_missing_snapshot','; '.join(r.get('sources',[]))])
lines=['# РКО: аудит доступности оригинальных адресов и полноты переноса','',
'Сверка 8 октября 2026 года: XML-карты, публичные страницы и ссылки из каталогов cosmatica.org.',
'',
f"- Обнаружено уникальных адресов: **{len(inventory)}**.",
f"- Перенесено публичных редакционных материалов: **{catalog['renderable']}**.",
f"- Не входят в редакционный архив: **{len(inventory)-catalog['renderable']}**.",
'',
'| Категория | Количество |','|---|---:|',
f"| Подтверждённые HTTP 404 на старом сайте | {counts['not_found_404']} |",
f"| HTTP 403 на старом сайте | {counts['forbidden_403']} |",
f"| Вместо профиля открывается другая страница | {counts['soft_missing_no_public_profile']} |",
f"| Публичные статьи с неполученным исходным текстом | {len(unresolved)} |",
f"| Служебные маршруты (не статьи) | {catalog['nonEditorial']} |",
'',f"Проверка баланса: {catalog['renderable']} + {counts['not_found_404']} + {counts['forbidden_403']} + {counts['soft_missing_no_public_profile']} + {len(unresolved)} + {catalog['nonEditorial']} = {len(inventory)}.",
'',
'## Неполученные публичные статьи',
'',
'Следующие ссылки найдены в действующих списках РКО, но их текст и HTML не удалось получить для переноса. На 8 октября повторные HTTP-запросы к оригинальному сайту завершались тайм-аутом. **Не считать статьи восстановленными**. Запросить у Павла доступ к этим материалам через CMS или исходную БД, затем повторить импорт и сравнение текста.',
'']
for row in unresolved:
    lines.append('- '+row['url'])
lines+=['','## Условия передачи','',
'1. Файлы книг остаются на сервере РКО; сохранены оригинальные ссылки скачивания.',
'2. Не показывать отсутствующие/неполученные статьи как перенесённые; не заполнять их вымышленным текстом.',
'3. Рабочие серверные функции и исходная CMS не заменяются статической демонстрацией.',
'4. Полный перечень исключений (включая указанные 11 адресов) находится в `data/archive/unavailable-urls.csv`.',
'5. После доступа к исходному сайту повторно проверить недоступные страницы и обложки книг.',
'']
(root/'integration/ORIGIN_ACCESS_REPORT.md').write_text('\n'.join(lines)+'\n')
print('RECONCILIATION',{'found':len(inventory),'indexed':catalog['renderable'],'404':counts['not_found_404'],'403':counts['forbidden_403'],'soft':counts['soft_missing_no_public_profile'],'unresolved':len(unresolved),'service':catalog['nonEditorial']})
