import { z } from 'astro/zod';

const text = z
  .string()
  .min(1)
  .refine((s) => !/résumé|résume|resumé/i.test(s), { message: 'Write "Resume" without accents' });

export const statSchema = z.object({
  k: text,
  v: text,
  accent: z.boolean().optional(),
  note: text.optional(),
});

export const workSchema = z.object({
  order: z.number().int().positive(),
  title: text,
  category: text,
  summary: text,
  description: text,
  role: text,
  timeline: text,
  stack: z.array(text).min(1),
  repo: z.url(),
  demo: z.object({ label: text, href: z.url().optional() }).optional(),
  stats: z.array(statSchema).length(4),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type Work = z.infer<typeof workSchema>;
export type Stat = z.infer<typeof statSchema>;
