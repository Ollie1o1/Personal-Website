import { describe, it, expect } from 'vitest';
import { easeOutCubic, parseMetric } from '../../src/lib/countup';

describe('easeOutCubic', () => {
  it('eases from 0 to 1', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875);
  });
});

describe('parseMetric', () => {
  it('keeps thousands separators and suffixes', () => {
    const m = parseMetric('6,000+')!;
    expect(m.value).toBe(6000);
    expect(m.format(6000)).toBe('6,000+');
    expect(m.format(1234)).toBe('1,234+');
  });
  it('handles k suffix and sign/currency prefix', () => {
    const m = parseMetric('+$9.2k')!;
    expect(m.value).toBe(9.2);
    expect(m.format(9.2)).toBe('+$9.2k');
    expect(m.format(4.51)).toBe('+$4.5k');
  });
  it('does not add separators the original lacked', () => {
    expect(parseMetric('1338')!.format(1338)).toBe('1338');
  });
  it('returns null for non-numeric or multi-number metrics', () => {
    expect(parseMetric('pass')).toBeNull();
    expect(parseMetric('3 : 1')).toBeNull();
    expect(parseMetric('4 / 4')).toBeNull();
  });
});
