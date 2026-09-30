import type { Stat } from '../lib/schema';

// Verified against ~/Projects/options on 2026-09-29:
//   commits  git rev-list --count HEAD            -> 1,338
//   tests    grep -rh "def test_" tests | wc -l   -> 6,058 (floor; not a pytest-collected count)
//   LOC      tracked *.py via wc -l               -> 179,974
export const telemetry: { asOf: string; cells: Stat[] } = {
  asOf: 'Sep 2026',
  cells: [
    { k: 'Screener tests', v: '6,000+' },
    { k: 'Screener commits', v: '1,338' },
    { k: 'Screener Python LOC', v: '180k' },
    { k: 'Emulators built', v: '2' },
  ],
};
