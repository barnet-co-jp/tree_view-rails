# CI policy suite

This note explains the narrow CI policy suite used by maintainers when a pull request changes workflow routing, CI observation guidance, lockfile drift guards, or CI-policy-sensitive maintainer docs.

## When to use it

Run the full CI policy suite when you need to confirm the policy guards without running the broader JavaScript entrypoint suite:

```bash
npm run test:ci-policy
```

The package script runs the standalone LICENSE package-sensitive prelude first (`node script/test_license_package_sensitive_signal.mjs`). The package script runs the suite self-test first and then runs the configured CI policy guard groups after that prelude. Treat `script/test_ci_policy_suite.mjs` as the source of truth for the suite group list.

## Targeted runs

Use the suite options when you are narrowing one guard failure:

```bash
node script/test_ci_policy_suite.mjs --list
node script/test_ci_policy_suite.mjs --only <group-or-index>
node script/test_ci_policy_suite.mjs --self-test
```

`--list` prints the available guard groups in order. `--only` accepts the 1-based index, exact group name, case-insensitive group name, or a unique partial group name. Unknown, ambiguous, or out-of-range values fail and print the available groups plus the `--list` hint.

## Registration self-test

When adding or renaming a CI policy guard script, update the suite `checks` array or document an explicit exclusion before relying on CI. The self-test scans candidate scripts, confirms that registered scripts stay visible through the suite, and fails with the missing script path when a candidate is not registered.

Candidate CI policy scripts must either be listed in the `checks` array or named in `ciPolicyScriptExclusions` with a short reason. Keep exclusions narrow: `test_ci_policy_suite.mjs` is excluded because it is this suite's self-test entrypoint, not a direct guard group.

The standalone LICENSE package-sensitive guard is intentionally outside the `checks` array. The self-test also confirms that `package.json` keeps that standalone prelude before the suite self-test and the suite run, so command-shape drift is caught even though the prelude is not listed as a guard group.

## Workflow trigger policy

The CI workflow intentionally starts from the `pull_request` event and from `push` events on `main`. Pull request runs are the review-time signal for a proposed head, while main-push runs preserve post-merge release, package, and compatibility evidence for the default branch.

Manual `workflow_dispatch` runs are not part of the current trigger policy. When a maintainer needs fresh CI evidence without a new commit, use the GitHub Actions rerun controls for the current head SHA rather than adding a manual trigger to the workflow.

The workflow does not use `pull_request_target`. Treat that absence as part of the CI trust boundary: pull request jobs run with the normal pull request context and the read-only workflow permissions described below, rather than using a privileged target-branch event.

Keep the policy responsibilities separate when reviewing workflow changes. Trigger policy decides when the workflow starts, the permissions guard protects the `GITHUB_TOKEN` token scope, and the concurrency guard limits stale pull request run cancellation without canceling main-push evidence.

## Pull request changed-file detection

For pull requests, the `changes` job fetches the base branch, then tries to find a merge base between `origin/${{ github.base_ref }}` and `HEAD`. When the merge base is available, the workflow uses the three-dot diff, `origin/${{ github.base_ref }}...HEAD`, so routing is based on the pull request changes. If the merge base cannot be resolved, it falls back to `git diff --name-only origin/${{ github.base_ref }} HEAD`.

The resulting file list is passed to `script/ci_changed_files_policy.mjs`, which is the source of truth for the `docs_only`, `package_sensitive`, `docker_setup_sensitive`, `docs_entrypoint_sensitive`, and `ci_policy_sensitive` outputs. `script/test_ci_workflow_changed_file_detection_signals.mjs` protects the workflow command signals; this note explains the maintainer-facing meaning of that routing and does not change the classification logic.

For non-pull-request events such as `main` pushes, the `changes` job does not derive a changed-file list. Before the base-ref fetch and pull-request diff logic, it emits conservative default outputs with `docs_only=false`, `mockups_changed=false`, `browser_smoke_changed=false`, and `package_sensitive`, `docker_setup_sensitive`, `docs_entrypoint_sensitive`, and `ci_policy_sensitive` set to `true`. Treat those defaults as default-branch evidence routing: pull requests may use changed-file shortcuts, while main-push runs use the conservative defaults to run broad release-facing package, Docker setup, docs entrypoint, and CI policy gates. This preserves broad default-branch confidence without changing pull-request classifier behavior.

