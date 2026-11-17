import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateAudit } from './audit-policy.mjs';

const issue = { module_name: 'picomatch', url: 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf', vulnerable_versions: '<=4.0.7', findings: [{ version: '4.0.7' }] };
const report = advisory => ({ advisories: { a: advisory }, metadata: { vulnerabilities: { high: 1 } } });
const date = new Date('2026-11-18T00:00:00Z');
test('only the verified exact local patch is accounted for', () => {
  assert.equal(evaluateAudit(report(issue), true, date).blocked.length, 0);
  assert.equal(evaluateAudit(report(issue), false, date).blocked.length, 1);
});
test('new advisories, unexpected versions and expired review block release', () => {
  assert.equal(evaluateAudit(report({ ...issue, url: 'https://github.com/advisories/another' }), true, date).blocked.length, 1);
  assert.equal(evaluateAudit(report({ ...issue, findings: [{ version: '2.3.2' }] }), true, date).blocked.length, 1);
  assert.equal(evaluateAudit(report(issue), true, new Date('2026-12-18T00:00:00Z')).blocked.length, 1);
});
test('registry errors and missing findings fail closed', () => {
  assert.throws(() => evaluateAudit({ error: 'offline' }, true, date));
  assert.throws(() => evaluateAudit({ advisories: {}, metadata: { vulnerabilities: { high: 1 } } }, true, date));
  assert.equal(evaluateAudit(report({ ...issue, findings: [] }), true, date).blocked.length, 1);
});
