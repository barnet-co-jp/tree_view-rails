# JavaScript CI cache boundary

This page explains how the JavaScript CI lane uses the npm cache without changing the dependency-resolution source of truth.

## Source of truth

The committed `package-lock.json` remains the dependency-resolution source of truth. Local setup, Docker setup smoke, pull-request JavaScript checks, and main-push JavaScript checks use `npm ci` so verification installs exactly from the committed lockfile.

The CI workflow uses `actions/setup-node@v7` with `cache: npm` in the JavaScript job. Treat that cache as an install-speed and CI-reuse optimization only. It must not be used as evidence that dependencies, package manager policy, or the lockfile changed.

## When dependencies change

When `package.json` dependency metadata or Node engine metadata changes, update `package-lock.json` with `npm install` before returning to the `npm ci` path. The npm lockfile drift guard in `npm run test:ci-policy` checks that the committed lockfile metadata still matches `package.json` before CI relies on `npm ci`.

Do not change dependency versions, the Node major, `actions/setup-node` policy, or package manager policy from this cache boundary alone. Those changes belong to the dependency or CI pull request that owns the actual policy decision.

## Related checks

- `.github/workflows/ci.yml` keeps the JavaScript job on Node 22, `actions/setup-node@v7`, `cache: npm`, and `npm ci`.
- `npm run test:node-version-sources` keeps `.nvmrc`, `package.json` `engines.node`, and the workflow `node-version` aligned.
- `npm run test:ci-policy` keeps workflow action/version signals and lockfile drift signals visible for maintainers.
- [Release checklist](release.md) records the release-facing `npm ci` and package-lock boundary.
- [Development](development.md) records the local setup path and triage commands.
