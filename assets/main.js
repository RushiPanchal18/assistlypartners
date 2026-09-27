document.documentElement.classList.add('js');

(function () {
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Mobile drawer
  var toggle = document.querySelector('.menu-toggle');
  var drawer = document.querySelector('.mobile-drawer');
  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        drawer.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  // Desktop dropdowns
  document.querySelectorAll('.dropdown').forEach(function (dd) {
    var btn = dd.querySelector('button');
    var panel = dd.querySelector('.dropdown-panel');
    if (!btn || !panel) return;
    var close = function () {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    };
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = panel.classList.contains('open');
      document.querySelectorAll('.dropdown-panel.open').forEach(function (p) { p.classList.remove('open'); });
      if (!open) {
        panel.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      } else {
        close();
      }
    });
    dd.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  });
  document.addEventListener('click', function () {
    document.querySelectorAll('.dropdown-panel.open').forEach(function (p) {
      p.classList.remove('open');
      var b = p.parentElement.querySelector('button');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  });

  // Scroll reveal
  var reveals = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
    // Anything already in view on load reveals immediately
    window.setTimeout(function () {
      reveals.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) el.classList.add('in');
      });
    }, 60);
  }

  // Stat counters
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var statNums = document.querySelectorAll('.stat-num[data-count]');
  if (statNums.length) {
    var animateCount = function (el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduceMotion) { el.textContent = prefix + target + suffix; return; }
      var start = null;
      var duration = 1100;
      var step = function (ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = prefix + Math.round(eased * target) + suffix;
        if (progress < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) {
      statNums.forEach(animateCount);
    } else {
      var statIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            statIo.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      statNums.forEach(function (el) { statIo.observe(el); });
    }
  }

  // Contact form: client-side validation + Netlify-friendly submit state
  var form = document.querySelector('form[data-contact]');
  if (form) {
    var status = form.querySelector('.form-status');
    form.addEventListener('submit', function (e) {
      var invalid = form.querySelector(':invalid');
      if (invalid) {
        e.preventDefault();
        invalid.focus();
        if (status) {
          status.textContent = 'Please complete the highlighted fields before sending.';
          status.style.color = '#B42318';
        }
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending…';
      }
      if (status) {
        status.textContent = 'Sending your request…';
        status.style.color = '';
      }
    });
  }
})();