## Pull request run concurrency

The CI workflow uses workflow-level `concurrency` so a newer pull request head can cancel older runs for the same pull request. The group is built from the workflow name, event name, and pull request number or ref, which keeps unrelated pull requests and `main` runs separate.

`cancel-in-progress` is intentionally limited to the `pull_request` event. Pushes to `main` still run to completion so release and package verification evidence is not weakened by a later push. Treat a canceled pull request run as stale-head evidence; review readiness should come from the workflow run for the current head SHA.

`script/test_ci_workflow_concurrency_signals.mjs` protects the representative concurrency signals, including the PR-only cancellation condition and the absence of unconditional `cancel-in-progress: true`. This note explains how maintainers should read that policy; it does not change workflow routing, required checks, branch protection, or CI polling behavior.

## Representative routing outputs

The changed-file policy exposes representative output flags rather than a full repository inventory. Use these examples as review guidance when reading a pull request's `changes` output:

| Output | Representative path signals | Maintainer meaning |
| --- | --- | --- |
| `docs_only` | `README.md`, `docs/**`, `AGENTS.md`, `Product Profile.md` | The pull request is documentation-shaped, although other outputs may still request focused confidence checks. |
| `package_sensitive` | `README.md`, `CHANGELOG.md`, `docs/**`, `Gemfile`, `Gemfile.lock`, `Rakefile`, `tree_view.gemspec`, `package.json`, `package-lock.json`, `.nvmrc`, `script/check_gem_package_contents.rb`, `lib/**`, `config/locales/**`, `app/javascript/**`, `config/public_api_manifest.yml`, `.github/dependabot.yml` | The packaged gem, Ruby package/release wiring, Node/package install-source metadata, runtime source, locale files, or package-facing docs confidence path should run. |
| `docs_entrypoint_sensitive` | `README.md`, `CHANGELOG.md`, `docs/**`, `config/public_api_manifest.yml` | Docs entrypoint signals should run because reader-facing docs, the release ledger, or public manifest signals changed. |
| `ci_policy_sensitive` | `AGENTS.md`, `docs/en/ci-policy-suite.md`, `docs/ja/ci-policy-suite.md`, `.github/workflows/ci.yml`, `.github/dependabot.yml`, `script/ci_changed_files_policy.mjs`, `script/test_ci_policy_suite.mjs`, `script/test_ci_changed_files_policy.mjs`, focused `script/test_ci_*` guards, lock dependency drift guard scripts | CI policy guards should run because workflow routing, Dependabot routing, CI policy suite docs, maintainer policy signals, or the CI policy guard scripts themselves changed. |
| `docker_setup_sensitive` | `Dockerfile`, `docker-compose.yml`, `package.json`, `package-lock.json`, `.nvmrc` | Docker-based maintainer setup confidence should run. |
| `mockups_changed` | `docs/mockups/**` | Static mockup routes changed and may need browser-smoke or gallery review. |
| `browser_smoke_changed` | `test/browser/**` | Browser smoke definitions changed and should be treated as executable test-surface changes. |

`.nvmrc` appears under both `package_sensitive` and `docker_setup_sensitive`. Its Node version source can change package and Node install-source confidence, so it runs the package confidence path; the same drift can break container alignment, so it also runs Docker setup confidence.

`app/javascript/**` changes remain package-sensitive full JavaScript confidence changes, but they do not set `browser_smoke_changed` by themselves. Keep real-browser smoke routing reserved for changed browser smoke definitions, static mockup routes, or pull requests where maintainers explicitly request browser evidence for an interaction change.

CI policy guard scripts are also CI-policy-sensitive because they define or verify the routing policy. Keep their representative signal in this table broad enough to point maintainers toward `script/test_ci_policy_suite.mjs` and focused `script/test_ci_*` guards, while leaving the executable path list in `script/ci_changed_files_policy.mjs` and `script/test_ci_changed_files_policy.mjs`.

