# Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Oliver Raczka's personal site as a static Astro 7 portfolio in the approved "instrument panel" direction, with three verified case studies, deployed to a Vercel preview.

**Architecture:** Astro 7 static output. Content (case studies) lives in an MDX content collection validated by a Zod schema; all other copy lives in typed data modules under `src/data/`. Styling is hand-written CSS on custom-property tokens. Interactivity is a handful of small vanilla TS modules whose pure logic lives in `src/lib/` and is unit-tested with Vitest. A post-build script (`scripts/verify-dist.mjs`) enforces the content-accuracy and link rules against the built HTML.

**Tech Stack:** Astro 7.3, @astrojs/mdx 8, @astrojs/sitemap 3, @fontsource/inter-tight 5, @fontsource/ibm-plex-mono 5, satori 0.33 + @resvg/resvg-js 2.6 (OG images), Vitest, Node 25.

**Spec:** `docs/superpowers/specs/2026-09-29-portfolio-redesign-design.md`

**Visual source of truth:** the approved mockups in `.superpowers/brainstorm/43897-1790735966/content/` — `homepage-layout.html`, `case-study.html`, `visual-system.html`. Markup/CSS tasks reproduce those (minus the blue annotation tags), with the changes the spec records (three case studies, RISC-V in the index, no accents on "Resume", updated stats).

## Global Constraints

- "Resume" is never written with accents (not "Résumé") — in copy, titles, aria-labels, filenames.
- The P&L figure (+$9.2k realized) always appears with the discretionary framing: *"discretionary trades I picked from its ranked signals, not autonomous trading"*.
- Test counts are "6,000+ tests", never "passing". Screener: 1,338 commits, 180k Python LOC, 27 weighted factors (verified 2026-09-29).
- Orion and Chat-App never appear. Case studies: Options Screener, NES Emulator, OVERDRIVE only.
- Anecdotes not found in commits/READMEs are written as MDX comments `{/* TODO(oliver): … */}`, never as published prose.
- `site.linkedin === null` → no LinkedIn link rendered anywhere.
- Tokens exactly as spec table; fonts Inter Tight + IBM Plex Mono, self-hosted.
- Motion: exactly four effects, all disabled under `prefers-reduced-motion: reduce`.
- No horizontal scroll at 375px. Lighthouse mobile ≥ 95 on all four categories.
- Commit after every task; message trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File Structure

```
astro.config.mjs            site URL, integrations (mdx, sitemap)
package.json                scripts: dev, build, check, test, verify
tsconfig.json               extends astro/tsconfigs/strict
vitest.config.ts
public/
  favicon.svg               OR monogram
  robots.txt
  resume.pdf                copied from ~/Desktop/hello/OliverRaczka_Resume.pdf
scripts/verify-dist.mjs     post-build content/link rules
src/
  site.config.ts            identity + links (single source of truth)
  content.config.ts         registers `work` collection using workSchema
  content/work/*.mdx        three case studies
  data/                     telemetry.ts, also-built.ts, experience.ts, stack.ts
  lib/                      pure, unit-tested logic
    schema.ts               workSchema (Zod)
    links.ts                socialLinks(site)
    theme.ts                resolveTheme(saved, prefersLight)
    palette.ts              filterCommands(cmds, query)
    countup.ts              easeOutCubic, frameValue, formatLike
  styles/tokens.css, base.css
  layouts/Base.astro        <head>, SEO, theme boot script, StatusBar, Palette, Footer
  layouts/CaseStudy.astro
  components/               StatusBar, Palette, Hero, Telemetry, WorkPanel, AlsoBuilt,
                            Experience, Stack, Footer, StatStrip, Toc, Figure, CodeRef, Seo
  scripts/                  theme.ts, palette.ts, clock.ts, countup.ts, lamp.ts, reveal.ts, scrollspy.ts
  pages/index.astro, work/[slug].astro, 404.astro, og/[...route].png.ts
tests/unit/*.test.ts
```

---

### Task 1: Scaffold Astro project, tokens, base layout, site config

**Files:**
- Delete: `index.html`, `script.js`, `style.css`
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `src/site.config.ts`, `src/lib/links.ts`, `src/styles/tokens.css`, `src/styles/base.css`, `src/layouts/Base.astro`, `src/pages/index.astro` (temporary hero only), `public/favicon.svg`, `public/robots.txt`, `public/resume.pdf`
- Test: `tests/unit/links.test.ts`

**Interfaces:**
- Produces: `site` (default export of `src/site.config.ts`) with shape `{ name, title, tagline, url, email, github, linkedin: string|null, location, timezone, availability, resumePath }`; `socialLinks(site): {label: string, href: string}[]`; `Base.astro` props `{ title: string; description: string; ogImage?: string }` with a default `<slot/>`.

- [ ] **Step 1:** `git rm index.html script.js style.css`; create `package.json`:

```json
{
  "name": "oliver-raczka-site",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "check": "astro check",
    "test": "vitest run",
    "verify": "astro build && node scripts/verify-dist.mjs"
  }
}
```

