# РКО: аудит доступности оригинальных адресов и полноты переноса

Сверка 8 октября 2026 года: XML-карты, публичные страницы и ссылки из каталогов cosmatica.org.

- Обнаружено уникальных адресов: **5203**.
- Перенесено публичных редакционных материалов: **4812**.
- Не входят в редакционный архив: **391**.

| Категория | Количество |
|---|---:|
| Подтверждённые HTTP 404 на старом сайте | 373 |
| HTTP 403 на старом сайте | 1 |
| Вместо профиля открывается другая страница | 1 |
| Публичные статьи с неполученным исходным текстом | 11 |
| Служебные маршруты (не статьи) | 5 |

Проверка баланса: 4812 + 373 + 1 + 1 + 11 + 5 = 5203.

## Неполученные публичные статьи

Следующие ссылки найдены в действующих списках РКО, но их текст и HTML не удалось получить для переноса. На 8 октября повторные HTTP-запросы к оригинальному сайту завершались тайм-аутом. **Не считать статьи восстановленными**. Запросить у Павла доступ к этим материалам через CMS или исходную БД, затем повторить импорт и сравнение текста.

- https://cosmatica.org/articles/1123-udivitelnye-griby-2-serija.html
- https://cosmatica.org/articles/1124-semena-svobody.html
- https://cosmatica.org/articles/1167-nacionalnye-kosmicheskie-obschestva-kak-centry-kosmoplanetarnoi-socialnoi-pedagogiki.html
- https://cosmatica.org/articles/1168-russkoe-kosmicheskoe-obschestvo-obschaja.html
- https://cosmatica.org/articles/1330-ekofilosofskaja-determinacija-prostranstva-kultury-noosfernogo-goroda.html
- https://cosmatica.org/articles/1432-grjaduschii-noosfernyi-sintez-nauki-i-vlasti-kak-imperativ.html
- https://cosmatica.org/articles/1433-pervaja-faza-globalnoi-ekologicheskoi-katastrofy.html
- https://cosmatica.org/articles/1434-noosfernyi-socializm-kak-socialno-ekonomicheskaja-organizacija-razvitija-obschestva.html
- https://cosmatica.org/articles/1435-zavisimost-buduschego-kosmicheskogo-proryva-chelovechestva-ot.html
- https://cosmatica.org/articles/1437-12-novaja-noosfernaja-ideologija-i-ideal-buduschego.html
- https://cosmatica.org/articles/1438-13-strategija-evolyucionnogo-proryva-rossii-i-chelovechestva-v-xxi-veke-i-noosferizm.html

## Условия передачи

1. Файлы книг остаются на сервере РКО; сохранены оригинальные ссылки скачивания.
2. Не показывать отсутствующие/неполученные статьи как перенесённые; не заполнять их вымышленным текстом.
3. Рабочие серверные функции и исходная CMS не заменяются статической демонстрацией.
4. Полный перечень исключений (включая указанные 11 адресов) находится в `data/archive/unavailable-urls.csv`.
5. После доступа к исходному сайту повторно проверить недоступные страницы и обложки книг.

