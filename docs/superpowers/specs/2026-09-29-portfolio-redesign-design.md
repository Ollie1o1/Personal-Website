# Portfolio Redesign — Design Spec

**Date:** 2026-09-29 · **Owner:** Oliver Raczka · **Status:** approved in brainstorming, pending spec review

## Goal

Replace the current single-page static site (plain HTML/CSS/JS, not deployed) with a portfolio that makes a
strong first impression on interviewers for Summer 2027 internships in **systems and quant** roles. It must
lead with Oliver's strongest, verifiable work and read as the product of a careful engineer.

## Non-goals

- No blog (an empty blog is a negative signal).
- No headshot; an `OR` monogram stands in.
- No custom domain yet — deploy to `*.vercel.app`.
- The in-browser WASM NES emulator is **phase 2**, explicitly out of scope here. The NES case study shows a
  disabled "Play in browser (soon)" link as a placeholder.

## Stack & hosting

- **Astro 5**, fully static output, content collections with Zod-typed frontmatter.
- **Hand-written CSS** driven by custom-property tokens. No Tailwind, no UI framework.
- **Vanilla JS islands only**, ~3 KB total: ⌘K palette, theme toggle, live clock, count-up, grid lamp, TOC scroll-spy.
- **Fonts self-hosted** via `@fontsource` (Inter Tight, IBM Plex Mono). No runtime requests to Google.
- **Vercel** static deployment through the Vercel CLI (Oliver runs `vercel login` once).

## Site map

| Route | Content |
|---|---|
| `/` | Homepage |
| `/work/options-screener` | Case study |
| `/work/nes-emulator` | Case study |
| `/work/overdrive` | Case study |
| `/work/risc-v` | Case study |
| `/resume.pdf` | Copy of `~/Desktop/hello/OliverRaczka_Resume.pdf` |
| `/404` | Styled not-found page |

## Site config (single source of truth)

`src/site.config.ts` exports name, tagline, email, GitHub URL, availability line, and `linkedin: string | null`.
When `linkedin` is `null`, every LinkedIn link (status bar, footer, palette, JSON-LD `sameAs`) is omitted.
Setting it to a URL makes it appear everywhere with no other edits.

## Homepage (top → bottom)

1. **Status bar (sticky):** `OR` monogram + name · nav (Work, Experience, Resume ↗, ⌘K) · live clock
   (`America/Toronto`, labelled "Guelph, ON") · theme toggle.
