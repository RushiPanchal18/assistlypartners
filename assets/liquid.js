/* Assistly Partners — Liquid designs
   Chrome metaballs in the page headers, dark/light toggle (Liquid Chrome),
   scroll drip (Molten Gold), and the hover effects. */
(function () {
  var root = document.documentElement;
  var design = root.getAttribute('data-design');
  if (!design) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  /* ------------------------------------------------ environments */
  function hex(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function buildRamp(stops) {
    var out = new Uint8ClampedArray(256 * 3);
    for (var i = 0; i < 256; i++) {
      var t = i / 255 * 2 - 1, k = 0;
      while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
      var a = stops[k], b = stops[k + 1];
      var u = Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0])));
      var ca = hex(a[1]), cb = hex(b[1]);
      for (var c = 0; c < 3; c++) out[i * 3 + c] = ca[c] + (cb[c] - ca[c]) * u;
    }
    return out;
  }
  // Studio lighting: bright sky, hard horizon, dark floor, coloured bounce light
  var ENV = {
    chromeDark: {
      ramp: buildRamp([[-1, '#FFFFFF'], [-0.55, '#DCE3EE'], [-0.2, '#7D93B6'], [-0.04, '#2A4A7F'], [0.02, '#081226'], [0.4, '#1E3A66'], [0.72, '#3A4E73'], [1, '#E3A008']]),
      rim: [227, 160, 8]
    },
    chromeLight: {
      ramp: buildRamp([[-1, '#FFFFFF'], [-0.5, '#EEF2F7'], [-0.18, '#A9B8CE'], [-0.03, '#2A4A7F'], [0.03, '#0B1A33'], [0.35, '#3B5584'], [0.72, '#C9D2DF'], [1, '#E3A008']]),
      rim: [227, 160, 8]
    },
    gold: {
      ramp: buildRamp([[-1, '#FFFFFF'], [-0.6, '#FFF1C7'], [-0.25, '#F5C542'], [-0.05, '#B07C06'], [0.02, '#1A1206'], [0.4, '#4A3408'], [0.72, '#1E3A66'], [1, '#6D83A6']]),
      rim: [70, 120, 210]
    }
  };
  function env() {
    if (design === 'gold') return ENV.gold;
    return root.getAttribute('data-look') === 'light' ? ENV.chromeLight : ENV.chromeDark;
  }

  /* ------------------------------------------------ liquid stage */
  var scrollDrip = 0;
  if (design === 'gold') {
    window.addEventListener('scroll', function () { scrollDrip = Math.min(1.6, window.scrollY / 380); }, { passive: true });
  }

  function Liquid(stage, kind) {
    var self = this;
    this.stage = stage;
    this.kind = kind;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'liquid-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    stage.insertBefore(this.canvas, stage.firstChild);
    this.ctx = this.canvas.getContext('2d');
    this.visible = true;
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0, r: 0, tr: 0 };
    this.resize();

    if ('ResizeObserver' in window) {
      var t;
      new ResizeObserver(function () { clearTimeout(t); t = setTimeout(function () { self.resize(); self.render(performance.now()); }, 120); }).observe(stage);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { self.visible = es[0].isIntersecting; }).observe(stage);
    }
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var x = (e.clientX - r.left) * self.scale;
      // No glass panel protects the text on inner pages or in Molten Gold,
      // so the droplet only appears over the empty right side there.
      var guarded = (self.kind === 'page' || design === 'gold') && r.width > 900;
      if (guarded && x < self.W * (self.kind === 'page' ? 0.68 : 0.58)) { self.pointer.tr = 0; return; }
      self.pointer.tx = x;
      self.pointer.ty = (e.clientY - r.top) * self.scale;
      self.pointer.tr = self.kind === 'hero' ? Math.min(self.W, self.H) * (self.narrow ? 0.12 : 0.07) : self.H * 0.15;
    });
    stage.addEventListener('pointerleave', function () { self.pointer.tr = 0; });
  }

  Liquid.prototype.resize = function () {
    var rect = this.stage.getBoundingClientRect();
    var wide = rect.width > 900;
    this.scale = wide ? 0.46 : 0.5;
    this.W = Math.max(60, Math.round(rect.width * this.scale));
    this.H = Math.max(60, Math.round(rect.height * this.scale));
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.img = this.ctx.createImageData(this.W, this.H);
    var W = this.W, H = this.H, R = Math.min(W, H);
    this.narrow = !wide;
    if (this.kind === 'hero' && !wide) {
      // Phones and tablets: the metal gets its own zone between the buttons and the stat bar
      var sb = this.stage.querySelector('.stat-bar');
      var cy = (sb ? sb.getBoundingClientRect().top - rect.top - 165 : rect.height * 0.8) * this.scale;
      var Z = Math.min(W, 260 * this.scale);
      this.balls = [
        { hx: W * 0.55, hy: cy, r: Z * 0.34, ax: Z * 0.15, ay: Z * 0.08, fx: 0.00031, fy: 0.00043, p: 0.0 },
        { hx: W * 0.36, hy: cy + Z * 0.12, r: Z * 0.24, ax: Z * 0.12, ay: Z * 0.08, fx: 0.00047, fy: 0.00029, p: 1.7 },
        { hx: W * 0.74, hy: cy - Z * 0.10, r: Z * 0.20, ax: Z * 0.10, ay: Z * 0.07, fx: 0.00039, fy: 0.00051, p: 3.1 },
        { hx: W * 0.20, hy: cy - Z * 0.14, r: Z * 0.12, ax: Z * 0.08, ay: Z * 0.06, fx: 0.00055, fy: 0.00037, p: 4.4 },
        { hx: W * 0.86, hy: cy + Z * 0.18, r: Z * 0.12, ax: Z * 0.08, ay: Z * 0.06, fx: 0.00061, fy: 0.00049, p: 5.3 }
      ];
      this.pointer.x = this.pointer.tx = W * 0.5;
      this.pointer.y = this.pointer.ty = cy;
    } else if (this.kind === 'hero') {
      var right = 0.74;
      this.balls = [
        { hx: W * right, hy: H * 0.44, r: R * 0.145, ax: W * 0.05, ay: H * 0.06, fx: 0.00031, fy: 0.00043, p: 0.0 },
        { hx: W * (right + 0.1), hy: H * 0.60, r: R * 0.105, ax: W * 0.04, ay: H * 0.08, fx: 0.00047, fy: 0.00029, p: 1.7 },
        { hx: W * (right - 0.08), hy: H * 0.68, r: R * 0.08, ax: W * 0.06, ay: H * 0.05, fx: 0.00039, fy: 0.00051, p: 3.1 },
        { hx: W * (right + 0.15), hy: H * 0.28, r: R * 0.065, ax: W * 0.03, ay: H * 0.05, fx: 0.00055, fy: 0.00037, p: 4.4 },
        { hx: W * 0.04, hy: H * 0.94, r: R * 0.12, ax: W * 0.03, ay: H * 0.03, fx: 0.00027, fy: 0.00035, p: 2.2 },
        { hx: W * (right - 0.18), hy: H * 0.30, r: R * 0.05, ax: W * 0.04, ay: H * 0.04, fx: 0.00061, fy: 0.00049, p: 5.3 }
      ];
      this.pointer.x = this.pointer.tx = W * (right - 0.05);
      this.pointer.y = this.pointer.ty = H * 0.45;
    } else {
      this.balls = [
        { hx: W * 0.87, hy: H * 0.48, r: H * 0.26, ax: W * 0.02, ay: H * 0.07, fx: 0.00033, fy: 0.00045, p: 0.0 },
        { hx: W * 0.95, hy: H * 0.76, r: H * 0.17, ax: W * 0.015, ay: H * 0.06, fx: 0.00049, fy: 0.00031, p: 1.9 },
        { hx: W * 0.80, hy: H * 0.26, r: H * 0.12, ax: W * 0.02, ay: H * 0.06, fx: 0.00041, fy: 0.00053, p: 3.3 },
        { hx: W * 0.98, hy: H * 0.16, r: H * 0.10, ax: W * 0.01, ay: H * 0.05, fx: 0.00057, fy: 0.00039, p: 4.6 }
      ];
      this.pointer.x = this.pointer.tx = W * 0.85;
      this.pointer.y = this.pointer.ty = H * 0.5;
    }
  };

  Liquid.prototype.render = function (time) {
    var W = this.W, H = this.H, data = this.img.data, balls = this.balls;
    var e = env(), RAMP = e.ramp, rimR = e.rim[0] * 0.58, rimG = e.rim[1] * 0.58, rimB = e.rim[2] * 0.58;
    var drip = this.kind === 'hero' ? scrollDrip : 0;
    var bx = [], by = [], br2 = [], n = balls.length, i;
    for (i = 0; i < n; i++) {
      var b = balls[i];
      bx.push(b.hx + Math.sin(time * b.fx + b.p) * b.ax);
      by.push(b.hy + Math.cos(time * b.fy + b.p) * b.ay + drip * b.r * (0.6 + (i % 3) * 0.9));
      br2.push(b.r * b.r);
    }
    var p = this.pointer;
    p.x += (p.tx - p.x) * 0.12;
    p.y += (p.ty - p.y) * 0.12;
    p.r += (p.tr - p.r) * 0.08;
    if (p.r > 0.5) { bx.push(p.x); by.push(p.y); br2.push(p.r * p.r); n++; }

    var S = Math.min(W, H) * (this.kind === 'hero' ? 0.34 : 0.6);
    var Lx = -0.42, Ly = -0.62, Lz = 0.66;   // key light, upper left
    var Ax = 0.55, Ay = 0.55, Az = 0.63;     // bounce light, lower right
    var o = 0;
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++, o += 4) {
        var f = 0, gx = 0, gy = 0;
        for (var j = 0; j < n; j++) {
          var dx = x - bx[j], dy = y - by[j];
          var d2 = dx * dx + dy * dy + 1;
          var q = br2[j] / d2;
          f += q;
          var g = q / d2;
          gx -= g * dx; gy -= g * dy;
        }
        if (f < 0.94) { data[o + 3] = 0; continue; }
        var nx = -gx * S, ny = -gy * S, nz = 1;
        var inv = 1 / Math.sqrt(nx * nx + ny * ny + 1);
        nx *= inv; ny *= inv; nz *= inv;
        var t = 2 * nz * ny * 0.92 + 2 * nz * nx * 0.14;
        if (t < -1) t = -1; else if (t > 1) t = 1;
        var ri = ((t + 1) * 127.5) | 0;
        var spec = nx * Lx + ny * Ly + nz * Lz; spec = spec > 0 ? Math.pow(spec, 48) * 255 : 0;
        var rim = nx * Ax + ny * Ay + nz * Az; rim = rim > 0 ? Math.pow(rim, 6) : 0;
        data[o] = RAMP[ri * 3] + spec + rim * rimR;
        data[o + 1] = RAMP[ri * 3 + 1] + spec + rim * rimG;
        data[o + 2] = RAMP[ri * 3 + 2] + spec + rim * rimB;
        var a = (f - 0.94) / 0.1;
        data[o + 3] = a >= 1 ? 255 : a * 255;
      }
    }
    this.ctx.putImageData(this.img, 0, 0);
  };

  var stages = [];
  var hero = document.querySelector('.hero');
  if (hero) stages.push(new Liquid(hero, 'hero'));
  var pageHero = document.querySelector('.page-hero');
  if (pageHero) stages.push(new Liquid(pageHero, 'page'));

  function renderAll(time) { stages.forEach(function (s) { s.render(time); }); }
  renderAll(4000);

  if (!reduce && stages.length) {
    var last = 0;
    (function loop(ts) {
      if (!document.hidden && ts - last > 30) {
        last = ts;
        stages.forEach(function (s) { if (s.visible) s.render(ts); });
      }
      requestAnimationFrame(loop);
    })(0);
  }

  /* ------------------------------------------------ dark / light toggle */
  var toggle = document.getElementById('lookToggle');
  if (toggle) {
    var meta = document.querySelector('meta[name="theme-color"]');
    var sync = function () {
      var light = root.getAttribute('data-look') === 'light';
      toggle.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
      if (meta) meta.setAttribute('content', light ? '#F6F4EF' : '#070D1A');
    };
    var apply = function (look) {
      root.setAttribute('data-look', look);
      try { localStorage.setItem('assistly-look', look); } catch (e) {}
      sync();
      renderAll(performance.now());
    };
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-look') === 'light' ? 'dark' : 'light';
      if (!document.startViewTransition || reduce) { apply(next); return; }
      var r = toggle.getBoundingClientRect();
      var x = r.left + r.width / 2, y = r.top + r.height / 2;
      var R = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      var vt = document.startViewTransition(function () { apply(next); });
      vt.ready.then(function () {
        root.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + R + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 700, easing: 'cubic-bezier(.4, 0, .2, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(function () {});
    });
    sync();
  }

  /* ------------------------------------------------ nav pill */
  var links = document.querySelector('.nav-links');
  if (links) {
    var pill = document.createElement('span');
    pill.className = 'nav-pill';
    links.insertBefore(pill, links.firstChild);
    var current = null;
    links.querySelectorAll(':scope > a, .dropdown > button').forEach(function (el) {
      var show = function () {
        var lr = links.getBoundingClientRect(), er = el.getBoundingClientRect();
        pill.style.left = (er.left - lr.left) + 'px';
        pill.style.width = er.width + 'px';
        pill.style.opacity = '1';
        if (current) current.classList.remove('pilled');
        el.classList.add('pilled');
        current = el;
      };
      el.addEventListener('mouseenter', show);
      el.addEventListener('focus', show);
    });
    links.addEventListener('mouseleave', function () {
      pill.style.opacity = '0';
      if (current) { current.classList.remove('pilled'); current = null; }
    });
  }

  /* ------------------------------------------------ magnetic buttons */
  document.querySelectorAll('.btn').forEach(function (btn) {
    btn.addEventListener('pointermove', function (e) {
      var r = btn.getBoundingClientRect();
      var mx = e.clientX - r.left, my = e.clientY - r.top;
      btn.style.setProperty('--mx', (mx / r.width * 100) + '%');
      btn.style.setProperty('--my', (my / r.height * 100) + '%');
      if (finePointer && !reduce) {
        btn.style.transform = 'translate(' + ((mx - r.width / 2) * 0.2) + 'px,' + ((my - r.height / 2) * 0.3) + 'px)';
      }
    });
    btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
  });

  /* ------------------------------------------------ cursor light + tilt */
  document.querySelectorAll('.card, .spotlight, .tier, .quote, .compare-col').forEach(function (el) {
    var tilt = el.matches('a.card, a.spotlight') && finePointer && !reduce;
    var resting = el.matches('.tier') ? null : '-40%';
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', (px * 100) + '%');
      el.style.setProperty('--my', (py * 100) + '%');
      if (tilt) {
        el.style.setProperty('--rx', ((0.5 - py) * 8) + 'deg');
        el.style.setProperty('--ry', ((px - 0.5) * 10) + 'deg');
      }
    });
    el.addEventListener('pointerleave', function () {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
      if (resting) { el.style.setProperty('--mx', resting); el.style.setProperty('--my', resting); }
    });
  });
})();
