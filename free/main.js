(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Year
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  // Phone menu
  const toggle = $('[data-nav-toggle]');
  const nav = $('#nav');
  if (toggle && nav) {
    const setOpen = (open) => { toggle.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open); };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  // Header: hide on scroll down, show on scroll up
  const header = $('[data-header]');
  let lastY = window.scrollY;

  // Split the big statement into words for the scroll-lit effect
  const statement = $('[data-words]');
  let words = [];
  if (statement && !reduce) {
    statement.innerHTML = statement.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
    words = $$('.w', statement);
  }

  const parallax = reduce ? [] : $$('[data-parallax]');

  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle('is-scrolled', y > 10);
      const navOpen = nav && nav.classList.contains('is-open');
      header.classList.toggle('is-hidden', !navOpen && y > lastY && y > 400);
    }
    lastY = y;

    const vh = window.innerHeight;
    parallax.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const speed = parseFloat(el.dataset.parallax) || 0;
      const offset = (r.top + r.height / 2 - vh / 2) * speed * -1;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });

    if (words.length) {
      const r = statement.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      const lit = Math.round(progress * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < lit));
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Reveal on scroll, with a small stagger for siblings
  const revealEls = $$('.reveal, .reveal-clip');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const sibs = [...el.parentElement.children].filter((c) => c.matches('.reveal, .reveal-clip'));
        el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 5) * 0.08}s`);
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  }

  // Menu tabs + search
  const menu = $('#menu');
  if (menu) {
    const tabs = $$('[role="tab"]', menu);
    const panels = $$('[role="tabpanel"]', menu);
    const search = $('[data-menu-search]', menu);
    const empty = $('[data-menu-empty]', menu);

    const animatePanel = (panel) => {
      if (reduce) return;
      $$('li', panel).forEach((li, i) => li.style.setProperty('--i', Math.min(i, 30)));
      panel.classList.remove('is-entering');
      void panel.offsetWidth;
      panel.classList.add('is-entering');
    };

    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach((p) => { p.hidden = p.id !== tab.getAttribute('aria-controls'); });
      if (focus) tab.focus();
      animatePanel($('#' + tab.getAttribute('aria-controls')));
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => {
        if (search && search.value) { search.value = ''; runSearch(); }
        select(tab);
      });
      tab.addEventListener('keydown', (e) => {
        const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        select(tabs[(i + step + tabs.length) % tabs.length], true);
      });
    });

    const runSearch = () => {
      const q = (search.value || '').trim().toLowerCase();
      menu.classList.toggle('is-searching', !!q);
      if (!q) {
        $$('li', menu).forEach((li) => { li.hidden = false; });
        empty.hidden = true;
        select(tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0]);
        return;
      }
      let total = 0;
      panels.forEach((p) => {
        let n = 0;
        $$('li', p).forEach((li) => {
          const hit = li.querySelector('.item-name').textContent.toLowerCase().includes(q);
          li.hidden = !hit;
          if (hit) n++;
        });
        p.hidden = n === 0;
        total += n;
      });
      empty.hidden = total > 0;
    };
    if (search) search.addEventListener('input', runSearch);
  }

  // Magnetic button (pointer devices only)
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }
})();
