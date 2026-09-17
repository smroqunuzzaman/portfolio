// Smooth Scroll Navigation & Observer Logic
document.addEventListener('DOMContentLoaded', () => {
  initScrollRestoration();
  initPortfolioLoader();
  initHeroTypewriter();
  initDynamicInfoIsland();
  initThemeToggle();
  initSwipeLettersButtons();
  initScrollNav();
  initMobileMenu();
  initNoirCompanion();
  initCustomCursor();
  initSelectedCarousel();
  initAboutScrollScrub();
  initKineticScrollStrip();
  initCollabCanvasHeadline();
  initFooterShutterReveal();
});

/* ==========================================================================
   THEME TOGGLE SYSTEM (DARK / LIGHT MODE)
   ========================================================================== */
function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggle');
  const fixture = document.getElementById('bulbDiscFixture') || toggleBtn?.querySelector('.bulb-disc-fixture');
  const chain = document.getElementById('bulbPullChain') || toggleBtn?.querySelector('.bulb-pull-chain');
  const chainPath = document.getElementById('chainSpringPath');
  const chainBead = document.getElementById('chainBead');

  if (!toggleBtn) return;

  function updateToggleAria(theme) {
    const isLight = theme === 'light';
    toggleBtn.setAttribute('aria-checked', isLight ? 'true' : 'false');
    toggleBtn.setAttribute('title', isLight ? 'Turn off the lights (Switch to Dark Mode)' : 'Turn on the lights (Switch to Light Mode)');
  }

  function toggleCurrentTheme() {
    const isCurrentlyLight = document.documentElement.getAttribute('data-theme') === 'light';
    const nextTheme = isCurrentlyLight ? 'dark' : 'light';

    if (nextTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    try {
      localStorage.setItem('theme', nextTheme);
    } catch (e) {}

    updateToggleAria(nextTheme);

    if (navigator.vibrate) {
      try { navigator.vibrate(40); } catch (e) {}
    }
  }

  // Fallback for simple button if fixture or chain elements are not present
  if (!fixture || !chain || !chainPath || !chainBead) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleCurrentTheme();
    });
    return;
  }

  // Initial check
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  updateToggleAria(currentTheme);

  // String Resting Dimensions (SVG viewBox 0 0 40 50, Center X = 20)
  const SVG_CX = 20;
  const REST_LENGTH = 16; // Rest length in pixels
  let currentY = 0;
  let currentX = 0;
  let targetY = 0;
  let targetX = 0;
  let velY = 0;
  let velX = 0;
  let isDragging = false;
  let startPointerY = 0;
  let startPointerX = 0;
  let dragDisplacementY = 0;
  let dragDisplacementX = 0;
  let springRafId = null;

  // Render current position of SVG string & bead strictly anchored to bottom tangent of circular disc
  function renderString(x, y) {
    const endX = SVG_CX + x;
    const endY = REST_LENGTH + y;

    // Smooth subtle curvature during drag or oscillation
    const ctrlX = SVG_CX + x * 0.45;
    const ctrlY = (REST_LENGTH + y) * 0.5;
    // Cord start coordinate is permanently locked to (SVG_CX, 0) right at circle's bottom rim
    chainPath.setAttribute('d', `M ${SVG_CX} 0 Q ${ctrlX.toFixed(2)} ${ctrlY.toFixed(2)} ${endX.toFixed(2)} ${endY.toFixed(2)}`);

    // Position bead at the end of the string
    chainBead.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
  }

  // Framer Spring Physics Simulation (Damped Harmonic Oscillator: Stiffness 320, Damping 22, Mass 1)
  const STIFFNESS = 320;
  const DAMPING = 22;
  const MASS = 1;
  let lastTime = 0;

  function runSpringPhysics(now) {
    if (!lastTime) lastTime = now;
    const dt = Math.min((now - lastTime) / 1000, 0.032); // clamp dt to max 32ms
    lastTime = now;

    // Spring forces: F = -k * (pos - target) - c * vel
    const forceY = -STIFFNESS * (currentY - targetY) - DAMPING * velY;
    const accelY = forceY / MASS;
    velY += accelY * dt;
    currentY += velY * dt;

    const forceX = -STIFFNESS * (currentX - targetX) - DAMPING * velX;
    const accelX = forceX / MASS;
    velX += accelX * dt;
    currentX += velX * dt;

    renderString(currentX, currentY);

    // Check if settled
    const isSettled =
      Math.abs(currentY - targetY) < 0.05 &&
      Math.abs(velY) < 0.05 &&
      Math.abs(currentX - targetX) < 0.05 &&
      Math.abs(velX) < 0.05;

    if (!isSettled && !isDragging) {
      springRafId = requestAnimationFrame(runSpringPhysics);
    } else if (isSettled && !isDragging) {
      currentY = targetY;
      currentX = targetX;
      velY = 0;
      velX = 0;
      renderString(0, 0);
      springRafId = null;
      lastTime = 0;
    }
  }

  function startSpring() {
    if (springRafId) cancelAnimationFrame(springRafId);
    lastTime = performance.now();
    targetX = 0;
    targetY = 0;
    springRafId = requestAnimationFrame(runSpringPhysics);
  }

  // MODE CHANGE TRIGGER 1: Direct Click on the Inside Circular Fixture Disc
  fixture.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCurrentTheme();
    // Physical spring impulse bounce on click
    currentY = 16;
    currentX = (Math.random() - 0.5) * 3;
    velY = 130;
    velX = 0;
    startSpring();
  });

  // MODE CHANGE TRIGGER 2: Pulling the Hanging Cord Fully Downwards
  chain.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging = true;
    startPointerX = e.clientX;
    startPointerY = e.clientY;
    dragDisplacementX = 0;
    dragDisplacementY = 0;
    if (springRafId) cancelAnimationFrame(springRafId);
    try { chain.setPointerCapture(e.pointerId); } catch (err) {}
  });

  chain.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const rawDx = e.clientX - startPointerX;
    const rawDy = e.clientY - startPointerY;

    // Elastic rubber-band resistance formula (matching Framer dragElastic behavior)
    const positiveDy = Math.max(0, rawDy);
    dragDisplacementY = (positiveDy * 0.55) / (1 + positiveDy * 0.008);
    dragDisplacementX = (rawDx * 0.35) / (1 + Math.abs(rawDx) * 0.01);

    currentX = dragDisplacementX;
    currentY = dragDisplacementY;
    renderString(currentX, currentY);
  });

  function handleChainPointerEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    try { chain.releasePointerCapture(e.pointerId); } catch (err) {}

    const FULL_PULL_THRESHOLD = 20; // Full pull threshold in pixels
    if (dragDisplacementY >= FULL_PULL_THRESHOLD) {
      // Trigger mode change only on full pull
      toggleCurrentTheme();
      velY = -120;
    } else {
      // Small drag or tap on chain/bead releases without mode change
      velY = -dragDisplacementY * 6;
    }

    velX = -dragDisplacementX * 6;
    startSpring();
  }

  chain.addEventListener('pointerup', handleChainPointerEnd);
  chain.addEventListener('pointercancel', handleChainPointerEnd);

  // System color scheme change
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      try {
        if (!localStorage.getItem('theme')) {
          const sysTheme = e.matches ? 'light' : 'dark';
          if (sysTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
          } else {
            document.documentElement.removeAttribute('data-theme');
          }
          updateToggleAria(sysTheme);
        }
      } catch (err) {}
    });
  }

  // Initial render
  renderString(0, 0);
}

/* ==========================================================================
   DYNAMIC INFO ISLAND SYSTEM (Realtime Clock & Smooth Framer Expander)
   ========================================================================== */
function initDynamicInfoIsland() {
  const island = document.getElementById('dynamicInfoIsland');
  const toggleBtn = document.getElementById('dynamicInfoToggle');
  const bottomBar = document.getElementById('dynamicInfoBottom');
  const clockDigits = document.getElementById('clockDigits');

  if (!island || !toggleBtn) return;

  // 1. Live Dhaka Time (GMT+6) real-time updater
  function updateDhakaClock() {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      if (clockDigits) {
        clockDigits.textContent = formatter.format(now);
      }
    } catch (e) {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      if (clockDigits) {
        clockDigits.textContent = `${hours}:${minutes} ${ampm}`;
      }
    }
  }

  updateDhakaClock();
  setInterval(updateDhakaClock, 10000); // Update regularly

  // 2. Interactive open/close states
  let closeTimeout = null;

  function openIsland() {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      closeTimeout = null;
    }
    island.classList.add('is-open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    if (bottomBar) bottomBar.setAttribute('aria-hidden', 'false');
  }

  function closeIsland() {
    island.classList.remove('is-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    if (bottomBar) bottomBar.setAttribute('aria-hidden', 'true');
  }

  // Hover expansion for desktop
  island.addEventListener('mouseenter', () => {
    openIsland();
  });

  island.addEventListener('mouseleave', () => {
    closeTimeout = setTimeout(() => {
      closeIsland();
    }, 280);
  });

  // Click/Tap toggle for touch and click
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (island.classList.contains('is-open')) {
      closeIsland();
    } else {
      openIsland();
    }
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!island.contains(e.target) && island.classList.contains('is-open')) {
      closeIsland();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && island.classList.contains('is-open')) {
      closeIsland();
    }
  });
}

/* ==========================================================================
   FRAMER SWIPE LETTERS BUTTON SYSTEM (Alternate Staggered Letter Wave)
   ========================================================================== */
