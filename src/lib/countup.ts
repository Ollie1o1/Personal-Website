export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export interface ParsedMetric {
  value: number;
  format: (n: number) => string;
}

/** Splits a display metric like "+$9.2k" or "6,000+" into a number plus a formatter that
 *  reproduces its prefix, suffix, separators and precision. Null when it isn't one number. */
export function parseMetric(s: string): ParsedMetric | null {
  const m = s.trim().match(/^([^\d]*?)(\d[\d,]*(?:\.\d+)?)([^\d]*)$/);
  if (!m) return null;
  const [, prefix, num, suffix] = m;
  const decimals = num.includes('.') ? num.split('.')[1].length : 0;
  const grouped = num.includes(',');
  const value = Number(num.replace(/,/g, ''));
  const format = (n: number) => {
    const [int, frac] = n.toFixed(decimals).split('.');
    const i = grouped ? Number(int).toLocaleString('en-US') : int;
    return prefix + (frac ? `${i}.${frac}` : i) + suffix;
  };
  return { value, format };
}
