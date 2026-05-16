/* ═══════════════════════════════════════════════════════
   MANGALAM HDPE PIPES — script.js
   1. Sticky product bar  (scrolls in past hero fold)
   2. Hero image mini-carousel  (thumbnails)
   3. Applications carousel  (arrow + touch/swipe)
   4. Carousel zoom preview  (follows cursor, custom cursor)
   5. Process tabs
   6. FAQ accordion
   7. Mobile nav toggle
   8. Form submit feedback
   9. Smooth anchor scroll with header offset
═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const qs  = (s, c = document) => c.querySelector(s);
  const qsa = (s, c = document) => [...c.querySelectorAll(s)];

  /* ══════════════════════════════════════════════
     1. STICKY PRODUCT BAR
     Appears when the user scrolls past the hero,
     hides when scrolled back to the top.
  ══════════════════════════════════════════════ */
  (function initStickyBar() {
    const bar  = qs('#stickyBar');
    const hero = qs('#hero');
    if (!bar || !hero) return;

    let ticking = false;

    function update() {
      const heroBottom = hero.getBoundingClientRect().bottom;
      if (heroBottom <= 0) {
        bar.classList.add('is-visible');
        bar.setAttribute('aria-hidden', 'false');
      } else {
        bar.classList.remove('is-visible');
        bar.setAttribute('aria-hidden', 'true');
      }
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
  })();

  /* ══════════════════════════════════════════════
     2. HERO IMAGE MINI-CAROUSEL  (thumbnails)
     Clicking a thumbnail swaps the main image.
  ══════════════════════════════════════════════ */
  (function initHeroCarousel() {
    const mainImg = qs('#heroActiveImg');
    const thumbs  = qsa('.hero__thumb');
    const prevBtn = qs('#heroPrev');
    const nextBtn = qs('#heroNext');
    if (!mainImg || !thumbs.length) return;

    const srcs = thumbs.map(t => qs('img', t).src.replace('w=80&h=60', 'w=700&h=520'));
    let current = 0;

    function go(idx) {
      current = (idx + srcs.length) % srcs.length;
      mainImg.src = srcs[current];
      thumbs.forEach((t, i) => t.classList.toggle('is-active', i === current));
    }

    thumbs.forEach((t, i) => t.addEventListener('click', () => go(i)));
    prevBtn?.addEventListener('click', () => go(current - 1));
    nextBtn?.addEventListener('click', () => go(current + 1));
  })();

  /* ══════════════════════════════════════════════
     3. APPLICATIONS CAROUSEL
     Arrow buttons, touch/swipe, responsive count.
  ══════════════════════════════════════════════ */
  (function initAppCarousel() {
    const track   = qs('#appTrack');
    const prev    = qs('#appPrev');
    const next    = qs('#appNext');
    if (!track) return;

    const slides = qsa('.app-slide', track);
    let idx = 0;

    function visible() {
      if (window.innerWidth <= 768)  return 1;
      if (window.innerWidth <= 1024) return 2;
      return 3;
    }
    function maxIdx() { return Math.max(0, slides.length - visible()); }

    function goTo(i) {
      idx = Math.max(0, Math.min(i, maxIdx()));
      const w   = slides[0].getBoundingClientRect().width;
      const gap = 16;
      track.style.transform = `translateX(-${idx * (w + gap)}px)`;
      if (prev) prev.disabled = idx === 0;
      if (next) next.disabled = idx >= maxIdx();
    }

    prev?.addEventListener('click', () => goTo(idx - 1));
    next?.addEventListener('click', () => goTo(idx + 1));

    // Touch/swipe
    let tx0 = 0;
    track.addEventListener('touchstart', e => { tx0 = e.changedTouches[0].clientX; }, { passive: true });
    track.addEventListener('touchend',   e => {
      const d = tx0 - e.changedTouches[0].clientX;
      if (Math.abs(d) > 40) goTo(d > 0 ? idx + 1 : idx - 1);
    }, { passive: true });

    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => goTo(Math.min(idx, maxIdx())), 150); });

    goTo(0);
  })();

  /* ══════════════════════════════════════════════
     4. ZOOM MAGNIFIER + CUSTOM CURSOR
     Hover over the hero product image →
       • custom zoom cursor appears at pointer
       • magnifier panel clips a 2.5× zoomed portion
         of the image centred on the cursor position
       • works for every carousel image automatically
  ══════════════════════════════════════════════ */
  (function initZoom() {
    const preview    = qs('#zoomPreview');
    const previewImg = qs('#zoomPreviewImg');
    const cursor     = qs('#zoomCursor');
    const heroWrap   = qs('#heroMainImg');
    const heroImg    = qs('#heroActiveImg');
    if (!preview || !previewImg || !cursor || !heroWrap || !heroImg) return;

    const ZOOM   = 2.5;   // magnification factor
    const PW     = 320;   // preview panel width  (matches CSS)
    const PH     = 240;   // preview panel height (matches CSS)
    const OFF_X  = 28;    // horizontal gap between cursor and panel
    let active = false;

    function show() {
      // Sync image src with whatever the carousel currently shows
      if (previewImg.src !== heroImg.src) previewImg.src = heroImg.src;
      preview.classList.add('is-visible');
      cursor.classList.add('is-visible');
      active = true;
    }

    function hide() {
      preview.classList.remove('is-visible');
      cursor.classList.remove('is-visible');
      active = false;
    }

    function update(mx, my) {
      // Keep in sync when carousel swaps the image mid-hover
      if (previewImg.src !== heroImg.src) previewImg.src = heroImg.src;

      // --- Position the floating panel near the cursor ---
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let left = mx + OFF_X;
      let top  = my - PH / 2;
      if (left + PW > vw - 16) left = mx - PW - OFF_X;
      if (left < 16)           left = 16;
      if (top + PH > vh - 16)  top  = vh - PH - 16;
      if (top  < 16)           top  = 16;
      preview.style.left = `${left}px`;
      preview.style.top  = `${top}px`;

      // Custom cursor dot follows mouse exactly
      cursor.style.left = `${mx}px`;
      cursor.style.top  = `${my}px`;

      // --- Pan the zoomed image inside the panel ---
      const rect = heroImg.getBoundingClientRect();
      // Cursor position relative to source image (0–1)
      const relX = Math.max(0, Math.min(1, (mx - rect.left) / rect.width));
      const relY = Math.max(0, Math.min(1, (my - rect.top)  / rect.height));

      // Zoomed image dimensions inside the panel
      const zW = PW * ZOOM;
      const zH = PH * ZOOM;

      // Translate so the cursor point is centred in the panel
      let ox = -(relX * zW - PW / 2);
      let oy = -(relY * zH - PH / 2);

      // Clamp: don't let blank space show at edges
      ox = Math.min(0, Math.max(PW - zW, ox));
      oy = Math.min(0, Math.max(PH - zH, oy));

      previewImg.style.width     = `${zW}px`;
      previewImg.style.height    = `${zH}px`;
      previewImg.style.transform = `translate(${ox}px, ${oy}px)`;
    }

    heroWrap.addEventListener('mouseenter', () => {
      heroWrap.style.cursor = 'none';
      show();
    });
    heroWrap.addEventListener('mouseleave', () => {
      heroWrap.style.cursor = '';
      hide();
    });

    document.addEventListener('mousemove', e => {
      if (active) update(e.clientX, e.clientY);
    });

    window.addEventListener('scroll', hide, { passive: true });
  })();

  /* ══════════════════════════════════════════════
     5. PROCESS TABS
  ══════════════════════════════════════════════ */
  (function initProcessTabs() {
    const tabs   = qsa('.process-tab');
    const panels = qsa('.process-panel');
    if (!tabs.length) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const key = tab.dataset.tab;
        tabs.forEach(t   => { t.classList.remove('is-active'); t.setAttribute('aria-selected','false'); });
        panels.forEach(p => p.classList.remove('is-active'));
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected','true');
        const panel = qs(`#tab-${key}`);
        if (panel) panel.classList.add('is-active');
      });
    });
  })();

  /* ══════════════════════════════════════════════
     6. FAQ ACCORDION
     One item open at a time.
  ══════════════════════════════════════════════ */
  (function initFaq() {
    qsa('.faq-item').forEach(item => {
      const btn = qs('.faq-item__q', item);
      if (!btn) return;
      btn.addEventListener('click', () => {
        const open = item.classList.contains('faq-item--open');
        // Close all
        qsa('.faq-item').forEach(it => {
          it.classList.remove('faq-item--open');
          qs('.faq-item__q', it)?.setAttribute('aria-expanded','false');
        });
        // Toggle clicked
        if (!open) {
          item.classList.add('faq-item--open');
          btn.setAttribute('aria-expanded','true');
        }
      });
    });
  })();

  /* ══════════════════════════════════════════════
     7. MOBILE NAV TOGGLE
  ══════════════════════════════════════════════ */
  (function initMobileNav() {
    const hbg = qs('#hamburger');
    const nav = qs('#mainNav');
    if (!hbg || !nav) return;

    hbg.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      hbg.classList.toggle('is-open', open);
      hbg.setAttribute('aria-expanded', String(open));
    });

    // Close on link click
    qsa('a', nav).forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      hbg.classList.remove('is-open');
      hbg.setAttribute('aria-expanded','false');
    }));

    // Close on outside click
    document.addEventListener('click', e => {
      if (!nav.contains(e.target) && !hbg.contains(e.target)) {
        nav.classList.remove('is-open');
        hbg.classList.remove('is-open');
        hbg.setAttribute('aria-expanded','false');
      }
    });

    // Products dropdown toggle on mobile
    const ddToggle = qs('.nav-dropdown__toggle');
    const ddMenu   = qs('.nav-dropdown__menu');
    if (ddToggle && ddMenu) {
      ddToggle.addEventListener('click', () => {
        const expanded = ddToggle.getAttribute('aria-expanded') === 'true';
        ddToggle.setAttribute('aria-expanded', String(!expanded));
        ddMenu.style.display = expanded ? 'none' : 'flex';
      });
    }
  })();

  /* ══════════════════════════════════════════════
     8. FORM SUBMIT FEEDBACK
  ══════════════════════════════════════════════ */
  (function initForms() {
    // CTA form
    const cta = qs('#ctaForm');
    if (cta) {
      cta.addEventListener('submit', e => {
        e.preventDefault();
        const btn = qs('button[type="submit"]', cta);
        btn.textContent = '✓ Request Sent!';
        btn.style.background = '#16a34a';
        btn.disabled = true;
        setTimeout(() => { btn.textContent = 'Request Custom Quote'; btn.style.background = ''; btn.disabled = false; }, 4000);
      });
    }
    // Catalogue form
    const cat = qs('#catalogueForm');
    if (cat) {
      cat.addEventListener('submit', e => {
        e.preventDefault();
        const btn = qs('button', cat);
        btn.textContent = '✓ Sent!';
        btn.disabled = true;
        setTimeout(() => { btn.textContent = 'Request Catalogue'; btn.disabled = false; }, 3000);
      });
    }
  })();

  /* ══════════════════════════════════════════════
     9. MODALS (Quote + Catalogue)
  ══════════════════════════════════════════════ */
  (function initModals() {
    const overlay        = qs('#modalOverlay');
    const quoteModal     = qs('#quoteModal');
    const catalogueModal = qs('#catalogueModal');
    if (!overlay) return;

    function openModal(modal) {
      // Hide all modals first
      [quoteModal, catalogueModal].forEach(m => { if (m) m.hidden = true; });
      modal.hidden = false;
      overlay.removeAttribute('aria-hidden');
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      // Focus first input
      const first = modal.querySelector('input');
      if (first) setTimeout(() => first.focus(), 50);
    }

    function closeModal() {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      // After animation, hide modal panels
      setTimeout(() => {
        [quoteModal, catalogueModal].forEach(m => { if (m) m.hidden = true; });
      }, 250);
    }

    // Open on data-modal buttons
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-modal]');
      if (!btn) return;
      const target = btn.dataset.modal === 'quote' ? quoteModal : catalogueModal;
      if (target) { e.preventDefault(); openModal(target); }
    });

    // Close on × buttons
    qs('#quoteModalClose')?.addEventListener('click', closeModal);
    qs('#catalogueModalClose')?.addEventListener('click', closeModal);

    // Close on overlay click (outside modal)
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal();
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
    });

    // Form submit feedback
    qs('#quoteModalForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const btn = e.currentTarget.querySelector('[type="submit"]');
      btn.textContent = '✓ Request Sent!';
      btn.style.background = '#16a34a';
      btn.disabled = true;
      setTimeout(() => {
        closeModal();
        btn.textContent = 'Submit Form';
        btn.style.background = '';
        btn.disabled = false;
        e.currentTarget.reset();
      }, 1800);
    });

    qs('#catalogueModalForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const btn = e.currentTarget.querySelector('[type="submit"]');
      btn.textContent = '✓ Sent!';
      btn.style.background = '#16a34a';
      btn.disabled = true;
      setTimeout(() => {
        closeModal();
        btn.textContent = 'Submit Request';
        btn.style.background = '';
        btn.disabled = false;
        e.currentTarget.reset();
      }, 1800);
    });
  })();

  /* ══════════════════════════════════════════════
     10. SMOOTH ANCHOR SCROLL (with header offset)
  ══════════════════════════════════════════════ */
  (function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const id = link.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const headerH = (qs('.site-header') || {}).offsetHeight || 70;
        const top = target.getBoundingClientRect().top + window.scrollY - headerH - 12;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  })();

})();
