const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu-button]');
const nav = document.querySelector('[data-nav]');
const cursor = document.querySelector('.cursor-dot');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const updateHeader = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 24);
};

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? '메뉴 열기' : '메뉴 닫기');
  nav?.classList.toggle('is-open', !isOpen);
  document.body.style.overflow = isOpen ? '' : 'hidden';
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', '메뉴 열기');
    nav.classList.remove('is-open');
    document.body.style.overflow = '';
  });
});

const revealItems = document.querySelectorAll('.reveal');
if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.13, rootMargin: '0px 0px -6% 0px' });

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
    revealObserver.observe(item);
  });
}

const counters = document.querySelectorAll('[data-count]');
if (!reducedMotion && 'IntersectionObserver' in window) {
  const countObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const node = entry.target;
      const target = Number(node.dataset.count);
      const start = performance.now();
      const duration = 1100;
      const tick = (time) => {
        const progress = Math.min((time - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        node.textContent = Math.round(target * eased).toLocaleString('ko-KR');
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      observer.unobserve(node);
    });
  }, { threshold: .6 });
  counters.forEach((counter) => countObserver.observe(counter));
}

const patentSection = document.querySelector('.technology');
const patentTabs = [...document.querySelectorAll('[data-patent-tab]')];
const patentPanels = [...document.querySelectorAll('[data-patent-panel]')];

if (patentSection && patentTabs.length > 1 && patentPanels.length) {
  const patentInteractiveAreas = [
    patentSection.querySelector('.ip-register'),
    patentSection.querySelector('.ip-labs'),
  ].filter(Boolean);
  let patentIndex = Math.max(0, patentTabs.findIndex((tab) => tab.classList.contains('is-active')));
  let patentTimer = null;
  let patentInView = false;
  let patentPaused = false;
  const patentPauseReasons = new Set();

  const updatePatentPauseState = () => {
    patentSection.classList.toggle(
      'is-patent-paused',
      reducedMotion || patentPaused || !patentInView || document.hidden,
    );
  };

  const stopPatentTimer = () => {
    window.clearInterval(patentTimer);
    patentTimer = null;
  };

  const startPatentTimer = () => {
    stopPatentTimer();
    updatePatentPauseState();
    if (reducedMotion || patentPaused || !patentInView || document.hidden) return;
    patentTimer = window.setInterval(() => {
      activatePatent(patentIndex + 1);
    }, 5000);
  };

  const activatePatent = (nextIndex, { focus = false } = {}) => {
    patentIndex = (nextIndex + patentTabs.length) % patentTabs.length;
    const activeTab = patentTabs[patentIndex];
    const patentKey = activeTab.dataset.patentTab;

    patentTabs.forEach((tab, index) => {
      tab.classList.remove('is-active');
      const isActive = index === patentIndex;
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });

    // Reflow restarts the five-second progress indicator for the selected patent.
    void activeTab.offsetWidth;
    activeTab.classList.add('is-active');

    patentPanels.forEach((panel) => {
      const isActive = panel.dataset.patentPanel === patentKey;
      panel.classList.toggle('is-active', isActive);
      panel.setAttribute('aria-hidden', String(!isActive));
    });

    if (focus) activeTab.focus();
  };

  patentTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      activatePatent(index);
      startPatentTimer();
    });

    tab.addEventListener('keydown', (event) => {
      const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();

      let nextIndex = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = index + 1;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = index - 1;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = patentTabs.length - 1;
      activatePatent(nextIndex, { focus: true });
      startPatentTimer();
    });
  });

  const setPatentPaused = (reason, isPaused) => {
    if (isPaused) patentPauseReasons.add(reason);
    else patentPauseReasons.delete(reason);
    patentPaused = patentPauseReasons.size > 0;
    if (patentPaused) stopPatentTimer();
    else startPatentTimer();
    updatePatentPauseState();
  };

  patentInteractiveAreas.forEach((area, index) => {
    const pointerReason = `pointer-${index}`;
    const focusReason = `focus-${index}`;
    area.addEventListener('pointerenter', () => setPatentPaused(pointerReason, true));
    area.addEventListener('pointerleave', () => setPatentPaused(pointerReason, false));
    area.addEventListener('focusin', () => setPatentPaused(focusReason, true));
    area.addEventListener('focusout', (event) => {
      if (!area.contains(event.relatedTarget)) setPatentPaused(focusReason, false);
    });
  });

  if ('IntersectionObserver' in window) {
    const patentObserver = new IntersectionObserver(([entry]) => {
      const wasInView = patentInView;
      patentInView = entry.isIntersecting;
      if (patentInView && !wasInView) activatePatent(patentIndex);
      if (patentInView) startPatentTimer();
      else stopPatentTimer();
      updatePatentPauseState();
    }, { threshold: .2 });
    patentObserver.observe(patentSection);
  } else {
    patentInView = true;
    startPatentTimer();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopPatentTimer();
    else startPatentTimer();
    updatePatentPauseState();
  });

  updatePatentPauseState();
}

if (cursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  window.addEventListener('pointermove', (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
    cursor.classList.add('is-visible');
  }, { passive: true });

  document.querySelectorAll('a, button, .capability-card').forEach((target) => {
    target.addEventListener('pointerenter', () => cursor.classList.add('is-active'));
    target.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
  });
}

document.querySelector('[data-year]').textContent = new Date().getFullYear();
