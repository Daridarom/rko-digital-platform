/* Панель просмотра макета: подпись и ссылка на карту макетов. В шаблоны сайта не переносится. */
(function () {
  'use strict';
  var bar = document.createElement('div');
  bar.className = 'rko-review';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Панель просмотра макета');
  bar.innerHTML = '<span class="rko-review__label">Макет cosmatica.org</span><a href="map.html">Карта макетов</a>';
  document.body.appendChild(bar);
}());