Run: `npm i astro@^7.3 @astrojs/mdx@^8 @astrojs/sitemap@^3 @fontsource/inter-tight@^5 @fontsource/ibm-plex-mono@^5 && npm i -D vitest @astrojs/check typescript`

- [ ] **Step 2: Write the failing test** `tests/unit/links.test.ts`:

```ts
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
```

- [ ] **Step 3:** Run `npx vitest run tests/unit/links.test.ts` → FAIL (module not found).

- [ ] **Step 4: Implement** `src/lib/links.ts`:

```ts
export interface LinkSource { email: string; github: string; linkedin: string | null }
export interface SocialLink { label: string; href: string }

export function socialLinks(s: LinkSource): SocialLink[] {
  const links: SocialLink[] = [
    { label: 'Email', href: `mailto:${s.email}` },
    { label: 'GitHub', href: s.github },
  ];
  if (s.linkedin) links.push({ label: 'LinkedIn', href: s.linkedin });
  return links;
}
```

and `src/site.config.ts`:

```ts
const site = {
  name: 'Oliver Raczka',
  title: 'Systems & quant engineer.',
  tagline: 'Third-year Computer Science at the University of Guelph. I write emulators, game engines, and an options screener I trade real money with.',
  url: 'https://oliver-raczka.vercel.app',
  email: 'oliver.raczka.shue@gmail.com',
  github: 'https://github.com/Ollie1o1',
  linkedin: null as string | null, // set to your profile URL to show LinkedIn everywhere
  location: 'Guelph, ON',
  timezone: 'America/Toronto',
  availability: 'Open to Summer 2027 internships',
  resumePath: '/resume.pdf',
};
export default site;
```

- [ ] **Step 5:** Run the test → PASS.

- [ ] **Step 6:** Create `astro.config.mjs` (`site: site.url`, `integrations: [mdx(), sitemap()]`, `output: 'static'`), `tsconfig.json` (`{"extends":"astro/tsconfigs/strict","include":[".astro/types.d.ts","**/*"],"exclude":["dist"]}`), `vitest.config.ts` (`test.include: ['tests/unit/**/*.test.ts']`).

- [ ] **Step 7:** `src/styles/tokens.css` — dark tokens on `:root` and `[data-theme="dark"]`, light on `[data-theme="light"]`, exactly the spec table; plus `--font-sans: 'Inter Tight', system-ui, sans-serif; --font-mono: 'IBM Plex Mono', ui-monospace, monospace; --radius: 6px; --wrap: 1040px; --gutter: clamp(16px, 4vw, 36px)`. `src/styles/base.css` — reset, `body { background: var(--bg) ... }` with the 32px hairline grid (`linear-gradient(var(--grid) 1px, transparent 1px)` both axes, `--grid` = `#17181d` dark / `#e8e6df` light), `.wrap`, `.mono`, `.label` (mono 10–11px uppercase `letter-spacing:.1em`), `:focus-visible` amber outline, `.sr-only`, `@media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation: none !important; transition: none !important; } }`.

- [ ] **Step 8:** `Base.astro`: imports fontsource weights (inter-tight 400/500/600, ibm-plex-mono 400/500), tokens + base CSS; `<html lang="en">`; inline `is:inline` boot script in head that sets `document.documentElement.dataset.theme` from `localStorage['theme']` (try/catch) or `matchMedia('(prefers-color-scheme: light)')` → `light`/`dark`; `<title>`, description, canonical; `<slot/>`. Temporary `src/pages/index.astro` renders `site.name` in Base.

- [ ] **Step 9:** `public/favicon.svg` (24×24 square, 1px stroke `#ececef` on `#0f1013`, "OR" in mono 600), `public/robots.txt` (`User-agent: *\nAllow: /\nSitemap: https://oliver-raczka.vercel.app/sitemap-index.xml`), `cp ~/Desktop/hello/OliverRaczka_Resume.pdf public/resume.pdf`.

- [ ] **Step 10:** Run `npm run check && npm run build && npm test` → all pass, `dist/index.html` exists.

- [ ] **Step 11:** Commit `feat: scaffold Astro 7 site with tokens, base layout, site config`.

---

### Task 2: Work collection schema, data modules, verify-dist script

**Files:**
- Create: `src/lib/schema.ts`, `src/content.config.ts`, `src/data/telemetry.ts`, `src/data/also-built.ts`, `src/data/experience.ts`, `src/data/stack.ts`, `scripts/verify-dist.mjs`, three stub MDX files in `src/content/work/`
- Test: `tests/unit/schema.test.ts`

**Interfaces:**
- Produces: `workSchema` (Zod object); types `Stat = {k: string; v: string; accent?: boolean; note?: string}`; collection name `work`, entries sorted by `data.order`; data exports `telemetry: {asOf: string; cells: Stat[]}`, `alsoBuilt: {name: string; blurb: string; lang: string; href: string}[]`, `experience: {when: string; title: string; org?: string; detail: string}[]`, `education: {school; degree; when; coursework: string[]}`, `stack: {group: string; items: string[]}[]`.

