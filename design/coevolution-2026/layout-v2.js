(() => {
  'use strict';
  const ready = fn => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();

  function matrixMarkup(extraClass='') {
    const item=(n,t,cls='')=>`<div class="src-item ${cls}"><b>${n}.</b><span>${t}</span><i aria-hidden="true"></i></div>`;
    return `<div class="src-matrix ${extraClass}" role="img" aria-label="Маршрутный лист Миссия НИРМА — Конструктора будущего 2026: четыре сферы взаимосвязей, четыре уровня и 23 активности">
      <div class="src-title">МАРШРУТНЫЙ ЛИСТ «МИССИЯ НИРМА» — КОНСТРУКТОРА БУДУЩЕГО 2026</div>
      <div class="src-corner"><span class="src-links">СВЯЗИ</span><span class="src-levels">УРОВНИ</span></div>
      <div class="src-head nature"><strong>Человек<br>и<br>природа</strong></div>
      <div class="src-head self"><strong>Человек<br>сам с<br>собой</strong></div>
      <div class="src-head people"><strong>Человек<br>и<br>Человек</strong></div>
      <div class="src-head society"><strong>Человек<br>и<br>общество</strong></div>

      <div class="src-rowlabel info"><strong>ИНФОРМА-<br>ТИВНЫЙ</strong><span aria-hidden="true">📖</span></div>
      <div class="src-cell nature info n1">${item(1,'Орнитология')}</div>
      <div class="src-cell nature info n2">${item(2,'Астрономия')}</div>
      <div class="src-cell self info n8">${item(8,'Управление временем')}</div>
      <div class="src-cell people info n13">${item(13,'Фильм «Школьные ботаны»')}</div>
      <div class="src-cell society info n16">${item(16,'Лит. клуб<br>Фильм «Белая Ворона»')}</div>
      <div class="src-cell society info n17">${item(17,'Библиотека')}</div>

      <div class="src-rowlabel practice"><strong>ПРАКТИЧЕ-<br>СКИЙ</strong><span aria-hidden="true">💪</span></div>
      <div class="src-cell nature practice n3">${item(3,'Пчеловодство')}</div>
      <div class="src-cell nature practice n4">${item(4,'Поход в лес')}</div>
      <div class="src-cell self practice n9">${item(9,'Сообжариум')}</div>
      <div class="src-cell self practice n10">${item(10,'Тренировки тела')}</div>
      <div class="src-cell people practice n14">${item(14,'Мастерская дружбы')}</div>
      <div class="src-cell society practice n18">${item(18,'Лит. клуб<br>Пишем рассказ')}</div>
      <div class="src-cell society practice n19">${item(19,'Три роли')}</div>

      <div class="src-rowlabel creative"><strong>ТВОРЧЕСКИЙ</strong><span aria-hidden="true">🎨</span></div>
      <div class="src-cell nature creative n5">${item(5,'Гончарка')}</div>
      <div class="src-cell nature creative n6">${item(6,'Улучшаем пространство')}</div>
      <div class="src-cell nature creative n7">${item(7,'Творим из природных материалов')}</div>
      <div class="src-cell self creative n11">${item(11,'Самопрезентация')}</div>
      <div class="src-cell self creative n12">${item(12,'Я глазами других')}</div>
      <div class="src-cell bridge creative n15">${item(15,'Театральная мастерская','wide')}</div>
      <div class="src-cell society creative n20">${item(20,'Лит. клуб<br>«Сила слова»')}</div>
      <div class="src-cell society creative n21">${item(21,'Конференция')}</div>

      <div class="src-rowlabel research"><strong>ИССЛЕДО-<br>ВАТЕЛЬ-<br>СКИЙ</strong><span aria-hidden="true">🔎</span></div>
      <div class="src-cell research n23">${item(23,'Исследовательская деятельность: строители, ОБЖ, природоведы, экологи','wide')}</div>
      <div class="src-cell society research n22">${item(22,'Фестиваль<br>«ЭКОДВИЖ»')}</div>
    </div>`;
  }

  ready(() => {
    // Главная: миниатюра той же схемы, без отдельной придуманной визуализации.
    const orbit = document.querySelector('[data-page="home"] .orbit-wrap');
    if (orbit) {
      orbit.innerHTML = `<a class="hero-source-card" href="#/matrix" aria-label="Открыть маршрутный лист НИРМЫ">
        <div class="hero-source-head"><div><small>Маршрутный лист НИРМЫ</small><strong>Исходная структура программы</strong></div><span>Открыть ↗</span></div>
        <div class="src-mini">${matrixMarkup('src-matrix--mini')}</div>
      </a>`;
    }

    document.querySelectorAll('.program-feature .art-type').forEach(el => {
      if (el.textContent.replace(/\s+/g,' ').trim().toLowerCase().includes('конструк')) {
        el.innerHTML = '<span class="program-kicker">Конструкторы</span><span class="program-future">будущего</span>';
      }
    });

    const page = document.querySelector('[data-page="matrix"]');
    if (page) {
      const heading = page.querySelector('.page-heading');
      if (heading) {
        const eyebrow = heading.querySelector('.eyebrow');
        const h1 = heading.querySelector('h1');
        const lead = heading.querySelector('.lead');
        if (eyebrow) eyebrow.textContent = 'Маршрутный лист «Миссия НИРМА» · Конструктора будущего 2026';
        if (h1) h1.innerHTML = 'Матрица <span class="red">4 × 4.</span>';
        if (lead) lead.textContent = 'Структура повторяет исходный маршрутный лист: четыре сферы по горизонтали, четыре уровня по вертикали и занятия в тех же секторах.';
      }
      const body = page.querySelector('.page-body');
      if (body) body.innerHTML = `<figure class="maria-source">
        <div class="maria-source__head"><div><strong>Маршрутный лист программы</strong><p>Без поиска, фильтров и дополнительных трактовок. №15 соединяет две соседние сферы, №23 — три сферы, как в исходной схеме.</p></div><button class="source-open" type="button" id="source-open">Открыть крупно ↗</button></div>
        <div class="source-sheet">${matrixMarkup()}</div>
      </figure>
      <dialog class="source-dialog" id="source-dialog"><div class="source-dialog__bar"><strong>Маршрутный лист НИРМЫ</strong><button type="button" id="source-close" aria-label="Закрыть">×</button></div><div class="source-dialog__scroll">${matrixMarkup('src-matrix--large')}</div></dialog>`;

      const dlg=document.getElementById('source-dialog');
      document.getElementById('source-open')?.addEventListener('click',()=>dlg?.showModal());
      document.getElementById('source-close')?.addEventListener('click',()=>dlg?.close());
      dlg?.addEventListener('click',e=>{if(e.target===dlg) dlg.close();});
    }

    const aboutLead = document.querySelector('[data-page="about"] .page-heading .lead');
    if (aboutLead && /Мария предлагает/.test(aboutLead.textContent)) {
      aboutLead.textContent = '«Соэволюция» — портал целостного развития Русского космического общества. Направление объединяет программы через общую логику взаимосвязей, практики, творчества и исследования.';
    }
  });
})();
