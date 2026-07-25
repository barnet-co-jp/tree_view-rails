# Development

This page summarizes common development and maintenance tasks for the TreeView gem.

## Setup

```bash
bundle install
npm ci
```

With Docker:

```bash
cp .env.example .env
docker compose build
docker compose run --rm app bundle install
docker compose run --rm app npm ci
```

The development Docker image installs Node 22 and npm so the Docker setup can run the same JavaScript install path as local development. Keep the Dockerfile Node major aligned with `.nvmrc`, `package.json` `engines.node`, and the workflow `node-version` value when any of them changes.

Use Node 22 for local JavaScript work. The repository root `.nvmrc` matches the CI JavaScript lane and is the source of truth for the recommended local Node major version. Keep `.nvmrc`, `package.json` `engines.node`, and the workflow `node-version` value aligned when any of them changes. The automated drift guard is `script/test_node_version_sources.mjs`, exposed as `npm run test:node-version-sources` and included in `npm run test:entrypoints`; it verifies those Node version sources stay on Node 22 without changing the lockfile-backed install policy.

Use `npm ci` for local JavaScript setup. The committed `package-lock.json` is now the source of truth for repeatable installs, and pull-request CI and Docker setup use the same lockfile-backed install path. When dependency metadata or Node engine metadata changes in `package.json`, run `npm install` so the root `package-lock.json` metadata changes with it before returning to the `npm ci` path. See [Installation](installation.md) for the current CI and install-path summary.

## Common commands

```bash
bundle exec standardrb
bundle exec rspec
bundle exec rake build
gem build tree_view.gemspec
ruby script/check_gem_package_contents.rb tree_view-*.gem
npm run test:js
npm test
npm run test:vitest-ui
npm run test:entrypoints
npm run test:docs-entrypoints
npm run test:development-docs-commands
npm run test:entrypoints-composition
npm run test:ci-policy-license-prelude
npm run test:immutable-package-root-export-signals
npm run test:public-api-manifest-structure
npm run test:css-custom-property-manifest
npm run test:toggle-icons-docs
npm run test:release-docs
npm run test:release-package-contents
npm run test:docs-i18n
npm run test:ci-policy
npm run test:node-version-sources
npm run test:ruby-version-sources
npm run test:browser
```

