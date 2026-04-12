// Scroll-reveal: fade sections in as they enter the viewport
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('section').forEach((section) => {
  observer.observe(section);
});

// --- Particle background ---
(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'particle-canvas';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  const isTouchDevice = matchMedia('(pointer: coarse)').matches;
  let mouse = null;
  let particles = [];
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    initParticles();
  }

  function initParticles() {
    let count = Math.floor((w * h) / 18000);
    if (count > 120) count = 120;
    if (w < 768) count = Math.floor(count / 2);
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1.0 + Math.random() * 1.2,
        o: 0.08 + Math.random() * 0.12,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      });
    }
  }

  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });

  if (!isTouchDevice) {
    window.addEventListener('mousemove', function (e) {
      mouse = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('mouseleave', function () {
      mouse = null;
    });
  }

  function loop() {
    requestAnimationFrame(loop);
    ctx.clearRect(0, 0, w, h);

    const len = particles.length;
    for (let i = 0; i < len; i++) {
      const p = particles[i];

      // Cursor repulsion
      if (mouse) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < 14400) { // 120^2
          const dist = Math.sqrt(distSq);
          if (dist > 0) {
            const force = (1 - dist / 120) * 1.5;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }
      }

      // Drift
      p.x += p.vx;
      p.y += p.vy;

      // Edge wrapping
      if (p.x < 0) p.x += w;
      else if (p.x > w) p.x -= w;
      if (p.y < 0) p.y += h;
      else if (p.y > h) p.y -= h;

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fillStyle = 'rgba(255,255,255,' + p.o + ')';
      ctx.fill();

      // Connecting lines
      for (let j = i + 1; j < len; j++) {
        const q = particles[j];
        const ex = p.x - q.x;
        const ey = p.y - q.y;
        const eSq = ex * ex + ey * ey;
        if (eSq < 10000) { // 100^2
          const eDist = Math.sqrt(eSq);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.06 * (1 - eDist / 100)) + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  resize();
  loop();

  // --- Spring cursor ---
  if (!isTouchDevice) {
    const dot = document.getElementById('spring-cursor');
    let cx = 0, cy = 0, tx = 0, ty = 0;
    document.addEventListener('mousemove', function(e) { tx = e.clientX; ty = e.clientY; dot.style.opacity = 1; });
    document.addEventListener('mouseleave', function() { dot.style.opacity = 0; });
    (function animateDot() {
      cx += (tx - cx) * 0.15;
      cy += (ty - cy) * 0.15;
      dot.style.left = cx + 'px';
      dot.style.top = cy + 'px';
      requestAnimationFrame(animateDot);
    })();
  }
})();

// --- Language stats bar ---
(function() {
  const statsEl = document.querySelector('.lang-stats');
  if (!statsEl) return;
  let animated = false;
  const statsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting && !animated) {
        animated = true;
        document.querySelectorAll('.lang-fill').forEach(function(fill) {
          fill.style.width = fill.dataset.pct + '%';
        });
      }
    });
  }, { threshold: 0.3 });
  statsObserver.observe(statsEl);
})();

// --- Command palette ---
(function() {
  const COMMANDS = [
    { label: 'Go to About',    action: function() { document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' }); } },
    { label: 'Go to Projects', action: function() { document.querySelector('#projects')?.scrollIntoView({ behavior: 'smooth' }); } },
    { label: 'Go to Skills',   action: function() { document.querySelector('#skills')?.scrollIntoView({ behavior: 'smooth' }); } },
    { label: 'Go to Contact',  action: function() { document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' }); } },
    { label: 'Open GitHub',    action: function() { window.open('https://github.com/Ollie1o1', '_blank'); } },
  ];

  const overlay = document.getElementById('palette-overlay');
  const input = document.getElementById('palette-input');
  const results = document.getElementById('palette-results');
  let activeIndex = -1;

  function openPalette() {
    overlay.classList.remove('palette-hidden');
    input.value = '';
    activeIndex = -1;
    renderResults('');
    input.focus();
  }

  function closePalette() {
    overlay.classList.add('palette-hidden');
    input.value = '';
  }

  function renderResults(query) {
    const filtered = query
      ? COMMANDS.filter(function(c) { return c.label.toLowerCase().includes(query.toLowerCase()); })
      : COMMANDS;
    results.innerHTML = '';
    activeIndex = -1;
    filtered.forEach(function(cmd, i) {
      const li = document.createElement('li');
      li.textContent = cmd.label;
      li.addEventListener('mouseenter', function() {
        setActive(i);
      });
      li.addEventListener('click', function() {
        cmd.action();
        closePalette();
      });
      results.appendChild(li);
    });
  }

  function setActive(index) {
    const items = results.querySelectorAll('li');
    items.forEach(function(li) { li.classList.remove('active'); });
    activeIndex = index;
    if (items[activeIndex]) items[activeIndex].classList.add('active');
  }

  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (overlay.classList.contains('palette-hidden')) {
        openPalette();
      } else {
        closePalette();
      }
      return;
    }
    if (overlay.classList.contains('palette-hidden')) return;
    const items = results.querySelectorAll('li');
    if (e.key === 'Escape') {
      closePalette();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(Math.min(activeIndex + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (e.key === 'Enter') {
      if (items[activeIndex]) {
        items[activeIndex].click();
      } else if (items.length === 1) {
        items[0].click();
      }
    }
  });

  input.addEventListener('input', function() {
    renderResults(input.value);
  });

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closePalette();
  });
})();
