// OVERDRIVE's shared leaderboard: every visitor's finished runs, fastest first.
//
//   GET  /api/overdrive-board?mode=arena|fast   → { entries: [{ name, time, difficulty }] }  (top 10)
//   POST /api/overdrive-board  { mode, name, time, difficulty }  → { ok, entries }
//
// Stored in Upstash Redis (a sorted set per mode, score = seconds) through its
// REST API. Connect a store to the Vercel project and its env vars
// (KV_REST_API_URL / KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL / _TOKEN)
// switch this on; without them it answers 503 and the game keeps its
// per-browser board. Times are sanity-checked and each IP may post 10 an hour.

export const MODES = ['arena', 'fast'];
export const KEEP = 100;           // stored per mode; GET returns the top TOP
export const TOP = 10;
export const MIN_TIME = { arena: 180, fast: 60 };   // faster than this isn't a real run
export const MAX_TIME = 4 * 3600;
export const POSTS_PER_HOUR = 10;

// The game's own rule (Leaderboard::cleanName): A-Z 0-9 space - . _, 12 at most
export function cleanName(raw) {
  const s = String(raw ?? '').toUpperCase().replace(/[^A-Z0-9 ._-]/g, '').slice(0, 12).trim();
  return s;
}

// A submission, checked; returns { mode, name, time, difficulty } or { error }
export function validate(body) {
  const mode = body?.mode;
  if (!MODES.includes(mode)) return { error: 'mode' };
  const name = cleanName(body?.name);
  if (!name) return { error: 'name' };
  const time = Number(body?.time);
  if (!Number.isFinite(time) || time < MIN_TIME[mode] || time > MAX_TIME) return { error: 'time' };
  const difficulty = Number(body?.difficulty);
  if (!Number.isInteger(difficulty) || difficulty < 0 || difficulty > 3) return { error: 'difficulty' };
  return { mode, name, time: Math.round(time * 100) / 100, difficulty };
}

function store() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function redis(s, commands) {
  const r = await fetch(`${s.url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${s.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return (await r.json()).map((x) => x.result);
}

// ZRANGE ... WITHSCORES comes back flat: [member, score, member, score, ...]
export function parseTop(flat) {
  const out = [];
  for (let i = 0; i + 1 < (flat?.length ?? 0); i += 2) {
    try {
      const m = JSON.parse(flat[i]);
      out.push({ name: cleanName(m.n), time: Number(flat[i + 1]), difficulty: m.d | 0 });
    } catch { /* skip a bad member */ }
  }
  return out;
}

const top = async (s, mode) =>
  parseTop((await redis(s, [['ZRANGE', `od:board:${mode}`, 0, TOP - 1, 'WITHSCORES']]))[0]);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const s = store();
  if (!s) return res.status(503).json({ error: 'leaderboard store not connected' });
  try {
    if (req.method === 'GET') {
      const mode = req.query?.mode;
      if (!MODES.includes(mode)) return res.status(400).json({ error: 'mode' });
      return res.status(200).json({ entries: await top(s, mode) });
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
      const v = validate(body);
      if (v.error) return res.status(400).json({ error: v.error });
      const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
      const [count] = await redis(s, [['INCR', `od:rl:${ip}`], ['EXPIRE', `od:rl:${ip}`, 3600, 'NX']]);
      if (count > POSTS_PER_HOUR) return res.status(429).json({ error: 'slow down' });
      const member = JSON.stringify({ n: v.name, d: v.difficulty, at: Date.now() });
      await redis(s, [
        ['ZADD', `od:board:${v.mode}`, v.time, member],
        ['ZREMRANGEBYRANK', `od:board:${v.mode}`, KEEP, -1],
      ]);
      return res.status(200).json({ ok: true, entries: await top(s, v.mode) });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method' });
  } catch (e) {
    return res.status(502).json({ error: 'store unavailable' });
  }
}
