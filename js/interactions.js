/**
 * interactions.js
 * - 3D card tilt on mouse move (normal mode only)
 * - Scroll-triggered card entrance animation
 */
(function () {
  'use strict';

  /* ── 1. Scroll Reveal ──────────────────────────────────── */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Stagger delay based on card position in grid
          const cards = Array.from(entry.target.parentElement?.children || []);
          const idx = cards.indexOf(entry.target);
          const delay = Math.min(idx % 4, 3) * 60; // 0, 60, 120, 180ms max
          entry.target.style.transitionDelay = delay + 'ms';
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.06, rootMargin: '0px 0px -24px 0px' }
  );

  function observeNewCards() {
    document.querySelectorAll('.moment-card:not([data-rv])').forEach((card) => {
      card.dataset.rv = '1';
      revealObserver.observe(card);
    });
  }

  // Watch for cards added dynamically by app JS
  const domObserver = new MutationObserver(observeNewCards);
  domObserver.observe(document.body, { childList: true, subtree: true });
  observeNewCards();


  /* ── 2. 3D Tilt on Hover ──────────────────────────────── */
  let activeCard = null;
  let rafId = null;
  let targetRx = 0, targetRy = 0;
  let currentRx = 0, currentRy = 0;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animateTilt() {
    currentRx = lerp(currentRx, targetRx, 0.12);
    currentRy = lerp(currentRy, targetRy, 0.12);

    if (activeCard) {
      activeCard.style.transform =
        `perspective(900px) rotateX(${currentRx}deg) rotateY(${currentRy}deg) translateZ(3px)`;
    }

    const settled =
      Math.abs(currentRx - targetRx) < 0.01 &&
      Math.abs(currentRy - targetRy) < 0.01;

    if (!settled) {
      rafId = requestAnimationFrame(animateTilt);
    } else {
      rafId = null;
    }
  }

  function startLoop() {
    if (!rafId) rafId = requestAnimationFrame(animateTilt);
  }

  document.addEventListener('mousemove', (e) => {
    // Skip in minimal mode
    if (document.documentElement.dataset.minimal === '1') return;

    const card = e.target.closest('.moment-card');
    if (card !== activeCard) {
      if (activeCard) resetCard(activeCard);
      activeCard = card;
    }
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // Featured card: subtle tilt; regular: normal tilt
    const isFirst = card === card.parentElement?.firstElementChild;
    const xMag = isFirst ? 5 : 7;
    const yMag = isFirst ? 3 : 5;

    targetRy = x * xMag;
    targetRx = -y * yMag;
    startLoop();
  });

  function resetCard(card) {
    targetRx = 0;
    targetRy = 0;
    startLoop();

    // After spring settles, clear inline transform so CSS hover takes over
    setTimeout(() => {
      if (card !== activeCard) {
        card.style.transform = '';
        card.style.transitionDelay = '';
      }
    }, 400);
  }

  document.addEventListener('mouseleave', (e) => {
    if (e.target === document.documentElement) {
      if (activeCard) resetCard(activeCard);
      activeCard = null;
    }
  });

  document.addEventListener('mouseover', (e) => {
    if (!e.target.closest('.moment-card') && activeCard) {
      resetCard(activeCard);
      activeCard = null;
    }
  });

})();