Use `npm run test:js` when you want the same JavaScript entrypoint, unit, and browser smoke coverage as the CI JavaScript lane. Use `npm run test:vitest-ui` when you want the local Vitest UI for inspecting or rerunning unit-style JavaScript tests interactively; it is a maintainer convenience command, not a replacement for CI-oriented `npm test`, `npm run test:js:core`, or `npm run test:js`. Use `npm run test:docs-entrypoints` when you are narrowing docs-only failures across docs entrypoints, repository-only maintainer entrypoints, README Quick Start signals, Public API docs signals, and i18n parity before running the broader `npm run test:entrypoints` or browser smoke checks. Use `npm run test:development-docs-commands` when you only need the Development docs command-signal guard; the broader `npm run test:docs-entrypoints` suite runs it as the `Development docs command signals` group. Use `npm run test:entrypoints-composition` when you only need to confirm `test:entrypoints`, `test:js:core`, and `test:js` package script composition / ordering drift; individual guard contents stay owned by their scripts. Use `npm run test:ci-policy-license-prelude` when you only need the standalone LICENSE package-sensitive prelude that runs before the CI policy suite self-test and checks; it is not a `script/test_ci_policy_suite.mjs` checks-array group. Use `npm run test:immutable-package-root-export-signals` when you only need the README / Public API / immutable export guide reader-facing docs signal for immutable package-root exports. Runtime export existence remains covered by `script/test_entrypoints.mjs`, and literal declaration shape remains covered by `script/test_declaration_literal_shapes.mjs`. Use `npm run test:public-api-manifest-structure` when a manifest-structure failure needs the narrow Node smoke for top-level keys, nested JavaScript package-root and event/detail shapes, or duplicate-key guardrails without running the broader docs entrypoint suite. The duplicate-key guard detects duplicate YAML keys before the YAML loader can silently overwrite a manifest section; treat it as a source-of-truth drift safety guard, not as a public API adoption decision. Use `npm run test:css-custom-property-manifest` when a CSS custom property manifest or stylesheet signal failure needs the narrow manifest-to-stylesheet smoke. Use `npm run test:toggle-icons-docs` when a toggle icon public-surface or docs signal failure needs the focused docs smoke. Use `npm run test:release-docs` or `npm run test:release-package-contents` when you only need the release docs signal or release package contents signal; these are narrow triage aliases for their docs-entrypoint groups, not replacements for the full `npm run test:docs-entrypoints` suite. Use `npm run test:docs-i18n` when you only need to confirm English/Japanese docs parity without running the full docs entrypoint suite. Use `npm run test:ci-policy` when you only need to confirm changed-file classification, workflow detection signals, CI lint job representative signals, workflow action major version signals, CI observation guidance signals, and lockfile dependency metadata drift before the broader entrypoint suite. The command starts with the standalone LICENSE package-sensitive prelude, `script/test_license_package_sensitive_signal.mjs`, before the CI policy suite self-test and checks. That prelude is the representative signal for LICENSE package-sensitive routing and is guarded through package script composition, not as a `script/test_ci_policy_suite.mjs` checks-array group. Its workflow detection signals also confirm that the representative lint job keeps Ruby 3.3 and runs `bundle exec standardrb`, so lint lane drift is reviewed as an intentional CI policy change instead of a silent workflow edit. Its workflow permissions guard confirms that the workflow keeps the default `GITHUB_TOKEN` read-only with `contents: read` and does not require `contents: write` or `pull-requests: write`, so token-permission drift is reviewed as an intentional CI trust-boundary change. Its workflow action major guard checks that representative CI jobs keep the expected `actions/checkout`, `actions/setup-node`, and `ruby/setup-ruby` major versions, so action-major drift is reviewed as an intentional CI trust-boundary change rather than a silent workflow edit. Its CI observation guidance guard keeps `AGENTS.md` and the workflow observation source aligned so maintainers know to inspect the GitHub Actions workflow run when combined status is empty, read job status/conclusion with changed-files routing in mind, and treat intentionally skipped jobs as different from failed or missing checks. Its npm lockfile drift guard checks that the root `engines`, `dependencies`, and `devDependencies` metadata in `package-lock.json` still matches `package.json`, so dependency or Node engine metadata changes should update both files before PR CI relies on `npm ci`. Its Bundler lockfile drift guard checks that direct `Gemfile` gem requirements still match the `Gemfile.lock` `DEPENDENCIES` metadata, so Gemfile dependency metadata changes should run `bundle install` before PR CI relies on the committed lockfile. For Dependabot Bundler branches that fail on this drift before regular lint is useful, use [Dependabot Bundler recovery](dependabot-bundler-recovery.md) to choose between `@dependabot recreate`, rebase, or a maintainer-owned manual lockfile refresh. Use `npm run test:node-version-sources` when you only need to confirm that `.nvmrc`, `package.json` `engines.node`, and CI workflow `node-version` still agree on Node 22. Use `npm run test:ruby-version-sources` when you only need to confirm that the README, gemspec, CI workflow, Dockerfile Ruby base image, Development docs, and package script still agree on the supported Ruby sources and representative Ruby version matrix. Use `gem build tree_view.gemspec` followed by `ruby script/check_gem_package_contents.rb tree_view-*.gem` when you only need to reproduce the `gem_package` job's package contents verification. Use the individual npm commands when you are narrowing a failure.

Docs i18n parity exceptions should be rare and temporary. Use a `parityExceptions` entry only when one language intentionally lags the other while a peer page is being reviewed or staged. The exception key uses the source page that already exists, such as `en:temporary-page.md`; `affectedLanguage` names the missing peer language, `reason` records why the mismatch is intentional, and `review` records the planned review timing or removal condition. Do not use exceptions as a permanent single-language docs path. The checker itself validates the exception key, metadata, source page, affected language, and non-empty `reason` / `review`, so docs guidance stays prose-only unless that validation rule changes.

For docs entrypoint suite triage, run `npm run test:docs-entrypoints -- --list` to print the numbered groups and commands. Then run `npm run test:docs-entrypoints -- --only <group-or-index>` with the 1-based number from that list, an exact group name, a case-insensitive group name, or a unique partial group name. Unknown, ambiguous, or out-of-range values exit non-zero and print the available groups plus the `--list` hint.

