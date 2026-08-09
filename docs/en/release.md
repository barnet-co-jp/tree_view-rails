# Release checklist

This page summarizes the release checklist and policy for the `tree_view` gem.

## Versioning policy

`tree_view` follows semantic versioning.

- Patch versions fix bugs or documentation errors without changing public behavior.
- Minor versions add backward-compatible APIs, options, hooks, or docs.
- Major versions may include intentional breaking changes.

Even before `1.0.0`, breaking changes should be deliberate and documented with migration notes in `CHANGELOG.md` and relevant docs.

## Release branch and tag policy

For normal releases, do not create long-lived `release/*` branches. Tag a green commit on `main` with `vX.Y.Z`.

Release flow:

1. Open a release preparation PR against `main`.
2. Update `lib/tree_view/version.rb` when the target version is not already set.
3. Move relevant `CHANGELOG.md` entries from `Unreleased` into a dated version section.
4. Merge the PR into `main`.
5. Confirm main-push full CI is green.
6. Tag the exact green `main` commit with `vX.Y.Z`.
7. Create a GitHub Release when appropriate.
8. Publish the gem when appropriate.

Before writing GitHub Release notes, use the [Release note candidate collector](release-note-candidates.md) to gather merged PR and closed Issue links for maintainer review. The collector is only a checklist aid: it does not rewrite `CHANGELOG.md`, decide the final notes, tag, publish, or create a GitHub Release.

Introduce `release/x.y` branches only when parallel maintenance, long RC verification, or security/compatibility patch lines are needed.

## Initial release target

The initial `0.1.0` release should include a coherent documented baseline rather than every planned feature.

Minimum release conditions:

- `TreeView::VERSION` is set to `0.1.0`
- `CHANGELOG.md` has a dated `0.1.0` section
- core tree construction and rendering helpers are covered by specs
- static rendering works without dedicated JavaScript
- Turbo path-builder integration is documented
- selection params parsing and checkbox rendering are documented when included
- asset and importmap setup is documented
- public API and compatibility boundaries are documented
- package file list includes Rails integration files and docs
- main-push full CI is green

## Code and tests

The committed `package-lock.json` is the source of truth for JavaScript dependency installs. Local setup, pull-request CI, Docker setup smoke, and main-push JavaScript checks use `npm ci` so release evidence does not update dependency resolution during verification.

### JavaScript install path

When JavaScript dependencies change, keep these release-facing points aligned:

- Update `package.json` and `package-lock.json` together without bundling unrelated dependency upgrades.
- Keep setup wording in `README.md`, `docs/en/installation.md`, `docs/ja/installation.md`, `docs/en/development.md`, and `docs/ja/development.md` aligned with `npm ci`.
- Keep the Node 22 source guard separate: `.nvmrc`, `package.json` `engines.node`, workflow `node-version`, and `script/test_node_version_sources.mjs` confirm the Node major, while the lockfile-backed install path confirms dependency resolution.
- Observe fresh PR or main-push CI after dependency changes so the JavaScript lane proves the updated lockfile works in CI.

Do not change dependency versions, the Node major, or package manager policy from this checklist alone; those belong in the dependency or CI change PR that owns the actual switch.

### Bundler lockfile drift guard

When Ruby dependency metadata changes, keep `Gemfile` and `Gemfile.lock` aligned before release verification. The `npm run test:ci-policy` command includes `script/test_gemfile_lock_dependency_drift.mjs`, which compares direct `Gemfile` gem requirements with the `Gemfile.lock` `DEPENDENCIES` metadata and points maintainers to `bundle install` when the committed lockfile is stale.

Use this guard as release/package verification confidence for Bundler metadata only. It does not change dependency versions, Bundler policy, Dependabot grouping, or CI workflow behavior by itself.

### Ruby CI dependency cache boundary

The pull-request and main-push Rails matrix lanes select each dependency set through matrix-specific `BUNDLE_GEMFILE` and let `ruby/setup-ruby@v1` perform the verification install with `bundler-cache: true`. The cache speeds repeated verification; it does not own dependency or lockfile updates.

Contributors and dependency-update pull requests still own running `bundle install` with the applicable Gemfile and committing synchronized dependency metadata or lockfiles. CI consumes that committed state through its cached install path without changing Bundler policy, dependency versions, or lockfiles.

### Ruby support source guard

When Ruby support wording or source files change, keep the release checklist aligned with the same source set used by `npm run test:ruby-version-sources`: `README.md`, `tree_view.gemspec`, the CI workflow, the Dockerfile Ruby base image, Development docs, and the package script. This guard confirms the supported Ruby sources and representative Ruby version matrix stay consistent; it does not change the supported Ruby policy by itself.

