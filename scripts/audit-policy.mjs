export function evaluateAudit(report, patchVerified, now = new Date()) {
  if (!report?.advisories || !report?.metadata?.vulnerabilities || report.error) {
    throw new Error('Registry audit response is incomplete; release remains blocked.');
  }
  const mitigated = [];
  const blocked = [];
  for (const advisory of Object.values(report.advisories)) {
    const exactPatchedIssue = advisory.module_name === 'picomatch'
      && advisory.url === 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf'
      && advisory.vulnerable_versions === '<=4.0.7'
      && advisory.findings?.length > 0
      && advisory.findings.every(finding => finding.version === '4.0.7');
    if (exactPatchedIssue && patchVerified && now < new Date('2026-12-18T00:00:00Z')) {
      mitigated.push(advisory.url);
    } else blocked.push(advisory.url || advisory.module_name || 'unknown advisory');
  }
  // Fail closed if the registry reports vulnerabilities without their details.
  const total = Object.values(report.metadata.vulnerabilities).reduce((sum, count) => sum + Number(count), 0);
  if (!Number.isFinite(total) || (total > 0 && Object.keys(report.advisories).length === 0)) {
    throw new Error('Registry vulnerability totals lack advisory details.');
  }
  return { mitigated, blocked };
}