When you add or rename a docs smoke or signal script, run `node script/test_docs_entrypoint_suite.mjs --self-test` to confirm the suite registration is still complete. The self-test is also registered as the `Docs entrypoint suite option contract` group inside `npm run test:docs-entrypoints`; it checks candidate docs entrypoint scripts against the suite's `checks` array and explicit exclusions. Explicit exclusions are not silent skips: each excluded script must be registered through another npm script or suite, and new docs smoke or signal scripts should either be added to the `checks` array or documented as an explicit exclusion with its registration route and reason. Treat it as a registration guard, not as a redesign surface for the candidate patterns or CI workflow.

Within `npm run test:entrypoints`, `script/test_entrypoints.mjs` checks the runtime package-root exports, controller registration helper, manifest loader, and `.d.ts` export-name inventory. `script/test_declaration_literal_shapes.mjs` then checks the literal shapes in `app/javascript/tree_view/index.d.ts` for the manifest-backed JavaScript constants such as event names, detail keys, remote-state values, transfer values, controller identifiers, selection data hooks, and empty-state hooks. Use the export-name guard when a package-root export is missing or extra; use the literal-shape guard when the export exists but a key, tuple, or representative literal value no longer matches `config/public_api_manifest.yml`. This is a smoke guard, not a TypeScript compiler or declaration generator.

For the Rails version matrix:

```bash
BUNDLE_GEMFILE=gemfiles/rails_7_0.gemfile bundle install
BUNDLE_GEMFILE=gemfiles/rails_7_0.gemfile bundle exec rake
BUNDLE_GEMFILE=gemfiles/rails_7_1.gemfile bundle install
BUNDLE_GEMFILE=gemfiles/rails_7_1.gemfile bundle exec rake
BUNDLE_GEMFILE=gemfiles/rails_7_2.gemfile bundle install
BUNDLE_GEMFILE=gemfiles/rails_7_2.gemfile bundle exec rake
BUNDLE_GEMFILE=gemfiles/rails_8_0.gemfile bundle install
BUNDLE_GEMFILE=gemfiles/rails_8_0.gemfile bundle exec rake
```

## Public API compatibility specs

Public API compatibility specs protect documented Ruby entry points, helper methods, helper option keys, grouped options, and JavaScript package-root exports from accidental removals or renames. The JavaScript entrypoint smoke also checks manifest-backed controller registrations, public event names, and documented `event.detail` key groups. Keep these specs focused on API existence and representative behavior rather than full implementation details.

Docs entrypoint smoke and public API docs signal smoke have separate responsibilities within `npm run test:docs-entrypoints`: `script/test_docs_entrypoints.mjs` protects broad documentation entry points, links, and feature-guide signals, while `script/test_repository_only_maintainer_entrypoints.mjs` protects repository-only maintainer entry points such as `Product Profile.md`, `AGENTS.md`, `CHANGELOG.md`, and `docs/i18n-audit.md` from disappearing out of the root docs map or language README files without treating them as gem-packaged host-app API guides. `script/test_public_api_docs_signals.mjs` protects representative Public API and feature-doc signals. When a public API manifest entry, package-root export, public helper surface, or docs signal is added or renamed, review and update the public API docs signal smoke alongside the affected English and Japanese docs.

When an intentional breaking change is accepted, update the public API docs and the compatibility specs together so the documented contract and test coverage stay aligned.

`config/public_api_manifest.yml` is the machine-readable source of truth for the public surface covered by compatibility checks. It currently tracks Ruby module methods, public constants, configuration options, localized-name I18n key groups, filtered-tree modes, VisibleRows row metadata, NodePresenter builder names, GraphAdapter initializer keywords, helper names, helper option keys, toolbar actions, toolbar action metadata, grouped option keys, setup generator output paths, PathTreeBuilder node shapes, RenderWindow metadata, ResourceTableRenderState call keywords, RenderState callback builder keys, diagnostics accepted checks / run options / Result surface, JavaScript package-root named exports, transfer drop positions, transfer data MIME types, remote-state values and data hooks, controller registrations, public event names, intentional no-detail event names, documented `event.detail` keys, integration hooks, toolbar data hooks, selection data and checkbox hooks, and empty-state hooks.