Use the release checklist to confirm that Ruby support evidence is visible before tagging, while leaving Ruby major/minor support changes, Rails matrix changes, workflow behavior, and gemspec metadata updates to the PR that owns the actual support-policy change.

### CI policy suite

When release preparation or a CI-sensitive documentation change needs targeted CI policy guard evidence, start from [CI policy suite](ci-policy-suite.md). Use `node script/test_ci_policy_suite.mjs --list` to see available guard groups, `node script/test_ci_policy_suite.mjs --only <group-or-index>` to narrow one guard, and `node script/test_ci_policy_suite.mjs --self-test` to confirm guard registration coverage before relying on release evidence.

Local checks:

```bash
bundle exec rake release:check
bundle exec standardrb
bundle exec rake
npm run test:js
```

`bundle exec rake release:check` validates the current `TreeView::VERSION`, checks for a dated `CHANGELOG.md` section for that version, builds the gem, confirms release-facing files are packaged, runs `ruby script/check_gem_package_contents.rb tree_view-*.gem` against the built gem, and runs a `bundle exec ruby -Ilib -e 'require "tree_view"'` load check. The dated `CHANGELOG.md` section must include at least one allowed category heading (`Added`, `Changed`, `Fixed`, `Deprecated`, `Removed`, `Security`, `Documentation`, or `Tests`) and non-empty release note body under a category heading, so release preparation cannot leave only a version shell without reader-facing notes. The package contents guard checks representative Rails helper, view partial, locale, docs, JavaScript, CSS, importmap, public API manifest, public runtime files, and gem metadata URI surfaces. For manifest-listed public Ruby constants, package verification compares `config/public_api_manifest.yml` `public_constants` with `PUBLIC_CONSTANT_RUNTIME_FILES`, then fails separately when a runtime file is missing from the built gem or when a manifest constant lacks a guard mapping. The same guard also checks the public setup generator files for `tree_view:state:install` so generator name, optional owner argument, and generated destination path evidence stay aligned with the public setup surface docs. The metadata part of that guard checks the gem metadata URI set (`homepage_uri`, `source_code_uri`, `documentation_uri`, `changelog_uri`, and `bug_tracker_uri`) plus the release metadata boundary for required Ruby version, allowed push host, and runtime dependency metadata (`required_ruby_version`, `allowed_push_host`, and runtime dependency `railties >= 7.0`), so docs entrypoint, source, changelog, issue tracker, Ruby support, RubyGems push scope, and Rails runtime requirement drift are caught by package verification rather than by release prose alone. Packaged docs must not link back to repository-only `Product Profile.md` or `AGENTS.md` through encoded parent-directory links; `PACKAGED_DOCS_FORBIDDEN_RELATIVE_ROOT_LINKS` reports `Forbidden repository-only root doc links in packaged <path>` with the affected packaged docs path and link. The main-push `gem_package` CI job repeats the same package contents verification against its built gem. Tag alignment is skipped until `vX.Y.Z` exists, then verifies that the release tag points at the current `HEAD`.

After creating the release tag, rerun the release check with tag alignment required:

```bash
TREE_VIEW_REQUIRE_RELEASE_TAG=1 bundle exec rake release:check
```

Use the default command during release preparation PRs because the tag usually does not exist yet. Use the flagged command after tagging so the check fails if `vX.Y.Z` is missing or points at a different commit from the current `HEAD`.

Pull request CI checks:

- Ruby lint through `bundle exec standardrb`
- Ruby specs through `bundle exec rspec`
- Representative Rails compatibility checks through `gemfiles/rails_7_0.gemfile`, `gemfiles/rails_7_2.gemfile`, and `gemfiles/rails_8_0.gemfile`. These representative Rails lanes run for non-docs PRs. When the changed-files policy marks a PR as docs-only, each lane emits `Docs-only PR: skipping representative Rails compatibility lane.` and skips checkout, Ruby setup, and `bundle exec rake` so docs-only changes avoid runtime-heavy Rails compatibility work.
- JavaScript checks through the changed-files policy: docs-entrypoint-sensitive docs-only PRs run `npm run test:docs-entrypoints`, CI-policy-sensitive docs-only PRs run `npm run test:ci-policy`, non-docs PRs run `npm run test:js:core`, and mockup or browser-smoke-sensitive PRs install Playwright Chromium and run `npm run test:browser`
- Gem package verification when the PR touches package-sensitive paths

