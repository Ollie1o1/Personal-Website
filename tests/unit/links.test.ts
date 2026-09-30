import { describe, it, expect } from 'vitest';
import { socialLinks } from '../../src/lib/links';

const base = { email: 'a@b.c', github: 'https://github.com/x', linkedin: null as string | null };

describe('socialLinks', () => {
  it('omits LinkedIn when null', () => {
    expect(socialLinks(base).map(l => l.label)).toEqual(['Email', 'GitHub']);
  });
  it('includes LinkedIn when set', () => {
    const links = socialLinks({ ...base, linkedin: 'https://linkedin.com/in/x' });
    expect(links.at(-1)).toEqual({ label: 'LinkedIn', href: 'https://linkedin.com/in/x' });
  });
  it('uses mailto for email', () => {
    expect(socialLinks(base)[0].href).toBe('mailto:a@b.c');
  });
});