Use `npm run test:public-api-manifest-structure` when you only need to confirm the manifest structure smoke for top-level sections, nested public JavaScript groups, event/detail shape, and duplicate YAML keys. The duplicate-key guard detects duplicate YAML keys before the YAML loader can silently overwrite a manifest section; treat it as a source-of-truth drift safety guard, not as a public API adoption decision. The broader `npm run test:docs-entrypoints` command still runs the same manifest-structure group through the docs entrypoint suite, so keep the single-command smoke and suite entry aligned when that guard changes.

`event_names_without_detail` is the intentional classification for host lifecycle events that do not publish public `event.detail` fields. Do not use that list to add or freeze host lifecycle payload shapes; keep payload-bearing events under the documented `event.detail` key groups instead.

NodePresenter builder names are a manifest-backed name surface. When `node_presenter_builder_names` changes, sync the manifest, the focused compatibility spec, the NodePresenter row partial patterns guide, and `docs/en/public-api.md` / `docs/ja/public-api.md` if the public API overview names the same builder surface. Do not use the manifest tracking summary to define presenter return values, authorization, route policy, action semantics, or host-app column formatting.

RenderState callback builder keys are a manifest-backed key surface, not a full callback behavior contract. When `render_state_callback_builder_keys` changes, sync the manifest, the focused compatibility spec, the flat callback builder section in `docs/en/public-api.md` / `docs/ja/public-api.md`, and any feature docs that name the same key. Do not use the manifest tracking summary to define callback arity, return-value validation, row rendering semantics, or fallback behavior.

Public constants are also a package-verification surface. When `public_constants` changes, keep `config/public_api_manifest.yml`, `spec/public_api_compatibility_spec.rb`, the public API docs, and `script/check_gem_package_contents.rb` aligned: the package verifier's `PUBLIC_CONSTANT_RUNTIME_FILES` mapping must include the runtime file that proves each manifest-listed constant is packaged. Do not treat that mapping as the source of truth for constant adoption, renaming, or public API policy; it is the release-package evidence that follows the manifest-backed public surface.

When you add, rename, or remove one of those entries, keep the sync trail small and explicit:

- Update the manifest and the owning compatibility spec, entrypoint smoke, or package guard that protects that surface.
- Align `docs/en/public-api.md` and `docs/ja/public-api.md` when the surface is part of the documented public API.
- Check any README, usage page, feature doc, configuration option doc, JavaScript event doc, mockup inventory, or release doc that names the same surface.
- Record the user-facing effect in `CHANGELOG.md` when adopters need to notice it; use Documentation only for docs-only guidance changes that do not imply runtime behavior changes.
- Review `docs/en/release.md` and `docs/ja/release.md` when the change affects release notes, migration expectations, package verification, or tag-time evidence.

## JavaScript browser smoke tests

Unit-style JavaScript tests run through Vitest and jsdom with:

```bash
npm test
```

A separate entrypoint smoke check loads `app/javascript/tree_view/index.js` directly:

```bash
npm run test:entrypoints
```

That check keeps the documented controller exports and `registerTreeViewControllers` helper aligned with the importmap entrypoint. It uses Ruby to load `config/public_api_manifest.yml` and print the `javascript_package_root` section as JSON before Node assertions run, so run it from the repository root with Ruby available when you are diagnosing manifest loader failures.

The entrypoint command also runs `script/test_declaration_literal_shapes.mjs`. Keep this second guard aligned with `script/test_entrypoints.mjs`: the entrypoint smoke proves runtime exports and `.d.ts` export names exist, while the declaration literal guard proves the exported literal object shapes in `index.d.ts` still mirror `config/public_api_manifest.yml`.

Docs-only entrypoint and signal checks can be run separately with:

```bash
npm run test:docs-entrypoints
```

