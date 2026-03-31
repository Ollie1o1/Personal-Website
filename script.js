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
})();