Package-sensitive PR paths include `tree_view.gemspec`, `Rakefile`, root and packaged docs (`README.md`, `CHANGELOG.md`, and `docs/**`), JavaScript install and Node source files (`package.json`, `package-lock.json`, and `.nvmrc`), Bundler source files (`Gemfile` and `Gemfile.lock`), `script/check_gem_package_contents.rb`, `.github/workflows/ci.yml`, `.github/dependabot.yml`, `lib/**`, Rails integration files under `app/helpers/**`, `app/views/**`, `app/assets/**`, and `app/javascript/**`, plus `config/importmap.tree_view.rb`, `config/public_api_manifest.yml`, and `config/locales/**`. Dependabot configuration changes are package-sensitive because dependency automation routing can affect package verification confidence; this classification does not change Dependabot schedules, grouping, or dependency versions. Those PRs run `gem build tree_view.gemspec`, `ruby script/check_gem_package_contents.rb tree_view-*.gem`, `gem install tree_view-*.gem`, and `ruby -e "require 'tree_view'"`. Docs-only PRs still avoid runtime-heavy lanes when they touch only docs paths, but README, CHANGELOG, and packaged docs changes are package-sensitive because the built gem must keep release-facing docs present and aligned. That `package_sensitive` classification is separate from `docs_entrypoint_sensitive`: docs-only changes to `README.md`, `CHANGELOG.md`, `docs/**`, and `config/public_api_manifest.yml` also run docs entrypoint smoke so reader-facing docs and machine-readable public API guidance stay aligned without changing the runtime test matrix. Docs-only PRs that are not docs-entrypoint-sensitive and do not touch mockups, CI-policy-sensitive, or browser-smoke-sensitive paths can skip JavaScript checks entirely; mockup or browser-smoke-sensitive PRs still run the browser smoke even when their content is otherwise docs-only.

Signal guards keep the representative phrase: Package-sensitive PR paths include `tree_view.gemspec`.

Main-push CI checks:

- Ruby version matrix
- Rails version matrix
- JavaScript tests through `npm ci` and `npm run test:js`
- Gem package verification, including representative Rails helper, view partial, locale, docs, JavaScript, CSS, importmap, public API manifest, public runtime files, public setup generator files, and gem metadata URI contents

PR CI must pass before merge. Use the broader `main` CI for release decisions because it includes full compatibility matrices, JavaScript coverage, and unconditional package verification.

## Downstream host-app evidence

TreeView release evidence lives in this repository: the public API manifest, package-root exports, public API and feature docs, mockup README / review gallery, browser smoke targets, and package verification are the upstream sources to review before tagging.

Downstream Rails applications, such as `docs-portal`, should keep their own adoption smoke and rollback notes for app-specific flows such as sidebar trees, detail trees, persisted state, selection, window offsets, routes, permissions, icons, and business row actions. Treat those notes as host-app adoption evidence, not as TreeView's source of truth or a TreeView-only release requirement.

When a downstream smoke fails, first classify whether the finding points to an upstream TreeView contract/package issue or to host-app wiring, query, route, authorization, copy, or rollback policy. Do not use a downstream pinned SHA, application-specific rollback note, or unmerged downstream pull request as the release-facing source of truth for TreeView behavior.

## Documentation

When public usage or public options change, update related docs and CHANGELOG.

When the change touches documented host-app wiring or machine-readable public contract surfaces such as package-root JavaScript exports, controller identifiers, grouped option keys, documented event names/detail keys, documented `data-tree-view-*` integration hooks, or selection controller host-element value attributes, review `config/public_api_manifest.yml` together with the public API docs and any affected feature pages.

`config/public_api_manifest.yml` remains the machine-readable source of truth for package-root exports, controller identifiers, grouped option keys, and documented event detail keys. Public API and feature docs remain the source of truth for documented wiring attributes and hooks that are intentionally not exported there.

When the change touches the public setup surface, review [Public Setup Surface](public-setup-surface.md) together with `config/public_api_manifest.yml`. The persisted-state setup generator name, optional owner argument, and generated destination paths are public setup compatibility surface; release verification should keep the package contents guard aligned with those setup files without changing generator implementation, generated templates, or migration schema from this checklist alone.

For any public API manifest change, confirm the release-facing trail is complete before tagging:

- the manifest change is reflected in `docs/en/public-api.md`, `docs/ja/public-api.md`, and any affected feature page
- `CHANGELOG.md` describes the user-visible compatibility surface under the appropriate release category
- breaking changes, removals, or deprecations include migration notes rather than only manifest or spec wording
- docs-only manifest guidance changes are listed as Documentation entries and do not imply runtime behavior changes

Pull request CI runs `node script/ci_public_contract_release_trail.mjs` for this focused review. Changes to `config/public_api_manifest.yml`, `app/javascript/tree_view/index.js`, or `app/javascript/tree_view/index.d.ts` must include `CHANGELOG.md`; changes limited to the English and Japanese Public API guidance do not require a changelog entry. Breaking, deprecation, removal, or rename wording also requires a concrete migration action in the changelog or synchronized migration guides. Run `npm run test:public-contract-release-trail` to verify the representative manifest-only, docs-only, changelog-present, and migration-note fixtures.

