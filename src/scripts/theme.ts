import { nextTheme, type Theme } from '../lib/theme';

export function initThemeToggle() {
  const root = document.documentElement;
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');
  const sync = () => buttons.forEach((b) => b.setAttribute('aria-pressed', String(root.dataset.theme === 'light')));
  sync();
  buttons.forEach((b) => b.addEventListener('click', toggleTheme));
  document.addEventListener('themechange', sync);
}

export function toggleTheme() {
  const root = document.documentElement;
  const next = nextTheme((root.dataset.theme as Theme) ?? 'dark');
  root.dataset.theme = next;
  try {
    localStorage.setItem('theme', next);
  } catch {
    /* storage unavailable (private mode) — theme still applies for this page view */
  }
  document.dispatchEvent(new CustomEvent('themechange'));
}
