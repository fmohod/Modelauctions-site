/* Model Auctions — 0003/slides.js
   The scene walk-through, as an enhancement only (the same pattern as the first
   Houston Yogis article). The page is complete without this file: the scenes
   stack, the dots are real links, and the film scene links to the Media page,
   which is where video plays. This article plays nothing itself. What this
   adds: the entrance and the current-scene dot, a slow drift on the logo mark
   and the opening photograph, and left/right arrow keys. */
(function () {
  'use strict';

  var scenes = [].slice.call(document.querySelectorAll('[data-scene]'));
  var dots   = [].slice.call(document.querySelectorAll('.scene-dots a'));
  var motion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var active = -1;

  function reduced() { return !!(motion && motion.matches); }


  /* ── entrance, and which scene is current ──────────────── */
  function setActive(i) {
    if (i < 0 || i === active) return;
    active = i;
    dots.forEach(function (d, n) {
      if (n === i) { d.setAttribute('aria-current', 'true'); } else { d.removeAttribute('aria-current'); }
    });
  }

  if ('IntersectionObserver' in window) {
    var entering = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); entering.unobserve(e.target); }
      });
    }, { threshold: 0.2 });

    var current = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { setActive(scenes.indexOf(e.target)); } });
    }, { rootMargin: '-45% 0px -45% 0px' });          // the scene crossing the middle of the screen

    scenes.forEach(function (s) { entering.observe(s); current.observe(s); });
  } else {
    scenes.forEach(function (s) { s.classList.add('is-in'); });
  }


  /* ── a slow drift (--p is read by slides.css) ──────────── */
  var pending = false;

  function drift() {
    pending = false;
    var vh = window.innerHeight || 800;
    scenes.forEach(function (s) {
      var r = s.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) { return; }
      var p = (r.top + r.height / 2 - vh / 2) / vh;     // 0 when the scene is centered
      s.style.setProperty('--p', Math.max(-1, Math.min(1, p)).toFixed(3));
    });
  }
  function queue() {
    if (!pending && !reduced()) { pending = true; window.requestAnimationFrame(drift); }
  }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  queue();


  /* ── left / right arrow: previous and next scene ───────── */
  function go(i) {
    i = Math.max(0, Math.min(scenes.length - 1, i));
    var s = scenes[i];
    s.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    // Move the keyboard's place with the screen, as the scene dots (real fragment links) already do.
    s.setAttribute('tabindex', '-1');
    s.focus({ preventScroll: true });
  }

  document.addEventListener('keydown', function (ev) {
    if (ev.defaultPrevented || ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey) { return; }
    var dir = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) { return; }
    var t = ev.target, tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) { return; }
    ev.preventDefault();
    go(active + dir);
  });
})();
