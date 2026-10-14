import type { Stat } from '../lib/schema';

// Verified against ~/Projects/options on 2026-10-14:
//   commits  git rev-list --count HEAD            -> 1,386
//   tests    grep -rh "def test_" tests | wc -l   -> 6,212 (floor; not a pytest-collected count)
//   LOC      tracked *.py via wc -l               -> 183,677
export const telemetry: { asOf: string; cells: Stat[] } = {
  asOf: 'Oct 2026',
  cells: [
    { k: 'Screener tests', v: '6,000+' },
    { k: 'Screener commits', v: '1,386' },
    { k: 'Screener Python LOC', v: '184k' },
    { k: 'Emulators built', v: '2' },
  ],
};
