(function(){
'use strict';
var c=window.COSMATICA_CONTENT;
if(!c || !c.project || !c.project.variants)return;
var V=c.project.variants;
V.books_reprint={
 id:'books_reprint',name:'Переиздание ключевых книг РКО',fullName:'Переиздание ключевых книг Русского космического общества',
 status:'Сбор средств',direction:'Книгоиздание и просвещение',
 mission:'Возвращение ключевых изданий Русского космического общества к читателям, образовательным командам и региональным сообществам.',
 goal:'Подготовить, напечатать и распространить три книги, связанные с интеллектуальным наследием Общества.',
 history:'Переиздание связывает библиотеку РКО с просветительской деятельностью и новыми аудиториями.',
 audiences:['Читатели','Педагоги','Региональные отделения','Образовательные учреждения'],
 science:['Космизм','Научное наследие','Библиотека','Просвещение'],
 participation:['Помочь распространению книг','Организовать презентацию','Поддержать переиздание'],
 tabs:['О проекте','Книги','Участие','Поддержка'],
 sections:[{title:'Задачи',body:'Сохранение доступности ключевых текстов и вовлечение новых читателей в изучение идей Общества.'}],
 documents:[],links:[],stats:{},fundraising:{enabled:true,mode:'goal',label:'Поддержать переиздание',target:250000,raised:0,note:'Цель минимального тиража — 250 000 рублей. Текущий размер поступлений в демонстрации не синхронизируется.'}
};
V.sport={
 id:'sport',name:'Спортивный клуб РКО',fullName:'Спортивный клуб Русского Космического Общества',
 status:'Действующий',direction:'Спорт и здоровье',
 mission:'Объединение участников Русского космического общества вокруг спорта, командных событий и культуры здоровья.',
 goal:'Развивать массовую спортивную активность и поддерживать мероприятия Общества.',
 history:'Спортивный клуб организует события и поддерживает участие сообществ в соревнованиях и встречах.',
 audiences:['Участники РКО','Молодёжь','Ветераны','Семьи'],
 science:['Физическая культура','Здоровье','Социальное взаимодействие'],
 participation:['Участвовать в мероприятиях','Вступить в команду','Помочь в организации'],
 tabs:['О проекте','Мероприятия','Участие'],
 sections:[{title:'Форматы деятельности',body:'Командные встречи, соревнования, тренировки и культурно-спортивные события.'}],
 documents:[],links:[],stats:{},fundraising:{enabled:false}
};
if(c.library && Array.isArray(c.library.books)){
 // These references are resolved against the imported public book archive.
 // Do not use book titles as ?item: source-runtime expects a source URL or ref.
 c.library.links=[
  'view.html?p=book',
  'view.html?p=book&ref=28092b80c6ccb8cbc2',
  'view.html?p=book&ref=3e335c9e7d12429a4d',
  'view.html?p=book&ref=d6070a31d881f373d9',
  'view.html?p=book&ref=63209ea07ecafb58cf',
  'view.html?p=book&ref=748b2b08a39ad3f1ac',
  'view.html?p=book&ref=d0bc9e3e5f4d1033eb'
 ];
}
// Preserve canonical source URLs for news cards. demo.js maps those URLs to
// locally imported material; using a title as ?item makes real articles 404.
var cards=c.projects && c.projects.cards || [];
cards.forEach(function(card){
 if(/Переиздание ключевых/.test(card.title))card.id='books_reprint';
 if(/Спортивный клуб/.test(card.title))card.id='sport';
});
})();