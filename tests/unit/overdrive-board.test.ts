import { describe, expect, it, vi, afterEach } from 'vitest';
import handler, { cleanName, validate, parseTop, maxScore, boardKey } from '../../api/overdrive-board.js';

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
    expect(validate({ mode: 'fast', name: 'A', time: 600, difficulty: 1 })).toEqual({ mode: 'fast', name: 'A', time: 600, difficulty: 1 });
    expect(validate({ mode: 'arena', name: 'A', time: 600, difficulty: 1, score: 9000 }))
      .toEqual({ mode: 'arena', name: 'A', time: 600, difficulty: 1, score: 9000, wave: 0 });
    expect(validate({ mode: 'arena', name: 'A', time: 20, difficulty: 1, score: 9000 }).error).toBe('time');
    expect(validate({ mode: 'arena', name: 'A', time: 600, difficulty: 1 }).error).toBe('score');
    expect(validate({ mode: 'arena', name: 'A', time: 600, difficulty: 1, score: maxScore('arena', 600, 0) + 1 }).error).toBe('score');
    expect(validate({ mode: 'endless', name: 'A', time: 400, difficulty: 2, score: 12000, wave: 9 }).score).toBe(12000);
    expect(validate({ mode: 'endless', name: 'A', time: 400, difficulty: 2, score: 900000, wave: 2 }).error).toBe('score');
    expect(validate({ mode: 'endless', name: 'A', time: 400, difficulty: 2, score: 900, wave: -1 }).error).toBe('wave');
    expect(validate({ mode: 'sky', name: 'A', time: 600, difficulty: 1 }).error).toBe('mode');
    expect(validate({ mode: 'fast', name: '!!', time: 600, difficulty: 1 }).error).toBe('name');
    expect(validate({ mode: 'fast', name: 'A', time: 600, difficulty: 9 }).error).toBe('difficulty');
  });

  it('keeps one board per mode, and the old daily mode is gone', () => {
    expect(boardKey('fast')).toBe('od:board:fast');
    expect(boardKey('arena')).toBe('od:board2:arena');
    expect(boardKey('endless')).toBe('od:board2:endless');
    expect(validate({ mode: 'daily', name: 'A', time: 300, difficulty: 1, score: 5000, wave: 6 }).error).toBe('mode');
  });

  it('keeps a time board per boss, fastest first', async () => {
    expect(boardKey('boss0')).toBe('od:board:boss0');
    expect(boardKey('boss5')).toBe('od:board:boss5');
    expect(validate({ mode: 'boss1', name: 'ollie', time: 84.31, difficulty: 2 })).toEqual({ mode: 'boss1', name: 'OLLIE', time: 84.31, difficulty: 2 });
    expect(validate({ mode: 'boss1', name: 'A', time: 5, difficulty: 2 }).error).toBe('time');
    expect(validate({ mode: 'boss6', name: 'A', time: 90, difficulty: 2 }).error).toBe('mode');
    vi.stubEnv('KV_REST_API_URL', 'https://redis.example'); vi.stubEnv('KV_REST_API_TOKEN', 't');
    const calls: string[][][] = [];
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: { body: string }) => {
      const cmds = JSON.parse(init.body);
      calls.push(cmds);
      const result = cmds.map((c: string[]) =>
        c[0] === 'INCR' ? { result: 1 } : c[0] === 'ZRANGE' ? { result: [JSON.stringify({ n: 'OLLIE', d: 2 }), '84.31'] } : { result: 1 });
      return { ok: true, json: async () => result };
    }));
    const res = mockRes();
    await handler({ method: 'POST', body: { mode: 'boss1', name: 'ollie', time: 84.31, difficulty: 2 },
                    headers: { 'x-forwarded-for': '9.9.9.9' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.entries[0]).toEqual({ name: 'OLLIE', time: 84.31, difficulty: 2 });
    const flat = calls.flat();
    expect(flat.find((c) => c[0] === 'ZADD')?.[1]).toBe('od:board:boss1');
    expect(flat.find((c) => c[0] === 'ZRANGE')).not.toContain('REV');
  });

  it('reads Redis WITHSCORES replies', () => {
    expect(parseTop([JSON.stringify({ n: 'ollie', d: 2 }), '301.5', 'junk', '1'])).toEqual([{ name: 'OLLIE', time: 301.5, difficulty: 2 }]);
    expect(parseTop([JSON.stringify({ n: 'ollie', d: 1, t: 640.5, w: 0 }), '9100'], 'arena'))
      .toEqual([{ name: 'OLLIE', score: 9100, time: 640.5, difficulty: 1, wave: 0 }]);
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
    await handler({ method: 'POST', body: { mode: 'fast', name: 'ollie', time: 612.4, difficulty: 1 },
                    headers: { 'x-forwarded-for': '1.2.3.4' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.entries[0]).toEqual({ name: 'OLLIE', time: 612.4, difficulty: 1 });
    expect(JSON.stringify(calls)).toContain('ZADD');
  });

  it('ranks score boards highest first', async () => {
    vi.stubEnv('KV_REST_API_URL', 'https://redis.example'); vi.stubEnv('KV_REST_API_TOKEN', 't');
    const calls: string[][][] = [];
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: { body: string }) => {
      const cmds = JSON.parse(init.body);
      calls.push(cmds);
      const result = cmds.map((c: string[]) =>
        c[0] === 'INCR' ? { result: 1 }
        : c[0] === 'ZRANGE' ? { result: [JSON.stringify({ n: 'OLLIE', d: 1, t: 300, w: 6 }), '5000'] } : { result: 1 });
      return { ok: true, json: async () => result };
    }));
    const res = mockRes();
    await handler({ method: 'POST', body: { mode: 'endless', name: 'ollie', time: 300, difficulty: 1, score: 5000, wave: 6 },
                    headers: { 'x-forwarded-for': '5.6.7.8' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.entries[0]).toEqual({ name: 'OLLIE', score: 5000, time: 300, difficulty: 1, wave: 6 });
    const flat = calls.flat();
    expect(flat.find((c) => c[0] === 'ZADD')?.[1]).toBe('od:board2:endless');
    expect(flat.find((c) => c[0] === 'ZRANGE')).toContain('REV');
    expect(flat.find((c) => c[0] === 'EXPIRE' && String(c[1]).startsWith('od:board2'))).toBeFalsy();   // boards are kept
  });
});
