import { describe, expect, it, vi, afterEach } from 'vitest';
import handler, { cleanName, validate, parseTop } from '../../api/overdrive-board.js';

function mockRes() {
  const res: any = { headers: {} as Record<string, string>, statusCode: 0, body: undefined };
  res.setHeader = (k: string, v: string) => { res.headers[k] = v; };
  res.status = (c: number) => { res.statusCode = c; return res; };
  res.json = (b: unknown) => { res.body = b; return res; };
  return res;
}

describe('OVERDRIVE leaderboard API', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it('cleans names like the game does', () => {
    expect(cleanName('  ollie <3!!  ')).toBe('OLLIE 3');
    expect(cleanName('abcdefghijklmnopq')).toHaveLength(12);
    expect(cleanName(undefined)).toBe('');
  });

  it('rejects implausible submissions', () => {
    expect(validate({ mode: 'arena', name: 'A', time: 600, difficulty: 1 })).toEqual({ mode: 'arena', name: 'A', time: 600, difficulty: 1 });
    expect(validate({ mode: 'arena', name: 'A', time: 20, difficulty: 1 }).error).toBe('time');
    expect(validate({ mode: 'sky', name: 'A', time: 600, difficulty: 1 }).error).toBe('mode');
    expect(validate({ mode: 'fast', name: '!!', time: 600, difficulty: 1 }).error).toBe('name');
    expect(validate({ mode: 'fast', name: 'A', time: 600, difficulty: 9 }).error).toBe('difficulty');
  });

  it('reads Redis WITHSCORES replies', () => {
    expect(parseTop([JSON.stringify({ n: 'ollie', d: 2 }), '301.5', 'junk', '1'])).toEqual([{ name: 'OLLIE', time: 301.5, difficulty: 2 }]);
  });

  it('answers 503 until a store is connected', async () => {
    vi.stubEnv('KV_REST_API_URL', ''); vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    const res = mockRes();
    await handler({ method: 'GET', query: { mode: 'arena' }, headers: {} }, res);
    expect(res.statusCode).toBe(503);
  });

  it('stores a run and returns the board', async () => {
    vi.stubEnv('KV_REST_API_URL', 'https://redis.example'); vi.stubEnv('KV_REST_API_TOKEN', 't');
    const calls: unknown[] = [];
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: { body: string }) => {
      const cmds = JSON.parse(init.body);
      calls.push(cmds);
      const result = cmds.map((c: string[]) =>
        c[0] === 'INCR' ? { result: 1 } : c[0] === 'ZRANGE' ? { result: [JSON.stringify({ n: 'OLLIE', d: 1 }), '612.4'] } : { result: 1 });
      return { ok: true, json: async () => result };
    }));
    const res = mockRes();
    await handler({ method: 'POST', body: { mode: 'arena', name: 'ollie', time: 612.4, difficulty: 1 },
                    headers: { 'x-forwarded-for': '1.2.3.4' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.entries[0]).toEqual({ name: 'OLLIE', time: 612.4, difficulty: 1 });
    expect(JSON.stringify(calls)).toContain('ZADD');
  });
});
