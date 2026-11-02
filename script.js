/* =========================================================
   CKx Portfolio — script.js
   Vanilla JS: nav state, mobile menu, smooth scroll,
   active links, scroll reveal, wavy headline, skill hover letters, copy-to-clipboard.
   ========================================================= */

(function () {
  'use strict';

  // Lets CSS know JS is running (scroll-reveal starts hidden only then)
  document.documentElement.classList.add('js');

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduceMotion = motionQuery.matches;

  const header = document.getElementById('site-header');
  const navToggle = document.querySelector('.nav__toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = Array.from(document.querySelectorAll('.nav__link'));

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Nav: blurred background after scrolling ---------- */
  function updateHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  let headerTicking = false;
  window.addEventListener('scroll', function () {
    if (headerTicking) return;
    headerTicking = true;
    requestAnimationFrame(function () {
      updateHeader();
      headerTicking = false;
    });
  }, { passive: true });
  updateHeader();

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    navMenu.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  }

  navToggle.addEventListener('click', function () {
    setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
      setMenu(false);
      navToggle.focus();
    }
  });

  // Close the overlay if the window grows past the mobile breakpoint
  window.matchMedia('(min-width: 761px)').addEventListener('change', function (e) {
    if (e.matches) setMenu(false);
  });

  /* ---------- Smooth scrolling for in-page links ---------- */
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const id = link.getAttribute('href').slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;

    e.preventDefault();
    setMenu(false);

    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', '#' + id);

    // Move keyboard focus to the target without a second jump
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  /* ---------- Active nav link based on current section ---------- */
  const sectionIds = navLinks.map(function (a) { return a.getAttribute('href').slice(1); });
  const sections = sectionIds.map(function (id) { return document.getElementById(id); }).filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (a) {
      const active = a.getAttribute('href') === '#' + id;
      a.classList.toggle('is-active', active);
      if (active) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window) {
    // A section is "current" when it crosses the middle band of the viewport
    const sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { sectionObserver.observe(s); });

    // The footer is short, so also mark Contact when we hit the bottom of the page
    window.addEventListener('scroll', function () {
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) setActive('contact');
      else if (window.scrollY < window.innerHeight * 0.5) setActive('');
    }, { passive: true });
  }

  /* ---------- Fade / slide-in on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    const revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    // (Stagger delays for sibling cards live in style.css)
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Wavy "PORTFOLIO" headline ---------- */
  const wavePath = document.getElementById('wave-path');
  const waveTexts = document.querySelectorAll('.wave-text');
  const mainText = document.querySelector('.wave-text--main');
  const hero = document.getElementById('hero');

  // Sine wave: 3 full periods across the path so its length stays constant while it moves
  const WAVE = {
    x0: -600,
    x1: 1800,
    period: 800,
    amplitude: 30,
    baseline: 280,
    step: 6,
    speed: 0.00055 // radians per ms (~11s per cycle)
  };

  function buildWave(phase) {
    let d = '';
    for (let x = WAVE.x0; x <= WAVE.x1; x += WAVE.step) {
      const t = ((x - WAVE.x0) / WAVE.period) * Math.PI * 2;
      const y = WAVE.baseline - WAVE.amplitude * Math.sin(t + phase);
      d += (x === WAVE.x0 ? 'M' : 'L') + x + ' ' + y.toFixed(2) + ' ';
    }
    return d;
  }

  // Scale the word so it spans a fixed width of the viewBox regardless of font metrics
  function fitHeadline() {
    if (!mainText || typeof mainText.getComputedTextLength !== 'function') return;
    const targetLength = 1040; // viewBox units (viewBox width is 1200)
    const current = mainText.getComputedTextLength();
    if (!current) return;
    const size = parseFloat(mainText.getAttribute('font-size')) * (targetLength / current);
    waveTexts.forEach(function (t) { t.setAttribute('font-size', size.toFixed(1)); });
  }

  let phase = 0;
  let lastTime = 0;
  let rafId = null;
  let heroVisible = true;

  function frame(time) {
    if (lastTime) phase += (time - lastTime) * WAVE.speed;
    lastTime = time;
    wavePath.setAttribute('d', buildWave(phase));
    rafId = requestAnimationFrame(frame);
  }

  function startWave() {
    if (rafId || reduceMotion || !heroVisible || document.hidden) return;
    lastTime = 0;
    rafId = requestAnimationFrame(frame);
  }

  function stopWave() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (wavePath) {
    wavePath.setAttribute('d', buildWave(0)); // static wave (also the reduced-motion state)

    // Re-fit once web fonts have loaded, since the width depends on them
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitHeadline);
    } else {
      window.addEventListener('load', fitHeadline);
    }
    fitHeadline();

    // Only animate while the hero is on screen
    if ('IntersectionObserver' in window && hero) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        if (heroVisible) startWave(); else stopWave();
      }).observe(hero);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopWave(); else startWave();
    });

    startWave();
  }

  // React if the user toggles reduced motion while the page is open
  motionQuery.addEventListener('change', function (e) {
    reduceMotion = e.matches;
    if (reduceMotion) {
      stopWave();
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      startWave();
    }
  });

  /* ---------- Skills: split labels into letters for the hover roll ---------- */
  // Screen readers get the plain word; the per-letter copy is aria-hidden.
  document.querySelectorAll('.skill__text').forEach(function (el) {
    const text = el.textContent.trim();
    el.textContent = '';

    const label = document.createElement('span');
    label.className = 'visually-hidden';
    label.textContent = text;

    const letters = document.createElement('span');
    letters.className = 'skill__letters';
    letters.setAttribute('aria-hidden', 'true');

    Array.from(text).forEach(function (ch, i) {
      const c = document.createElement('span');
      c.className = 'skill__char';
      c.textContent = ch === ' ' ? '\u00a0' : ch;
      c.style.setProperty('--i', i); // drives the stagger delay in CSS
      letters.appendChild(c);
    });

    el.append(label, letters);
  });

  /* ---------- Experience: show the first 3 rows, toggle the rest ---------- */
  const XP_VISIBLE = 3; // how many rows show before "Show more"
  const xpList = document.getElementById('xp-list');
  const xpMore = document.querySelector('.xp-more');

  if (xpList && xpMore) {
    const rows = xpList.querySelectorAll('.xp');
    const extra = rows.length - XP_VISIBLE;

    if (extra > 0) {
      const label = xpMore.querySelector('.xp-more__label');
      const count = xpMore.querySelector('.xp-more__count');

      // Mark the hidden rows; --n staggers their fade-in in CSS
      Array.prototype.forEach.call(rows, function (row, i) {
        if (i >= XP_VISIBLE) {
          row.classList.add('is-extra');
          row.style.setProperty('--n', i - XP_VISIBLE);
        }
      });

      function setExpanded(open) {
        xpList.classList.toggle('is-collapsed', !open);
        xpMore.setAttribute('aria-expanded', String(open));
        label.textContent = open ? 'Show less' : 'Show more';
        count.textContent = open ? '' : '(+' + extra + ')';
      }

      setExpanded(false);
      xpMore.hidden = false;

      xpMore.addEventListener('click', function () {
        const open = xpMore.getAttribute('aria-expanded') !== 'true';
        setExpanded(open);
        // After collapsing, keep the button on screen
        if (!open) xpMore.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
      });
    }
  }

  /* ---------- Click-to-copy (Discord username) ---------- */
  const toast = document.getElementById('toast');
  let toastTimer = null;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 1800);
  }

  function fallbackCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.className = 'visually-hidden';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const text = btn.getAttribute('data-copy');
      const done = function () { showToast('Copied!'); };
      const fail = function () { showToast(fallbackCopy(text) ? 'Copied!' : 'Copy failed — ' + text); };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, fail);
      } else {
        fail();
      }
    });
  });
})();
