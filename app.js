// Smooth Scroll Navigation & Observer Logic
document.addEventListener('DOMContentLoaded', () => {
  initPortfolioLoader();
  initHeroTypewriter();
  initThemeToggle();
  initScrollNav();
  initMobileMenu();
  initNoirCompanion();
  initCustomCursor();
});

/* ==========================================================================
   THEME TOGGLE SYSTEM (DARK / LIGHT MODE)
   ========================================================================== */
function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggle');
  if (!toggleBtn) return;

  function updateToggleAria(theme) {
    const isLight = theme === 'light';
    toggleBtn.setAttribute('aria-checked', isLight ? 'true' : 'false');
    toggleBtn.setAttribute('title', isLight ? 'Turn off the lights (Switch to Dark Mode)' : 'Turn on the lights (Switch to Light Mode)');
  }

  // Initial check
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  updateToggleAria(currentTheme);

  toggleBtn.addEventListener('click', () => {
    // Trigger physical cord pull-down animation
    toggleBtn.classList.remove('pulling');
    void toggleBtn.offsetWidth;
    toggleBtn.classList.add('pulling');

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
  });

  // Listen to system changes if user hasn't explicitly set localStorage
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
}


function scrollToSection(id) {
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}

function initScrollNav() {
  const bottomNav = document.getElementById('bottomNav');
  const sections = document.querySelectorAll('section[id]');
  const navButtons = document.querySelectorAll('.nav-btn');

  // Show bottom navigation on scroll down from hero
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      bottomNav.classList.add('visible');
    } else {
      bottomNav.classList.remove('visible');
    }
  });

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
      "Offx OTC flow... high-stakes institutional trading where every millisecond counts.",
      "Pricing, compliance, and terms brought right to the decision point. Clean execution.",
      "Notice how density doesn't compromise speed here. Total operator confidence."
    ],
    selected: [
      "Selected case files: blockchain AI bots, data builders, enterprise cloud consoles.",
      "Four diverse products, one common thread: ruthlessly eliminating complexity.",
      "Clean systems that scale. The evidence is right here on the table."
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

      // Condition for section's last line/bottom being fully opened in viewport:
      // - The bottom edge has reached the screen (rect.bottom <= vh + 50)
      // - The section hasn't scrolled completely off above (rect.bottom >= 120)
      // - The section is the primary focused section on screen (rect.top < vh * 0.65)
      if (rect.bottom <= vh + 50 && rect.bottom >= 120 && rect.top < vh * 0.65) {
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
  document.addEventListener('mouseover', (e) => {
    const target = e.target;
    if (!target) return;
    const isInteractive = target.closest('a, button, [role="button"], input, textarea, select, .pill-tag, .filter-chip, .overlay-link, .nav-btn, .hero-btn, .stack-item, .noir-body, .theme-bulb-toggle, .project-card');
    if (isInteractive) {
      isHovering = true;
      targetDotRadius = 6.2;
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target;
    if (!target) return;
    const isInteractive = target.closest('a, button, [role="button"], input, textarea, select, .pill-tag, .filter-chip, .overlay-link, .nav-btn, .hero-btn, .stack-item, .noir-body, .theme-bulb-toggle, .project-card');
    if (isInteractive) {
      const related = e.relatedTarget;
      if (related && related.closest && related.closest('a, button, [role="button"], input, textarea, select, .pill-tag, .filter-chip, .overlay-link, .nav-btn, .hero-btn, .stack-item, .noir-body, .theme-bulb-toggle, .project-card')) {
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

      const isLight = document.documentElement.getAttribute('data-theme') === 'light';

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


