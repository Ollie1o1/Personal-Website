import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { renderOg, type OgCard } from '../../lib/og';
import site from '../../site.config';

export const getStaticPaths: GetStaticPaths = async () => {
  const work = await getCollection('work');
  const cards: { route: string; card: OgCard }[] = [
    { route: 'index', card: { eyebrow: site.availability, title: site.name, subtitle: `${site.title} Emulators, a from-scratch game engine, and an options screener I trade with.` } },
    { route: '404', card: { eyebrow: '404', title: 'Signal lost.', subtitle: 'That page does not exist.' } },
    ...work.map((w) => ({
      route: `work/${w.id}`,
      card: { eyebrow: `${String(w.data.order).padStart(2, '0')} / ${w.data.category}`, title: w.data.title, subtitle: w.data.summary },
    })),
  ];
  return cards.map(({ route, card }) => ({ params: { route }, props: { card } }));
};

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg(props.card as OgCard);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
