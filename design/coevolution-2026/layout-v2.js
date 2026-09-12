(() => {
  'use strict';
  const ready = fn => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();
  ready(() => {
    const exactSourceImage = 'maria-matrix-exact.svg?v=20260912-1910';

    const orbit = document.querySelector('[data-page="home"] .orbit-wrap');
    if (orbit) {
      orbit.innerHTML = `
        <a class="hero-source-card" href="#/matrix" aria-label="Открыть маршрутный лист НИРМЫ">
          <div class="hero-source-head">
            <div><small>Маршрутный лист НИРМЫ</small><strong>Исходная схема программы</strong></div>
            <span>Открыть ↗</span>
          </div>
          <img src="${exactSourceImage}" alt="Маршрутный лист Миссия НИРМА — Конструктора будущего 2026">
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
        if (lead) lead.textContent = 'Схема воспроизводит структуру исходного листа: четыре сферы по горизонтали, четыре уровня по вертикали и 23 активности.';
      }

      const body = page.querySelector('.page-body');
      if (body) {
        body.innerHTML = `
          <figure class="maria-source">
            <div class="maria-source__head">
              <div>
                <strong>Маршрутный лист программы</strong>
                <p>Сохранены исходная компоновка, цветовые зоны, номера и названия занятий. На телефоне лист масштабируется целиком; для чтения мелких подписей его можно открыть отдельно.</p>
              </div>
              <a href="${exactSourceImage}" target="_blank" rel="noopener">Открыть крупно ↗</a>
            </div>
            <a class="maria-source__image" href="${exactSourceImage}" target="_blank" rel="noopener" aria-label="Открыть маршрутный лист крупно">
              <img src="${exactSourceImage}" alt="Маршрутный лист Миссия НИРМА — Конструктора будущего 2026">
            </a>
            <figcaption>Первичный источник для сверки — исходный PDF программы. В веб-версии не меняется содержание матрицы; адаптируется только способ отображения.</figcaption>
          </figure>`;
      }
    }

    const aboutLead = document.querySelector('[data-page="about"] .page-heading .lead');
    if (aboutLead && /Мария предлагает/.test(aboutLead.textContent)) {
      aboutLead.textContent = '«Соэволюция» — портал целостного развития Русского космического общества. Направление объединяет программы через общую логику взаимосвязей, практики, творчества и исследования.';
    }
  });
})();
