(() => {
  const themes = {
    orbit: { cls: 'theme-orbit', label: 'ОРБИТА · вариант A', color: '#f6f6f2' },
    noosphere: { cls: 'theme-noosphere', label: 'НООСФЕРА · вариант B', color: '#050711' },
    institute: { cls: 'theme-institute', label: 'КОСМИЧЕСКИЙ ИНСТИТУТ · вариант C', color: '#f1ede3' },
    synthesis: { cls: 'theme-synthesis', label: 'СИНТЕЗ · вариант D', color: '#080a2e' }
  };
  const params = new URLSearchParams(location.search);
  let theme = params.get('theme') || localStorage.getItem('cosmatica-theme') || 'synthesis';
  if (!themes[theme]) theme = 'synthesis';

  const applyTheme = (name, updateUrl = true) => {
    const selected = themes[name] || themes.synthesis;
    document.body.classList.remove('theme-orbit','theme-noosphere','theme-institute','theme-synthesis');
    document.body.classList.add(selected.cls);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', selected.color);
    const badge = document.getElementById('prototypeBadge');
    if (badge) badge.textContent = selected.label;
    document.querySelectorAll('[data-theme]').forEach(btn => {
      const active = btn.dataset.theme === name;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    localStorage.setItem('cosmatica-theme', name);
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set('theme', name);
      history.replaceState({}, '', url);
    }
  };
  applyTheme(theme, false);

  document.querySelectorAll('[data-theme]').forEach(btn => btn.addEventListener('click', () => applyTheme(btn.dataset.theme)));

  const menu = document.getElementById('mainNav');
  const toggle = document.querySelector('.menu-toggle');
  if (menu && toggle) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Закрыть' : 'Меню';
    });
    menu.addEventListener('click', e => {
      if (e.target.closest('a') && innerWidth <= 760) {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded','false');
        toggle.textContent = 'Меню';
      }
    });
  }

  const palette = document.getElementById('commandPalette');
  const openPalette = () => {
    if (!palette) return;
    palette.showModal();
    setTimeout(() => palette.querySelector('input')?.focus(), 20);
  };
  document.querySelectorAll('[data-open-palette]').forEach(btn => btn.addEventListener('click', openPalette));
  document.querySelectorAll('[data-close-palette]').forEach(btn => btn.addEventListener('click', () => palette?.close()));
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
    if (e.key === 'Escape' && palette?.open) palette.close();
  });
  palette?.addEventListener('click', e => { if (e.target === palette) palette.close(); });

  const progress = document.getElementById('scrollProgress');
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const value = max > 0 ? (scrollY / max) * 100 : 0;
    if (progress) progress.style.width = `${Math.min(100, Math.max(0, value))}%`;
  };
  addEventListener('scroll', updateProgress, { passive: true });
  addEventListener('resize', updateProgress);
  updateProgress();
})();