- [ ] **Step 1: Failing test** `tests/unit/schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { workSchema } from '../../src/lib/schema';

const valid = {
  order: 1, title: 'NES Emulator', category: 'EMULATION · RUST',
  summary: 'x', role: 'Solo', timeline: '2026', stack: ['Rust'],
  repo: 'https://github.com/Ollie1o1/better_emulator',
  stats: [{ k: 'a', v: '1' }, { k: 'b', v: '2' }, { k: 'c', v: '3' }, { k: 'd', v: '4' }],
  asOf: '2026-09-29', description: 'meta description',
};

describe('workSchema', () => {
  it('accepts a valid entry', () => { expect(workSchema.safeParse(valid).success).toBe(true); });
  it('requires exactly four stats', () => {
    expect(workSchema.safeParse({ ...valid, stats: valid.stats.slice(0, 3) }).success).toBe(false);
  });
  it('rejects accented Resume anywhere in strings', () => {
    expect(workSchema.safeParse({ ...valid, summary: 'See my Résumé' }).success).toBe(false);
  });
  it('allows a demo with no href (rendered disabled)', () => {
    expect(workSchema.safeParse({ ...valid, demo: { label: 'Play in browser (soon)' } }).success).toBe(true);
  });
});
```

- [ ] **Step 2:** Run → FAIL.

- [ ] **Step 3: Implement** `src/lib/schema.ts`:

```ts
import { z } from 'astro/zod';

const text = z.string().min(1).refine(s => !/résumé|résume|resumé/i.test(s), {
  message: 'Write "Resume" without accents',
});
export const statSchema = z.object({ k: text, v: text, accent: z.boolean().optional(), note: text.optional() });

export const workSchema = z.object({
  order: z.number().int().positive(),
  title: text,
  category: text,
  summary: text,
  description: text,
  role: text,
  timeline: text,
  stack: z.array(text).min(1),
  repo: z.string().url(),
  demo: z.object({ label: text, href: z.string().url().optional() }).optional(),
  stats: z.array(statSchema).length(4),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type Work = z.infer<typeof workSchema>;
export type Stat = z.infer<typeof statSchema>;
```

`src/content.config.ts`:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { workSchema } from './lib/schema';

const work = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/work' }),
  schema: workSchema,
});
export const collections = { work };
```

- [ ] **Step 4:** Run → PASS. (If `astro/zod` does not resolve under Vitest, import `z` from `zod` directly and add `zod` as a dependency pinned to Astro's version.)

- [ ] **Step 5:** Write the data modules with **verified** values:
  - `telemetry.ts`: asOf `'Sep 2026'`; cells: Screener tests `6,000+`; Screener commits `1,338`; Screener Python LOC `180k`; Emulators built `2`.
  - `also-built.ts`: RISC-V emulator — "RV32I CPU with 128 MB DRAM and a unit-tested fetch-decode-execute loop" — C — `/emulator`; Crypto trading bot — "Maker-only hybrid strategy with XGBoost signals" — Python — `/crypto_mathbot`; Maze RL solver — "Q-learning agent that learns the shortest path from scratch" — Python — `/Maze`; img2ascii — "Zero-dependency image to ASCII CLI" — Go — `/imgtoascii`; Audio visualizer — "Real-time system-audio spectrum at 60 fps" — Java — `/Audio-Visualizer`. (Each blurb re-checked against the repo README before commit; also verify `crypto_mathbot` actually uses XGBoost with `grep -ri xgboost`, drop the term if not.)
  - `experience.ts`: from `~/Desktop/hello/OliverRaczka_Resume.tex` lines 95–111 verbatim in meaning; education from lines 139–145.
  - `stack.ts`: Systems (C, C++, Rust, Make, Cargo), Graphics (OpenGL 3.3, GLSL, SDL2, GLM), Quant / data (Python, NumPy, Pandas, SciPy, SQLite, Streamlit), Web / infra (FastAPI, React, Node.js, Docker, GitHub Actions). Every term must appear in the resume skills line or in a repo; check with grep before commit.

- [ ] **Step 6:** Create `scripts/verify-dist.mjs` — walks `dist/**/*.html` and fails (exit 1, listing every violation) when:
  1. any file matches `/r[ée]sum[ée]/` with an accent (`/résumé|résume|resumé/i`);
  2. any file contains `9.2k` or `9,200` but not `discretionary`;
  3. any file matches `/\bOrion\b|Chat-App/`;
  4. `site.linkedin` is null (import `src/site.config.ts` via a regex read of `linkedin:` line) and any file contains `linkedin.com`;
  5. any internal `href`/`src` starting with `/` does not resolve to a file in `dist` (try `path`, `path/index.html`, `path.html`), ignoring `#` fragments;
  6. any page lacks `<title>`, `meta name="description"`, or `meta property="og:image"`; or its og:image path (made site-relative) does not exist in `dist`;
  7. any file contains the word `passing` within 40 characters of `test`.

