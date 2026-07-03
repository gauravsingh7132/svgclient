/* =========================================================================
   SVG GOLF AVENUE — MAIN.JS
   Clean ES6, no dependencies. Sections:
   1. Config
   2. Utilities (throttle/debounce)
   3. Header scroll state
   4. Scroll reveal + counters (IntersectionObserver)
   5. Countdown timer
   6. Modals & popups (event delegation)
   7. WhatsApp form submit
   8. ROI calculator
   9. Site visit booking
   10. Scarcity ticker
   11. Live activity feed
   12. Exit intent
   ========================================================================= */
(() => {
  'use strict';

  /* ---------- 1. Config ---------- */
  const WHATSAPP_NUMBER = '916398921556';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 2. Utilities ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function throttleRaf(fn) {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        fn(...args);
        ticking = false;
      });
    };
  }

  function waLink(message) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  /* ---------- 3. Header scroll state ---------- */
  const header = $('header.main');
  if (header) {
    const onScroll = throttleRaf(() => {
      header.classList.toggle('scrolled', window.scrollY > 30);
    });
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- 3b. Mobile nav toggle ---------- */
  (() => {
    const toggle = $('#navToggle');
    const nav = $('#mobileNav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.hidden = !open;
    }

    toggle.addEventListener('click', () => setOpen(nav.hidden));
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !nav.hidden) setOpen(false);
    });
  })();

  /* ---------- 4. Scroll reveal + counters ---------- */
  if (prefersReducedMotion) {
    $$('.reveal, .signature-svg').forEach((el) => el.classList.add('in'));
  } else {
    const revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            revealIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    $$('.reveal, .signature-svg').forEach((el) => revealIO.observe(el));
  }

  const counterIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const duration = 1400;
        let start = null;

        function step(ts) {
          if (start === null) start = ts;
          const progress = Math.min((ts - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);
          el.textContent = prefix + Math.round(eased * target).toLocaleString('en-IN') + suffix;
          if (progress < 1) requestAnimationFrame(step);
        }

        if (prefersReducedMotion) {
          el.textContent = prefix + target.toLocaleString('en-IN') + suffix;
        } else {
          requestAnimationFrame(step);
        }
        counterIO.unobserve(el);
      });
    },
    { threshold: 0.4 }
  );
  $$('[data-count]').forEach((el) => counterIO.observe(el));

  /* ---------- 5. Countdown timer ---------- */
  (() => {
    const daysEl = $('#cd-days');
    if (!daysEl) return;
    const target = new Date();
    target.setDate(target.getDate() + 15);
    target.setHours(23, 59, 59, 0);

    const pad = (n) => String(n).padStart(2, '0');
    const fields = {
      days: $('#cd-days'),
      hours: $('#cd-hours'),
      mins: $('#cd-mins'),
      secs: $('#cd-secs'),
    };

    function tick() {
      const diff = Math.max(target - new Date(), 0);
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      fields.days.textContent = pad(d);
      fields.hours.textContent = pad(h);
      fields.mins.textContent = pad(m);
      fields.secs.textContent = pad(s);
    }
    tick();
    setInterval(tick, 1000);
  })();

  /* ---------- 6. Modals & popups (event delegation) ---------- */
  function openOverlay(el) {
    if (el) el.classList.add('show');
  }
  function closeOverlay(el) {
    if (el) el.classList.remove('show');
  }

  document.addEventListener('click', (e) => {
    const openTarget = e.target.closest('[data-open]');
    if (openTarget) {
      openOverlay($('#' + openTarget.dataset.open));
      return;
    }
    const closeTarget = e.target.closest('[data-close]');
    if (closeTarget) {
      closeOverlay($('#' + closeTarget.dataset.close));
      return;
    }
    // click on overlay backdrop closes it
    if (e.target.matches('.modal-bg, .faq-popup-bg, #exitPopup')) {
      closeOverlay(e.target);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      $$('.modal-bg.show, .faq-popup-bg.show, #exitPopup.show').forEach(closeOverlay);
    }
  });

  /* FAQ popup — triggers once, when the FAQ section enters view */
  const faqSection = $('#faq');
  const faqPopup = $('#faqPopup');
  if (faqSection && faqPopup) {
    let shown = false;
    const faqIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !shown) {
            shown = true;
            setTimeout(() => openOverlay(faqPopup), 600);
            faqIO.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    faqIO.observe(faqSection);
  }

  /* ---------- 7. WhatsApp form submit ---------- */
  function submitToWhatsApp(e) {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const get = (k) => (data.get(k) || '').toString().trim();

    let msg = 'Hello! I am interested in SVG Golf Avenue, Site-C Greater Noida.\n\n';
    msg += `Name: ${get('name')}\n`;
    msg += `Phone: ${get('phone')}\n`;
    if (get('interest')) msg += `Interested In: ${get('interest')}\n`;
    if (get('budget')) msg += `Budget: ${get('budget')}\n`;
    if (get('query')) msg += `Query: ${get('query')}\n`;
    msg += '\nPlease share the latest price list and floor plan. Thank you!';

    window.open(waLink(msg), '_blank', 'noopener');
    $$('.modal-bg.show, .faq-popup-bg.show').forEach(closeOverlay);
    form.reset();
    return false;
  }
  $$('form[data-wa-form]').forEach((form) => form.addEventListener('submit', submitToWhatsApp));

  /* ---------- 8. ROI calculator ---------- */
  (() => {
    const invSlider = $('#invSlider');
    if (!invSlider) return;
    const holdSlider = $('#holdSlider');
    const yieldSlider = $('#yieldSlider');
    const appSlider = $('#appSlider');
    const chart = $('#roiChart');
    const barColors = ['#6D28D9', '#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE', '#F5F3FF', '#4ADE80', '#22C55E'];

    function fmtCr(lac) {
      return lac >= 100 ? `₹${(lac / 100).toFixed(2)} Cr` : `₹${Math.round(lac)}L`;
    }

    function calcROI() {
      const inv = parseInt(invSlider.value, 10);
      const hold = parseInt(holdSlider.value, 10);
      const yld = parseFloat(yieldSlider.value) / 100;
      const app = parseFloat(appSlider.value) / 100;

      $('#invAmt').textContent = `₹${inv} Lac`;
      $('#holdPeriod').textContent = `${hold} Year${hold > 1 ? 's' : ''}`;
      $('#yieldPct').textContent = `${(yld * 100).toFixed(0)}%`;
      $('#appPct').textContent = `${(app * 100).toFixed(0)}%`;

      const rental = inv * yld * hold;
      const finalProp = inv * Math.pow(1 + app, hold);
      const capGain = finalProp - inv;
      const total = rental + capGain;
      const roi = Math.round((total / inv) * 100);

      $('#rentalIncome').textContent = fmtCr(rental);
      $('#capitalGain').textContent = fmtCr(capGain);
      $('#totalReturn').textContent = fmtCr(total);
      $('#roiPct').textContent = `${roi}%`;
      $('#finalVal').textContent = fmtCr(finalProp);
      $('#invRef').textContent = `₹${inv}L`;

      chart.innerHTML = '';
      const frag = document.createDocumentFragment();
      for (let yr = 1; yr <= hold; yr++) {
        const val = inv * Math.pow(1 + app, yr);
        const h = Math.max(20, Math.round((val / finalProp) * 160));
        const wrap = document.createElement('div');
        wrap.className = 'roi-bar-wrap';
        wrap.innerHTML = `<div class="roi-bar-val">${fmtCr(val)}</div><div class="roi-bar" style="height:${h}px;background:linear-gradient(180deg,${barColors[Math.min(yr - 1, 9)]},${barColors[Math.min(yr, 9)]})"></div><div class="roi-bar-lbl">Yr ${yr}</div>`;
        frag.appendChild(wrap);
      }
      chart.appendChild(frag);
    }

    [invSlider, holdSlider, yieldSlider, appSlider].forEach((slider) =>
      slider.addEventListener('input', calcROI)
    );
    calcROI();
  })();

  /* ---------- 9. Site visit booking ---------- */
  (() => {
    const grid = $('#dateGrid');
    if (!grid) return;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Always computed from the visitor's current date/time (IST on Indian devices) —
    // this list re-generates itself on every page load, so it never goes stale.
    const today = new Date();
    const monthsSeen = new Set([monthNames[today.getMonth()] + ' ' + today.getFullYear()]);
    const monthLabel = $('#dateMonthLabel');
    const moreBtn = $('#moreDatesBtn');
    const MAX_DAYS_AHEAD = 60; // don't offer bookings more than 2 months out
    let dayOffset = 0; // how many calendar days we've already scanned past "today"
    let lastMonthRendered = today.getMonth();

    function renderBatch(count) {
      const frag = document.createDocumentFragment();
      let added = 0;
      while (added < count && dayOffset < MAX_DAYS_AHEAD) {
        dayOffset++;
        const d = new Date(today);
        d.setDate(today.getDate() + dayOffset);
        if (d.getDay() === 0) continue; // skip Sunday (site closed)

        const monthChanged = d.getMonth() !== lastMonthRendered;
        lastMonthRendered = d.getMonth();
        monthsSeen.add(monthNames[d.getMonth()] + ' ' + d.getFullYear());

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'date-btn';
        btn.dataset.iso = d.toISOString().slice(0, 10);
        btn.innerHTML = `<span class="day">${dayNames[d.getDay()]}</span><span class="num">${d.getDate()}${monthChanged || added === 0 ? ' ' + monthNames[d.getMonth()] : ''}</span>`;
        frag.appendChild(btn);
        added++;
      }
      grid.appendChild(frag);
      if (monthLabel) monthLabel.textContent = '· ' + Array.from(monthsSeen).join(' – ');
      if (moreBtn && dayOffset >= MAX_DAYS_AHEAD) {
        moreBtn.textContent = 'No further dates available';
        moreBtn.disabled = true;
      }
    }

    renderBatch(7);
    if (moreBtn) moreBtn.addEventListener('click', () => renderBatch(7));

    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.date-btn');
      if (!btn) return;
      $$('.date-btn', grid).forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });

    const timeGrid = $('.time-grid');
    if (timeGrid) {
      timeGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.time-btn');
        if (!btn || btn.classList.contains('disabled')) return;
        $$('.time-btn', timeGrid).forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    }

    const bookBtn = $('#bookSiteVisitBtn');
    if (bookBtn) {
      bookBtn.addEventListener('click', () => {
        const name = $('#svName').value.trim();
        const phone = $('#svPhone').value.trim();
        const city = $('#svCity').value.trim();
        const dateEl = $('.date-btn.active', grid);
        const timeEl = $('.time-btn.active', timeGrid);

        if (!name || !phone) {
          alert('Please enter your name and mobile number.');
          return;
        }
        const dateStr = dateEl
          ? `${$('.day', dateEl).textContent} ${$('.num', dateEl).textContent.replace(/\s+\w{3}$/, '')} (${dateEl.dataset.iso})`
          : 'any day';
        const timeStr = timeEl ? timeEl.textContent : 'any time';

        let msg = 'Hi! I want to book a site visit for SVG Golf Avenue.\n\n';
        msg += `Name: ${name}\n`;
        msg += `Phone: ${phone}\n`;
        msg += `Date: ${dateStr}\n`;
        msg += `Time: ${timeStr}\n`;
        if (city) msg += `Pickup from: ${city}\n`;
        msg += '\nPlease confirm my visit. Thank you!';

        window.open(waLink(msg), '_blank', 'noopener');
      });
    }
  })();

  /* ---------- 10. Scarcity ticker (slow, realistic decrement) ---------- */
  (() => {
    const el = $('#unitsLeft');
    if (!el) return;
    let unitCount = parseInt(el.textContent, 10) || 6;
    setInterval(() => {
      if (Math.random() < 0.01 && unitCount > 1) {
        unitCount--;
        el.textContent = unitCount;
      }
    }, 30000);
  })();

  /* ---------- 11. Live activity feed ---------- */
  (() => {
    const feed = $('#activityFeed');
    if (!feed) return;
    const activities = [
      { av: '👨', name: 'Rajesh K.', city: 'Noida', action: 'just booked a site visit', time: '2 min ago' },
      { av: '👩', name: 'Priya S.', city: 'Delhi', action: 'enquired about Studio Apt', time: '5 min ago' },
      { av: '👨', name: 'Amit V.', city: 'Gurgaon', action: 'downloaded price list', time: '8 min ago' },
      { av: '👩', name: 'Sunita M.', city: 'Faridabad', action: 'requested callback', time: '11 min ago' },
      { av: '👨', name: 'Vikram R.', city: 'Greater Noida', action: 'booked a site visit', time: '15 min ago' },
      { av: '👩', name: 'Kavita P.', city: 'Indirapuram', action: 'enquired about retail shop', time: '18 min ago' },
      { av: '👨', name: 'Deepak T.', city: 'Ghaziabad', action: 'downloaded floor plan', time: '22 min ago' },
      { av: '👩', name: 'Neha G.', city: 'Dwarka', action: 'just booked a site visit', time: '26 min ago' },
    ];
    let idx = 0;

    function showNext() {
      const a = activities[idx % activities.length];
      idx++;
      const pill = document.createElement('div');
      pill.className = 'activity-pill';
      pill.setAttribute('role', 'status');
      pill.innerHTML = `<div class="av">${a.av}</div><div class="txt"><strong>${a.name} from ${a.city}</strong><span>${a.action} · ${a.time}</span></div><div class="dot-live"></div>`;
      feed.appendChild(pill);
      requestAnimationFrame(() => pill.classList.add('show'));
      setTimeout(() => {
        pill.classList.remove('show');
        setTimeout(() => pill.remove(), 500);
      }, 5000);
    }

    if (!prefersReducedMotion) {
      setTimeout(() => {
        showNext();
        setInterval(showNext, 9000);
      }, 6000);
    }
  })();

  /* ---------- 12. Exit intent ---------- */
  (() => {
    const popup = $('#exitPopup');
    if (!popup) return;
    let shown = false;

    document.addEventListener('mouseleave', (e) => {
      if (e.clientY < 10 && !shown) {
        shown = true;
        openOverlay(popup);
      }
    });

    if (window.innerWidth < 780) {
      setTimeout(() => {
        if (!shown) {
          shown = true;
          openOverlay(popup);
        }
      }, 45000);
    }

    const exitWaBtn = $('#exitWaBtn');
    if (exitWaBtn) {
      exitWaBtn.addEventListener('click', () => {
        window.open(
          waLink('Hi! I was on your website and want the price list for SVG Golf Avenue — please share details.'),
          '_blank',
          'noopener'
        );
        closeOverlay(popup);
      });
    }
  })();
})();
