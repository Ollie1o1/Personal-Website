export interface Command {
  id: string;
  label: string;
  hint: string;
  href?: string;
  action?: 'theme';
}

// 3 = whole string starts with q, 2 = a word starts with q, 1 = q is a subsequence, 0 = no match.
function score(hay: string, q: string): number {
  const h = hay.toLowerCase();
  if (h.startsWith(q)) return 3;
  if (h.split(/[\s()/-]+/).some((w) => w.startsWith(q))) return 2;
  let i = 0;
  for (const ch of h) if (ch === q[i]) i++;
  return i === q.length ? 1 : 0;
}

export function filterCommands(cmds: Command[], query: string): Command[] {
  const q = query.trim().toLowerCase();
  if (!q) return cmds;
  return cmds
    .map((c, idx) => {
      const hint = score(c.hint, q);
      return { c, idx, s: Math.max(score(c.label, q), hint && hint - 0.5) };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.idx - b.idx)
    .map((x) => x.c);
}
