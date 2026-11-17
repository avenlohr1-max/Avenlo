# Dependency security maintenance

18 November 2026. Use pnpm 11.25.0 and the committed frozen lockfile for every build. npm install does not apply this project's security patch and must not be used to prepare releases.

Updated Next.js to 16.4.6, ESLint to 10.15.0 and typescript-eslint to 8.73.0. Pinned fixed transitive fflate 0.8.3, follow-redirects 1.16.3 and minimatch 11.0.9. These address the registry findings present at this checkpoint. The minimatch release-age exception permits this specific security update; workerd's pre-existing build permission is preserved.

## Picomatch local patch

[GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) has no published upstream fix as of this change. The package remains named/versioned picomatch 4.0.7; its MIT licence and attribution remain intact. `patches/picomatch@4.0.7.patch` is a maintained local fix, not an upstream release or a claim that the registry audit is clean.

The existing parser's repeated-extglob guard checked ambiguous alternatives but skipped some single complex branches. The patch literalizes single complex repeated branches unless they are plain literals or reducible by the existing safe character-star reduction. For example `+(*)b` and `+(*a)b` become literal matching patterns instead of nested backtracking expressions. This deliberately narrows these complex extglob semantics. Ordinary path wildcards, braces, ordinary alternatives and literal repeats retain tested behavior.

All transitive picomatch dependencies resolve to the same patched 4.0.7 version, including dependencies formerly on v2. Compatibility must therefore pass the full build and integration suites before release. No raw customer glob input is introduced by this change.

`pnpm audit:release` queries the full registry report without ignored advisories, verifies exact patch and installed-parser hashes, checks lockfile versions, and runs seven adversarial cases in timed child processes plus nine compatibility cases. It accounts only for this exact advisory/version when the patch is verified. Other findings of any severity, registry failures, changed patch bytes, unexpected versions or missing details block release. Three audit-policy tests cover those failure paths. The local patch review expires on 18 December 2026; replace it with an upstream release when available, rerun checks and remove the corresponding local accounting.

The raw registry report will still contain the Picomatch advisory because it identifies packages by upstream version. Release output reports it explicitly as locally patched; it must never be summarized as zero registry vulnerabilities.