Documentation files to review when public behavior or public compatibility surfaces change:

- `README.md`
- `docs/ja/README.md`
- `docs/en/README.md`
- `docs/ja/api.md`
- `docs/en/api.md`
- `docs/ja/public-api.md`
- `docs/en/public-api.md`
- `docs/en/public-setup-surface.md` when setup generator names, optional arguments, or generated destination paths change
- `config/public_api_manifest.yml` when it is the source of truth for the changed contract surface
- feature-specific docs
- `docs/i18n-audit.md` (documentation maintenance checklist)
- `CHANGELOG.md`

## CHANGELOG policy

For each release, add a dated entry to `CHANGELOG.md`.

Use these categories:

- Added
- Changed
- Fixed
- Deprecated
- Removed
- Security
- Documentation
- Tests

Use Security for vulnerability fixes and security hardening notes. Record test, CI, docs smoke, and package verification changes under Tests. Record public API manifest changes by their user-visible effect. Use Added or Changed for backward-compatible public surface updates, Deprecated or Removed for compatibility changes that require migration notes, and Documentation only when the manifest or docs guidance changed without a runtime contract change.

Include migration notes for breaking changes or deprecations.

## Gem package

Before release:

- Confirm `TreeView::VERSION` matches the release version.
- Run `gem build tree_view.gemspec`.
- Run `ruby script/check_gem_package_contents.rb tree_view-*.gem` against the built gem.
- Install the generated gem locally and confirm `require "tree_view"` works.
- Confirm packaged files include:
  - `lib/**/*`
  - Rails helpers, views, stylesheets, JavaScript, and importmap files
  - public setup generator files for `tree_view:state:install`
  - `app/helpers/tree_view_helper.rb`
  - `app/views/tree_view/_tree_row.html.erb`
  - `app/javascript/tree_view/index.js`
  - `app/javascript/tree_view/index.d.ts` as the compile-time declaration shipped beside the runtime entrypoint
  - `app/assets/stylesheets/tree_view.scss`
  - `config/importmap.tree_view.rb`
  - `config/public_api_manifest.yml`
  - `config/locales/tree_view.toolbar.en.yml`
  - `config/locales/tree_view.toolbar.ja.yml`
  - `lib/generators/tree_view/state/install_generator.rb`
  - `lib/generators/tree_view/state/templates/create_tree_view_states.rb`
  - `lib/generators/tree_view/state/templates/tree_view_state.rb`
  - `lib/generators/tree_view/state/templates/tree_view_state_owner.rb`
  - `README.md`
  - `CHANGELOG.md`
  - `docs/**/*`
  - `docs/en/release.md`
  - `docs/ja/release.md`
  - `LICENSE*`

Because `docs/**/*` is packaged, keep package-facing docs independent from repository-only maintainer docs. `Product Profile.md` and `AGENTS.md` stay repository-only; do not add encoded parent-directory links from packaged docs back to those root-only files. The package contents guard reports `Forbidden repository-only root doc links in packaged <path>` when that boundary drifts.

## Package verification signals

The package contents guard also verifies package-root JavaScript entrypoint and importmap signals. Keep `config/public_api_manifest.yml` `javascript_package_root.named_exports` aligned with packaged `app/javascript/tree_view/index.js` and `app/javascript/tree_view/index.d.ts`; when a manifest-listed export is absent, the guard reports `Missing manifest-listed JavaScript package-root named exports in packaged <path>`. This is release evidence only, so do not add or rename public JavaScript exports from this checklist alone.

RubyGems consumer-facing descriptive metadata is guarded separately from URI and release metadata. `spec/gemspec_files_spec.rb` keeps the packaged gemspec license at `MIT`, the summary as `Tree rendering primitives for Rails applications`, and the description as `Reusable tree traversal, render state, helpers, partials, and Rails integration points for tree-style UIs.` This is descriptive metadata evidence for registry-facing identity; URI metadata and release metadata remain separate package-checker evidence, and this checklist does not change their values, dependencies, or release policy.

The package verifier also checks that the built gem contains `config/importmap.tree_view.rb` and that its source keeps `pin "tree_view", to: "tree_view/index.js"` for importmap host apps. This is importmap package evidence, distinct from runtime package-root export guards and controller registration or behavior guards. Importmap setup behavior, public exports, and controller semantics belong to the PR that intentionally changes those surfaces.

## Repository

- Confirm `main` is green before tagging.
- Tag the released version on `main`.
- Create a GitHub Release when appropriate.
- Link notable closed issues and merged PRs from release notes.
