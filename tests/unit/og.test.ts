import { describe, it, expect } from 'vitest';
import { ogPath } from '../../src/lib/og-path';

describe('ogPath', () => {
  it('maps home', () => {
    expect(ogPath('/')).toBe('/og/index.png');
  });
  it('maps nested routes and strips trailing slashes', () => {
    expect(ogPath('/work/nes-emulator/')).toBe('/og/work/nes-emulator.png');
    expect(ogPath('/work/nes-emulator')).toBe('/og/work/nes-emulator.png');
  });
  it('maps 404', () => {
    expect(ogPath('/404')).toBe('/og/404.png');
  });
});