That command runs the docs entrypoint smoke, repository-only maintainer entrypoint smoke, docs entrypoint signal smoke, README Quick Start signal, Public API docs signal, and i18n parity checks without the broader entrypoint and CI policy checks. Use `npm run test:docs-entrypoints -- --list` to see the numbered groups, then `npm run test:docs-entrypoints -- --only <group-or-index>` to run one group by its 1-based number, exact name, case-insensitive name, or unique partial name. The repository-only maintainer entrypoint smoke keeps checkout-only files such as `Product Profile.md`, `AGENTS.md`, `CHANGELOG.md`, and `docs/i18n-audit.md` discoverable from `docs/README.md` and the language README files without treating them as gem-packaged host-app API guides. Use it when a docs-only change fails before moving on to `npm run test:entrypoints` or `npm run test:browser`.

Browser-level smoke tests run through Playwright with:

```bash
npm run test:browser
```

Use the browser smoke suite for representative interaction flows that need a real browser event loop, focus handling, and drag/drop APIs. Keep these tests small and stable: cover keyboard navigation, expand/collapse, checkbox cascade behavior, lazy-loading state changes, transfer payloads, and row form controls coexisting with tree behavior.

When browser-level accessibility smoke is added, do not silently suppress tree or treegrid-oriented findings. If a fixture intentionally allows a pattern because of TreeView's documented table-first policy, leave a short adjacent comment or suppression note that cites `docs/en/accessibility-semantics.md` or `docs/ja/accessibility-semantics.md` and names the specific policy being relied on, such as row-level ARIA on table rows, omitted `aria-controls`, or host-app-owned keyboard flow.

## CI policy

Pull requests run the fast Ruby checks and JavaScript checks that protect day-to-day changes:

- Ruby lint through `bundle exec standardrb`
- Ruby specs through `bundle exec rspec`
- Representative Rails compatibility checks through `gemfiles/rails_7_0.gemfile`, `gemfiles/rails_7_2.gemfile`, and `gemfiles/rails_8_0.gemfile`
- JavaScript checks through the changed-files policy: docs-entrypoint-sensitive docs-only PRs run `npm run test:docs-entrypoints`, CI-policy-sensitive docs-only PRs run `npm run test:ci-policy`, non-docs PRs run `npm run test:js:core`, and mockup or browser-smoke-sensitive PRs install Playwright Chromium and run `npm run test:browser`. Docs-only PRs that are not docs-entrypoint-sensitive or CI-policy-sensitive and do not touch mockups or browser-smoke paths can skip JavaScript checks.

The pull-request Rails lanes intentionally skip Rails 7.1 to keep PR feedback focused on representative lower, current, and next-major coverage; the `main` push full Rails matrix is the final compatibility gate that includes Rails 7.1.

The `changes` job classifies pull-request paths with `script/ci_changed_files_policy.mjs`. The main outputs are `docs_only`, `mockups_changed`, `browser_smoke_changed`, `package_sensitive`, `docker_setup_sensitive`, `docs_entrypoint_sensitive`, and `ci_policy_sensitive`. The CLI emits the same output keys that `.github/workflows/ci.yml` exposes through `jobs.changes.outputs.*`; missing CLI output means `script/ci_changed_files_policy.mjs` stopped publishing a workflow output, while a stale workflow reference means the workflow still consumes an output no longer produced by the CLI. Keep `script/test_ci_changed_files_policy.mjs` in sync with any workflow or path-classification change so representative file sets continue to document the intended guard behavior.

Docs-only pull requests that touch only `README.md`, `docs/**`, `Product Profile.md`, `CHANGELOG.md`, and `AGENTS.md` keep the `lint` and `pr_specs` jobs, but short-circuit the representative Rails lanes while preserving the same check names for branch protection. The JavaScript job then depends on the narrower path class: `README.md`, non-mockup `docs/**`, `CHANGELOG.md`, and `config/public_api_manifest.yml` are `docs_entrypoint_sensitive` and run `npm run test:docs-entrypoints`; `AGENTS.md` is `ci_policy_sensitive` and runs `npm run test:ci-policy` even when it is the only changed path, because it owns maintainer CI observation guidance; `Product Profile.md` by itself skips JavaScript because it is a repository-maintainer document rather than a package-facing or CI-policy docs signal; `docs/mockups/**` changes run the browser smoke path; and Pull requests that change `test/browser/**` are not docs-only shortcut candidates and also run explicit browser smoke coverage. Pull requests that also touch `.github/workflows/**` do not use this shortcut and still run the normal PR lanes.