function initSwipeLettersButtons() {
  const buttons = document.querySelectorAll('[data-swipe-letters], .swipe-letters-btn');

  buttons.forEach(btn => {
    const titleEl = btn.querySelector('.swipe-title') || btn.querySelector('.cv-btn-title');
    if (!titleEl || titleEl.dataset.swipeInitialized) return;

    titleEl.dataset.swipeInitialized = 'true';
    const rawText = titleEl.textContent.trim();
    if (!rawText) return;

    // Set aria-label on parent button if needed
    if (!btn.getAttribute('aria-label')) {
      btn.setAttribute('aria-label', rawText);
    }

    const chars = Array.from(rawText).map(c => c === ' ' ? '\u00A0' : c);

    const wrapper = document.createElement('span');
    wrapper.className = 'swipe-title-wrap';
    wrapper.setAttribute('aria-hidden', 'true');

    chars.forEach((ch, i) => {
      const slot = document.createElement('span');
      slot.className = 'swipe-char-slot';

      const track = document.createElement('span');
      const isEven = i % 2 === 0;
      track.className = `swipe-char-track ${isEven ? 'swipe-dir-top' : 'swipe-dir-bottom'}`;
      track.style.setProperty('--swipe-delay', `${i * 18}ms`);

      const copy1 = document.createElement('span');
      copy1.className = 'swipe-letter-item';
      copy1.textContent = ch;

      const copy2 = document.createElement('span');
      copy2.className = 'swipe-letter-item';
      copy2.textContent = ch;

      track.appendChild(copy1);
      track.appendChild(copy2);
      slot.appendChild(track);
      wrapper.appendChild(slot);
    });

    titleEl.innerHTML = '';
    titleEl.appendChild(wrapper);
  });
}


function scrollToSection(id) {
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}

function initScrollNav() {
  const bottomNav = document.getElementById('bottomNav');
  if (!bottomNav) return;
  const sections = document.querySelectorAll('section[id]');
  const navButtons = document.querySelectorAll('.nav-btn');

  // Show bottom navigation on scroll down from hero
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      bottomNav.classList.add('visible');
    } else {
      bottomNav.classList.remove('visible');
    }
  }, { passive: true });

  // Intersection Observer for Active Section Highlighting
  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navButtons.forEach(btn => {
          if (btn.getAttribute('data-nav') === id) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
}

function initMobileMenu() {
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const dropdown = document.getElementById('mobileDropdown');

  if (!mobileBtn || !dropdown) return;

  mobileBtn.addEventListener('click', () => {
    const isOpen = dropdown.classList.contains('open');
    if (isOpen) {
      dropdown.classList.remove('open');
      mobileBtn.textContent = 'Menu';
    } else {
      dropdown.classList.add('open');
      mobileBtn.textContent = 'Close';
    }
  });

  dropdown.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      dropdown.classList.remove('open');
      mobileBtn.textContent = 'Menu';
    });
  });
}

/* ==========================================================================
   SPIDER-MAN NOIR REALISTIC WEB-SWINGING MOTIVATION COMPANION
   - Hover avatar: shows dynamic motivation, lasts 5 seconds on cursor leave
   - Re-hover: shows another new motivation
   - Scroll sections: only triggers when the full section (last line) is opened
     and user holds there for 5 seconds.
   - Prolonged dwell: if user remains in the section > 15s after first motivation,
     Noir delivers another new motivation for that section.
   - Reverse scroll: returning to a section and holding > 5s shows a new quote.
   - Leaving section: automatically closes active motivation immediately.
   - Click anywhere: immediately closes active motivation.
   ========================================================================== */
function initNoirCompanion() {
  const companion = document.getElementById('noirCompanion');
  const rig = document.getElementById('noirRig');
  const body = document.getElementById('noirBody');
  const sfxBurst = document.getElementById('noirSfxBurst');
  const bubble = document.getElementById('noirDossierBubble');
  const quoteText = document.getElementById('noirQuoteText');

  if (!rig || !body || !quoteText || !bubble) return;

  // In-character Spider-Man Noir motivational quotes (for hover/click)
  const motivationQuotes = [
    "In a city of broken UX, discipline builds the future.",
    "Sometimes the toughest design battles are won in the quiet hours.",
    "Every master was once a rookie who refused to fold.",
    "Clean tokens. Verifiable hierarchy. Trust your instincts.",
    "The shadows only exist where there's a light nearby.",
    "Stay focused in the dark. The craft you build today defines tomorrow.",
    "Perfection isn't an accident. It's relentless persistence.",
    "When the case feels heavy, remember why you started.",
    "A good interface never makes a user think twice. Keep it sharp.",
    "No shortcuts. Pixel by pixel, system by system."
  ];

  // Pools of tailored detective motivation quotes for each section of the portfolio
  const sectionQuotes = {
    about: [
      "Literature turned into design logic... see, he understands human psychology before pixels.",
      "Reading between the lines. That’s how real empathy gets engineered into digital systems.",
      "Story and logic in tension. That’s where interfaces start feeling second nature."
    ],
    featured: [
      "ProQscan AI... enterprise procurement and real-time inventory control. Pure operational clarity.",
      "Requisition, stock, anomaly audit, and executive oversight unified into an unbroken trail.",
      "Notice the high-density layout. Zero data gaps, total executive leverage."
    ],
    selected: [
      "Real production platforms: Callswain AI, Voqal, Sakeena, Boighor.",
      "From automated IVR routing to global EdTech and mobile e-reading, clean systems throughout.",
      "Hover over each case file... the live mockups and evidence speak for themselves."
    ],
    'why-me': [
      "Strategy and craft under one trenchcoat. Rare in a field full of surface polishers.",
      "Density is not the enemy — disorder is. Structure is the weapon.",
      "Full product lifecycle ownership. From whiteboard hypothesis to shipped revenue."
    ],
    process: [
      "Discovery in the open, decisions documented. No guessing games on the build.",
      "Airtight specifications and engineering support where it actually matters.",
      "From Figma components to pull-request verification. Zero handoff drift."
    ],
    contact: [
      "Got a high-stakes product case? Light up the signal. Let's build.",
      "Direct line to the detective. Open for impactful product design roles.",
      "Clear communication, zero friction. Send the brief."
    ]
  };

  // Retro Comic SFX Bursts
  const sfxList = [
    "*THWIP!*",
    "*CASE CLOSED*",
    "*DETECTIVE SENSE*",
    "*EVIDENCE FOUND*",
    "*THE SHADOWS*"
  ];

  let currentQuoteIndex = -1;
  let hideTimer = null;
  let isHoveringAvatar = false;
  let activeSection = null;
  let sectionHoldTimer = null;
  let sectionSecondaryTimer = null;
  const sectionQuoteIndices = {};

  // Show motivation bubble with smooth text transition & optional auto-hide duration
  function showBubble(text, duration = 5000) {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }

    quoteText.style.opacity = '0';
    setTimeout(() => {
      quoteText.textContent = `"${text}"`;
      quoteText.style.opacity = '1';
    }, 150);

    bubble.classList.add('visible');

    if (duration > 0) {
      hideTimer = setTimeout(() => {
        hideBubble();
      }, duration);
    }
  }

  // Dismiss motivation bubble smoothly
  function hideBubble() {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    bubble.classList.remove('visible');
  }

  // Pick a fresh hover quote avoiding immediate repeats
  function getNextHoverQuote() {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * motivationQuotes.length);
    } while (nextIndex === currentQuoteIndex && motivationQuotes.length > 1);
    currentQuoteIndex = nextIndex;
    return motivationQuotes[currentQuoteIndex];
  }

  // Pick the next unrepeated quote in cycle for a section
  function getSectionQuote(sectionId) {
    const list = sectionQuotes[sectionId];
    if (!list || list.length === 0) return "";
    let idx = sectionQuoteIndices[sectionId];
    if (idx === undefined) {
      idx = 0;
    } else {
      idx = (idx + 1) % list.length;
    }
    sectionQuoteIndices[sectionId] = idx;
    return list[idx];
  }

  // Comic SFX Burst
  function triggerComicSFX(text) {
    if (!sfxBurst) return;
    const randomText = text || sfxList[Math.floor(Math.random() * sfxList.length)];
    sfxBurst.textContent = randomText;
    sfxBurst.classList.remove('active');
    void sfxBurst.offsetWidth;
    sfxBurst.classList.add('active');

    setTimeout(() => {
      sfxBurst.classList.remove('active');
    }, 1000);
  }

  // 1. HOVER ON AVATAR (Works anywhere on the landing page)
  body.addEventListener('mouseenter', () => {
    isHoveringAvatar = true;
    const quote = getNextHoverQuote();
    // Keep visible while hovering
    showBubble(quote, 0);
  });

  body.addEventListener('mouseleave', () => {
    isHoveringAvatar = false;
    // Lasts 5 seconds after cursor moves away
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      hideBubble();
    }, 5000);
  });

  // Click on Noir directly: elastic bounce + comic SFX + fresh quote
  body.addEventListener('click', (e) => {
    e.stopPropagation();

    body.classList.remove('thwip-bounce');
    void body.offsetWidth;
    body.classList.add('thwip-bounce');

    triggerComicSFX();
    const nextQuote = getNextHoverQuote();
    showBubble(nextQuote, isHoveringAvatar ? 0 : 5000);
  });

  // 2. DISMISS ON CLICK ANYWHERE
  document.addEventListener('click', (e) => {
    // If clicking directly inside Noir body, let Noir handle it
    if (body.contains(e.target)) return;

    if (bubble.classList.contains('visible')) {
      hideBubble();
    }
  });

  // 3. SECTION DETECTION & TIMED DWELL MOTIVATION
  // Section IDs to monitor
  const sectionIds = ['about', 'featured', 'selected', 'why-me', 'process', 'contact'];

  // Check which section has its full content (bottom/last line) opened in view
  function getFullyOpenedSection() {
    const vh = window.innerHeight;
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();

      // Condition for sticky About section vs regular scroll sections
      if (id === 'about') {
        if (rect.top <= 50 && rect.bottom >= vh * 0.5) {
          return 'about';
        }
      } else if (rect.bottom <= vh + 50 && rect.bottom >= 120 && rect.top < vh * 0.65) {
        return id;
      }
    }
    return null;
  }

  function handleScrollSectionCheck() {
    const newSection = getFullyOpenedSection();

    if (newSection !== activeSection) {
      // User left previous section:
      // Automatically close any open motivation from previous section immediately
      if (activeSection !== null && bubble.classList.contains('visible') && !isHoveringAvatar) {
        hideBubble();
      }

      // Clear any pending 5s hold timer or 15s secondary timer
      if (sectionHoldTimer) {
        clearTimeout(sectionHoldTimer);
        sectionHoldTimer = null;
      }
      if (sectionSecondaryTimer) {
        clearTimeout(sectionSecondaryTimer);
        sectionSecondaryTimer = null;
      }

      activeSection = newSection;

      if (newSection) {
        const targetSection = newSection;

        // User must hold there for 5 seconds before motivation opens
        sectionHoldTimer = setTimeout(() => {
          if (activeSection === targetSection && !isHoveringAvatar) {
            const firstQuote = getSectionQuote(targetSection);
            showBubble(firstQuote, 5000); // displays for 5 seconds then fades out

            // If user continues holding in this section for more than 15 seconds after the first motivation,
            // deliver another new motivation for this section
            sectionSecondaryTimer = setTimeout(() => {
              if (activeSection === targetSection && !isHoveringAvatar) {
                const secondQuote = getSectionQuote(targetSection);
                showBubble(secondQuote, 5000);
              }
            }, 15000);
          }
        }, 5000);
      }
    }
  }

  let isScrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!isScrollTicking) {
      window.requestAnimationFrame(() => {
        handleScrollSectionCheck();
        isScrollTicking = false;
      });
      isScrollTicking = true;
    }
  }, { passive: true });

  // Initial check on load
  handleScrollSectionCheck();
}

