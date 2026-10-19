// OVERDRIVE's shared leaderboards: every visitor's finished runs.
//
//   GET  /api/overdrive-board?mode=arena|fast|endless   → { entries }  (top 10)
//   POST /api/overdrive-board  { mode, name, time, difficulty, score, wave }  → { ok, entries }
//
// FAST is a time trial, ranked fastest first; entries are { name, time, difficulty }.
// ARENA and ENDLESS rank by the game's combined score (style earned, a time
// bonus or waves cleared, damage taken, x difficulty), highest first;
// entries are { name, score, time, difficulty, wave }.
//
// Stored in Upstash Redis (a sorted set per board) through its REST API.
// Connect a store to the Vercel project and its env vars (KV_REST_API_URL /
// KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL / _TOKEN) switch this on;
// without them it answers 503 and the game keeps its per-browser boards.
// Submissions are sanity-checked and each IP may post 10 an hour.

export const MODES = ['arena', 'fast', 'endless'];
export const SCORED = ['arena', 'endless'];   // ranked by score, highest first
export const KEEP = 100;           // stored per board; GET returns the top TOP
export const TOP = 10;
export const MIN_TIME = { arena: 180, fast: 60, endless: 10 };   // faster than this isn't a real run
export const MAX_TIME = 4 * 3600;
export const MAX_WAVE = 500;
export const POSTS_PER_HOUR = 10;

// The game's own rule (Leaderboard::cleanName): A-Z 0-9 space - . _, 12 at most
export function cleanName(raw) {
  const s = String(raw ?? '').toUpperCase().replace(/[^A-Z0-9 ._-]/g, '').slice(0, 12).trim();
  return s;
}

// The highest score a run could plausibly have (Score.h in the game: style is
// at most a few thousand a wave, or tens of thousands over a full ARENA run;
// 10 points a second under the 15-minute par; 500 a wave; x1.5 on BRUTAL)
export function maxScore(mode, time, wave) {
  const mult = 1.5;
  if (mode === 'arena') return Math.round((60000 + Math.max(0, 900 - time) * 10) * mult);
  return Math.round(((wave + 1) * 4000 + wave * 500) * mult);
}

// A submission, checked; returns the run or { error }
export function validate(body) {
  const mode = body?.mode;
  if (!MODES.includes(mode)) return { error: 'mode' };
  const name = cleanName(body?.name);
  if (!name) return { error: 'name' };
  const time = Number(body?.time);
  if (!Number.isFinite(time) || time < MIN_TIME[mode] || time > MAX_TIME) return { error: 'time' };
  const difficulty = Number(body?.difficulty);
  if (!Number.isInteger(difficulty) || difficulty < 0 || difficulty > 3) return { error: 'difficulty' };
  const run = { mode, name, time: Math.round(time * 100) / 100, difficulty };
  if (!SCORED.includes(mode)) return run;
  const wave = mode === 'arena' ? 0 : Number(body?.wave);
  if (!Number.isInteger(wave) || wave < 0 || wave > MAX_WAVE) return { error: 'wave' };
  const score = Number(body?.score);
  if (!Number.isInteger(score) || score < 1 || score > maxScore(mode, time, wave)) return { error: 'score' };
  Object.assign(run, { score, wave });
  return run;
}

// The Redis key of a board. ARENA moved to board2 when it switched from
// times to scores; FAST's times stay where they were.
export function boardKey(mode) {
  if (mode === 'fast') return 'od:board:fast';
  return `od:board2:${mode}`;
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
export function parseTop(flat, mode = 'fast') {
  const out = [];
  for (let i = 0; i + 1 < (flat?.length ?? 0); i += 2) {
    try {
      const m = JSON.parse(flat[i]);
      const v = Number(flat[i + 1]);
      if (SCORED.includes(mode)) out.push({ name: cleanName(m.n), score: v, time: Number(m.t) || 0, difficulty: m.d | 0, wave: m.w | 0 });
      else out.push({ name: cleanName(m.n), time: v, difficulty: m.d | 0 });
    } catch { /* skip a bad member */ }
  }
  return out;
}

const top = async (s, mode) => {
  const range = ['ZRANGE', boardKey(mode), 0, TOP - 1];
  if (SCORED.includes(mode)) range.push('REV');
  range.push('WITHSCORES');
  return parseTop((await redis(s, [range]))[0], mode);
};

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
      const key = boardKey(v.mode);
      const scored = SCORED.includes(v.mode);
      const member = JSON.stringify(scored ? { n: v.name, d: v.difficulty, t: v.time, w: v.wave, at: Date.now() }
                                           : { n: v.name, d: v.difficulty, at: Date.now() });
      const cmds = [
        ['ZADD', key, scored ? v.score : v.time, member],
        // keep the best KEEP: drop the lowest scores (or the slowest times)
        scored ? ['ZREMRANGEBYRANK', key, 0, -(KEEP + 1)] : ['ZREMRANGEBYRANK', key, KEEP, -1],
      ];
      await redis(s, cmds);
      return res.status(200).json({ ok: true, entries: await top(s, v.mode) });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method' });
  } catch (e) {
    return res.status(502).json({ error: 'store unavailable' });
  }
}
