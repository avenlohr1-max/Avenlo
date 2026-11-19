import assert from 'node:assert/strict';
import console from 'node:console';
import process from 'node:process';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const fromVite = createRequire(require.resolve('vite/package.json'));
const entry = fromVite.resolve('picomatch');
const pm = fromVite('picomatch');
const manifest = fromVite('picomatch/package.json');
assert.equal(manifest.version, '4.0.7');
const parser = readFileSync(fromVite.resolve('picomatch/lib/parse'), 'utf8');
assert.ok(parser.includes('!normalizeSimpleBranch(branches[0]) &&\n      !getStarExtglobSequenceChars(branches[0])'));

for (const pattern of ['+(*)b', '+(*a)b', '*(*)b', '*(*a)b', '+([ab]*)c', '+(a*)b', '+(+(a))b']) {
  // Run each adversarial regex in a disposable process: a regression must fail
  // promptly instead of hanging CI or blocking the main event loop.
  const code = `const pm = require(${JSON.stringify(entry)}); if (pm.isMatch('a'.repeat(48) + '!', ${JSON.stringify(pattern)})) process.exit(2);`;
  const result = spawnSync(process.execPath, ['-e', code], { timeout: 1500, encoding: 'utf8', windowsHide: true });
  assert.equal(result.error, undefined, `Regex exceeded deadline for ${pattern}: ${result.error?.code}`);
  assert.equal(result.status, 0, `Unexpected match/failure for ${pattern}: ${result.stderr}`);
}

for (const [value, pattern, expected] of [
  ['src/app/page.tsx', '**/*.{ts,tsx}', true],
  ['src/app/page.css', '**/*.{ts,tsx}', false],
  ['file.docx', '*.@(pdf|docx)', true],
  ['ab', '+(a|b)', true],
  ['abab', '+(ab)', true],
  ['aab', '+(*(a)|*(b))', true],
  ['+(*)b', '+(*)b', true],
  ['foo/bar.js', '**/*.js', true],
  ['foo/.secret', '**/*', false],
]) assert.equal(pm.isMatch(value, pattern), expected, `${value}: ${pattern}`);

console.log('Picomatch patch verified: 7 bounded adversarial patterns and 9 compatibility cases.');