/* ==========================================================================
   FLUID NEON RIBBON CURSOR TRAIL (White Neon in Dark Mode / Dark Neon in Light Mode)
   ========================================================================== */
function initCustomCursor() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return;
  }

  const canvas = document.getElementById('cursorTrailCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = window.devicePixelRatio || 1;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  // Multi-point physical kinetic chain for fluid ribbon movement (Tuned to compact half-length)
  const TOTAL_POINTS = 14;
  let mouseX = width / 2;
  let mouseY = height / 2;
  let isPointerActive = false;
  let isHovering = false;
  let currentDotRadius = 4.2;
  let targetDotRadius = 4.2;

  const chain = [];
  for (let i = 0; i < TOTAL_POINTS; i++) {
    chain.push({ x: mouseX, y: mouseY });
  }

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!isPointerActive) {
      isPointerActive = true;
      canvas.classList.add('active');
      for (let i = 0; i < TOTAL_POINTS; i++) {
        chain[i].x = mouseX;
        chain[i].y = mouseY;
      }
    }
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    isPointerActive = false;
    canvas.classList.remove('active');
  });

  document.addEventListener('mouseenter', () => {
    isPointerActive = true;
    canvas.classList.add('active');
  });

  // Interactive hover detection
  const INTERACTIVE_SELECTOR = 'a, button, [role="button"], input, textarea, select, .pill-tag, .filter-chip, .overlay-link, .nav-btn, .hero-btn, .stack-item, .noir-body, .theme-bulb-toggle, .dynamic-info-top, .dyn-social-btn, .dynamic-avail-badge, .project-card, .filter-pill, .row-item, .selected-case-row, .dossier-back-btn, .figma-arrow, .dossier-gateway-btn';

  document.addEventListener('mouseover', (e) => {
    const target = e.target;
    if (!target) return;
    const isInteractive = target.closest(INTERACTIVE_SELECTOR);
    if (isInteractive) {
      isHovering = true;
      targetDotRadius = 6.2;
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target;
    if (!target) return;
    const isInteractive = target.closest(INTERACTIVE_SELECTOR);
    if (isInteractive) {
      const related = e.relatedTarget;
      if (related && related.closest && related.closest(INTERACTIVE_SELECTOR)) {
        return;
      }
      isHovering = false;
      targetDotRadius = 4.2;
    }
  });

  // Click feedback
  window.addEventListener('mousedown', () => {
    targetDotRadius = 2.8;
  });

  window.addEventListener('mouseup', () => {
    targetDotRadius = isHovering ? 6.2 : 4.2;
  });

  // Animation render loop
  function render() {
    if (isPointerActive) {
      // 1. Direct instantaneous pin for leading cursor point
      chain[0].x += (mouseX - chain[0].x) * 0.92;
      chain[0].y += (mouseY - chain[0].y) * 0.92;

      // 2. Trailing kinetic chain for the flowing ribbon curve (Compact half-length)
      const lerpSpeed = 0.58;
      const maxSegmentDist = 18; // Prevents the tail from stretching excessively long on fast flicks
      for (let i = 1; i < TOTAL_POINTS; i++) {
        const prev = chain[i - 1];
        const curr = chain[i];
        curr.x += (prev.x - curr.x) * lerpSpeed;
        curr.y += (prev.y - curr.y) * lerpSpeed;

        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const dist = Math.hypot(dx, dy);
        if (dist > maxSegmentDist) {
          const angle = Math.atan2(dy, dx);
          curr.x = prev.x + Math.cos(angle) * maxSegmentDist;
          curr.y = prev.y + Math.sin(angle) * maxSegmentDist;
        }
      }

      currentDotRadius += (targetDotRadius - currentDotRadius) * 0.2;

      // Clear frame
      ctx.clearRect(0, 0, width, height);

      const siteIsLight = document.documentElement.getAttribute('data-theme') === 'light';

      // Dynamic footer contrast detection: check if cursor is over the revealed inverted area
      const contactSection = document.getElementById('contact');
      let isOverInverted = false;
      if (contactSection) {
        const cRect = contactSection.getBoundingClientRect();
        if (mouseY >= cRect.top && mouseY <= cRect.bottom && mouseX >= cRect.left && mouseX <= cRect.right) {
          const shutterState = window.__footerShutterState;
          if (shutterState) {
            let colProg = shutterState.s15;
            const relX = (mouseX - cRect.left) / cRect.width;
            if (relX >= 0.4 && relX < 0.6) {
              colProg = shutterState.s3;
            } else if ((relX >= 0.2 && relX < 0.4) || (relX >= 0.6 && relX < 0.8)) {
              colProg = shutterState.s24;
            }
            const bladeBottom = cRect.top + cRect.height * (1 - colProg);
            if (mouseY >= bladeBottom) {
              isOverInverted = true;
            }
          } else {
            isOverInverted = true;
          }
        }
      }
      // When hovering over revealed inverted footer, cursor flips to maintain strong contrast:
      // Dark site + White footer -> Dark cursor
      // Light site + Dark footer -> White cursor
      const isLight = isOverInverted ? !siteIsLight : siteIsLight;

      // 3. Draw Tapering Neon Line / Ribbon
      // From tail (TOTAL_POINTS - 1) to head (1)
      for (let i = TOTAL_POINTS - 1; i > 0; i--) {
        const p1 = chain[i];
        const p0 = chain[i - 1];

        // Normalized t: 0 at tail, 1 at head
        const t = 1 - (i / (TOTAL_POINTS - 1));
        const strokeWidth = 0.6 + Math.pow(t, 1.35) * (isHovering ? 4.8 : 3.8);
        const alpha = 0.05 + Math.pow(t, 1.15) * 0.95;

        // Outer Neon Glow Pass
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p0.x, p0.y);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = strokeWidth * 2.2;

        if (isLight) {
          // Dark Neon Mode (for Light Theme)
          ctx.strokeStyle = `rgba(18, 18, 22, ${alpha * 0.35})`;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
          ctx.shadowBlur = 8;
        } else {
          // White Neon Mode (for Dark Theme)
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.45})`;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
          ctx.shadowBlur = 12;
        }
        ctx.stroke();
        ctx.restore();

        // Core Crisp Neon Stroke Pass
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p0.x, p0.y);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = strokeWidth;

        if (isLight) {
          ctx.strokeStyle = `rgba(9, 9, 11, ${alpha})`;
        } else {
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        }
        ctx.stroke();
        ctx.restore();
      }

      // 4. Draw Leading Neon Point (Head Dot)
      ctx.save();
      ctx.beginPath();
      ctx.arc(chain[0].x, chain[0].y, currentDotRadius, 0, Math.PI * 2);

      if (isLight) {
        // Dark neon point with deep halo
        ctx.fillStyle = '#09090b';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = isHovering ? 14 : 9;
      } else {
        // Bright white neon point with radiant aura
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(255, 255, 255, 1)';
        ctx.shadowBlur = isHovering ? 18 : 12;
      }
      ctx.fill();

      // Delicate inner core highlight for extra neon brilliance
      if (!isLight) {
        ctx.beginPath();
        ctx.arc(chain[0].x, chain[0].y, currentDotRadius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(255, 255, 255, 1)';
        ctx.shadowBlur = 4;
        ctx.fill();
      }
      ctx.restore();
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

/* ==========================================================================
   FIGMA-STYLE "DESIGN IN PROGRESS" INTERACTIVE LOADER
   Simulates active vector editing session matching user reference image
   ========================================================================== */
function initPortfolioLoader() {
  const loader = document.getElementById('portfolioLoader');
  if (!loader) return;

  // Check if page was loaded via normal page navigation or reload
  const navEntry = window.performance && window.performance.getEntriesByType && window.performance.getEntriesByType('navigation')[0];
  const isReload = navEntry ? navEntry.type === 'reload' : (window.performance && window.performance.navigation && window.performance.navigation.type === 1);
  const hasSeenLoader = sessionStorage.getItem('hasSeenPortfolioLoader');

  // If user has already seen the loader in this session and is not reloading the page, remove immediately
  if (hasSeenLoader && !isReload) {
    loader.style.display = 'none';
    loader.remove();
    return;
  }

  // Record that the loader was shown in this session
  sessionStorage.setItem('hasSeenPortfolioLoader', 'true');

  const box = document.getElementById('loaderSelectionBox');
  const cursor = document.getElementById('loaderFigmaCursor');
  const dimW = document.getElementById('loaderDimW');
  const dimH = document.getElementById('loaderDimH');
  const dimPct = document.getElementById('loaderPct');
  const pill = document.getElementById('loaderDimensionPill');
  const guideX = document.getElementById('smartGuideX');
  const guideY = document.getElementById('smartGuideY');
  const skipBtn = document.getElementById('skipLoaderBtn');

  let isCompleted = false;

  function closeLoader() {
    if (isCompleted) return;
    isCompleted = true;
    loader.classList.add('loader-hidden');
    setTimeout(() => {
      loader.style.display = 'none';
    }, 700);
  }

  // Interactive bypass on click or keyboard press
  loader.addEventListener('click', (e) => {
    closeLoader();
  });

  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeLoader();
    });
  }

  window.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') && !isCompleted) {
      closeLoader();
    }
  });

  // Animation timeline using requestAnimationFrame
  const startTime = performance.now();
  const dragDuration = 1500; // Drag lasts 1.5s
  const dragStartDelay = 450; // Initial hold displaying reference composition

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function animateLoader(now) {
    if (isCompleted) return;

    const elapsed = now - startTime;

    if (elapsed < dragStartDelay) {
      // Resting state: exactly matching the attached reference image
      if (box) {
        box.style.top = '12%';
        box.style.left = '56%';
        box.style.width = '44%';
        box.style.height = '76%';
      }
      if (dimW) dimW.textContent = '280';
      if (dimH) dimH.textContent = '160';
      if (dimPct) dimPct.textContent = '24%';
      requestAnimationFrame(animateLoader);
      return;
    }

    const progressRaw = Math.min(1, (elapsed - dragStartDelay) / dragDuration);
    const progress = easeInOutCubic(progressRaw);

    // Smoothly drag and expand bounding box to encompass entire word
    const top = 12 - progress * 16;      // 12% -> -4%
    const left = 56 - progress * 59;     // 56% -> -3%
    const width = 44 + progress * 62;    // 44% -> 106%
    const height = 76 + progress * 32;   // 76% -> 108%

    if (box) {
      box.style.top = `${top}%`;
      box.style.left = `${left}%`;
      box.style.width = `${width}%`;
      box.style.height = `${height}%`;
    }

    // Dynamic coordinates and progress counter
    const curW = Math.round(280 + progress * 560);
    const curH = Math.round(160 + progress * 50);
    const curPct = Math.round(24 + progress * 76);

    if (dimW) dimW.textContent = curW;
    if (dimH) dimH.textContent = curH;
    if (dimPct) dimPct.textContent = `${curPct}%`;

    // Snap Figma smart guides into place as alignment nears center
    if (progressRaw > 0.62 && progressRaw < 0.98) {
      if (guideX) guideX.classList.add('active');
      if (guideY) guideY.classList.add('active');
    } else {
      if (guideX) guideX.classList.remove('active');
      if (guideY) guideY.classList.remove('active');
    }

    // Micro cursor click/grab feedback
    if (cursor) {
      if (elapsed >= dragStartDelay && elapsed < dragStartDelay + 160) {
        cursor.style.transform = 'scale(0.9)';
      } else {
        cursor.style.transform = 'scale(1)';
      }
    }

    if (progressRaw < 1) {
      requestAnimationFrame(animateLoader);
    } else {
      // Editing complete: Show 100% Ready status
      if (dimPct) {
        dimPct.innerHTML = '100% <span style="color:#ffffff; margin-left:3px;">✔</span>';
      }
      if (pill) {
        pill.style.borderColor = 'rgba(255, 255, 255, 0.5)';
      }

      // Flash locked confirmation in clean white
      setTimeout(() => {
        if (box) {
          box.style.borderColor = '#ffffff';
          box.style.boxShadow = '0 0 28px rgba(255, 255, 255, 0.45)';
        }
      }, 150);

      // Deselect handles and fade selection
      setTimeout(() => {
        if (box) {
          box.style.opacity = '0';
          box.style.transition = 'opacity 0.4s ease';
        }
      }, 550);

      // Gracefully unveil the portfolio
      setTimeout(() => {
        closeLoader();
      }, 900);
    }
  }

  requestAnimationFrame(animateLoader);
}

/* ==========================================================================
   HERO DYNAMIC TYPEWRITER SYSTEM
   - First open: Shows 'UI/UX Designer.' for 10 seconds
   - Next: Cycles through titles in 5-second pauses
   - On scroll down and re-enter: Resets to 'UI/UX Designer.' first, then random order
   ========================================================================== */
function initHeroTypewriter() {
  const typewriterElem = document.getElementById('heroTypewriterText');
  const heroSection = document.getElementById('hero');
  if (!typewriterElem) return;

  const MAIN_TITLE = 'UI/UX DESIGNER';
  const OTHER_TITLES = [
    'PRODUCT DESIGNER',
    'VISUAL STORYTELLER',
    'PHOTOGRAPHY ENTHUSIAST',
    'BIT NERDY'
  ];

  const TYPE_SPEED = 54;       // Smooth, fluid, natural typewriter cadence (ms/char)
  const DELETE_SPEED = 28;     // Crisp backspace speed (ms/char)
  const FIRST_DWELL = 3500;    // Reduced pause: ~3.5s on initial UI/UX DESIGNER
  const REGULAR_DWELL = 2200;  // Reduced pause: ~2.2s between subsequent titles

  let currentText = typewriterElem.textContent.trim() || MAIN_TITLE;
  let typeTimeout = null;
  let holdTimeout = null;
  let useRandomOrder = false;
  let randomizedQueue = [];
  let sequentialIndex = 0;
  let hasScrolledAway = false;

  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function getNextTitle() {
    if (useRandomOrder) {
      if (randomizedQueue.length === 0) {
        randomizedQueue = shuffle(OTHER_TITLES);
      }
      return randomizedQueue.shift();
    } else {
      // First cycle: organized sequence
      const title = OTHER_TITLES[sequentialIndex];
      sequentialIndex++;
      if (sequentialIndex >= OTHER_TITLES.length) {
        // After full first cycle, switch to random order
        useRandomOrder = true;
        sequentialIndex = 0;
      }
      return title;
    }
  }

  function typeText(targetTitle, onComplete) {
    if (currentText.length < targetTitle.length) {
      currentText = targetTitle.substring(0, currentText.length + 1);
      typewriterElem.textContent = currentText;
      typeTimeout = setTimeout(() => typeText(targetTitle, onComplete), TYPE_SPEED);
    } else {
      if (onComplete) onComplete();
    }
  }

  function deleteText(onComplete) {
    if (currentText.length > 0) {
      currentText = currentText.substring(0, currentText.length - 1);
      typewriterElem.textContent = currentText;
      typeTimeout = setTimeout(() => deleteText(onComplete), DELETE_SPEED);
    } else {
      if (onComplete) onComplete();
    }
  }

  function transitionTo(nextTitle, dwellMs) {
    clearTimeout(typeTimeout);
    clearTimeout(holdTimeout);

    deleteText(() => {
      typeText(nextTitle, () => {
        holdTimeout = setTimeout(() => {
          const next = getNextTitle();
          transitionTo(next, REGULAR_DWELL);
        }, dwellMs);
      });
    });
  }

  // Reset to main title when user scrolls back to hero section
  function resetToMainTitle() {
    clearTimeout(typeTimeout);
    clearTimeout(holdTimeout);

    // After re-entering, next titles will be random
    useRandomOrder = true;
    randomizedQueue = shuffle(OTHER_TITLES);

    if (currentText === MAIN_TITLE) {
      holdTimeout = setTimeout(() => {
        const next = getNextTitle();
        transitionTo(next, REGULAR_DWELL);
      }, FIRST_DWELL);
    } else {
      deleteText(() => {
        typeText(MAIN_TITLE, () => {
          holdTimeout = setTimeout(() => {
            const next = getNextTitle();
            transitionTo(next, REGULAR_DWELL);
          }, FIRST_DWELL);
        });
      });
    }
  }

  // Scroll detection: when user scrolls down and comes back to the hero section
  if (heroSection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          hasScrolledAway = true;
        } else if (hasScrolledAway && entry.isIntersecting) {
          hasScrolledAway = false;
          resetToMainTitle();
        }
      });
    }, {
      threshold: 0.15
    });

    observer.observe(heroSection);
  }

  // Initial Run on page open:
  // User sees the main one "UI/UX Designer." first, holds for 10 seconds
  typewriterElem.textContent = MAIN_TITLE;
  currentText = MAIN_TITLE;

  holdTimeout = setTimeout(() => {
    const next = getNextTitle();
    transitionTo(next, REGULAR_DWELL);
  }, FIRST_DWELL);
}

/* ==========================================================================
   SELECTED WORK 3D FLUID CARD CAROUSEL SLIDER
   - Smooth left / right wrapping index cycling
   - Center active card, peeked previous and next cards
   - Dot indicator sync and direct click navigation
   - Keyboard arrow keys & touch swipe support
   ========================================================================== */
function initSelectedCarousel() {
  const wrapper = document.getElementById('carouselStageWrapper');
  const track = document.getElementById('carouselCardsTrack');
  const dotsContainer = document.getElementById('carouselDotsRow');

  if (!track || !wrapper) return;

  const cards = Array.from(track.querySelectorAll('.carousel-card'));
  const dots = dotsContainer ? Array.from(dotsContainer.querySelectorAll('.carousel-dot')) : [];
  const totalCards = cards.length;
  if (totalCards === 0) return;

  let currentPos = 0;
  let targetPos = 0;
  let isDragging = false;
  let pointerStartX = 0;
  let dragStartPos = 0;
  let lastClientX = 0;
  let lastTime = 0;
  let dragVelocity = 0;
  let hasDragged = false;

  // Render loop using requestAnimationFrame for smooth continuous swipe motion
  function render() {
    requestAnimationFrame(render);

    // Liquid spring interpolation for horizontal swipe motion
    // If dragging, responsive tracking; if released, smooth, buttery deceleration
    const diff = targetPos - currentPos;
    if (Math.abs(diff) > 0.0002) {
      const ease = isDragging ? 0.32 : 0.075;
      currentPos += diff * ease;
    } else if (!isDragging) {
      currentPos = targetPos;
    }

    cards.forEach((card, index) => {
      // Circular distance from current position
      let d = index - currentPos;
      d = ((d % totalCards) + totalCards) % totalCards;
      if (d > totalCards / 2) d -= totalCards;

      const absD = Math.abs(d);

      // Smooth horizontal spatial transition along 3D perspective track
      const xPercent = Math.sign(d) * Math.min(1, absD) * 44;
      const zOffset = -absD * 80;
      const scale = Math.max(0.72, 1 - absD * 0.15);
      const opacity = Math.max(0, Math.min(1, 1 - Math.max(0, absD - 0.15) * 0.52));
      const blur = Math.max(0, (absD - 0.2) * 2.2);

      // Cards stay in one place vertically (translateY 0), smoothly translating horizontally
      card.style.transform = `translateX(${xPercent.toFixed(2)}%) translateY(0) scale(${scale.toFixed(3)}) translateZ(${zOffset.toFixed(1)}px)`;
      card.style.opacity = opacity.toFixed(3);
      card.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : 'none';
      card.style.zIndex = Math.round(20 - absD * 10);

      const isActive = absD < 0.4;
      card.style.pointerEvents = isActive ? 'auto' : (absD < 1.35 ? 'auto' : 'none');
      card.classList.toggle('is-active', isActive);
      card.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    // Sync active pagination dot to closest card
    const activeDotIndex = ((Math.round(targetPos) % totalCards) + totalCards) % totalCards;
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === activeDotIndex);
      dot.setAttribute('aria-selected', idx === activeDotIndex ? 'true' : 'false');
    });
  }

  requestAnimationFrame(render);

  // --- POINTER DRAG GESTURES ---
  wrapper.addEventListener('pointerdown', (e) => {
    isDragging = true;
    hasDragged = false;
    pointerStartX = e.clientX;
    dragStartPos = targetPos;
    lastClientX = e.clientX;
    lastTime = performance.now();
    dragVelocity = 0;
    wrapper.classList.add('is-dragging');
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - pointerStartX;
    if (Math.abs(deltaX) > 8) {
      hasDragged = true;
    }

    const now = performance.now();
    const dt = Math.max(1, now - lastTime);
    dragVelocity = (e.clientX - lastClientX) / dt;
    lastClientX = e.clientX;
    lastTime = now;

    // Convert pixel drag to fractional card units (520px = 1 full card float)
    const dragFraction = deltaX / 520;
    targetPos = dragStartPos - dragFraction;
  });

  function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;
    wrapper.classList.remove('is-dragging');

    if (hasDragged) {
      // If user flicked with velocity, carry momentum smoothly to next/prev card
      if (Math.abs(dragVelocity) > 0.35) {
        if (dragVelocity < 0) {
          targetPos = Math.ceil(targetPos);
        } else {
          targetPos = Math.floor(targetPos);
        }
      } else {
        // Gently settle to nearest card
        targetPos = Math.round(targetPos);
      }
    }
  }

  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  // Prevent link click if user was dragging
  wrapper.addEventListener('click', (e) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Click on peeked side cards smoothly floats them to center
  cards.forEach((card, index) => {
    card.addEventListener('click', (e) => {
      if (hasDragged) return;
      if (e.target.closest('a') || e.target.closest('button')) {
        return;
      }
      // Calculate circular delta from current target
      let delta = index - ((Math.round(targetPos) % totalCards + totalCards) % totalCards);
      if (delta > totalCards / 2) delta -= totalCards;
      if (delta < -totalCards / 2) delta += totalCards;

      if (Math.abs(delta) > 0) {
        e.preventDefault();
        targetPos = Math.round(targetPos) + delta;
      }
    });
  });

  // Pagination dots click smoothly floats to target card
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const dotIndex = parseInt(dot.getAttribute('data-dot'), 10);
      if (!isNaN(dotIndex)) {
        let delta = dotIndex - ((Math.round(targetPos) % totalCards + totalCards) % totalCards);
        if (delta > totalCards / 2) delta -= totalCards;
        if (delta < -totalCards / 2) delta += totalCards;
        targetPos = Math.round(targetPos) + delta;
      }
    });
  });

  // Trackpad / Mouse Wheel Horizontal Swipe
  let wheelTimer = null;
  wrapper.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > 25) {
      e.preventDefault();
      targetPos += (e.deltaX > 0 ? 1 : -1) * 0.08;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        targetPos = Math.round(targetPos);
      }, 180);
    }
  }, { passive: false });

  // Keyboard left/right arrow navigation
  const selectedSection = document.getElementById('selected');
  if (selectedSection) {
    window.addEventListener('keydown', (e) => {
      const rect = selectedSection.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      if (e.key === 'ArrowLeft') {
        targetPos = Math.round(targetPos) - 1;
      } else if (e.key === 'ArrowRight') {
        targetPos = Math.round(targetPos) + 1;
      }
    });
  }
}

/* ==========================================================================
   ABOUT MANIFESTO STICKY SCROLL-SCRUB READING SYSTEM
   - Keeps section pinned ("stuck") while user scrolls down
   - Progressively lights up words from muted gray to high-contrast white / black
   - Smoothly drives the reading progress bar
   - Unlocks when all words are fully read and illuminated
   ========================================================================== */
function initAboutScrollScrub() {
  const track = document.getElementById('about');
  const manifesto = document.getElementById('aboutScrubManifesto');

  if (!track || !manifesto) return;

  const words = manifesto.querySelectorAll('.scrub-word');
  const totalWords = words.length;
  if (totalWords === 0) return;

  let isTicking = false;

  function handleScrub() {
    const rect = track.getBoundingClientRect();
    const vh = window.innerHeight;
    const scrollDistance = rect.height - vh;

    if (scrollDistance <= 0) return;

    // Scrolled distance from top of section hitting top of viewport
    const scrolled = -rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / scrollDistance));

    // Calculate how many words should be illuminated
    const activeWordCount = Math.floor(progress * (totalWords + 1));

    words.forEach((word, index) => {
      if (index < activeWordCount) {
        word.classList.add('active');
      } else {
        word.classList.remove('active');
      }
    });

    isTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (!isTicking) {
      window.requestAnimationFrame(handleScrub);
      isTicking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', handleScrub, { passive: true });

  // Initial call on load
  handleScrub();
}

/* ==========================================================================
   SCROLL POSITION MEMORY & BACK NAVIGATION RESTORATION
   Guarantees that navigating into a case study or CV and returning lands the user
   at the exact pixel and section where they left off.
   ========================================================================== */
function getPageScrollKey() {
  const path = window.location.pathname;
  return path.substring(path.lastIndexOf('/') + 1) || 'index.html';
}

function initScrollRestoration() {
  const key = getPageScrollKey();
  const navEntry = window.performance && window.performance.getEntriesByType && window.performance.getEntriesByType('navigation')[0];
  const isReload = navEntry ? navEntry.type === 'reload' : (window.performance && window.performance.navigation && window.performance.navigation.type === 1);

  // 1. Restore exact scroll position if returning from another page
  if (!isReload) {
    const saved = sessionStorage.getItem('scroll_pos_' + key);
    if (saved !== null) {
      const targetY = parseInt(saved, 10);
      if (!isNaN(targetY) && targetY >= 0) {
        if ('scrollRestoration' in history) {
          history.scrollRestoration = 'manual';
        }

        const applyScroll = () => {
          window.scrollTo({ top: targetY, behavior: 'instant' });
        };

        applyScroll();
        requestAnimationFrame(applyScroll);
        setTimeout(applyScroll, 40);
        setTimeout(applyScroll, 120);
        setTimeout(applyScroll, 300);
        setTimeout(applyScroll, 600);
      }
    }
  }

  // 2. Continuous saving before navigation / unload
  function saveCurrentScroll() {
    try {
      sessionStorage.setItem('scroll_pos_' + key, window.scrollY.toString());
    } catch (e) {}
  }

  window.addEventListener('beforeunload', saveCurrentScroll);
  window.addEventListener('pagehide', saveCurrentScroll);

  // Capture scroll immediately upon clicking any internal navigation link
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href && (href.endsWith('.html') || href.includes('.html#') || href === 'index.html' || href.startsWith('/'))) {
      saveCurrentScroll();
    }
  });
}

/* ==========================================================================
   SCROLL-DRIVEN KINETIC STATEMENT STRIP (Matches Reference 'Text Line')
   Double-buffered liquid-smooth kinetic typography driven by viewport scroll
   ========================================================================== */
function initKineticScrollStrip() {
  const strip = document.getElementById('kineticStrip');
  const track = document.getElementById('kineticTrack');
  if (!strip || !track) return;

  const stream = track.querySelector('.kinetic-stream');
  if (!stream) return;

  let streamWidth = stream.offsetWidth || 1400;

  function updateDimensions() {
    if (stream) {
      streamWidth = stream.offsetWidth || streamWidth;
    }
  }

  window.addEventListener('resize', updateDimensions, { passive: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateDimensions);
  }

  // Double-buffered smooth physics state
  let currentPos = 0;
  let targetPos = 0;
  let targetScrollY = window.pageYOffset || window.scrollY || 0;
  let smoothedScrollY = targetScrollY;
  let prevSmoothedScrollY = targetScrollY;

  let isIntersecting = false;
  let isHovered = false;
  let animId = null;

  // Base ambient drift speed when holding/resting (pixels per frame at 60fps)
  const baseSpeed = 1.4;

  strip.addEventListener('mouseenter', () => { isHovered = true; });
  strip.addEventListener('mouseleave', () => { isHovered = false; });

  function onScroll() {
    targetScrollY = window.pageYOffset || window.scrollY || 0;
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  function renderLoop() {
    if (!isIntersecting) {
      animId = null;
      return;
    }

    // 1. Smooth out mouse-wheel/trackpad ticks with progressive damping (avoids sudden shocks)
    smoothedScrollY += (targetScrollY - smoothedScrollY) * 0.075;
    const rawDelta = smoothedScrollY - prevSmoothedScrollY;
    prevSmoothedScrollY = smoothedScrollY;

    // Softly cushion high-velocity spikes so acceleration never feels abrupt or shocking
    const clampedDelta = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), 55);

    // 2. Advance target position: brisk scroll response with natural physical inertia
    const hoverFactor = isHovered ? 0.35 : 1.0;
    targetPos += (baseSpeed * hoverFactor) + (clampedDelta * 1.35);

    // 3. Fluid dual-stage lerp creates a buttery, physical glide with zero jitter
    currentPos += (targetPos - currentPos) * 0.088;

    // 4. Infinite seamless modulo wrapping
    if (streamWidth > 0) {
      const displayX = ((currentPos % streamWidth) + streamWidth) % streamWidth;
      track.style.transform = `translate3d(${-displayX}px, 0, 0)`;
    }

    animId = requestAnimationFrame(renderLoop);
  }

  // IntersectionObserver: Only animate RAF when strip is in/near viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isIntersecting = entry.isIntersecting;
      if (isIntersecting && !animId) {
        updateDimensions();
        targetScrollY = window.pageYOffset || window.scrollY || 0;
        smoothedScrollY = targetScrollY;
        prevSmoothedScrollY = targetScrollY;
        animId = requestAnimationFrame(renderLoop);
      }
    });
  }, {
    rootMargin: '350px 0px 350px 0px'
  });

  observer.observe(strip);
  updateDimensions();
}

/* ==========================================================================
   COLLABORATIVE DESIGN CANVAS HEADLINE CONTROLLER
   Recreates the Figma live multi-cursor collaborative motion from reference video
   ========================================================================== */
function initCollabCanvasHeadline() {
  const container = document.getElementById('collabCanvasArea');
  const wordEl = document.getElementById('collabWord');
  const slotEl = document.getElementById('collabSlotWrapper');
  const figmaBox = document.getElementById('figmaBox');
  const figmaDimPill = document.getElementById('figmaDimPill');
  const fontMenu = document.getElementById('figmaFontMenu');
  const fontOptJakarta = document.getElementById('fontOptJakarta');
  const fontOptSerif = document.getElementById('fontOptSerif');
  const fontOptSyne = document.getElementById('fontOptSyne');
  const typoInspector = document.getElementById('figmaTypoInspector');
  const wBtnBold = document.getElementById('wBtnBold');
  const wBtnBlack = document.getElementById('wBtnBlack');
  const trackVal = document.getElementById('trackVal');
  const palette = document.getElementById('figmaColorPalette');
  const swatchPlatinum = document.getElementById('swatchPlatinum');
  const swatchWhite = document.getElementById('swatchWhite');
  const reviewChip = document.getElementById('collabReviewChip');
  const highlighterSvg = document.getElementById('collabHighlighterSvg');
  const cursorCristian = document.getElementById('cursorCristian');
  const cursorSandra = document.getElementById('cursorSandra');

  if (!container || !wordEl || !slotEl) return;

  // Reduced motion preference check
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    wordEl.style.fontFamily = "'Syne', sans-serif";
    wordEl.style.fontWeight = '800';
    wordEl.style.color = '#ffffff';
    wordEl.style.textShadow = '0 0 24px rgba(255, 255, 255, 0.45)';
    return;
  }

  let stageTimers = [];
  let idleInterval = null;
  let isFooterFullyOpen = false;
  let isLoopRunning = false;
  let startTimeout = null;

  function clearAllTimers() {
    stageTimers.forEach(t => clearTimeout(t));
    stageTimers = [];
    if (idleInterval) {
      clearInterval(idleInterval);
      idleInterval = null;
    }
    if (startTimeout) {
      clearTimeout(startTimeout);
      startTimeout = null;
    }
  }

  function addTimer(fn, delay) {
    const t = setTimeout(fn, delay);
    stageTimers.push(t);
    return t;
  }

  // Calculate coordinates relative to canvas container
  function getRel(el) {
    if (!el) return { x: 0, y: 0, w: 0, h: 0, centerX: 0, centerY: 0 };
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    return {
      x: eRect.left - cRect.left,
      y: eRect.top - cRect.top,
      w: eRect.width,
      h: eRect.height,
      centerX: eRect.left - cRect.left + eRect.width / 2,
      centerY: eRect.top - cRect.top + eRect.height / 2
    };
  }

  // Snappy, responsive cursor gliding
  function setCursorPos(cursorEl, x, y, duration = 0.45, easing = 'cubic-bezier(0.22, 1, 0.36, 1)') {
    if (!cursorEl) return;
    cursorEl.style.transition = `transform ${duration}s ${easing}, opacity 0.28s ease`;
    cursorEl.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  }

  function hideAllCursors() {
    [cursorCristian, cursorSandra].forEach(c => {
      if (c) c.style.opacity = '0';
    });
  }

  function resetAllTools() {
    if (figmaBox) figmaBox.classList.remove('active');
    if (fontMenu) fontMenu.classList.remove('active');
    if (typoInspector) typoInspector.classList.remove('active');
    if (palette) palette.classList.remove('active');
    if (reviewChip) reviewChip.classList.remove('active');
    if (highlighterSvg) highlighterSvg.classList.remove('drawn');

    if (fontOptSerif) fontOptSerif.classList.remove('hovered');
    if (fontOptSyne) fontOptSyne.classList.remove('active-target');
    if (wBtnBold) wBtnBold.classList.remove('hovered');
    if (wBtnBlack) wBtnBlack.classList.remove('active-target');
    if (swatchPlatinum) swatchPlatinum.classList.remove('hovered');
    if (swatchWhite) swatchWhite.classList.remove('active-target');
  }

  function stopCollabLoop() {
    isLoopRunning = false;
    clearAllTimers();
    resetAllTools();
    hideAllCursors();
  }

  // Snappy, engaging, fluid collaborative loop (~12.5s cycle)
  function runCollabLoop() {
    if (!isFooterFullyOpen) return;
    clearAllTimers();
    resetAllTools();
    hideAllCursors();
    isLoopRunning = true;

    // Baseline gentle appearance of "work"
    wordEl.style.fontFamily = "var(--font-display, 'Plus Jakarta Sans', sans-serif)";
    wordEl.style.fontStyle = 'normal';
    wordEl.style.fontWeight = '500';
    wordEl.style.letterSpacing = '-0.02em';
    wordEl.style.color = '#a1a1aa';
    wordEl.style.textShadow = 'none';
    wordEl.style.transform = 'none';
    if (figmaDimPill) figmaDimPill.textContent = '236 × 82';
    if (trackVal) trackVal.textContent = '-0.02em';

    // -------------------------------------------------------------
    // STEP 1: CRISTIAN ARRIVES & SELECTS "WORK" (0s - 0.85s)
    // -------------------------------------------------------------
    addTimer(() => {
      const slotPos = getRel(slotEl);

      // Cristian glides in from bottom-right
      setCursorPos(cursorCristian, slotPos.centerX + 160, slotPos.centerY + 70, 0);
      if (cursorCristian) cursorCristian.style.opacity = '1';

      // Snappy glide to top-right selection corner
      addTimer(() => {
        const sPos = getRel(slotEl);
        setCursorPos(cursorCristian, sPos.x + sPos.w + 10, sPos.y - 12, 0.45, 'cubic-bezier(0.22, 1, 0.36, 1)');
      }, 120);

      // Bounding box with dimension pill snaps in
      addTimer(() => {
        if (figmaBox) figmaBox.classList.add('active');
      }, 550);

    }, 100);

    // -------------------------------------------------------------
    // STEP 2: CHOOSING & CHANGING FONT FAMILY (0.85s - 2.6s)
    // -------------------------------------------------------------
    addTimer(() => {
      if (fontMenu) fontMenu.classList.add('active');

      // Cristian glides to 2nd option: Playfair Display (Serif)
      addTimer(() => {
        if (!fontOptSerif) return;
        const optPos = getRel(fontOptSerif);
        setCursorPos(cursorCristian, optPos.centerX - 10, optPos.centerY, 0.38, 'cubic-bezier(0.25, 1, 0.4, 1)');
      }, 250);

      // Hover serif: word smoothly previews editorial serif italic
      addTimer(() => {
        if (fontOptSerif) fontOptSerif.classList.add('hovered');
        wordEl.style.fontFamily = "'Playfair Display', Georgia, serif";
        wordEl.style.fontStyle = 'italic';
        wordEl.style.fontWeight = '500';
        if (figmaDimPill) figmaDimPill.textContent = '252 × 84';
      }, 650);

      // Move down to 3rd option: Syne (Display Bold)
      addTimer(() => {
        if (!fontOptSyne) return;
        const optPos = getRel(fontOptSyne);
        setCursorPos(cursorCristian, optPos.centerX - 10, optPos.centerY, 0.32, 'cubic-bezier(0.25, 1, 0.4, 1)');
      }, 1050);

      // Click Syne: smooth morph into bold modern display font
      addTimer(() => {
        if (fontOptSerif) fontOptSerif.classList.remove('hovered');
        if (fontOptSyne) fontOptSyne.classList.add('active-target');
        wordEl.style.fontFamily = "'Syne', sans-serif";
        wordEl.style.fontStyle = 'normal';
        wordEl.style.fontWeight = '700';
        wordEl.style.letterSpacing = '-0.025em';
        if (figmaDimPill) figmaDimPill.textContent = '264 × 82';
      }, 1400);

      // Close font menu smoothly
      addTimer(() => {
        if (fontMenu) fontMenu.classList.remove('active');
      }, 1850);

    }, 850);

    // -------------------------------------------------------------
    // STEP 3: TUNING WEIGHT, BOLDNESS & TRACKING (2.6s - 4.4s)
    // -------------------------------------------------------------
    addTimer(() => {
      if (typoInspector) typoInspector.classList.add('active');

      // Move Cristian to weight button 700
      addTimer(() => {
        if (!wBtnBold) return;
        const bPos = getRel(wBtnBold);
        setCursorPos(cursorCristian, bPos.centerX, bPos.centerY, 0.35, 'cubic-bezier(0.22, 1, 0.36, 1)');
      }, 200);

      addTimer(() => {
        if (wBtnBold) wBtnBold.classList.add('hovered');
      }, 550);

      // Glide over to weight button 800 (Extra Bold/Black)
      addTimer(() => {
        if (!wBtnBlack) return;
        const bPos = getRel(wBtnBlack);
        setCursorPos(cursorCristian, bPos.centerX, bPos.centerY, 0.3, 'cubic-bezier(0.25, 1, 0.4, 1)');
      }, 800);

      // Click 800: word smoothly thickens with tight tracking
      addTimer(() => {
        if (wBtnBold) wBtnBold.classList.remove('hovered');
        if (wBtnBlack) wBtnBlack.classList.add('active-target');
        wordEl.style.fontWeight = '800';
        wordEl.style.letterSpacing = '-0.04em';
        if (trackVal) trackVal.textContent = '-0.04em';
        if (figmaDimPill) figmaDimPill.textContent = '278 × 82';
      }, 1150);

      // Close inspector smoothly
      addTimer(() => {
        if (typoInspector) typoInspector.classList.remove('active');
      }, 1600);

    }, 2650);

    // -------------------------------------------------------------
    // STEP 4: CHOOSING COLOR FROM WHITE SHADES (4.4s - 6.2s)
    // -------------------------------------------------------------
    addTimer(() => {
      if (palette) palette.classList.add('active');

      // Move Cristian to Platinum swatch (#e4e4e7)
      addTimer(() => {
        if (!swatchPlatinum) return;
        const swPos = getRel(swatchPlatinum);
        setCursorPos(cursorCristian, swPos.centerX, swPos.centerY, 0.35, 'cubic-bezier(0.22, 1, 0.36, 1)');
      }, 200);

      // Platinum preview
      addTimer(() => {
        if (swatchPlatinum) swatchPlatinum.classList.add('hovered');
        wordEl.style.color = '#e4e4e7';
      }, 550);

      // Glide to Pure White swatch (#ffffff)
      addTimer(() => {
        if (!swatchWhite) return;
        const swPos = getRel(swatchWhite);
        setCursorPos(cursorCristian, swPos.centerX, swPos.centerY, 0.3, 'cubic-bezier(0.25, 1, 0.4, 1)');
      }, 850);

      // Click Pure White: word smoothly radiates glowing white
      addTimer(() => {
        if (swatchPlatinum) swatchPlatinum.classList.remove('hovered');
        if (swatchWhite) swatchWhite.classList.add('active-target');
        wordEl.style.color = '#ffffff';
        wordEl.style.textShadow = '0 0 24px rgba(255, 255, 255, 0.42), 0 0 55px rgba(255, 255, 255, 0.16)';
      }, 1200);

      // Close palette and dismiss bounding box smoothly
      addTimer(() => {
        if (palette) palette.classList.remove('active');
        if (figmaBox) figmaBox.classList.remove('active');
      }, 1650);

    }, 4450);

    // -------------------------------------------------------------
    // STEP 5: SANDRA REVIEWS & APPROVES (6.2s - 8.1s)
    // -------------------------------------------------------------
    addTimer(() => {
      const slotPos = getRel(slotEl);

      // Sandra glides in from right
      setCursorPos(cursorSandra, slotPos.centerX + 150, slotPos.centerY - 30, 0);
      if (cursorSandra) cursorSandra.style.opacity = '1';

      // Move Sandra right above "work"
      addTimer(() => {
        const sPos = getRel(slotEl);
        setCursorPos(cursorSandra, sPos.centerX + 35, sPos.y - 14, 0.45, 'cubic-bezier(0.22, 1, 0.36, 1)');
      }, 100);

      // Review chip pops in & highlighter loop draws
      addTimer(() => {
        if (reviewChip) reviewChip.classList.add('active');
        if (highlighterSvg) highlighterSvg.classList.add('drawn');
      }, 600);

    }, 6250);

    // -------------------------------------------------------------
    // STEP 6: SERENE FINALE & GENTLE FLOATING REST (8.1s - 12.5s)
    // -------------------------------------------------------------
    addTimer(() => {
      // Dismiss review badge; keep highlighter loop active around 'work' until next cycle
      if (reviewChip) reviewChip.classList.remove('active');

      const headlineEl = document.getElementById('collabHeadline') || container;
      const hPos = getRel(headlineEl);
      const slotPos = getRel(slotEl);
      const isMobile = window.innerWidth < 640;
      const baseY = hPos.y + hPos.h + (isMobile ? 12 : 22);

      // Position Roqunuzzaman & You side-by-side beneath headline with ample clearance
      const spacing = isMobile ? 80 : 130;
      const centerX = Math.min(Math.max(slotPos.centerX, hPos.x + spacing + 10), hPos.x + hPos.w - spacing - 10);
      const c1X = centerX - spacing / 2 - 35;
      const c2X = centerX + spacing / 2 + 20;

      setCursorPos(cursorCristian, c1X, baseY, 0.55, 'cubic-bezier(0.16, 1, 0.3, 1)');
      setCursorPos(cursorSandra, c2X, baseY + 6, 0.6, 'cubic-bezier(0.16, 1, 0.3, 1)');

      // Gentle floating idle breathing
      let idleTick = 0;
      idleInterval = setInterval(() => {
        idleTick++;
        const hP = getRel(headlineEl);
        const bY = hP.y + hP.h + (isMobile ? 12 : 22);
        const off1 = Math.sin(idleTick * 0.45) * 2.8;
        const off2 = Math.cos(idleTick * 0.45) * 2.8;

        if (cursorCristian) cursorCristian.style.transform = `translate3d(${Math.round(c1X)}px, ${Math.round(bY + off1)}px, 0)`;
        if (cursorSandra) cursorSandra.style.transform = `translate3d(${Math.round(c2X)}px, ${Math.round(bY + 6 + off2)}px, 0)`;
      }, 150);

      // Fade out cursors at 3.6s
      addTimer(() => {
        hideAllCursors();
      }, 3600);

      // Seamlessly restart loop at 4.2s if footer remains fully open
      addTimer(() => {
        if (isFooterFullyOpen) {
          runCollabLoop();
        } else {
          stopCollabLoop();
        }
      }, 4200);

    }, 8100);
  }

  // Hook triggered when footer shutter completes full opening reveal
  window.__setCollabFooterOpenState = function(isOpen) {
    if (isOpen) {
      if (!isFooterFullyOpen) {
        isFooterFullyOpen = true;
        // Start motion smoothly once footer is fully open
        if (startTimeout) clearTimeout(startTimeout);
        startTimeout = setTimeout(() => {
          if (isFooterFullyOpen && !isLoopRunning) {
            runCollabLoop();
          }
        }, 220);
      }
    } else {
      if (isFooterFullyOpen || isLoopRunning) {
        isFooterFullyOpen = false;
        stopCollabLoop();
      }
    }
  };

  // Interactive manual triggers (only if footer is open)
  slotEl.addEventListener('click', () => {
    if (isFooterFullyOpen) {
      runCollabLoop();
    }
  });

  let resizeDebounce = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(() => {
      if (isFooterFullyOpen && isLoopRunning) runCollabLoop();
    }, 250);
  }, { passive: true });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        if (isFooterFullyOpen || isLoopRunning) {
          isFooterFullyOpen = false;
          stopCollabLoop();
        }
      }
    });
  }, { threshold: 0.1 });

  observer.observe(container);
}

/* ==========================================================================
   FRAMER 5-COLUMN SHUTTER CURTAIN FOOTER REVEAL SYSTEM
   Scroll-focused, butter-smooth, fully reversible physical shutter blind reveal
   ========================================================================== */
function initFooterShutterReveal() {
  const contactSection = document.getElementById('contact');
  const curtain = document.getElementById('footerShutterCurtain');
  const replayBtn = document.getElementById('shutterReplayTriggerBtn');

  if (!contactSection || !curtain) return;

  const blade1 = curtain.querySelector('.shutter-col-1 .shutter-blade');
  const blade2 = curtain.querySelector('.shutter-col-2 .shutter-blade');
  const blade3 = curtain.querySelector('.shutter-col-3 .shutter-blade');
  const blade4 = curtain.querySelector('.shutter-col-4 .shutter-blade');
  const blade5 = curtain.querySelector('.shutter-col-5 .shutter-blade');
  const colMetaEls = curtain.querySelectorAll('.shutter-col-meta');

  if (!blade1 || !blade2 || !blade3 || !blade4 || !blade5) return;

  let currentProgress = 0;
  let targetProgress = 0;
  let isAutomatedReplay = false;
  let isRunning = false;

  // Hermite smoothstep for velvet acceleration and deceleration
  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  // Calculate target progress directly from scroll position
  function updateScrollTarget() {
    if (isAutomatedReplay) return;

    const rect = contactSection.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const docHeight = document.documentElement.scrollHeight;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    // Contact section entry point:
    // Starts opening as contact top enters lower portion of viewport
    const startY = windowHeight * 0.95;
    // Fully open when contact top reaches upper portion of viewport
    const endY = windowHeight * 0.15;

    let progress = (startY - rect.top) / (startY - endY);

    // If user scrolled to the absolute bottom of page, ensure 100% open
    if (scrollY + windowHeight >= docHeight - 25) {
      progress = 1.0;
    }

    // If contact section is completely below viewport, ensure 0%
    if (rect.top >= startY) {
      progress = 0.0;
    }

    targetProgress = Math.max(0, Math.min(1, progress));
  }

  // Primary animation render frame (RAF)
  function renderFrame() {
    updateScrollTarget();

    // Velvety physical lerp damping (0.09 factor) for liquid inertia
    currentProgress += (targetProgress - currentProgress) * 0.09;

    if (Math.abs(targetProgress - currentProgress) < 0.0005) {
      currentProgress = targetProgress;
    }

    // Staggered Center-Outward Wave Ranges:
    // Column 3 (Center): opens earliest (0.00 -> 0.65)
    const p3 = Math.max(0, Math.min(1, currentProgress / 0.65));
    // Columns 2 & 4 (Inner): open next (0.16 -> 0.82)
    const p24 = Math.max(0, Math.min(1, (currentProgress - 0.16) / 0.66));
    // Columns 1 & 5 (Outer): open last (0.32 -> 1.00)
    const p15 = Math.max(0, Math.min(1, (currentProgress - 0.32) / 0.68));

    // Smoothstep curves for each wave stage
    const s3 = smoothstep(p3);
    const s24 = smoothstep(p24);
    const s15 = smoothstep(p15);

    // Set scaleY transforms (1 = closed, 0 = retracted open)
    blade3.style.transform = `scaleY(${(1 - s3).toFixed(4)})`;
    blade2.style.transform = `scaleY(${(1 - s24).toFixed(4)})`;
    blade4.style.transform = `scaleY(${(1 - s24).toFixed(4)})`;
    blade1.style.transform = `scaleY(${(1 - s15).toFixed(4)})`;
    blade5.style.transform = `scaleY(${(1 - s15).toFixed(4)})`;

    // Metadata labels and center studio badge fade and slide
    const metaAlpha = Math.max(0, 1 - currentProgress * 2.2);
    const metaY = -currentProgress * 40;
    for (let i = 0; i < colMetaEls.length; i++) {
      colMetaEls[i].style.opacity = metaAlpha.toFixed(3);
      colMetaEls[i].style.transform = `translateY(${metaY.toFixed(1)}px)`;
    }

    // Container visibility & Fully-Opened State detection:
    const isFullyOpen = currentProgress >= 0.985;
    if (isFullyOpen) {
      curtain.style.visibility = 'hidden';
      curtain.classList.add('is-open');
      if (typeof window.__setCollabFooterOpenState === 'function') {
        window.__setCollabFooterOpenState(true);
      }
    } else {
      curtain.style.visibility = 'visible';
      curtain.classList.remove('is-open');
      if (typeof window.__setCollabFooterOpenState === 'function') {
        window.__setCollabFooterOpenState(false);
      }
    }

    // Expose real-time shutter physics for cursor contrast
    window.__footerShutterState = { s3, s24, s15, currentProgress };

    // Dynamic one-by-one menu button inversion:
    // As the black shutter blade in Column 5 retracts upward, each menu button crosses
    // the blade's bottom edge and transitions color individually in sync with the physical reveal!
    const cRect = contactSection.getBoundingClientRect();
    const blade5Bottom = cRect.top + cRect.height * (1 - s15);

    const navButtons = document.querySelectorAll('.nav-btn');
    for (let i = 0; i < navButtons.length; i++) {
      const btn = navButtons[i];
      const bRect = btn.getBoundingClientRect();
      const btnCenterY = bRect.top + bRect.height * 0.5;

      if (btnCenterY >= cRect.top && btnCenterY <= cRect.bottom && btnCenterY >= blade5Bottom) {
        btn.classList.add('nav-btn-inverted');
      } else {
        btn.classList.remove('nav-btn-inverted');
      }
    }

    const topLinks = document.querySelectorAll('.top-links-overlay .overlay-link');
    for (let i = 0; i < topLinks.length; i++) {
      const link = topLinks[i];
      const lRect = link.getBoundingClientRect();
      const linkCenterY = lRect.top + lRect.height * 0.5;

      if (linkCenterY >= cRect.top && linkCenterY <= cRect.bottom && linkCenterY >= blade5Bottom) {
        link.classList.add('link-inverted');
      } else {
        link.classList.remove('link-inverted');
      }
    }

    requestAnimationFrame(renderFrame);
  }

  // Interactive Replay Button Animation
  if (replayBtn) {
    replayBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (isAutomatedReplay) return;

      isAutomatedReplay = true;
      const startTime = performance.now();

      // Step 1: Smoothly animate targetProgress from current to 0 (shutters close in reverse)
      // Step 2: Pause briefly
      // Step 3: Smoothly animate targetProgress from 0 to 1 (shutters open in center wave)
      const startProg = currentProgress;
      const closeDuration = 800; // ms
      const holdDuration = 250;  // ms
      const openDuration = 1200; // ms

      function animateReplay(now) {
        const elapsed = now - startTime;

        if (elapsed < closeDuration) {
          const t = elapsed / closeDuration;
          targetProgress = startProg * (1 - smoothstep(t));
          requestAnimationFrame(animateReplay);
        } else if (elapsed < closeDuration + holdDuration) {
          targetProgress = 0;
          requestAnimationFrame(animateReplay);
        } else if (elapsed < closeDuration + holdDuration + openDuration) {
          const t = (elapsed - closeDuration - holdDuration) / openDuration;
          targetProgress = smoothstep(t);
          requestAnimationFrame(animateReplay);
        } else {
          targetProgress = 1;
          setTimeout(() => {
            isAutomatedReplay = false;
          }, 300);
        }
      }

      requestAnimationFrame(animateReplay);
    });
  }

  // Window scroll & resize listeners to instantly wake up target
  window.addEventListener('scroll', updateScrollTarget, { passive: true });
  window.addEventListener('resize', updateScrollTarget, { passive: true });

  // Initial calculation and start RAF loop
  updateScrollTarget();
  currentProgress = targetProgress;
  requestAnimationFrame(renderFrame);
}

