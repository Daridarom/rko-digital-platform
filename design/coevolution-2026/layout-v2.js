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

    // 1. Home: show the actual matrix idea, not an abstract circle or unexplained dots.
    const orbit = document.querySelector('[data-page="home"] .orbit-wrap');
    if (orbit) {
      orbit.innerHTML = `
        <a class="hero-matrix-card" href="#/matrix" aria-label="Открыть маршрутную матрицу НИРМЫ">
          <div class="hero-matrix-head">
            <div><small>Маршрутная модель НИРМЫ</small><strong>Матрица 4 × 4</strong></div>
            <span class="hero-matrix-badge">23 активности ↗</span>
          </div>
          <div class="hero-matrix-grid" aria-hidden="true">
            <span class="axis">Уровни ↓<br>Связи →</span><span class="nature">Человек<br>и природа</span><span class="self">Человек<br>сам с собой</span><span class="people">Человек<br>и человек</span><span class="society">Человек<br>и общество</span>
            <span class="axis">Информ.</span><span class="nature mini-ids">1 · 2</span><span class="self mini-ids">8</span><span class="people mini-ids">13</span><span class="society mini-ids">16 · 17</span>
            <span class="axis">Практич.</span><span class="nature mini-ids">3 · 4</span><span class="self mini-ids">9 · 10</span><span class="people mini-ids">14</span><span class="society mini-ids">18 · 19</span>
            <span class="axis">Творч.</span><span class="nature mini-ids">5 · 6 · 7</span><span class="self mini-ids">11 · 12 · 15</span><span class="people mini-ids">15</span><span class="society mini-ids">20 · 21</span>
            <span class="axis">Исслед.</span><span class="nature mini-ids">23</span><span class="self mini-ids">23</span><span class="people mini-ids">23</span><span class="society mini-ids">22</span>
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

    // 3. Matrix page: source-like responsive reconstruction. No horizontal scrolling required.
    const page = document.querySelector('[data-page="matrix"]');
    if (page) {
      const body = page.querySelector('.page-body');
      const meaning = page.querySelector('.matrix-meaning');
      if (body && !page.querySelector('.source-matrix')) {
        const figure = document.createElement('figure');
        figure.className = 'source-matrix';
        figure.innerHTML = `
          <div class="source-matrix__head">
            <div><strong>Маршрутный лист «Миссия НИРМА»</strong><p>Схема максимально близка к исходной таблице: те же четыре сферы, четыре уровня, номера и названия занятий.</p></div>
            <a href="matrix-source.svg" target="_blank" rel="noopener">Исходный макет ↗</a>
          </div>
          <div class="source-sheet" role="group" aria-label="Маршрутная матрица НИРМЫ">
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
          <figcaption>Нажмите на занятие, чтобы открыть полное описание. На телефоне вся схема помещается в ширину экрана; названия сокращаются только визуально, содержание карточек не меняется.</figcaption>`;
        body.insertBefore(figure, meaning || body.firstChild);
      }

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

    // 4. Keep explanatory copy neutral; no attribution labels in the public interface.
    const aboutLead = document.querySelector('[data-page="about"] .page-heading .lead');
    if (aboutLead && /Мария предлагает/.test(aboutLead.textContent)) {
      aboutLead.textContent = '«Соэволюция» — портал целостного развития Русского космического общества. Направление объединяет программы, которые раскрываются через общую логику взаимосвязей, практики, творчества и исследования.';
    }
  });
})();
