import { filterCommands, type Command } from '../lib/palette';
import { toggleTheme } from './theme';

export function initPalette() {
  const dialog = document.querySelector<HTMLDialogElement>('#palette');
  const data = document.querySelector('#palette-data');
  if (!dialog || !data) return;
  const input = dialog.querySelector<HTMLInputElement>('input')!;
  const list = dialog.querySelector<HTMLUListElement>('#palette-list')!;
  const commands: Command[] = JSON.parse(data.textContent ?? '[]');
  let results = commands;
  let active = 0;
  let opener: HTMLElement | null = null;

  const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);
  if (!isMac) document.querySelectorAll('[data-kbd-label]').forEach((el) => (el.textContent = 'Ctrl K'));

  const render = () => {
    list.replaceChildren(
      ...results.map((c, i) => {
        const li = document.createElement('li');
        li.id = `pal-${c.id}`;
        li.role = 'option';
        li.setAttribute('aria-selected', String(i === active));
        li.innerHTML = `<span class="pl"></span><span class="ph"></span>`;
        li.querySelector('.pl')!.textContent = c.label;
        li.querySelector('.ph')!.textContent = c.hint;
        li.addEventListener('pointermove', () => setActive(i));
        li.addEventListener('click', () => run(c));
        return li;
      }),
    );
    if (!results.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'No matches';
      list.append(li);
    }
    input.setAttribute('aria-activedescendant', results[active] ? `pal-${results[active].id}` : '');
  };

  const setActive = (i: number) => {
    if (i === active) return;
    active = i;
    list.querySelectorAll('[role=option]').forEach((el, j) => el.setAttribute('aria-selected', String(j === i)));
    input.setAttribute('aria-activedescendant', results[i] ? `pal-${results[i].id}` : '');
    list.children[i]?.scrollIntoView({ block: 'nearest' });
  };

  const open = () => {
    if (dialog.open) return;
    opener = document.activeElement as HTMLElement;
    input.value = '';
    results = commands;
    active = 0;
    render();
    dialog.showModal();
    input.setAttribute('aria-expanded', 'true');
    input.focus();
  };

  const close = () => dialog.open && dialog.close();

  const run = (c: Command) => {
    close();
    if (c.action === 'theme') return toggleTheme();
    if (!c.href) return;
    if (/^https?:/.test(c.href)) window.open(c.href, '_blank', 'noopener');
    else location.href = c.href;
  };

  dialog.addEventListener('close', () => {
    input.setAttribute('aria-expanded', 'false');
    opener?.focus();
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });
  input.addEventListener('input', () => {
    results = filterCommands(commands, input.value);
    active = 0;
    render();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!results.length) return;
      const d = e.key === 'ArrowDown' ? 1 : -1;
      setActive((active + d + results.length) % results.length);
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      run(results[active]);
    }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      dialog.open ? close() : open();
    }
  });
  document.querySelectorAll('[data-palette-open]').forEach((b) => b.addEventListener('click', open));
}