```js
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const SITE = await readFile(new URL('../src/site.config.ts', import.meta.url), 'utf8');
const linkedinNull = /linkedin:\s*null/.test(SITE);
const siteUrl = SITE.match(/url:\s*'([^']+)'/)[1];

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}
async function exists(p) { try { await stat(p); return true; } catch { return false; } }
async function resolves(url) {
  const clean = decodeURI(url.split('#')[0].split('?')[0]);
  if (clean === '' ) return true;
  const base = join(DIST, clean);
  return (await exists(base) && !(await stat(base)).isDirectory())
      || await exists(join(base, 'index.html')) || await exists(base + '.html');
}

const errors = [];
const files = (await walk(DIST)).filter(f => f.endsWith('.html'));
for (const f of files) {
  const html = await readFile(f, 'utf8');
  const rel = relative(DIST, f);
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
  if (/résumé|résume|resumé/i.test(text)) errors.push(`${rel}: accented "Resume"`);
  if (/9\.2k|9,200/.test(text) && !/discretionary/i.test(text)) errors.push(`${rel}: P&L without discretionary framing`);
  if (/\bOrion\b|Chat-App/.test(text)) errors.push(`${rel}: mentions excluded project`);
  if (linkedinNull && /linkedin\.com/i.test(html)) errors.push(`${rel}: LinkedIn link while site.linkedin is null`);
  if (/test[^<]{0,40}passing|passing[^<]{0,40}test/i.test(text)) errors.push(`${rel}: claims tests "passing"`);
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`${rel}: missing <title>`);
  if (!/<meta name="description"/.test(html)) errors.push(`${rel}: missing meta description`);
  const og = html.match(/<meta property="og:image" content="([^"]+)"/);
  if (!og) errors.push(`${rel}: missing og:image`);
  else if (!(await resolves(og[1].replace(siteUrl, '')))) errors.push(`${rel}: og:image ${og[1]} not built`);
  for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    if (url.startsWith('//')) continue;
    if (!(await resolves(url))) errors.push(`${rel}: broken internal link ${url}`);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`verify-dist: ${files.length} pages OK`);
```

- [ ] **Step 7:** Stub the three MDX files with valid frontmatter (full content in Tasks 5–7) and one `## Overview` paragraph each. Run `npm run check && npm test && npm run build` → pass. Run `node scripts/verify-dist.mjs` → expected FAIL on og:image (not built until Task 8) — confirms the script catches it. Temporarily note this in the commit message.

- [ ] **Step 8:** Commit `feat: work collection schema, data modules, dist verifier`.

---

### Task 3: Homepage sections

**Files:**
- Create: `src/components/{StatusBar,Hero,Telemetry,WorkPanel,AlsoBuilt,Experience,Stack,Footer}.astro`
- Modify: `src/pages/index.astro`, `src/layouts/Base.astro` (mount StatusBar + Footer)

**Interfaces:**
- Consumes: `site`, `socialLinks`, `telemetry`, `alsoBuilt`, `experience`, `education`, `stack`, `getCollection('work')`.
- Produces: `WorkPanel` props `{ entry: CollectionEntry<'work'>; wide?: boolean }`; every metric value element gets `data-count` (see Task 4) and class `metric`; every panel gets class `reveal`; hero/section anchors `#work`, `#experience`, `#stack`, `#contact`.