`package_sensitive` changes, including `README.md`, `CHANGELOG.md`, `docs/**`, `Gemfile`, `Gemfile.lock`, `tree_view.gemspec`, package metadata, importmap, manifest, runtime files, helpers, views, assets, JavaScript, and locale files, run the gem package verification job. Bundler dependency updates are package-sensitive because they can affect the environment used to build and verify the packaged gem. `Product Profile.md` and `AGENTS.md` stay outside that package-sensitive set unless they are bundled with another package-facing path. `docker_setup_sensitive` is reserved for Dockerfile, compose, Node version, and package install-source changes, and it triggers the Docker development setup job.

A green check suite does not by itself mean a pull request is ready to merge after `main` has moved. When a branch is `diverged`, check mergeability, changed files, risk, and how far the branch is behind. Prefer refreshing the branch and observing fresh CI when GitHub reports `mergeable: false`, when the branch is far behind, or when the pull request touches workflow definitions, public API, specs, or shared docs inventory. For small docs-only changes that are only a little behind, it is enough to confirm the changed files still apply cleanly, mergeability is true, and the named checks remain green.

### Known drift recovery

A narrow pull request can fail when `main` or an unmerged base pull request already has a known public-contract drift, such as a manifest structure spec that has not learned a new top-level key or a TypeScript declaration that has not caught up with package-root exports. Treat that as CI triage, not as permission to widen the pull request automatically.

When this happens:

- Confirm the failing jobs, file paths, and error messages, then compare them with existing issues or pull requests that own the same drift.
- Check whether the pull request's changed files actually touch the failing surface. If they do not, leave the pull request scoped to its issue.
- Use the owning drift pull request when one exists. Wait for it to merge and refresh or rerun the narrow pull request, or create/use a dedicated follow-up pull request for the drift if that issue is ready.
- Include the drift fix in the narrow pull request only when the issue scope already covers that public surface or a maintainer explicitly approves the bundle.
- In the pull request comment, record the head SHA, failed run number, failing jobs, drift owner issue or pull request, and the chosen next action.

For example, if a docs-only parity pull request fails because `spec/public_api_manifest_structure_spec.rb` is missing a manifest key and `app/javascript/tree_view/index.d.ts` is missing package-root exports, keep the parity pull request docs-only unless that public API drift is explicitly in scope.

Pushes to `main` also run the broader compatibility and release checks:

- Ruby version matrix
- Full Rails version matrix, including Rails 7.1
- gem package verification

## Change checklist

### Ruby API changes

- Add or update specs.
- Run `bundle exec standardrb` after Ruby file or Ruby spec edits, including connector or GitHub API edits that may bypass local editor newline handling.
- If Standard Ruby reports a mechanical formatting issue such as a missing final newline or trailing whitespace, apply the formatter or a minimal file rewrite before opening the pull request.
- Check `docs/ja/api-overview.md` and `docs/en/api-overview.md`.
- Update public API compatibility specs when documented entry points, helpers, or options are intentionally changed.
- If `config/public_api_manifest.yml` changes, update `docs/en/public-api.md` / `docs/ja/public-api.md`, then review the related README, usage docs, feature docs, configuration option docs, JavaScript event docs, `CHANGELOG.md`, and `docs/en/release.md` / `docs/ja/release.md`.
- Update `docs/en/api.md` / `docs/ja/api.md` when needed.
- Update CHANGELOG.

### JavaScript changes

- Run `npm test`.
- Run `npm run test:entrypoints` when documented controller exports or entrypoint wiring changes.
- Run `npm run test:browser` when browser interactions, focus, drag/drop, or real form controls are affected.
- Check importmap and packaged files.
- Confirm JavaScript entrypoint compatibility and update compatibility specs when documented exports intentionally change.

### Documentation changes

Before opening a docs pull request, do a short maintenance sweep using `docs/i18n-audit.md` as the cross-language checklist.

