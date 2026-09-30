// Renders 1200×630 Open Graph cards at build time with satori (layout → SVG) and resvg (SVG → PNG).
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// Resolved from the project root: at build time this module runs from a bundled chunk, not src/.
const font = (pkg: string, file: string) => readFile(join(process.cwd(), 'node_modules/@fontsource', pkg, 'files', file));

const fontsPromise = Promise.all([
  font('inter-tight', 'inter-tight-latin-600-normal.woff'),
  font('ibm-plex-mono', 'ibm-plex-mono-latin-400-normal.woff'),
  font('inter-tight', 'inter-tight-latin-400-normal.woff'),
]).then(([sans, mono, sansRegular]) => [
  { name: 'Inter Tight', data: sans, weight: 600 as const, style: 'normal' as const },
  { name: 'Inter Tight', data: sansRegular, weight: 400 as const, style: 'normal' as const },
  { name: 'IBM Plex Mono', data: mono, weight: 400 as const, style: 'normal' as const },
]);

const C = { bg: '#0f1013', grid: '#1a1b21', line: '#24262c', fg: '#ececef', mute: '#8a8d96', dim: '#5d6069', amber: '#f5b83d' };

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({ type, props: { style, children } });

export interface OgCard {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export async function renderOg({ eyebrow, title, subtitle }: OgCard): Promise<Buffer> {
  const tree = h(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '72px 80px',
      backgroundColor: C.bg,
      backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`,
      backgroundSize: '40px 40px',
      color: C.fg,
      fontFamily: 'Inter Tight',
    },
    [
      h('div', { display: 'flex', fontFamily: 'IBM Plex Mono', fontSize: 24, letterSpacing: 3, color: C.amber, textTransform: 'uppercase' }, eyebrow),
      h('div', { display: 'flex', flexDirection: 'column' }, [
        h('div', { fontSize: title.length > 18 ? 88 : 112, fontWeight: 600, letterSpacing: -4, lineHeight: 1 }, title),
        h('div', { marginTop: 28, fontSize: 34, fontWeight: 400, color: C.mute, lineHeight: 1.3, maxWidth: 960 }, subtitle),
      ]),
      h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'IBM Plex Mono', fontSize: 22, color: C.dim }, [
        h('div', { display: 'flex', alignItems: 'center', gap: 18 }, [
          h('div', { display: 'flex', width: 52, height: 52, border: `2px solid ${C.fg}`, color: C.fg, alignItems: 'center', justifyContent: 'center', fontSize: 20 }, 'OR'),
          h('div', { display: 'flex', color: C.fg }, 'Oliver Raczka'),
        ]),
        h('div', { display: 'flex' }, 'oliver-raczka.vercel.app'),
      ]),
    ],
  );
  const svg = await satori(tree as any, { width: 1200, height: 630, fonts: await fontsPromise });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
