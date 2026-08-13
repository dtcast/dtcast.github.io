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

const caseDeck = document.querySelector('[data-case-deck]');
const caseViewport = caseDeck?.querySelector('[data-case-viewport]');
const caseSlides = [...(caseDeck?.querySelectorAll('[data-case-slide]') || [])];
const caseButtons = [...(caseDeck?.querySelectorAll('[data-case-go]') || [])];
const casePrev = caseDeck?.querySelector('[data-case-prev]');
const caseNext = caseDeck?.querySelector('[data-case-next]');
const casePause = caseDeck?.querySelector('[data-case-pause]');
const caseCurrent = caseDeck?.querySelector('[data-case-current]');
const caseName = caseDeck?.querySelector('[data-case-name]');

if (caseDeck && caseViewport && caseSlides.length > 1) {
  const caseLabels = [
    '현대자동차그룹 · 글로벌 리뷰 인텔리전스 플랫폼',
    '㈜세스코 · 카카오톡 이미지 인증 캠페인 시스템',
    'Netnography.ai · 실시간 소셜 리스닝 플랫폼',
    'Band&Cast · 인플루언서 마케팅 운영 플랫폼',
    '㈜유닉스 · SNS 빅데이터 기반 드라이어 U&A 조사',
    '농협중앙회 · 스마트스토어 판매 현황 모니터링 도구',
  ];
  const turnDuration = 7000;
  const transitionDuration = 800;
  const casePauseReasons = new Set();
  let caseIndex = Math.max(0, caseSlides.findIndex((slide) => slide.classList.contains('is-active')));
  let caseTimer = null;
  let caseTransitionTimer = null;
  let caseInView = false;
  let caseTransitioning = false;
  let touchStartX = 0;
  let touchStartY = 0;

  const updateCaseHeight = (slide = caseSlides[caseIndex]) => {
    if (!slide) return;
    caseViewport.style.height = `${slide.offsetHeight}px`;
  };

  const shouldPauseCases = () => (
    reducedMotion || casePauseReasons.size > 0 || !caseInView || document.hidden
  );

  const updateCasePauseState = () => {
    const isPaused = shouldPauseCases();
    caseDeck.classList.toggle('is-paused', isPaused);
    casePause?.setAttribute('aria-pressed', String(casePauseReasons.has('manual')));
    const pauseLabel = casePause?.querySelector('span');
    if (pauseLabel) pauseLabel.textContent = casePauseReasons.has('manual') ? 'RESUME AUTO TURN' : 'PAUSE AUTO TURN';
  };

  const stopCaseTimer = () => {
    window.clearTimeout(caseTimer);
    caseTimer = null;
  };

  const startCaseTimer = () => {
    stopCaseTimer();
    updateCasePauseState();
    if (shouldPauseCases()) return;
    caseTimer = window.setTimeout(() => activateCase(caseIndex + 1, 'forward'), turnDuration);
  };

  const updateCaseControls = () => {
    caseButtons.forEach((button, index) => {
      const isActive = index === caseIndex;
      button.classList.remove('is-active');
      button.setAttribute('aria-selected', String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });
    const activeButton = caseButtons[caseIndex];
    if (activeButton) {
      void activeButton.offsetWidth;
      activeButton.classList.add('is-active');
    }
    if (caseCurrent) caseCurrent.textContent = String(caseIndex + 1).padStart(2, '0');
    if (caseName) caseName.textContent = caseLabels[caseIndex];
  };

  const activateCase = (nextIndex, direction = 'forward', { focus = false } = {}) => {
    if (caseTransitioning) return;
    const normalizedIndex = (nextIndex + caseSlides.length) % caseSlides.length;
    if (normalizedIndex === caseIndex) {
      startCaseTimer();
      return;
    }

    caseTransitioning = true;
    stopCaseTimer();
    window.clearTimeout(caseTransitionTimer);

    const currentSlide = caseSlides[caseIndex];
    const nextSlide = caseSlides[normalizedIndex];
    const outgoingClass = direction === 'backward' ? 'is-leaving-backward' : 'is-leaving-forward';
    const incomingClass = direction === 'backward' ? 'is-entering-backward' : 'is-entering-forward';
    const transitionHeight = Math.max(currentSlide.offsetHeight, nextSlide.offsetHeight);

    currentSlide.classList.remove('is-active');
    currentSlide.classList.add(outgoingClass);
    currentSlide.setAttribute('aria-hidden', 'true');
    currentSlide.setAttribute('inert', '');

    nextSlide.classList.remove('is-entering-forward', 'is-entering-backward');
    void nextSlide.offsetWidth;
    nextSlide.classList.add('is-active', incomingClass);
    nextSlide.setAttribute('aria-hidden', 'false');
    nextSlide.removeAttribute('inert');

    caseViewport.style.height = `${transitionHeight}px`;
    caseIndex = normalizedIndex;
    updateCaseControls();
    window.requestAnimationFrame(() => updateCaseHeight(nextSlide));

    if (focus) caseButtons[caseIndex]?.focus();

    caseTransitionTimer = window.setTimeout(() => {
      currentSlide.classList.remove('is-leaving-forward', 'is-leaving-backward');
      nextSlide.classList.remove('is-entering-forward', 'is-entering-backward');
      caseTransitioning = false;
      updateCaseHeight(nextSlide);
      startCaseTimer();
    }, reducedMotion ? 10 : transitionDuration);
  };

  caseSlides.forEach((slide, index) => {
    const isActive = index === caseIndex;
    slide.setAttribute('aria-hidden', String(!isActive));
    slide.toggleAttribute('inert', !isActive);
  });
  updateCaseControls();
  window.requestAnimationFrame(() => updateCaseHeight());

  caseButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      const direction = index < caseIndex ? 'backward' : 'forward';
      activateCase(index, direction);
    });
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Home') activateCase(0, 'backward', { focus: true });
      else if (event.key === 'End') activateCase(caseSlides.length - 1, 'forward', { focus: true });
      else if (event.key === 'ArrowLeft') activateCase(caseIndex - 1, 'backward', { focus: true });
      else activateCase(caseIndex + 1, 'forward', { focus: true });
    });
  });

  casePrev?.addEventListener('click', () => activateCase(caseIndex - 1, 'backward'));
  caseNext?.addEventListener('click', () => activateCase(caseIndex + 1, 'forward'));
  casePause?.addEventListener('click', () => {
    casePauseReasons.delete('focus');
    if (casePauseReasons.has('manual')) casePauseReasons.delete('manual');
    else casePauseReasons.add('manual');
    startCaseTimer();
  });

  caseDeck.addEventListener('keydown', (event) => {
    if (event.target.closest('[data-case-go]')) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      activateCase(caseIndex - 1, 'backward');
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      activateCase(caseIndex + 1, 'forward');
    }
  });

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    caseDeck.addEventListener('pointerenter', () => {
      casePauseReasons.add('pointer');
      stopCaseTimer();
      updateCasePauseState();
    });
    caseDeck.addEventListener('pointerleave', () => {
      casePauseReasons.delete('pointer');
      startCaseTimer();
    });
  }

  caseViewport.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });
  caseViewport.addEventListener('touchend', (event) => {
    const touch = event.changedTouches[0];
    const distanceX = touch.clientX - touchStartX;
    const distanceY = touch.clientY - touchStartY;
    if (Math.abs(distanceX) < 48 || Math.abs(distanceX) < Math.abs(distanceY) * 1.2) return;
    activateCase(caseIndex + (distanceX < 0 ? 1 : -1), distanceX < 0 ? 'forward' : 'backward');
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    const caseObserver = new IntersectionObserver(([entry]) => {
      caseInView = entry.isIntersecting;
      if (caseInView) startCaseTimer();
      else stopCaseTimer();
      updateCasePauseState();
    }, { threshold: .18 });
    caseObserver.observe(caseDeck);
  } else {
    caseInView = true;
    startCaseTimer();
  }

  if ('ResizeObserver' in window) {
    const caseResizeObserver = new ResizeObserver(() => updateCaseHeight());
    caseSlides.forEach((slide) => caseResizeObserver.observe(slide));
  } else {
    window.addEventListener('resize', () => updateCaseHeight(), { passive: true });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopCaseTimer();
    else startCaseTimer();
    updateCasePauseState();
  });
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
