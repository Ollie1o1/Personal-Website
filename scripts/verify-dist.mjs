// Post-build content and link rules. Run after `astro build`; exits 1 listing every violation.
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const SITE = await readFile(new URL('../src/site.config.ts', import.meta.url), 'utf8');
const linkedinNull = /linkedin:\s*null/.test(SITE);
const siteUrl = SITE.match(/url:\s*'([^']+)'/)[1];

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

async function isFile(p) {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

async function resolves(url) {
  const clean = decodeURI(url.split('#')[0].split('?')[0]);
  if (clean === '' || clean === '/') return isFile(join(DIST, 'index.html'));
  const base = join(DIST, clean);
  return (await isFile(base)) || (await isFile(join(base, 'index.html'))) || (await isFile(base + '.html'));
}

const errors = [];
const files = (await walk(DIST)).filter((f) => f.endsWith('.html'));
if (files.length === 0) {
  console.error('verify-dist: no pages found in dist/ — did the build fail?');
  process.exit(1);
}

for (const f of files) {
  const html = await readFile(f, 'utf8');
  const rel = relative(DIST, f);
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');

  if (/résumé|résume|resumé/i.test(text)) errors.push(`${rel}: accented "Resume"`);
  if (/9\.2k|9,200/.test(text) && !/discretionary/i.test(text)) errors.push(`${rel}: P&L without discretionary framing`);
  if (/\bOrion\b|Chat-App/.test(text)) errors.push(`${rel}: mentions an excluded project`);
  if (linkedinNull && /linkedin\.com/i.test(html)) errors.push(`${rel}: LinkedIn link while site.linkedin is null`);
  if (/tests?[^<]{0,40}passing|passing[^<]{0,40}tests?/i.test(text)) errors.push(`${rel}: claims tests are "passing"`);
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`${rel}: missing <title>`);
  if (!/<meta name="description"/.test(html)) errors.push(`${rel}: missing meta description`);

  const og = html.match(/<meta property="og:image" content="([^"]+)"/);
  if (!og) errors.push(`${rel}: missing og:image`);
  else if (!(await resolves(og[1].replace(siteUrl, '')))) errors.push(`${rel}: og:image ${og[1]} not built`);

  for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    if (url.startsWith('//')) continue;
    if (!(await resolves(url))) errors.push(`${rel}: broken internal link ${url}`);
  }
}

if (errors.length) {
  console.error(`verify-dist: ${errors.length} violation(s)\n` + errors.map((e) => `  ✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log(`verify-dist: ${files.length} pages OK`);
