import type { Stat } from '../lib/schema';

// Verified against ~/Projects/options on 2026-10-16:
//   commits  git rev-list --count HEAD            -> 1,418
//   tests    grep -rh "def test_" tests | wc -l   -> 6,261 (floor; not a pytest-collected count)
//   LOC      tracked *.py via wc -l               -> 185,445
export const telemetry: { asOf: string; cells: Stat[] } = {
  asOf: 'Oct 2026',
  cells: [
    { k: 'Screener tests', v: '6,000+' },
    { k: 'Screener commits', v: '1,418' },
    { k: 'Screener Python LOC', v: '185k' },
    { k: 'Emulators built', v: '2' },
  ],
};