- [ ] **Step 1:** Build each component to match `homepage-layout.html` (strip `.ann`). Specifics:
  - StatusBar: `<header>` sticky, `backdrop-filter: blur(8px)`; nav links Work `/#work`, Experience `/#experience`, Resume ↗ `site.resumePath` (`target=_blank`), a `<button data-palette-open>` showing `⌘K` (text swapped to `Ctrl K` by script on non-Mac); `<time data-clock>` with server-rendered fallback text `Guelph, ON`; `<button data-theme-toggle aria-label="Toggle color theme">`. On `<640px` nav collapses to monogram + ⌘K + theme button only.
  - Hero: eyebrow `● {site.availability}` (amber), `<h1>` name + `<span>` title in `--dim`, tagline, CTAs Resume (PDF) ↓ (primary, `download`), GitHub ↗, Email. Grid 1.35fr/1fr; stacks below 860px. H1 `font-size: clamp(44px, 8vw, 64px)`.
  - Telemetry: header "Telemetry · as of {asOf}", 2×2 cells.
  - Selected work: `#work`, heading "Selected work" + "03 case studies"; first entry `wide` (grid-column 1/-1, inner 1.2fr/1fr with mini stat grid and each stat's `note` rendered as footnote), other two in a 2-column grid. Whole panel is one `<a>` to `/work/{entry.id}` with the hairline-draw `::after`.
  - AlsoBuilt: `<table>` with caption `sr-only`; rows link to repo; on <640px the blurb column wraps under the name.
  - Experience: definition grid 150px/1fr → single column <640px; education row last with coursework as a comma list.
  - Stack: 4 columns → 2 at <860px → 1 at <480px.
  - Footer `#contact`: "Let's build something fast." + `socialLinks(site)` + `© 2026 Oliver Raczka · Built with Astro`.
- [ ] **Step 2:** `index.astro` composes Hero → Telemetry (inside hero grid) → Work → AlsoBuilt → Experience → Stack; Footer via Base.
- [ ] **Step 3:** Run `npm run build`; open `dist/index.html` via `npx astro preview` and screenshot at 375, 768, 1280 (headless Chrome: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --screenshot=... --window-size=375,2400 http://localhost:4321/`). Compare against the mockup; check no horizontal scroll at 375 (`document.documentElement.scrollWidth <= 375` via `--dump-dom` of a page that writes it, or visual check of screenshot edges).
- [ ] **Step 4:** Commit `feat: homepage sections`.

---

### Task 4: Interactions (theme, palette, clock, count-up, reveal, grid lamp)

**Files:**
- Create: `src/lib/theme.ts`, `src/lib/palette.ts`, `src/lib/countup.ts`, `src/scripts/{theme,palette,clock,countup,reveal,lamp}.ts`, `src/components/Palette.astro`
- Modify: `src/layouts/Base.astro` (mount Palette, import scripts)
- Test: `tests/unit/theme.test.ts`, `tests/unit/palette.test.ts`, `tests/unit/countup.test.ts`

**Interfaces:**
- Produces: `resolveTheme(saved: string | null, prefersLight: boolean): 'light' | 'dark'`; `nextTheme(t): 'light'|'dark'`; `Command = { id: string; label: string; hint: string; href?: string; action?: 'theme' }`; `filterCommands(cmds: Command[], q: string): Command[]`; `easeOutCubic(t: number): number`; `parseMetric(s: string): { value: number; format: (n: number) => string } | null`.

- [ ] **Step 1: Failing tests.**

```ts
// tests/unit/theme.test.ts
import { describe, it, expect } from 'vitest';
import { resolveTheme, nextTheme } from '../../src/lib/theme';
describe('resolveTheme', () => {
  it('prefers a valid saved choice', () => { expect(resolveTheme('light', false)).toBe('light'); });
  it('ignores garbage saved values', () => { expect(resolveTheme('purple', true)).toBe('light'); });
  it('falls back to OS preference, then dark', () => {
    expect(resolveTheme(null, true)).toBe('light');
    expect(resolveTheme(null, false)).toBe('dark');
  });
  it('toggles', () => { expect(nextTheme('dark')).toBe('light'); expect(nextTheme('light')).toBe('dark'); });
});
```

```ts
// tests/unit/palette.test.ts
import { describe, it, expect } from 'vitest';
import { filterCommands, type Command } from '../../src/lib/palette';
const cmds: Command[] = [
  { id: 'work', label: 'Selected work', hint: 'Section', href: '/#work' },
  { id: 'nes', label: 'NES Emulator', hint: 'Case study', href: '/work/nes-emulator' },
  { id: 'resume', label: 'Resume (PDF)', hint: 'Download', href: '/resume.pdf' },
  { id: 'theme', label: 'Toggle theme', hint: 'Action', action: 'theme' },
];
describe('filterCommands', () => {
  it('returns all for empty query', () => { expect(filterCommands(cmds, '  ')).toHaveLength(4); });
  it('matches case-insensitive subsequences', () => {
    expect(filterCommands(cmds, 'nes')[0].id).toBe('nes');
    expect(filterCommands(cmds, 'rsm').map(c => c.id)).toContain('resume');
  });
  it('ranks prefix matches first', () => {
    expect(filterCommands(cmds, 't')[0].id).toBe('theme');
  });
  it('searches hints too', () => { expect(filterCommands(cmds, 'case').map(c => c.id)).toEqual(['nes']); });
  it('returns empty for no match', () => { expect(filterCommands(cmds, 'zzz')).toEqual([]); });
});
```

```ts
// tests/unit/countup.test.ts
import { describe, it, expect } from 'vitest';
import { easeOutCubic, parseMetric } from '../../src/lib/countup';
describe('countup', () => {
  it('eases from 0 to 1', () => { expect(easeOutCubic(0)).toBe(0); expect(easeOutCubic(1)).toBe(1); expect(easeOutCubic(0.5)).toBeCloseTo(0.875); });
  it('keeps thousands separators and suffixes', () => {
    const m = parseMetric('6,000+')!; expect(m.value).toBe(6000); expect(m.format(6000)).toBe('6,000+'); expect(m.format(1234)).toBe('1,234+');
  });
  it('handles k suffix and sign/currency prefix', () => {
    const m = parseMetric('+$9.2k')!; expect(m.value).toBe(9.2); expect(m.format(9.2)).toBe('+$9.2k'); expect(m.format(4.51)).toBe('+$4.5k');
  });
  it('returns null for non-numeric metrics', () => { expect(parseMetric('pass')).toBeNull(); expect(parseMetric('3 : 1')).toBeNull(); });
});
```

- [ ] **Step 2:** Run → FAIL.

- [ ] **Step 3: Implement.**

```ts
// src/lib/theme.ts
export type Theme = 'light' | 'dark';
export function resolveTheme(saved: string | null, prefersLight: boolean): Theme {
  if (saved === 'light' || saved === 'dark') return saved;
  return prefersLight ? 'light' : 'dark';
}
export const nextTheme = (t: Theme): Theme => (t === 'dark' ? 'light' : 'dark');
```

```ts
// src/lib/palette.ts
export interface Command { id: string; label: string; hint: string; href?: string; action?: 'theme' }

function score(hay: string, q: string): number {
  const h = hay.toLowerCase();
  if (h.startsWith(q)) return 3;
  if (h.split(/\s+/).some(w => w.startsWith(q))) return 2;
  let i = 0;
  for (const ch of h) if (ch === q[i]) i++;
  return i === q.length ? 1 : 0;
}

export function filterCommands(cmds: Command[], query: string): Command[] {
  const q = query.trim().toLowerCase();
  if (!q) return cmds;
  return cmds
    .map((c, idx) => ({ c, idx, s: Math.max(score(c.label, q), score(c.hint, q) && score(c.hint, q) - 0.5) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s || a.idx - b.idx)
    .map(x => x.c);
}
```

```ts
// src/lib/countup.ts
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function parseMetric(s: string): { value: number; format: (n: number) => string } | null {
  const m = s.match(/^([^\d]*?)([\d,]+(?:\.\d+)?)([^\d]*)$/);
  if (!m) return null;
  const [, prefix, num, suffix] = m;
  if (/\d/.test(suffix) || /:/.test(s)) return null;
  const decimals = num.includes('.') ? num.split('.')[1].length : 0;
  const grouped = num.includes(',');
  const value = Number(num.replace(/,/g, ''));
  const format = (n: number) => {
    const fixed = n.toFixed(decimals);
    const [int, frac] = fixed.split('.');
    const i = grouped ? Number(int).toLocaleString('en-US') : int;
    return prefix + (frac ? `${i}.${frac}` : i) + suffix;
  };
  return { value, format };
}
```

- [ ] **Step 4:** Run → PASS.

- [ ] **Step 5:** Browser modules (all no-ops if their DOM hooks are absent):
  - `scripts/theme.ts`: `[data-theme-toggle]` click → `nextTheme`, set `dataset.theme`, save to `localStorage` in try/catch, update `aria-pressed`.
  - `scripts/palette.ts` + `Palette.astro`: `<dialog id="palette">` containing `<input role="combobox" aria-controls="palette-list" aria-expanded aria-activedescendant>` and `<ul id="palette-list" role="listbox">`. Commands built at build time in Palette.astro (sections, three case studies, Resume, GitHub, Email, LinkedIn when set, Toggle theme) and serialized to a `<script type="application/json" id="palette-data">`. ⌘K/Ctrl+K opens (`showModal()`), Escape closes (native), ↑/↓ move active, Enter activates (href → `location.href`, external → `window.open(..., '_blank', 'noopener')`, `action: 'theme'` → toggle). Returns focus to the opener on close. Also opened by `[data-palette-open]`. Swaps `⌘K` label to `Ctrl K` when `!/Mac|iPhone|iPad/.test(navigator.platform)`.
  - `scripts/clock.ts`: `[data-clock]` → `Intl.DateTimeFormat('en-CA', { timeZone: site.timezone, hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' })`, rendered as `Guelph, ON · 14:32 EDT`, updated on the next minute boundary then every 60s.
  - `scripts/countup.ts`: IntersectionObserver on `.metric` (threshold 0.6, once); `parseMetric(el.textContent)`; if null or reduced-motion, leave untouched; else animate 600ms with `easeOutCubic` via rAF. Server-rendered text is always the final value (works without JS).
  - `scripts/reveal.ts`: adds `html.js` class; `.reveal` elements get `opacity:0; transform: translateY(8px)` only under `html.js` and no reduced-motion; observer adds `.in` with `transition-delay: calc(var(--i) * 40ms)` where `--i` is set per sibling index; once.
  - `scripts/lamp.ts`: only when `matchMedia('(pointer: fine)').matches` and no reduced motion; a fixed `div.lamp` (`pointer-events:none; background: radial-gradient(240px circle at var(--x) var(--y), color-mix(in srgb, var(--amber) 9%, transparent), transparent 70%)`) with `mask-image` = the same 32px grid so only grid lines glow; `pointermove` updates `--x/--y` inside rAF.
- [ ] **Step 6:** `npm test && npm run build`; manual checks in `astro preview`: ⌘K opens/filters/navigates with keyboard only; theme persists across reload with no flash; clock ticks; count-up runs once; enable "Emulate CSS prefers-reduced-motion" → no motion, final values shown.
- [ ] **Step 7:** Commit `feat: palette, theme toggle, clock, count-up, reveal, grid lamp`.

---

### Task 5: Case-study layout and components

**Files:**
- Create: `src/layouts/CaseStudy.astro`, `src/pages/work/[slug].astro`, `src/components/{StatStrip,Toc,Figure,CodeRef}.astro`, `src/scripts/scrollspy.ts`

**Interfaces:**
- Consumes: `getCollection('work')`, `render(entry)` → `{ Content, headings }`.
- Produces: MDX-usable components `Figure` (props `{ caption: string }`, slot = inline SVG) and `CodeRef` (props `{ file: string; lines: string; repo: string; lang: string; code: string }`, renders a `<figure>` with Astro's `<Code>` highlighter using a custom theme built from tokens + caption linking `{repo}/blob/HEAD/{file}#L{start}-L{end}`).

- [ ] **Step 1:** `[slug].astro`: `getStaticPaths` from `getCollection('work')` sorted by `order`, params `{ slug: entry.id }`, props `{ entry, next }` where `next` wraps around.
- [ ] **Step 2:** `CaseStudy.astro` to match `case-study.html`: breadcrumb (`OR / work / {id}` · `← all work` → `/#work`), header grid 1fr/260px (stack <860px), `StatStrip` (4 cells, 2×2 <640px, `note` shown as footnote under the strip), body grid 160px/1fr with sticky `Toc` from `headings.filter(h => h.depth === 2)` (hidden <860px), prose max-width 640px, next-case-study footer. Demo link without href renders as `<span aria-disabled="true">` with `--dim` color.
- [ ] **Step 3:** `Toc` + `scripts/scrollspy.ts`: IntersectionObserver over `.prose h2[id]` with `rootMargin: '0px 0px -70% 0px'`; sets `aria-current="true"` on the matching TOC link; CSS styles `[aria-current]` with the amber `▸`.
- [ ] **Step 4:** Prose styles: h2 with mono index `<small>` generated by CSS counter; `code` inline in mono on `--panel`; `Figure` panel with caption in mono `--dim`; code blocks via Shiki `css-variables` theme mapped to tokens (keywords `#c4a7ff`, types `#7dd3fc`, numbers `--amber`, comments `--dim`; light-mode equivalents `#6d28d9`, `#0369a1`, `--amber`, `--dim`).
- [ ] **Step 5:** `npm run build`; screenshot a case-study page at 375/1280; TOC highlights on scroll.
- [ ] **Step 6:** Commit `feat: case-study layout, TOC scroll-spy, figure and code components`.

---

### Task 6: Case study content — Options Screener

**Files:** Modify `src/content/work/options-screener.mdx`

- [ ] **Step 1: Research** in `~/Projects/options` (read-only): README.md (factor table ~L777, architecture, data providers, backtest docs), `src/` subpackage list, the SVI fit module, the provenance/caching layer, walk-forward/forward-cohort gate code. Record each fact with its source file.
- [ ] **Step 2:** Frontmatter: order 1; category `QUANT · PYTHON`; summary = one sentence; role Solo; timeline = first-commit year – Present; stack from imports; stats: `Tests 6,000+`, `Commits 1,338`, `Factors 27`, `Realized +$9.2k` (accent, note = the discretionary line); asOf `2026-09-29`.
- [ ] **Step 3:** Sections: Overview; Architecture (Figure: providers → cache/provenance layer → pricing/Greeks/SVI → 27-factor scorer (VIX-regime weights) → forward-cohort gate → surfaces: Streamlit, FastAPI, Discord/Telegram bots); Hard problems (2–3 with `CodeRef` excerpts ≤ 25 lines each, e.g. stale-quote provenance flagging, SVI fitting, walk-forward validation that publishes negative results); Results (what the backtests showed, incl. negative results, and the discretionary P&L with framing); What I'd do next.
- [ ] **Step 4:** `npm run build && node scripts/verify-dist.mjs` (og failure still expected until Task 8; all other rules must pass). Commit `content: Options Screener case study`.

### Task 7: Case study content — NES Emulator and OVERDRIVE

**Files:** Modify `src/content/work/nes-emulator.mdx`, `src/content/work/overdrive.mdx`

- [ ] **Step 1: Research** from the clones in the scratchpad (`repos/better_emulator`, `repos/3d_shooter`): READMEs, `src/bus.rs`, `src/emulator.rs`, `src/cpu/mod.rs`, `src/ppu/mod.rs`, mappers; OVERDRIVE `src/main.cpp` loop, `Player.h` (air-strafe), `PostProcess.h` + bloom/crt shaders, `TextureGen.h`, `Enemy.h` FSM. `git log` for each for any real anecdotes.
- [ ] **Step 2:** NES frontmatter: order 2, `EMULATION · RUST`, demo `{ label: 'Play in browser (soon)' }`, stats: `Clock ratio 3 : 1`, `Mappers 3`, `APU channels 4 / 4`, `nestest` → only `pass` if README/tests show it passes; otherwise use `Rust LOC 3.5k`. Architecture Figure = the ownership diagram from the mockup. Hard problems: master-clock lockstep + NMI/IRQ propagation; single owning Bus instead of `Rc<RefCell<>>`; one of PPU Loopy scroll / MMC1 serial-register writes. Real excerpts only.
- [ ] **Step 3:** OVERDRIVE frontmatter: order 3, `GRAPHICS · C++`, stack `C++17, OpenGL 3.3 Core, SDL2, GLM`; stats: `Physics 60 Hz`, `Render passes` (count from PostProcess), `Image assets 0`, `C++ LOC 6.4k` (recount excluding shaders, or label "LOC incl. shaders"). Figure = frame pipeline (fixed-step sim → interpolate → scene pass (instanced enemies, Blinn-Phong) → bright → blur ×N → composite → CRT). Hard problems: fixed timestep + interpolation; swept collision/air-strafing; procedural textures. Platform note: macOS + Windows; Linux untested.
- [ ] **Step 4:** Build + verify (og failure only). Commit `content: NES Emulator and OVERDRIVE case studies`.

---

### Task 8: SEO, OG images, 404

**Files:**
- Create: `src/components/Seo.astro`, `src/pages/og/[...route].png.ts`, `src/lib/og.ts`, `src/pages/404.astro`
- Modify: `src/layouts/Base.astro`
- Test: `tests/unit/og.test.ts`

**Interfaces:**
- Produces: `ogPath(route: string): string` (`'/'` → `'/og/index.png'`, `'/work/nes-emulator'` → `'/og/work/nes-emulator.png'`); `renderOg({ eyebrow, title, subtitle }): Promise<Buffer>`.

- [ ] **Step 1: Failing test** `tests/unit/og.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ogPath } from '../../src/lib/og';
describe('ogPath', () => {
  it('maps home', () => { expect(ogPath('/')).toBe('/og/index.png'); });
  it('maps nested routes and strips trailing slash', () => {
    expect(ogPath('/work/nes-emulator/')).toBe('/og/work/nes-emulator.png');
  });
});
```

- [ ] **Step 2:** Run → FAIL. **Step 3:** implement `ogPath` (`const r = route.replace(/\/+$/, ''); return r === '' ? '/og/index.png' : `/og${r}.png``) and `renderOg` with satori (1200×630, `--bg` background with grid, mono eyebrow in amber, Inter Tight 600 title 72px, subtitle `--mute`, `OR` monogram bottom-left, URL bottom-right; fonts loaded from `node_modules/@fontsource/*/files/*-latin-{400,600}-normal.woff`) → `@resvg/resvg-js` PNG. **Step 4:** Run → PASS.
- [ ] **Step 5:** `og/[...route].png.ts` `getStaticPaths` for `index` + each work entry + `404`; `Seo.astro` emits title, description, canonical, `og:*`, `twitter:card=summary_large_image`, and on home a JSON-LD `Person` (`name`, `url`, `email`, `alumniOf` University of Guelph, `sameAs` = GitHub + LinkedIn when set). 404 page: "404 · Signal lost." with links home and to the palette.
- [ ] **Step 6:** `npm run build && node scripts/verify-dist.mjs` → **PASS with zero violations** (first fully green run). Inspect one PNG with the Read tool.
- [ ] **Step 7:** Commit `feat: SEO, generated OG images, JSON-LD, 404`.

---

### Task 9: Quality pass, README, Vercel preview

**Files:** Create `README.md`; modify any file needed to fix findings.

- [ ] **Step 1:** Contrast audit: compute WCAG ratios for every text token on `--bg` and `--panel` in both themes with a small node script (relative-luminance formula); any body-text pair < 4.5:1 or label pair < 4.5:1 at 10–11px gets its token nudged; record final ratios in the commit message.
- [ ] **Step 2:** Lighthouse mobile on `astro preview`: `npx lighthouse http://localhost:4321/ --form-factor=mobile --only-categories=performance,accessibility,best-practices,seo --output=json --chrome-flags="--headless"` and the same for `/work/options-screener`. All ≥ 95; fix and re-run until they are.
- [ ] **Step 3:** Screenshots at 375/768/1280 for `/`, each case study, 404, both themes. Review each for overflow, wrapping, alignment against the mockups.
- [ ] **Step 4:** Keyboard walkthrough: Tab through home and a case study; every control visibly focused; palette fully operable; skip-link "Skip to content" present as first focusable element (add to Base if missing).
- [ ] **Step 5:** `README.md`: what it is, `npm i` / `npm run dev` / `npm run verify` / `npm test`, adding a case study (schema fields, 4 stats, `asOf`, TODO(oliver) convention), setting LinkedIn (`src/site.config.ts`), refreshing the resume (`cp ~/Desktop/hello/OliverRaczka_Resume.pdf public/resume.pdf`), deploying (`vercel` preview, `vercel --prod`).
- [ ] **Step 6:** Full gate: `npm test && npm run check && npm run verify` → all green. Commit `chore: quality pass and README`.
- [ ] **Step 7:** Deploy preview: `npx vercel` (Oliver runs `! npx vercel login` first if not authenticated). Project name `oliver-raczka`; if the resulting URL differs from `site.url`, update `site.url` + `robots.txt`, rebuild, redeploy. Share the preview URL. Production (`vercel --prod`) and merge to `main` only after Oliver approves.