2. **Hero:** amber eyebrow "● Open to Summer 2027 internships"; H1 "Oliver Raczka" / dim line
   "Systems & quant engineer."; one-sentence bio; CTAs: **Resume (PDF)**, GitHub, Email.
   Right side: **Telemetry** panel with 4 cells, each labelled with exactly what it measures: Screener tests
   **5,000+** (a grep-based floor of 5,264 `def test_`; pytest collection isn't available, so never "5,264 passing"),
   Screener commits **1,125**, Screener LOC **159k**, Emulators built **2** (NES, RISC-V). Stamp: "as of <month year>".
   All four are re-verified against the repos before launch.
3. **Selected work:** Options Screener as a full-width panel (description + 4-stat mini grid including
   **+$9.2k realized\*** with the footnote *"discretionary trades I picked from its ranked signals, not
   autonomous trading"*); then NES Emulator, OVERDRIVE, RISC-V Emulator as three panels. Each links to its
   case study.
4. **Also built:** single-line index: Crypto trading bot (`crypto_mathbot`), Maze RL solver (`Maze`),
   img2ascii (`imgtoascii`), Audio visualizer (`Audio-Visualizer`). Each links to its GitHub repo.
5. **Experience:** Freelance Web Developer (May 2024 — Present); Desjardins Sales Representative
   (Apr 2025 — Present); Desjardins Event Marketing Intern (Jan 2024 — Jan 2025); University of Guelph,
   Bachelor of Computing, Computer Science, expected April 2028, with coursework: Operating Systems,
   Data Structures, Algorithms, Statistics II, Calculus II, Discrete Structures.
6. **Stack:** four groups (Systems, Graphics, Quant / data, Web / infra). No proficiency percentages.
7. **Footer / contact:** "Let's build something fast." + email, GitHub, (LinkedIn when set).

**Excluded projects:** Orion (a fork, not Oliver's work), Chat-App (cut from the resume as too thin),
Snake, Flappy Bird, wizard-jumper, pdf_converter, ascii-art-attempt, Bored-and-Curious, sdl-projects,
DataStructures, and all coursework repos.

## Case-study template

Each case study is one MDX file in `src/content/work/`. Frontmatter schema:

```ts
{
  order: number, title: string, slug: string, category: string,   // "EMULATION · RUST"
  summary: string,                     // one-sentence pitch
  role: string, timeline: string, stack: string[],
  repo: string, demo?: { label: string, href?: string },  // href absent → rendered disabled
  stats: { k: string, v: string, accent?: boolean, note?: string }[],  // exactly 4
  asOf: string                          // date the stats were verified
}
```

Page layout: breadcrumb → header (title, summary, meta sidebar) → 4-stat strip → body with sticky
scroll-spy TOC and sections **Overview, Architecture, Hard problems, Results, What I'd do next** →
next-case-study link. Architecture uses one hand-authored inline SVG diagram per project, drawn with
theme tokens so it works in both themes. "Hard problems" has 2–3 deep dives with code excerpts copied from
the real repo (file path + line range cited under each block).

## Content accuracy rules (non-negotiable)

- Every number is verified against its repo (or Oliver's resume, which was itself repo-verified on
  2026-08-27) at build time of the content, and each case study records `asOf`.
- The P&L is always framed as discretionary, in every place it appears.
- Anecdotes ("this bug took a week") are only written if found in commit history or READMEs; otherwise
  they are drafted as `TODO(oliver): …` comments in the MDX, never published as fact.
- Stack terms must each be backed by at least one repo or resume line.
- The word "Resume" is written without accents everywhere.

## Visual system

**Tokens** (dark default / light "paper"):

| token | dark | light |
|---|---|---|
| `--bg` | `#0f1013` | `#f3f2ee` |
| `--panel` | `#14151a` | `#fbfaf7` |
| `--line` | `#24262c` | `#dedbd2` |
| `--dim` | `#5d6069` | `#8b8d93` |
| `--mute` | `#8a8d96` | `#5f6168` |
| `--fg` | `#ececef` | `#16171a` |
| `--amber` | `#f5b83d` | `#b7791f` |

Theme resolution: saved choice (`localStorage`, try/catch-wrapped) → `prefers-color-scheme` → dark.
An inline head script sets `data-theme` before first paint (no flash). Every text/background pair
used must meet WCAG AA; `--dim` is restricted to ≥ 10px uppercase labels and non-essential text, and any
pair that fails AA gets adjusted during implementation.

**Type:** Inter Tight (display 64 / h2 28 / body 16) + IBM Plex Mono (labels 10–11 uppercase, metrics 26,
code 12.5). Tabular numerals for all metrics. Display sizes scale down with `clamp()`.

**Background:** 32px hairline grid on `--bg`.

**Motion (exactly four):** metric count-up on first view (600ms, ease-out cubic); panel rise (8px, fade,
40ms stagger, once); amber hairline draw on hover/focus (doubles as focus indicator); grid lamp (radial
amber glow following the cursor, pointer: fine only). All disabled under `prefers-reduced-motion`; the
count-up renders final values immediately in that case and without JS.

## Interactions

- **⌘K / Ctrl+K palette:** jump to sections and case studies, open Resume, GitHub, email, toggle theme.
  Full keyboard support, focus trap, Escape closes, ARIA `combobox`/`listbox` roles.
- **TOC scroll-spy** via IntersectionObserver.
- The site is fully usable with JS disabled (palette/toggle/clock simply absent).

## SEO & sharing

Per-page `<title>`/description, canonical URL, Open Graph + Twitter tags, a generated 1200×630 OG
image per page (built at compile time with `satori` + `@resvg/resvg-js`, in site styling), JSON-LD
`Person`, `sitemap.xml`, `robots.txt`, SVG favicon (the `OR` monogram).

## Quality bar / verification

- `astro check` and `astro build` pass with zero errors.
- Lighthouse (mobile) ≥ 95 in Performance, Accessibility, Best Practices, SEO on `/` and one case study —
  target 100.
- No horizontal scroll at 375px; layouts verified at 375 / 768 / 1280 px by screenshot.
- Keyboard-only walkthrough: every interactive element reachable with a visible focus state.
- Automated link check over the built site (no broken internal links).

## Repo & delivery

- Work on branch `redesign/astro` in `~/Projects/Personal-Website`; the old files are removed in the
  same branch (they remain in git history).
- `.superpowers/` added to `.gitignore`.
- README documents: dev/build commands, how to add a case study, how to set LinkedIn, how to refresh the
  resume PDF, how to deploy.
- Deploy a Vercel preview first; merge to `main` and go to production only after Oliver reviews it.
