# Cosmatica · исходники, полнота и сборка — 08.10.2026

Проверка по 31 исходному URL из таблицы; 32-е состояние — результаты поиска. **Структурное извлечение завершено для 31/31 исходных страниц.**

| № | Шаблон | Исходный текст* | Извлечённый текст* | Блоков | Состояние |
|---:|---|---:|---:|---:|---|
| 01 | home | 4118 | 104 | 37 | LISTING_NEEDS_ENTITY_EXTRACTION |
| 02 | news | 1566 | 1502 | 49 | LISTING_NEEDS_ENTITY_EXTRACTION |
| 03 | news-item | 3419 | 3112 | 20 | EXTRACTED_NEEDS_EDITORIAL_REVIEW |
| 04 | poster | 510 | 226 | 20 | LISTING_NEEDS_ENTITY_EXTRACTION |
| 05 | poster-item | 14441 | 13718 | 90 | EXTRACTED_NEEDS_EDITORIAL_REVIEW |
| 06 | calendar | 352 | 190 | 15 | LISTING_NEEDS_ENTITY_EXTRACTION |
| 07 | about | 6 | 8388 | 39 | EXTRACTED_NEEDS_EDITORIAL_REVIEW |
| 08 | about-info | 519 | 542 | 11 | LISTING_NEEDS_ENTITY_EXTRACTION |
| 09 | direction | 17 | 8279 | 37 | LISTING_NEEDS_ENTITY_EXTRACTION |
| 10 | collegium | 6290 | 6290 | 66 | LISTING_NEEDS_ENTITY_EXTRACTION |
| 11 | collegium-item | 6495 | 6413 | 42 | EXTRACTED_NEEDS_EDITORIAL_REVIEW |
| 12 | partners | 6979 | 517 | 28 | LISTING_NEEDS_ENTITY_EXTRACTION |
| 13 | partner | 266 | 0 | 1 | SOURCE_FIELD_REVIEW |
| 14 | contacts | 190 | 285 | 7 | SOURCE_FIELD_REVIEW |
| 15 | departments | 665 | 679 | 40 | LISTING_NEEDS_ENTITY_EXTRACTION |
| 16 | department | 307 | 211 | 5 | SOURCE_FIELD_REVIEW |
| 17 | projects | 948 | 129 | 25 | LISTING_NEEDS_ENTITY_EXTRACTION |
| 18 | project | 26144 | 24604 | 240 | EXTRACTED_NEEDS_EDITORIAL_REVIEW |
| 19 | users | 1437 | 476 | 28 | LISTING_NEEDS_ENTITY_EXTRACTION |
| 20 | profile | 357 | 9 | 1 | SOURCE_FIELD_REVIEW |
| 21 | articles | 467 | 3738 | 4 | LISTING_NEEDS_ENTITY_EXTRACTION |
| 22 | articles-list | 1785 | 4438 | 19 | LISTING_NEEDS_ENTITY_EXTRACTION |
| 23 | article | 52102 | 51468 | 167 | EXTRACTED_NEEDS_EDITORIAL_REVIEW |
| 24 | library | 818 | 475 | 17 | LISTING_NEEDS_ENTITY_EXTRACTION |
| 25 | book | 461 | 0 | 1 | SOURCE_FIELD_REVIEW |
| 26 | tabs | 6573 | 6443 | 51 | EXTRACTED_NEEDS_EDITORIAL_REVIEW |
| 27 | donate | 905 | 931 | 6 | BACKEND_INTEGRATION_REQUIRED |
| 28 | login | 157 | 50 | 3 | BACKEND_INTEGRATION_REQUIRED |
| 29 | restore | 166 | 203 | 3 | BACKEND_INTEGRATION_REQUIRED |
| 30 | register | 89 | 56 | 3 | BACKEND_INTEGRATION_REQUIRED |
| 31 | search | 824 | 223 | 5 | BACKEND_INTEGRATION_REQUIRED |
| 32 | search-results | — | — | — | NEEDS_CMS_DATA |

* Метрики получены разными алгоритмами и не подтверждают дословную полноту. Изображения, карточки, формы и связи требуют самостоятельной сверки.

## Подтверждено

- Структурные файлы по 31 исходной странице созданы локально с SHA-256 и статусом editorialReviewed=false.
- Большая статья, проект и мероприятие извлечены как длинные многоблочные документы.
- Для остальных типов обозначены поля и списки, которые невозможно перенести только экспортом абзацев.
- Исходные тексты и изображения не публиковались автоматически в открытом GitHub Pages.

## Блокирующие вопросы

1. Профиль, книга, партнёр: оригинал использует нетекстовые поля, вложенные карточки и изображения. Требуется разметка полей и ручная сверка.
2. Каталоги новостей, проектов, участников и книг: нужен полный список записей и пагинация.
3. Серверная авторизация, пожертвования, поиск требуют отдельной интеграции CMS.
4. Проверка имён, дат, документов, иллюстраций, правообладателей и доступности обязательна.
5. Содержательная готовность CONTENT_VERIFIED — только после редакционной подписи.

## Инструменты

- integration/extract-content.py — безопасный read-only экспорт.
- integration/source-parity.json — машинная трассировка без публикации оригинальных текстов.
- integration/cms-adapter.mjs и integration/rich-renderer.mjs — модель и отображение.
- integration/CMS_HANDOFF.md — протокол передачи и приёмки.