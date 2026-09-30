export type Theme = 'light' | 'dark';

export function resolveTheme(saved: string | null, prefersLight: boolean): Theme {
  if (saved === 'light' || saved === 'dark') return saved;
  return prefersLight ? 'light' : 'dark';
}

export const nextTheme = (t: Theme): Theme => (t === 'dark' ? 'light' : 'dark');
