(() => {
  'use strict';
  const ready = fn => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();
  ready(() => {
    // Главная: показываем уменьшенную копию той же исходной схемы, без собственной интерпретации.
    const orbit = document.querySelector('[data-page="home"] .orbit-wrap');
    if (orbit) {
      orbit.innerHTML = `
        <a class="hero-source-card" href="#/matrix" aria-label="Открыть маршрутный лист НИРМЫ">
          <div class="hero-source-head">
            <div><small>Маршрутный лист НИРМЫ</small><strong>4 сферы × 4 уровня</strong></div>
            <span>Открыть ↗</span>
          </div>
          <img src="matrix-source.svg" alt="Маршрутный лист Миссия НИРМА — Конструктора будущего 2026">
        </a>`;
    }

    // НИРМА: фиксируем аккуратный перенос названия.
    document.querySelectorAll('.program-feature .art-type').forEach(el => {
      if (el.textContent.replace(/\s+/g,' ').trim().toLowerCase().includes('конструк')) {
        el.innerHTML = '<span class="program-kicker">Конструкторы</span><span class="program-future">будущего</span>';
      }
    });

    // Страница матрицы: один эталонный маршрутный лист. Никаких фильтров, поиска и второй матрицы.
    const page = document.querySelector('[data-page="matrix"]');
    if (page) {
      const heading = page.querySelector('.page-heading');
      if (heading) {
        const eyebrow = heading.querySelector('.eyebrow');
        const h1 = heading.querySelector('h1');
        const lead = heading.querySelector('.lead');
        if (eyebrow) eyebrow.textContent = 'Маршрутный лист «Миссия НИРМА» · Конструктора будущего 2026';
        if (h1) h1.innerHTML = 'Матрица <span class="red">4 × 4.</span>';
        if (lead) lead.textContent = 'Структура сохранена по исходному файлу: четыре сферы взаимосвязей по горизонтали, четыре уровня по вертикали и 23 активности программы.';
      }

      const body = page.querySelector('.page-body');
      if (body) {
        body.innerHTML = `
          <figure class="maria-source">
            <div class="maria-source__head">
              <div>
                <strong>Исходная структура маршрутного листа</strong>
                <p>Без перестановки занятий и без дополнительной интерфейсной логики.</p>
              </div>
              <a href="matrix-source.svg" target="_blank" rel="noopener">Открыть крупно ↗</a>
            </div>
            <a class="maria-source__image" href="matrix-source.svg" target="_blank" rel="noopener" aria-label="Открыть маршрутный лист крупно">
              <img src="matrix-source.svg" alt="Маршрутный лист Миссия НИРМА — Конструктора будущего 2026">
            </a>
            <figcaption>
              Веб-копия повторяет исходный лист по расположению блоков, цветам, номерам, названиям занятий, отметочным квадратам и объединённым областям №15 и №23. Оригинальный PDF сохранён в архиве проекта под именем «Программа_квест_Конструктора_будущего.pdf».
            </figcaption>
          </figure>`;
      }
    }

    const aboutLead = document.querySelector('[data-page="about"] .page-heading .lead');
    if (aboutLead && /Мария предлагает/.test(aboutLead.textContent)) {
      aboutLead.textContent = '«Соэволюция» — портал целостного развития Русского космического общества. Направление объединяет программы через общую логику взаимосвязей, практики, творчества и исследования.';
    }
  });
})();
