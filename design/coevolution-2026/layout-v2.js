(() => {
  'use strict';
  const ready = fn => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();
  ready(() => {
    // 1. Home: the methodology itself becomes the visual instead of an abstract circle.
    const orbit = document.querySelector('[data-page="home"] .orbit-wrap');
    if (orbit) {
      orbit.innerHTML = `
        <a class="hero-matrix-card" href="#/matrix" aria-label="Открыть маршрутную матрицу НИРМЫ">
          <div class="hero-matrix-head">
            <div><small>Маршрутная модель НИРМЫ</small><strong>Матрица 4 × 4</strong></div>
            <span class="hero-matrix-badge">23 активности ↗</span>
          </div>
          <div class="hero-matrix-grid" aria-hidden="true">
            <span class="axis">Уровни<br>↓ / связи →</span><span class="nature">Человек<br>и природа</span><span class="self">Человек<br>сам с собой</span><span class="people">Человек<br>и человек</span><span class="society">Человек<br>и общество</span>
            <span class="axis">Информативный</span><span class="nature dotset"><i></i><i></i></span><span class="self dotset"><i></i></span><span class="people dotset"><i></i></span><span class="society dotset"><i></i><i></i></span>
            <span class="axis">Практический</span><span class="nature dotset"><i></i><i></i></span><span class="self dotset"><i></i><i></i></span><span class="people dotset"><i></i></span><span class="society dotset"><i></i><i></i></span>
            <span class="axis">Творческий</span><span class="nature dotset"><i></i><i></i><i></i></span><span class="self dotset"><i></i><i></i></span><span class="people dotset"><i></i></span><span class="society dotset"><i></i><i></i></span>
            <span class="axis">Исследова­тельский</span><span class="nature dotset"><i></i></span><span class="self dotset"><i></i></span><span class="people dotset"><i></i></span><span class="society dotset"><i></i></span>
          </div>
          <div class="hero-matrix-foot"><span><b>4</b> сферы взаимосвязей</span><span><b>4</b> уровня погружения</span></div>
        </a>`;
    }

    // 2. Lock the NIRMA title into two intentional lines.
    document.querySelectorAll('.program-feature .art-type').forEach(el => {
      if (el.textContent.replace(/\s+/g,' ').trim().toLowerCase().includes('конструк')) {
        el.innerHTML = '<span class="program-kicker">Конструкторы</span><span class="program-future">будущего</span>';
      }
    });

    // 3. Matrix page: show the source structure first, then the interactive tool.
    const page = document.querySelector('[data-page="matrix"]');
    if (page) {
      const body = page.querySelector('.page-body');
      const meaning = page.querySelector('.matrix-meaning');
      if (body && !page.querySelector('.source-matrix')) {
        const figure = document.createElement('figure');
        figure.className = 'source-matrix';
        figure.innerHTML = `
          <div class="source-matrix__head">
            <div><strong>Маршрутный лист «Миссия НИРМА»</strong><p>Содержание и расположение элементов сохранены; оформление адаптировано к интерфейсу сайта.</p></div>
            <a href="matrix-source.svg" target="_blank" rel="noopener">Открыть целиком ↗</a>
          </div>
          <div class="source-matrix__viewport" tabindex="0" role="region" aria-label="Маршрутная матрица НИРМЫ, горизонтальная прокрутка">
            <img src="matrix-source.svg" width="1400" height="820" alt="Маршрутный лист Миссия НИРМА — Конструктора будущего 2026: четыре сферы, четыре уровня и 23 активности">
          </div>
          <figcaption>На мобильном экране схему можно прокручивать горизонтально. Ниже остаётся интерактивная версия с поиском, фильтрами и карточками занятий.</figcaption>`;
        body.insertBefore(figure, meaning || body.firstChild);
      }

      // Keep source-derived meaning, but collapse the long principle cards by default.
      if (meaning) {
        const heads = [...meaning.querySelectorAll('.section-head')];
        const principlesHead = heads.find(h => /пять принципов/i.test(h.textContent));
        const principlesGrid = principlesHead && principlesHead.nextElementSibling && principlesHead.nextElementSibling.classList.contains('grid3') ? principlesHead.nextElementSibling : null;
        if (principlesHead && principlesGrid && !meaning.querySelector('.principles-details')) {
          const details = document.createElement('details');
          details.className = 'principles-details';
          const summary = document.createElement('summary');
          summary.textContent = 'Пять принципов построения программы';
          const inner = document.createElement('div');
          inner.className = 'principles-details__body';
          details.append(summary, inner);
          principlesHead.parentNode.insertBefore(details, principlesHead);
          inner.append(principlesHead, principlesGrid);
        }
        const lastHead = [...meaning.querySelectorAll('.section-head')].find(h => /веб-реконструкция/i.test(h.textContent));
        if (lastHead) {
          const eyebrow = lastHead.querySelector('.eyebrow');
          const h2 = lastHead.querySelector('h2');
          const p = lastHead.querySelector(':scope > p');
          if (eyebrow) eyebrow.textContent = 'Интерактивная версия';
          if (h2) h2.textContent = 'Найти занятие и увидеть его место в матрице.';
          if (p) p.textContent = 'Номера и связи сохранены; фильтры нужны только для удобства просмотра.';
        }
      }
    }

    // 4. Remove methodology attribution from public explanatory copy; keep team roles where relevant.
    const aboutLead = document.querySelector('[data-page="about"] .page-heading .lead');
    if (aboutLead && /Мария предлагает/.test(aboutLead.textContent)) {
      aboutLead.textContent = '«Соэволюция» — портал целостного развития Русского космического общества. Направление объединяет программы, которые раскрываются через общую логику взаимосвязей, практики, творчества и исследования.';
    }
  });
})();
