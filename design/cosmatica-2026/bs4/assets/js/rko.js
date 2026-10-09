/* Небольшие дополнения к Bootstrap 4.6.2. Работает через jQuery, который уже нужен Bootstrap. */
(function ($) {
  'use strict';

  // Фильтр карточек вкладками: <ul data-rko-filter="#grid"> + элементы с data-rko-item="ключ1|ключ2".
  $('[data-rko-filter]').each(function () {
    var $tabs = $(this);
    var $grid = $($tabs.data('rko-filter'));
    var $empty = $grid.nextAll('[data-rko-empty]').first();
    function apply(key) {
      var shown = 0;
      $grid.children('[data-rko-item]').each(function () {
        var match = key === 'all' || String($(this).data('rko-item')).split('|').indexOf(key) !== -1;
        $(this).toggleClass('d-none', !match);
        if (match) shown += 1;
      });
      $empty.toggleClass('d-none', shown > 0);
    }
    $tabs.on('click', '.nav-link', function (event) {
      event.preventDefault();
      $tabs.find('.nav-link').removeClass('active').removeAttr('aria-current');
      $(this).addClass('active').attr('aria-current', 'true');
      apply(String($(this).data('rko-key')));
      if (history.replaceState) history.replaceState(null, '', $(this).attr('href'));
    });
    // Переход по ссылке вида projects.html#completed — в том числе из меню на этой же странице.
    function fromHash() {
      var $link = $tabs.find('.nav-link[href="' + location.hash + '"]');
      if (location.hash && $link.length && !$link.hasClass('active')) $link.trigger('click');
    }
    $(window).on('hashchange', fromHash);
    fromHash();
  });

  // Вкладки, которые не помещаются по ширине: класс is-cut включает затухание у правого края.
  function markCutTabs() {
    $('.rko-tabs').each(function () {
      var cut = this.scrollWidth - this.clientWidth - this.scrollLeft > 4;
      $(this).toggleClass('is-cut', cut);
    });
  }
  $('.rko-tabs').on('scroll', markCutTabs);
  $(window).on('resize load', markCutTabs);
  markCutTabs();

  // Компьютер: при наведении на другой раздел закрываем меню, открытое щелчком по стрелке.
  $('.rko-nav .nav-item').on('mouseenter', function () {
    $('.rko-nav .nav-item').not(this).find('.dropdown-toggle[aria-expanded="true"]').dropdown('hide');
  });

  // Быстрый выбор суммы поддержки.
  $(document).on('click', '[data-rko-sum]', function () {
    var $form = $(this).closest('form');
    $form.find('input[type="number"]').val($(this).data('rko-sum')).trigger('focus');
    $form.find('[data-rko-sum]').removeClass('active');
    $(this).addClass('active');
  });

  // Подсветка текущего раздела в боковой навигации длинной страницы.
  if ($('body').hasClass('rko-scrollspy') && $('#organNav').length) {
    $('body').scrollspy({ target: '#organNav', offset: 120 });
  }

  // Макет: формы и ссылки на файлы ничего не отправляют и не скачивают.
  $(document).on('submit', 'form[data-rko-demo]', function (event) { event.preventDefault(); });
  $(document).on('click', 'a[data-rko-demo]', function (event) { event.preventDefault(); });
}(window.jQuery));
