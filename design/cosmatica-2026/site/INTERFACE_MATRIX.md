# Cosmatica 2026 · матрица интерфейсов

| № | Интерфейс | Маршрут | Тип |
|---:|---|---|---|
| 01 | Главная | index.html | home |
| 02 | Новости | view.html?p=news | list |
| 03 | Новость | view.html?p=news-item | article |
| 04 | Мероприятия | view.html?p=poster | events |
| 05 | Мероприятие | view.html?p=poster-item | article |
| 06 | Календарь | view.html?p=calendar | calendar |
| 07 | Об РКО | view.html?p=about | article |
| 08 | Информация об РКО | view.html?p=about-info | list |
| 09 | Органы управления | view.html?p=direction | directory |
| 10 | Высший Совет РКО | view.html?p=collegium | directory |
| 11 | Страница Совета | view.html?p=collegium-item | article |
| 12 | Партнёры | view.html?p=partners | directory |
| 13 | Страница партнёра | view.html?p=partner | article |
| 14 | Контакты | view.html?p=contacts | contacts |
| 15 | Отделения | view.html?p=departments | departments |
| 16 | Страница отделения | view.html?p=department | department |
| 17 | Проекты | view.html?p=projects | projects |
| 18 | Страница проекта | view.html?p=project | project |
| 19 | Состав РКО | view.html?p=users | people |
| 20 | Профиль участника | view.html?p=profile | profile |
| 21 | Категории материалов | view.html?p=articles | categories |
| 22 | Список публикаций | view.html?p=articles-list | list |
| 23 | Статья | view.html?p=article | article |
| 24 | Библиотека | view.html?p=library | library |
| 25 | Страница книги | view.html?p=book | book |
| 26 | Страница с вкладками | view.html?p=tabs | tabs |
| 27 | Поддержать РКО | view.html?p=donate | donate |
| 28 | Вход | view.html?p=login | login |
| 29 | Восстановление пароля | view.html?p=restore | restore |
| 30 | Регистрация | view.html?p=register | register |
| 31 | Поиск — до запроса | view.html?p=search | search-empty |
| 32 | Поиск — результаты | view.html?p=search-results | search-results |

## Общий стандарт

- единый фирменный header/footer;
- каноническая палитра РКО: #0D0C39 / #5D000F / #FFCA38;
- Roboto;
- светлая и тёмная тема;
- mobile/desktop;
- основные зоны нажатия не меньше 44 px;
- контентные страницы не смешиваются с интерфейсными служебными состояниями;
- проект имеет отдельную модель статуса, участия и поддержки;
- поиск имеет два самостоятельных состояния;
- отделения используют алфавитную навигацию и многоколоночную структуру.
