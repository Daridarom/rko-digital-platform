(() => {
  'use strict';
  const ready = fn => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();
  ready(() => {
    const D = window.COEVO || {activities:[]};
    const act = id => D.activities.find(a => a.id === id);
    const activity = id => {
      const a = act(id);
      if (!a) return '';
      return `<button type="button" class="source-act" data-activity="${id}" aria-label="${id}. ${a.name}"><b>${id}.</b><span>${a.name}</span></button>`;
    };
    const mobileCell = (sphere, ids) => `
      <div class="mobile-sphere ${sphere.cls}">
        <strong>${sphere.name}</strong>
        <div class="mobile-activities">${ids.map(activity).join('')}</div>
      </div>`;

    // Главная: короткое превью структуры без абстрактных точек.
    const orbit = document.querySelector('[data-page="home"] .orbit-wrap');
    if (orbit) {
      orbit.innerHTML = `
        <a class="hero-matrix-card" href="#/matrix" aria-label="Открыть маршрутную матрицу НИРМЫ">
          <div class="hero-matrix-head">
            <div><small>Маршрутная модель НИРМЫ</small><strong>4 сферы × 4 уровня</strong></div>
            <span class="hero-matrix-badge">23 активности ↗</span>
          </div>
          <div class="hero-matrix-grid" aria-hidden="true">
            <span class="axis">Уровни ↓<br>Связи →</span><span class="nature">Человек<br>и природа</span><span class="self">Человек<br>сам с собой</span><span class="people">Человек<br>и человек</span><span class="society">Человек<br>и общество</span>
            <span class="axis">Информ.</span><span class="nature mini-ids">1 · 2</span><span class="self mini-ids">8</span><span class="people mini-ids">13</span><span class="society mini-ids">16 · 17</span>
            <span class="axis">Практич.</span><span class="nature mini-ids">3 · 4</span><span class="self mini-ids">9 · 10</span><span class="people mini-ids">14</span><span class="society mini-ids">18 · 19</span>
            <span class="axis">Творч.</span><span class="nature mini-ids">5 · 6 · 7</span><span class="self mini-ids">11 · 12 · 15</span><span class="people mini-ids">15</span><span class="society mini-ids">20 · 21</span>
            <span class="axis">Исслед.</span><span class="nature mini-ids">23</span><span class="self mini-ids">23</span><span class="people mini-ids">23</span><span class="society mini-ids">22</span>
          </div>
          <div class="hero-matrix-foot"><span><b>4</b> сферы взаимосвязей</span><span><b>4</b> уровня освоения</span></div>
        </a>`;
    }

    // НИРМА: аккуратный перенос названия.
    document.querySelectorAll('.program-feature .art-type').forEach(el => {
      if (el.textContent.replace(/\s+/g,' ').trim().toLowerCase().includes('конструк')) {
        el.innerHTML = '<span class="program-kicker">Конструкторы</span><span class="program-future">будущего</span>';
      }
    });

    // Страница матрицы: только структура содержания. Без поиска, фильтров и дублирующих блоков.
    const page = document.querySelector('[data-page="matrix"]');
    if (page) {
      const heading = page.querySelector('.page-heading');
      if (heading) {
        const eyebrow = heading.querySelector('.eyebrow');
        const h1 = heading.querySelector('h1');
        const lead = heading.querySelector('.lead');
        if (eyebrow) eyebrow.textContent = 'Маршрутный лист «Миссия НИРМА» · Конструкторы будущего';
        if (h1) h1.innerHTML = 'Матрица <span class="red">целостного развития.</span>';
        if (lead) lead.textContent = 'Четыре сферы взаимосвязей и четыре уровня освоения. Внутри — занятия, которые входят в маршрут программы.';
      }

      const body = page.querySelector('.page-body');
      if (body) {
        const spheres = {
          nature:{cls:'nature',name:'Человек и природа'},
          self:{cls:'self',name:'Человек сам с собой'},
          people:{cls:'people',name:'Человек и человек'},
          society:{cls:'society',name:'Человек и общество'}
        };
        body.innerHTML = `
          <figure class="source-matrix source-matrix--only">
            <div class="source-matrix__head">
              <div><strong>Маршрутная матрица НИРМЫ</strong><p>Содержание сохранено по исходной схеме. На большом экране — таблица; на телефоне — те же четыре уровня, раскрытые в читаемые блоки.</p></div>
              <a href="matrix-source.svg" target="_blank" rel="noopener">Исходная схема ↗</a>
            </div>

            <div class="source-sheet source-sheet--desktop" role="group" aria-label="Маршрутная матрица НИРМЫ">
              <div class="source-corner"><b>УРОВНИ ↓</b><span>СВЯЗИ →</span></div>
              <div class="source-head nature">Человек<br>и природа</div>
              <div class="source-head self">Человек<br>сам с собой</div>
              <div class="source-head people">Человек<br>и человек</div>
              <div class="source-head society">Человек<br>и общество</div>

              <div class="source-level">ИНФОРМАТИВНЫЙ</div>
              <div class="source-zone nature">${activity(1)}${activity(2)}</div>
              <div class="source-zone self">${activity(8)}</div>
              <div class="source-zone people">${activity(13)}</div>
              <div class="source-zone society">${activity(16)}${activity(17)}</div>

              <div class="source-level">ПРАКТИЧЕСКИЙ</div>
              <div class="source-zone nature">${activity(3)}${activity(4)}</div>
              <div class="source-zone self">${activity(9)}${activity(10)}</div>
              <div class="source-zone people">${activity(14)}</div>
              <div class="source-zone society">${activity(18)}${activity(19)}</div>

              <div class="source-level source-level--creative">ТВОРЧЕСКИЙ</div>
              <div class="source-zone nature source-zone--creative">${activity(5)}${activity(6)}${activity(7)}</div>
              <div class="source-zone source-zone--creative-middle"><div class="source-middle-top"><div class="self">${activity(11)}${activity(12)}</div><div class="people"></div></div><div class="source-span-act">${activity(15)}</div></div>
              <div class="source-zone society source-zone--creative">${activity(20)}${activity(21)}</div>

              <div class="source-level">ИССЛЕДОВАТЕЛЬСКИЙ</div>
              <div class="source-zone source-zone--research-wide">${activity(23)}</div>
              <div class="source-zone society">${activity(22)}</div>
            </div>

            <div class="source-mobile" aria-label="Маршрутная матрица НИРМЫ для мобильного экрана">
              <section class="mobile-level"><h2>01 · Информативный</h2><div class="mobile-level-grid">${mobileCell(spheres.nature,[1,2])}${mobileCell(spheres.self,[8])}${mobileCell(spheres.people,[13])}${mobileCell(spheres.society,[16,17])}</div></section>
              <section class="mobile-level"><h2>02 · Практический</h2><div class="mobile-level-grid">${mobileCell(spheres.nature,[3,4])}${mobileCell(spheres.self,[9,10])}${mobileCell(spheres.people,[14])}${mobileCell(spheres.society,[18,19])}</div></section>
              <section class="mobile-level"><h2>03 · Творческий</h2><div class="mobile-level-grid">${mobileCell(spheres.nature,[5,6,7])}${mobileCell(spheres.self,[11,12])}${mobileCell(spheres.people,[15])}${mobileCell(spheres.society,[20,21])}</div><p class="mobile-crosslink"><b>15. Театральная мастерская</b> связывает сферы «Человек сам с собой» и «Человек и человек».</p></section>
              <section class="mobile-level"><h2>04 · Исследовательский</h2><div class="mobile-level-grid">${mobileCell(spheres.nature,[23])}${mobileCell(spheres.self,[23])}${mobileCell(spheres.people,[23])}${mobileCell(spheres.society,[22])}</div><p class="mobile-crosslink"><b>23. Исследовательская деятельность</b> объединяет первые три сферы.</p></section>
            </div>

            <figcaption>Номера и названия занятий сохранены по маршрутному листу. №15 относится к двум сферам, №23 — к трём.</figcaption>
          </figure>`;
      }
    }

    const aboutLead = document.querySelector('[data-page="about"] .page-heading .lead');
    if (aboutLead && /Мария предлагает/.test(aboutLead.textContent)) {
      aboutLead.textContent = '«Соэволюция» — портал целостного развития Русского космического общества. Направление объединяет программы через общую логику взаимосвязей, практики, творчества и исследования.';
    }
  });
})();
