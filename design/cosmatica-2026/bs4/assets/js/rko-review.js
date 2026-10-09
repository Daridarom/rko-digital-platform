/* Панель просмотра макета: переключает вариант оформления. В шаблоны сайта не переносится. */
(function () {
  'use strict';
  var root = document.documentElement;
  var current = root.getAttribute('data-design') === 'hybrid' ? 'hybrid' : 'sharp';

  var bar = document.createElement('div');
  bar.className = 'rko-review';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Панель просмотра макета');
  bar.innerHTML =
    '<span class="rko-review__label">Вариант</span>' +
    '<button type="button" data-design="sharp">Чёткий</button>' +
    '<button type="button" data-design="hybrid">Гибрид</button>' +
    '<a href="map.html">Карта макетов</a>';
  document.body.appendChild(bar);

  function apply(design) {
    current = design;
    if (design === 'hybrid') root.setAttribute('data-design', 'hybrid');
    else root.removeAttribute('data-design');
    try { localStorage.setItem('rko-design', design); } catch (e) { /* хранилище может быть недоступно */ }
    Array.prototype.forEach.call(bar.querySelectorAll('button'), function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-design') === design));
    });
  }
  bar.addEventListener('click', function (event) {
    var design = event.target.getAttribute && event.target.getAttribute('data-design');
    if (design) apply(design);
  });
  apply(current);
}());
