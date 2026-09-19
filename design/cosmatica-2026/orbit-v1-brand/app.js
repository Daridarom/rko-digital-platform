(() => {
  const badge = document.getElementById('prototypeBadge');
  if (badge) badge.textContent = 'ОРБИТА V1 · ФИРМЕННЫЙ СТИЛЬ';

  const menu = document.getElementById('mainNav');
  const toggle = document.querySelector('.menu-toggle');
  if (menu && toggle) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Закрыть' : 'Меню';
    });
  }
})();
