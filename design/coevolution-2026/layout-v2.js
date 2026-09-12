(() => {
  'use strict';
  const ready = fn => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();
  ready(() => {
    const exactSourceImage = 'maria-matrix-original.webp?v=20260912-1648';

    // Главная: показываем тот же исходный лист Марии без перерисовки.
    const orbit = document.querySelector('[data-page="home"] .orbit-wrap');
    if (orbit) {
      orbit.innerHTML = `
        <a class="hero-source-card" href="#/matrix" aria-label="Открыть исходный маршрутный лист НИРМЫ">
          <div class="hero-source-head">
            <div><small>Маршрутный лист НИРМЫ</small><strong>Исходная схема программы</strong></div>
            <span>Открыть ↗</span>
          </div>
          <img src="${exactSourceImage}" alt="Исходный маршрутный лист Миссия НИРМА — Конструктора будущего 2026">
        </a>`;
    }

    // НИРМА: аккуратный перенос названия.
    document.querySelectorAll('.program-feature .art-type').forEach(el => {
      if (el.textContent.replace(/\s+/g,' ').trim().toLowerCase().includes('конструк')) {
        el.innerHTML = '<span class="program-kicker">Конструкторы</span><span class="program-future">будущего</span>';
      }
    });

    // Страница матрицы: только исходный лист. Никаких реконструкций, фильтров и второй матрицы.
    const page = document.querySelector('[data-page="matrix"]');
    if (page) {
      const heading = page.querySelector('.page-heading');
      if (heading) {
        const eyebrow = heading.querySelector('.eyebrow');
        const h1 = heading.querySelector('h1');
        const lead = heading.querySelector('.lead');
        if (eyebrow) eyebrow.textContent = 'Маршрутный лист «Миссия НИРМА» · Конструктора будущего 2026';
        if (h1) h1.innerHTML = 'Матрица <span class="red">4 × 4.</span>';
        if (lead) lead.textContent = 'На странице показан исходный маршрутный лист без переработки его структуры и расположения элементов.';
      }

      const body = page.querySelector('.page-body');
      if (body) {
        body.innerHTML = `
          <figure class="maria-source">
            <div class="maria-source__head">
              <div>
                <strong>Исходный маршрутный лист</strong>
                <p>Показана первая страница исходного файла в том виде, в котором она была предоставлена. Для чтения мелких подписей откройте изображение крупно.</p>
              </div>
              <a href="${exactSourceImage}" target="_blank" rel="noopener">Открыть крупно ↗</a>
            </div>
            <a class="maria-source__image" href="${exactSourceImage}" target="_blank" rel="noopener" aria-label="Открыть исходный маршрутный лист крупно">
              <img src="${exactSourceImage}" alt="Исходный маршрутный лист Миссия НИРМА — Конструктора будущего 2026">
            </a>
            <figcaption>На сайте больше не используется перерисованная SVG-версия как источник. Оригинальный PDF сохранён отдельно в архиве проекта для сверки.</figcaption>
          </figure>`;
      }
    }

    const aboutLead = document.querySelector('[data-page="about"] .page-heading .lead');
    if (aboutLead && /Мария предлагает/.test(aboutLead.textContent)) {
      aboutLead.textContent = '«Соэволюция» — портал целостного развития Русского космического общества. Направление объединяет программы через общую логику взаимосвязей, практики, творчества и исследования.';
    }
  });
})();
