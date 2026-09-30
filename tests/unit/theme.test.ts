import { describe, it, expect } from 'vitest';
import { resolveTheme, nextTheme } from '../../src/lib/theme';

describe('resolveTheme', () => {
  it('prefers a valid saved choice', () => {
    expect(resolveTheme('light', false)).toBe('light');
    expect(resolveTheme('dark', true)).toBe('dark');
  });
  it('ignores garbage saved values', () => {
    expect(resolveTheme('purple', true)).toBe('light');
  });
  it('falls back to OS preference, then dark', () => {
    expect(resolveTheme(null, true)).toBe('light');
    expect(resolveTheme(null, false)).toBe('dark');
  });
  it('toggles', () => {
    expect(nextTheme('dark')).toBe('light');
    expect(nextTheme('light')).toBe('dark');
  });
});