Keep this table representative. Do not turn it into a full changed-file classifier mirror; `script/test_ci_changed_files_policy.mjs` remains the executable fixture source of truth.

## Docs-only check retention

Docs-only pull requests keep the usual CI job names visible even when heavyweight work is intentionally skipped. The representative Rails compatibility matrix keeps its check surface but prints the docs-only skip message instead of running the Rails command when `docs_only` is true.

The JavaScript job skips its install and checks only for docs-only pull requests that do not touch mockups, browser-smoke files, docs-entrypoint-sensitive files, or CI-policy-sensitive files. Package-facing docs such as `README.md`, `CHANGELOG.md`, and `docs/**` still route through the package/docs-entrypoint confidence path; `AGENTS.md` is repository-only docs and remains CI-policy-sensitive because it carries agent workflow and CI observation policy; `Product Profile.md` is repository-only docs and is intentionally not package-, docs-entrypoint-, or CI-policy-sensitive. The repository-only maintainer entrypoint smoke still runs when package-facing docs or other docs-entrypoint-sensitive files invoke `npm run test:docs-entrypoints`; Product Profile-only edits stay manual-review routed so the profile does not become a package-facing entrypoint.

Treat these retained check names as review and merge-decision context, not as proof that every heavyweight lane ran. Skipped lanes should still be read together with the changed-file routing outputs and the workflow run conclusion.

## GitHub Actions Dependabot lane

`.github/dependabot.yml` is the source of truth for the Dependabot update lanes. It currently includes a `github-actions` lane for GitHub Actions dependency updates with the same weekly Monday 09:00 Asia/Tokyo cadence and open pull request limit of 5 as the Bundler lane.

Changes to `.github/dependabot.yml` are both package-sensitive and CI-policy-sensitive. The package-sensitive route keeps dependency automation changes on the normal package confidence path, while the CI policy route guards the changed-file signal that decides how those pull requests are observed. This does not change the Dependabot schedule, grouping, dependency ecosystems, or Docker setup routing.

Keep that automation lane separate from the CI policy guard that watches representative action major versions. Dependabot opens version update pull requests; the action-major guard makes unexpected workflow action-major drift visible during review. The separate SHA pinning / allowed action policy decision remains tracked outside this note, so do not treat the Dependabot lane as a pinning-policy decision.

## Docker development setup lane

The pull request workflow exposes a `docker_setup_sensitive` changed-file lane for Docker-based maintainer setup confidence. The current representative paths are `Dockerfile`, `docker-compose.yml`, `package.json`, `package-lock.json`, `.nvmrc`, and `.github/workflows/ci.yml`.

When that lane is true, the `docker_development_setup` job builds the `app` service and runs the container-side JavaScript install smoke with Node 22, npm, and `npm ci`. Treat this as CI routing and environment-alignment evidence for Docker setup changes, not as a general Docker image design review.

This note does not change the Docker base image, compose volume policy, Node or Ruby support policy, package scripts, CI workflow jobs, required checks, or branch protection.

## Read-only workflow permissions

The pull request and main-push workflow keeps `GITHUB_TOKEN` read-only at the workflow top level with `permissions: contents: read`. This lets CI checkout repository contents and run the policy, docs, JavaScript, Ruby, Docker, and package verification lanes without granting repository write access to jobs by default.

`script/test_ci_workflow_permissions_signals.mjs` is the focused guard for this policy. It confirms the top-level permissions block includes `contents: read`, rejects `contents: write` and `pull-requests: write`, and rejects job-level `permissions:` overrides that would silently widen the token for one job.

Treat this as CI token-scope evidence only. It does not configure branch protection, required checks, repository settings, third-party action policy, or release publishing credentials. If a future workflow change needs write permissions, review that as a CI policy change and update this note and the guard together.

This note is only about maintainer command routing. It does not change CI workflow jobs, required checks, branch protection, workflow permissions, or lockfile policy.
