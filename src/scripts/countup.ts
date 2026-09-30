import { easeOutCubic, parseMetric } from '../lib/countup';

const DURATION = 600;

// Server-rendered text is always the final value; this only animates toward it.
export function initCountUp() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        animate(e.target as HTMLElement);
      }
    },
    { threshold: 0.6 },
  );
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => io.observe(el));
}

function animate(el: HTMLElement) {
  const final = el.textContent ?? '';
  const m = parseMetric(final);
  if (!m) return;
  el.setAttribute('aria-label', final.trim());
  const start = performance.now();
  const frame = (now: number) => {
    const t = Math.min((now - start) / DURATION, 1);
    el.textContent = t < 1 ? m.format(m.value * easeOutCubic(t)) : final;
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
