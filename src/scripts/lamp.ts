// A soft amber glow on the background grid lines, following a fine pointer.
export function initLamp() {
  if (!matchMedia('(pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const lamp = document.createElement('div');
  lamp.className = 'lamp';
  lamp.setAttribute('aria-hidden', 'true');
  document.body.prepend(lamp);
  let x = 0;
  let y = 0;
  let queued = false;
  window.addEventListener(
    'pointermove',
    (e) => {
      x = e.clientX;
      y = e.clientY;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        lamp.style.setProperty('--x', `${x}px`);
        lamp.style.setProperty('--y', `${y + window.scrollY}px`);
        lamp.classList.add('on');
        queued = false;
      });
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => lamp.classList.remove('on'));
}
