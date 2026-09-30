import { describe, it, expect } from 'vitest';
import { workSchema } from '../../src/lib/schema';

const valid = {
  order: 1,
  title: 'NES Emulator',
  category: 'EMULATION · RUST',
  summary: 'x',
  description: 'meta description',
  role: 'Solo',
  timeline: '2026',
  stack: ['Rust'],
  repo: 'https://github.com/Ollie1o1/better_emulator',
  stats: [
    { k: 'a', v: '1' },
    { k: 'b', v: '2' },
    { k: 'c', v: '3' },
    { k: 'd', v: '4' },
  ],
  asOf: '2026-09-29',
};

describe('workSchema', () => {
  it('accepts a valid entry', () => {
    expect(workSchema.safeParse(valid).success).toBe(true);
  });
  it('requires exactly four stats', () => {
    expect(workSchema.safeParse({ ...valid, stats: valid.stats.slice(0, 3) }).success).toBe(false);
  });
  it('rejects accented Resume anywhere in strings', () => {
    expect(workSchema.safeParse({ ...valid, summary: 'See my Résumé' }).success).toBe(false);
    expect(workSchema.safeParse({ ...valid, stats: [{ k: 'résume', v: '1' }, ...valid.stats.slice(1)] }).success).toBe(false);
  });
  it('allows a demo linking to an in-page anchor or site path', () => {
    expect(workSchema.safeParse({ ...valid, demo: { label: 'Play', href: '#play' } }).success).toBe(true);
    expect(workSchema.safeParse({ ...valid, demo: { label: 'Play', href: '/work/x/#play' } }).success).toBe(true);
    expect(workSchema.safeParse({ ...valid, demo: { label: 'Play', href: 'https://example.com' } }).success).toBe(true);
  });

  it('rejects a demo href that is not a URL, path or anchor', () => {
    expect(workSchema.safeParse({ ...valid, demo: { label: 'Play', href: 'play.html' } }).success).toBe(false);
  });

  it('allows a demo with no href (rendered disabled)', () => {
    expect(workSchema.safeParse({ ...valid, demo: { label: 'Play in browser (soon)' } }).success).toBe(true);
  });
  it('rejects a malformed asOf date', () => {
    expect(workSchema.safeParse({ ...valid, asOf: 'Sep 2026' }).success).toBe(false);
  });
});
