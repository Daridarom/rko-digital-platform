(() => {
  const params = new URLSearchParams(window.location.search);
  const theme = params.get('theme') || 'orbit';
  const themes = {
    orbit: { cls: 'theme-orbit', label: 'ОРБИТА · вариант A' },
    noosphere: { cls: 'theme-noosphere', label: 'НООСФЕРА · вариант B' },
    institute: { cls: 'theme-institute', label: 'КОСМИЧЕСКИЙ ИНСТИТУТ · вариант C' }
  };
  const selected = themes[theme] || themes.orbit;
  document.body.classList.remove('theme-orbit','theme-noosphere','theme-institute');
  document.body.classList.add(selected.cls);
  const badge = document.getElementById('prototypeBadge');
  if (badge) badge.textContent = selected.label;

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
