(() => {
  const menuButton = document.querySelector('.menu-button');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.textContent = open ? 'Закрыть' : 'Меню';
    });
    mobileMenu.addEventListener('click', e => {
      if (e.target.closest('a')) {
        mobileMenu.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.textContent = 'Меню';
      }
    });
  }

  const dialog = document.getElementById('searchDialog');
  document.querySelector('[data-open-search]')?.addEventListener('click', () => {
    dialog?.showModal();
    setTimeout(() => dialog?.querySelector('input')?.focus(), 30);
  });
  document.querySelector('[data-close-search]')?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      dialog?.showModal();
      setTimeout(() => dialog?.querySelector('input')?.focus(), 30);
    }
  });

  const progress = document.getElementById('pageProgress');
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = `${max > 0 ? Math.min(100, Math.max(0, scrollY / max * 100)) : 0}%`;
  };
  addEventListener('scroll', updateProgress, { passive: true });
  addEventListener('resize', updateProgress);
  updateProgress();

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer:fine)');
  const scene = document.querySelector('[data-parallax]');
  if (scene && !reduceMotion.matches && finePointer.matches) {
    scene.addEventListener('pointermove', e => {
      const r = scene.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - .5) * 10;
      const y = ((e.clientY - r.top) / r.height - .5) * 10;
      scene.style.setProperty('--px', `${x}px`);
      scene.style.setProperty('--py', `${y}px`);
    });
    scene.addEventListener('pointerleave', () => {
      scene.style.setProperty('--px', '0px');
      scene.style.setProperty('--py', '0px');
    });
  }

  const reveals = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08, rootMargin: '0px 0px -30px 0px' });
    reveals.forEach(el => observer.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('visible'));
  }
})();
