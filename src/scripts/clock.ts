export function initClock() {
  const el = document.querySelector<HTMLTimeElement>('time[data-clock]');
  if (!el) return;
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: el.dataset.tz ?? 'America/Toronto',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  });
  const tick = () => {
    const now = new Date();
    el.textContent = fmt.format(now).replace(/\s+/, ' ');
    el.dateTime = now.toISOString();
    setTimeout(tick, 60_000 - (now.getTime() % 60_000) + 50);
  };
  tick();
}
