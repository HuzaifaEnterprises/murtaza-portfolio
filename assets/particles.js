// Full-page particle field for the home page (fixed behind the content). Structure borrowed from a pasted particles component;
// colours come from the DESIGN.md tokens (--accent, --line). No outside library.
(function () {
  var canvas = document.querySelector('.particles');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LINK = 140;   // distance at which two dots are joined
  var GRAB = 180;   // distance at which a dot is joined to the pointer
  var dots = [], w = 0, h = 0, dpr = 1, accent = '#0f5e9c', running = false;
  var pointer = { x: -9999, y: -9999 };

  function readTokens() {
    var css = getComputedStyle(document.documentElement);
    accent = css.getPropertyValue('--accent').trim() || accent;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.min(90, Math.round((w * h) / 16000));
    dots = [];
    for (var i = 0; i < count; i++) {
      dots.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: 1 + Math.random() * 1.5
      });
    }
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = accent; ctx.strokeStyle = accent; ctx.lineWidth = 1;
    for (var i = 0; i < dots.length; i++) {
      var a = dots[i];
      ctx.globalAlpha = 0.45;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      for (var j = i + 1; j < dots.length; j++) {
        var b = dots[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK) {
          ctx.globalAlpha = 0.18 * (1 - d / LINK);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      var px = a.x - pointer.x, py = a.y - pointer.y, pd = Math.sqrt(px * px + py * py);
      if (pd < GRAB) {
        ctx.globalAlpha = 0.4 * (1 - pd / GRAB);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(pointer.x, pointer.y); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function step() {
    if (!running) return;
    for (var i = 0; i < dots.length; i++) {
      var p = dots[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }
    draw();
    requestAnimationFrame(step);
  }

  function start() { if (!running && !reduce) { running = true; requestAnimationFrame(step); } }
  function stop() { running = false; }

  window.addEventListener('pointermove', function (e) { pointer.x = e.clientX; pointer.y = e.clientY; });
  document.addEventListener('pointerleave', function () { pointer.x = pointer.y = -9999; });
  window.addEventListener('resize', resize);

  // Re-read the accent colour when the theme changes.
  new MutationObserver(function () { readTokens(); draw(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { readTokens(); draw(); });

  // Only animate while the tab is visible.
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  start();

  readTokens();
  resize();
})();