- Confirm whether the change affects shared user-facing guidance and therefore needs matching Japanese and English updates.
- Decide whether the change needs `CHANGELOG.md`, release docs, README/docs index links, or root-level docs policy updates.
- For public API, compatibility, installation, release, or migration docs, check the update matrix in `docs/i18n-audit.md` before narrowing the PR scope.
- For focused mockup additions, renames, or removals, confirm that the `docs/mockups/README.md` Files table, `docs/mockups/review-gallery.html`, and focused smoke target definitions describe the same inventory. The browser smoke derives expected files from the README Files table, compares them with the focused target definitions, and separately checks review-gallery links; do not treat that as a manually maintained target list.
- If one language or one related doc intentionally lags, leave the mismatch visible in the PR body or a follow-up issue instead of silently relying on the docs-only CI shortcut.

- Keep Japanese and English docs in sync when practical.
- Update `docs/i18n-audit.md`.
- Decide whether root compatibility docs should remain or point to language-specific docs.
- When a pull request touches only `README.md`, `docs/**`, `Product Profile.md`, `CHANGELOG.md`, and `AGENTS.md`, confirm that the docs-only CI short-circuit is still the intended policy before relying on it.
- If a pull request also changes `.github/workflows/**`, treat it as a full CI change rather than a docs-only shortcut candidate.
- When a pull request changes `test/browser/**`, expect normal JavaScript setup and explicit `npm run test:browser` coverage even if the intent is only to maintain browser smoke specs.
- When a pull request adds, renames, or removes a focused mockup under `docs/mockups/`, keep the mockup inventory trail synchronized: update `docs/mockups/README.md` Files table, add or adjust the `docs/mockups/review-gallery.html` card, review README and language README entry points when the recommended review flow changes, and add or update the focused smoke target definition with a representative selector and minimum count when the mockup should be browser-smoked.
- Docs-only CI skips JavaScript only when `docs/mockups/**` is unchanged. When focused mockup files change, CI runs `npm run test:browser` against the README-derived focused smoke targets, but that smoke does not prove the README Files table, review gallery, existing mockup inventory, and visual correctness are fully synchronized. If the existing mockup files and docs indexes already disagree, handle that as a separate docs follow-up instead of mixing gallery redesign or mockup HTML/CSS changes into a checklist-only PR.

## Before release

Keep this section as the short maintainer checklist. Use [Release checklist](release.md) for the detailed release evidence, including `bundle exec rake release:check`, gem package verification, tag alignment, and the main-push full CI gates.

- `bundle exec standardrb`
- `bundle exec rspec`
- `npm test`
- `npm run test:entrypoints`
- `npm run test:browser`
- `bundle exec rake build`
- `bundle exec rake release:check`
- gem package contents (`gem build tree_view.gemspec` and `ruby script/check_gem_package_contents.rb tree_view-*.gem`)
- release CI evidence: PR CI, then main-push full CI after merge, including gem package verification
- docs-entrypoint / CI-policy / browser smoke evidence when the changed files require those lanes
- confirm `config/public_api_manifest.yml` still matches the documented Ruby, helper, option, JavaScript export, and event surfaces covered by public API docs
- CHANGELOG
- docs index / i18n audit

## Branch and PR policy

- Keep functional changes small.
- Larger docs-only inventory or split PRs are acceptable.
- Before opening a pull request, check whether an open pull request already closes the same issue. Look for the same `Closes #NNN` line, linked issue, and overlapping changed files.
- If a duplicate close-check finds an existing candidate, stop the new PR path and either add review/follow-up/supersede context to the existing PR or ask a maintainer to choose the adoption path.
- When a Dependabot pull request branch has been edited by a human or agent, assume `@dependabot rebase` may no longer work and use `@dependabot recreate` or a replacement pull request instead of piling more refresh commits onto that branch.
- Keep broad mechanical baseline cleanup, such as lint rewrites, in a dedicated baseline pull request when it affects multiple dependency updates; do not duplicate the same cleanup across several Dependabot branches just to make each update green.
- PR CI must pass before merge.
- Docs-only PRs may short-circuit the representative Rails and JavaScript jobs, but merge still waits for the named checks to stay green.
- PRs that change workflow definitions should be observed on a fresh head SHA before merge.
- If a PR is `diverged` from `main`, do not rely on old green CI alone; review mergeability, changed files, risk, and behind count before deciding whether to refresh.
- Full compatibility and package verification is confirmed on `main` before release decisions.
