# oliver-raczka.vercel.app

Personal site and portfolio of Oliver Raczka: three in-depth case studies (Options Screener, NES Emulator, OVERDRIVE), experience, and a downloadable resume.

Static [Astro 7](https://astro.build) site. Hand-written CSS on design tokens, about 3 KB of vanilla TypeScript, no UI framework. Lighthouse (mobile): 99–100 on every category.

## Commands

```bash
npm install
npm run dev       # http://localhost:4321
npm test          # unit tests (Vitest)
npm run check     # type-check .astro, .ts and content frontmatter
npm run verify    # production build + content/link rules (scripts/verify-dist.mjs)
```

`npm run verify` fails the build if any page:

- writes "Resume" with accents,
- shows the realized P&L without the word "discretionary",
- mentions a project that must not appear (Orion, Chat-App),
- links to LinkedIn while `linkedin` is unset,
- claims tests are "passing",
- has a broken internal link, or lacks a title, description or built OG image.

## Common edits

**Set LinkedIn.** In `src/site.config.ts`, change `linkedin: null` to your profile URL. It then appears in the footer, the ⌘K palette and the structured data, with no other edits.

**Refresh the resume.**

```bash
cp ~/Desktop/hello/OliverRaczka_Resume.pdf public/resume.pdf
```

**Update homepage numbers.** Telemetry lives in `src/data/telemetry.ts`; experience, stack and the "Also built" index sit next to it in `src/data/`. Every number there is verified against its repo; the comment at the top of `telemetry.ts` records how.

**Add or edit a case study.** Each is one MDX file in `src/content/work/`, validated by `src/lib/schema.ts`:

| field | notes |
|---|---|
| `order` | position on the homepage; `1` gets the wide panel |
| `category` | e.g. `EMULATION · RUST` |
| `summary` / `description` | one-sentence pitch / meta description |
| `stats` | **exactly four** `{ k, v }`; add `accent: true` or a `note` footnote where needed |
| `demo` | optional; omit `href` to show it disabled ("soon") |
| `asOf` | `YYYY-MM-DD` the stats were checked against the repo |

Case studies can use two components:

- `<Figure caption="…">` wraps an inline SVG diagram. Use the classes `box`, `box-strong`, `box-accent`, `t`, `td`, `ta`, `edge` and `edge-accent` so it themes correctly in light and dark mode.
- `<CodeRef lang repo file lines code />` renders an excerpt with a link to the exact lines on GitHub. Copy excerpts verbatim from the repo.

Anything you can't back up from the repo or its history goes in an MDX comment as `{/* TODO(oliver): … */}` rather than in published text.

## Deploying

```bash
npx vercel          # preview deployment
npx vercel --prod   # production
```

If the production URL differs from `https://oliver-raczka.vercel.app`, update it in `src/site.config.ts`, `astro.config.mjs` and `public/robots.txt`.

## Layout

```
src/
  site.config.ts        identity and links (single source of truth)
  content/work/*.mdx    case studies
  data/                 homepage copy and numbers
  lib/                  pure, unit-tested logic (schema, palette search, theme, count-up, OG)
  components/           page sections
  layouts/              Base (head, status bar, palette, footer), CaseStudy
  scripts/              browser behaviour, one module per feature
  pages/                routes, including og/[...route].png.ts (build-time social cards)
scripts/verify-dist.mjs post-build content rules
docs/superpowers/       design spec and implementation plan
```
