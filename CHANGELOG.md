# Changelog

This changelog uses the following categories when applicable:

- `Added` for new features.
- `Changed` for changes in existing behavior.
- `Fixed` for bug fixes.
- `Deprecated` for features planned for removal.
- `Removed` for removed features.
- `Security` for vulnerability fixes and security hardening notes.
- `Documentation` for docs-only changes.
- `Tests` for test, CI, and package verification changes.

Breaking changes and required migration notes should be called out explicitly in the relevant version section.

## Unreleased

Release preparation notes:

- Treat `Added`, `Changed`, and `Fixed` entries as the primary reader-facing release notes. Many entries in this section expand public configuration, helper, JavaScript, or manifest-backed surfaces and should stay visible to host-app maintainers.
- Keep `Documentation` and `Tests` entries available as release evidence, but summarize or group them during the release preparation PR when they are maintenance-only and do not change runtime behavior.
- Record public API manifest, package-root export, and documented hook changes by their user-visible effect. Use `Documentation` only when docs or manifest guidance changed without a runtime or compatibility-surface change.
- No breaking change, deprecation, or removal is currently called out in `Unreleased`. If a later release review identifies one, add the migration note before moving these entries into a dated version section.

### Added

- Added localized display-name helpers for model, attribute, and node type names through ActiveModel / I18n.
- Added `UiConfig#turbo_frame` and `UiConfigBuilder#build_turbo(turbo_frame:)` so Turbo toggle links can target a host-app Turbo Frame without custom JavaScript.
- Added `tree_view_toolbar(render_state)` for rendering tree-wide expand/collapse toolbar actions through `UiConfig#toggle_all_path`.
- Added `TreeView::NodePresenter` as a thin adapter for node-level resolver hooks and `RenderState` row class/data/icon/badge builders.
- Added owner model argument support to the persisted state install generator so `tree_view:state:install User` can include `TreeViewStateOwner` in an existing owner model.
- Added `TreeView::StateStore#clear!` so host apps can clear saved expansion state for an owner and tree instance key.
- Added `TreeView::StateStore#clear_owner!` so host apps can clear all saved expansion state records for one owner while keeping per-tree-instance clear behavior separate.
- Added `RenderState` current node ancestor expansion via `current_item` / `current_key` and `auto_expand_ancestors`.
- Added `TreeView::PathTreeBuilder` for building generated folder nodes and record nodes from path-like record values.
- Added `TreeView.configuration.render_log_level`, defaulting to `:warn`, so TreeView helper-rendered partial logs can be silenced without changing the host app's global Rails logger level.
- Added a public TreeView-specific error hierarchy rooted at `TreeView::Error` for rescuing validation and configuration failures.
- Added explicit `UiConfig#mode` values for `:turbo`, `:static`, and `:client`, plus `UiConfigBuilder#build_turbo` and `UiConfigBuilder#build_client_side`.
- Added client-side-only expand/collapse mode that renders collapsed descendants into initial HTML and toggles rows in the browser with the bundled `tree-view-client` controller.
- Added `TreeView::Diagnostics.run` as a consolidated diagnostics entrypoint for node keys, DOM IDs, orphans, and cycles.
- Added `tree_children_container_dom_id`, `tree_remote_state_placeholder_dom_id`, and `tree_remote_state_placeholder_attributes` so host apps can reuse stable lazy-loading placeholder IDs and data attributes.
- Added `TreeViewEventDetailKeys` as a package-root JavaScript export for host app tests that need machine-readable documented event detail key names.
- Added additive public JavaScript event details for `tree-view-state:state-changed` (`reason`) and `tree-view-selection:change` (`sourceCheckbox` / `attemptedChecked`) so host apps can distinguish initialization, refresh, and user-toggle sources without changing existing event snapshots.
- Added `TreeViewTransferDataAttributes` as a package-root JavaScript export for documented transfer payload and disabled-row data attributes.
- Added `toggle_icons` to the manifest-backed grouped option compatibility surface while keeping the existing RenderState option behavior unchanged.

### Changed

- Removed misleading `aria-controls` from Turbo toggle links until TreeView has a single stable controlled target.
- Clarified public builder naming decisions: prefer `badge_builder`, keep `icon_builder` as a compatibility alias, treat `row_event_payload_builder` as transfer-specific, and document `loading_builder` / `error_builder` as boolean predicates.
- Strengthened pull request CI to run Ruby specs alongside Standard Ruby lint while keeping broader compatibility and release checks on `main`.
- Split RenderState selection and lazy-loading normalization into internal configuration objects while keeping the public RenderState API compatible.
- Remote-state retry actions now mark the row `loading` and dispatch `tree-view-remote-state:change` before the existing retry event, so host app listeners can observe the loading transition consistently.

### Fixed

- Cleaned up generated selection hidden inputs when selection controllers disconnect, scoped to each controller source id.

### Security

- Updated `rails-html-sanitizer` to 1.7.1 and its `loofah` dependency to 2.25.2 to incorporate upstream SVG reference and URI sanitization security fixes.

### Documentation

- Added localized names docs in Japanese and English.
- Added Turbo Frame option docs in Japanese and English.
- Added NodePresenter row partial cookbook docs and clarified criteria for promoting app-specific UI patterns into TreeView.
- Added toolbar helper docs in Japanese and English.
- Added README adoption guidance to help users decide whether TreeView fits their use case and to clarify the virtual scrolling boundary.
- Promoted accessibility semantics as a first-class capability in the README and docs indexes, including ARIA placement, keyboard boundaries, and host-app responsibilities.
- Added accessibility semantics docs for table-first TreeView rows and ARIA placement policy.
- Added client-side toggle mode docs in Japanese and English, including static / Turbo / client-side mode comparison and CSS customization guidance using `aria-expanded`.
- Added error hierarchy docs in Japanese and English, including public rescue guidance and `ArgumentError` compatibility notes.
- Added form and editing row docs for bulk edit forms, inline-editing layouts, Form Objects, validation errors, row actions, and host-app responsibility boundaries.
- Added public name decision docs in Japanese and English.
- Added render log level docs in Japanese and English.
- Added JavaScript event contract docs in Japanese and English for public Stimulus events and payload details.
- Clarified JavaScript event contract docs that `TreeViewEventDetailKeys` mirrors documented detail key names for machine-readable test assertions without changing event payload shape.
- Clarified release checklist guidance for documented JavaScript wiring surfaces, including `data-tree-view-*` integration hooks and selection controller host-element value attributes, alongside machine-readable package-root exports.
- Added migration guides in Japanese and English to summarize compatibility promises, deprecations, rename handling, and release-note expectations.
- Clarified the CI policy split between pull request Ruby checks and broader `main` / release checks.
- Clarified development docs for the Ruby-backed `npm run test:entrypoints` manifest loader path and setup expectations.
- Clarified development docs that `.nvmrc`, `package.json` `engines.node`, and workflow `node-version` stay aligned by a Node version source drift guard.
- Clarified Development docs for the Ruby version source and CI changed-file policy guard commands, including Bundler dependency package-sensitive guidance.
- Clarified Development docs for standalone gem package verification and docs i18n parity commands.
- Clarified Development docs for public constants package guard mapping and Release docs for public setup generator package checklist / repository-only packaged-doc link boundaries.
- Clarified `npm ci` install path guidance across README, installation, development, and release checklist docs so local setup, PR CI, Docker setup smoke, and main-push JavaScript checks share lockfile-backed evidence.
- Clarified Development docs for edited Dependabot branch rebase / recreate handling and keeping broad baseline cleanups out of overlapping dependency PRs.
- Clarified Development docs for package-lock dependency drift guard guidance so dependency and Node engine metadata updates use `npm install` before returning to the lockfile-backed `npm ci` path.
- Clarified Release docs for the Ruby support source guard and release checklist relationship across README, gemspec, CI workflow, Dockerfile Ruby base image, Development docs, and package script sources.
- Clarified that RenderState current-branch examples should prefer `current_item` / `current_key` with `auto_expand_ancestors` when only the current path should start open.
- Clarified that RenderWindow and windowed rendering limit HTML output only, while Lazy Loading, Children Pagination, and host-app virtual scrolling handle data-loading and DOM-virtualization concerns.
- Updated lazy-loading docs in Japanese and English to use helper-based children and remote-state placeholder examples.
- Added `TreeView::Diagnostics.run` documentation in Japanese and English for aggregate pre-render validation results.
- Added FAQ guidance for keyboard behavior and `treegrid` responsibility boundaries in Japanese and English.
- Added a host-app extension hook reverse lookup table in Japanese and English.
- Added toolbar disabled-action troubleshooting guidance in Japanese and English.
- Added GraphAdapter troubleshooting guidance in Japanese and English for resolver shape, heterogeneous node keys, and diagnostics handoff.
- Clarified the LocalizedNames public API boundary in Japanese and English so helper fallback behavior stays separate from host-app row rendering.
- Added ResourceTableRenderState API reference entries in Japanese and English for the bridge call signature, row partial fallback, and table-layer responsibility boundary.
- Added glossary entries in Japanese and English for integration-surface terms such as remote state, transfer payloads, drop position, resource-table bridge, windowed rendering, and children pagination.
- Added Standard Ruby preflight guidance to the development docs for connector or GitHub API edits to Ruby files.
- Documented the bilingual page-set parity policy for `docs/en` and `docs/ja`, including technical-asset and temporary single-language exceptions.
- Added downstream host app smoke / release evidence guidance in Japanese and English, separating upstream TreeView release evidence from host-app adoption notes.
- Clarified the remote-state retry event ordering in the JavaScript event contract docs in Japanese and English.
- Added direction-aware styling boundary entry points to the root docs index.
- Added a direction-aware hierarchy cue static mockup for LTR / RTL review of branch lines, toggle placement, current-row cues, selected rows, and row actions.
- Added transfer disabled / invalid boundary states to the drop-position mockup and updated the mockup review guidance.
- Added static mockup references for multi-tree selection forms, toggle icon states, high-contrast state cues, reduced-motion state cues, and localized row labels.
- Added focused mockup references for RenderWindow boundary metadata and direction-aware visual cue boundaries.
- Added a status-heavy row composition mockup section for dense business columns, row status cues, and host-app-owned action availability.
- Added a current-branch sidebar breadcrumb mockup for reviewing route context and row-local hierarchy cues in narrow panes.
- Added direction-aware styling boundary docs for host-app-owned RTL, writing direction, current-row cues, hierarchy connectors, and toggle spacing overrides.
- Added CSS custom property token guidance to direction-aware styling docs for selection, current-row, loading, error, focus, and branch-line state cues.
- Added Decision guide guidance for choosing Static, Turbo, or Client-side toggle mode before tuning render depth or loading strategy.
- Clarified docs index entry points for PathTreeBuilder, Children Pagination, and large-tree reading paths.
- Added docs index entry points for Accessibility Semantics so ARIA placement, keyboard boundaries, and automated check allowances are easier to find before review.
- Corrected Windowed Rendering docs examples and metadata tables to use the implemented `TreeView::RenderWindow#previous?` / `#next?` API names.
- Clarified mockup copy and language policy exception recording for deliberate review stress cases.
- Clarified that `docs/mockups/README.md` is the source of truth for mockup technical asset inventory.
- Added mockup visual evidence handoff guidance so static visual reference PRs distinguish browser smoke success from desktop and narrow viewport readability evidence.
- Added root docs index entry points for the English and Japanese Rendering Boundaries guides.
- Added malformed selection params troubleshooting guidance in English and Japanese, including `TreeView.parse_selection_params` error boundaries and host-app-owned request policy.
- Clarified Public API docs for `TreeViewControllerEntries` as a manifest-backed controller entry list while keeping `registerTreeViewControllers(application)` as the standard registration path.
- Clarified README package-root JavaScript surface examples for controller entries, integration hooks, and documented data hook objects.
- Clarified Public API docs for the shared `data-tree-children-url` hook boundary between `TreeViewRemoteStateDataHooks` and `TreeViewIntegrationHooks`.
- Clarified Public API docs and README package-root examples for `TreeViewTransferDataAttributes`, including transfer payload and disabled-row data attribute boundaries.
- Documented CI-policy-sensitive docs-only routing in AGENTS.md and Release docs so maintainers know when `npm run test:ci-policy` runs for repository-maintainer docs.
- Added RubyGems `documentation_uri` metadata release evidence so package users can find the docs entrypoint from gem metadata.
- Documented `Security` as an allowed CHANGELOG category for vulnerability fixes and security hardening notes.
- Added mockup review task chooser release evidence so reviewers can choose baseline, responsive, interaction, accessibility, selection, and toolbar/table boundary entry points from `docs/mockups/README.md`.
- Added repository maintainer CI policy suite guidance release evidence for listing, targeting, and self-testing CI policy guard groups from `AGENTS.md`.
- Added CI policy suite maintainer note and Release checklist entry points for targeted guard runs, suite self-test behavior, and guard registration expectations.
- Added GitHub Actions Dependabot lane guidance to the CI policy suite docs, separating automation updates from action-major guard and pinning-policy decisions.
- Added Docker development setup lane guidance to the CI policy suite docs, covering `docker_setup_sensitive`, `docker_development_setup`, Node 22, and `npm ci` container-side install smoke boundaries.
- Added pull request changed-file detection and docs-only check retention guidance to CI policy suite docs, covering merge-base / fallback diff routing and package-facing versus repository-only docs boundaries.
- Added representative routing output guidance to CI policy suite docs so maintainers can map changed-file routing outputs to expected PR checks.
- Clarified CI policy suite docs self-routing guidance so bilingual CI policy suite notes are represented in `ci_policy_sensitive` checks.
- Added read-only workflow permissions guidance to CI policy suite docs so maintainers can review `GITHUB_TOKEN` token-scope evidence alongside the permissions guard.
- Added CI workflow trigger policy guidance to CI policy suite docs so maintainers can review `pull_request`, `push main`, and the `pull_request_target` trust boundary without changing workflow triggers.
- Clarified repository-only maintainer docs routing in CI policy suite docs so AGENTS.md remains CI-policy-sensitive while Product Profile.md stays manual-review routed.
- Clarified empty-state mockup release evidence for disabled toolbar actions, including the `Current path unavailable` action and host-app-owned reset behavior.
- Clarified Development docs for temporary docs i18n parity exceptions, including `parityExceptions` metadata and the boundary against permanent single-language docs.
- Clarified review-gallery visual evidence guidance so gallery previews stay a fast orientation path while merge-grade desktop and narrow viewport evidence is recorded from the target mockup page.
- Clarified empty-state mockup README guidance so hidden-message and permission-hidden row review uses the existing `empty-state.html` entry point without changing authorization policy.
- Clarified CI policy suite package-sensitive routing guidance for Ruby package and release task paths such as `Gemfile`, `Rakefile`, `tree_view.gemspec`, and package contents verification.
- Clarified CI policy suite explicit exclusion guidance so candidate guard scripts must be registered in `checks` or carry a reasoned exclusion such as the suite self-test entrypoint.
- Added CI policy docs release evidence for main-push default outputs, covering package, Docker setup, docs entrypoint, and CI policy confidence lanes without changing pull-request classifier behavior.
- Added release evidence for Dependabot maintainer policy docs and JavaScript CI cache boundary docs, clarifying they are maintainer-facing documentation additions without changing dependency policy, package manager policy, or CI workflow behavior.
- Documented bilingual review evidence for npm and Bundler security updates, Bundler CI failure recovery, Dependabot queue limits, GitHub Actions update lanes, and the setup-node npm cache boundary.

### Tests

- Added focused docs signal coverage for the public error rescue/inheritance/message boundary, state-change reasons and representative event detail classification, transfer drop/MIME/data-attribute values, and controller entry key/identifier/export mappings without changing runtime or manifest contracts.
- Added a focused Dependabot maintenance evidence signal covering bilingual guidance, configured ecosystem queue limits, action-major smoke ownership, and the workflow npm cache boundary.

- Added narrow maintenance guard command release evidence for `test:entrypoints-composition`, `test:ci-policy-license-prelude`, and `test:immutable-package-root-export-signals` so Development docs command signals stay aligned with package-script aliases.
- Added package script composition guard release evidence for `test:entrypoints`, `test:js:core`, and `test:js` so maintainers can verify JavaScript command hierarchy drift during release preparation.
- Added RenderState callback builder docs signal coverage so manifest-backed callback builder keys stay aligned with Public API docs and host-app responsibility boundaries.
- Added diagnostics manifest drift guard evidence for accepted checks, `TreeView::Diagnostics.run` public options, and `TreeView::Diagnostics::Result` attributes / helper methods so runtime and manifest surfaces stay synchronized.
- Added gemspec `summary` / `description` metadata guard evidence and release package contents signal coverage so RubyGems-facing package metadata stays visible during release preparation.
- Added LICENSE file package-sensitive routing guard evidence so license-only release evidence changes still reach gem package verification without changing license text or package policy.
- Added CI policy suite routing smoke coverage so every registered Node guard script stays classified as `ci_policy_sensitive`.
- Added CI policy suite registration policy docs signal coverage so self-test ordering and explicit guard-script exclusions stay visible in the bilingual CI policy suite docs.
- Added CI workflow permissions policy smoke coverage so read-only token permissions stay guarded against write-scope drift.
- Split focused diagnostics, workflow concurrency, and release package contents signal smokes into registered suite groups so maintainers can run the narrow docs or CI guard directly.
- Added release narrow npm script evidence for `test:release-docs` and `test:release-package-contents` so maintainers can rerun release docs and package contents signals directly.
- Added Vitest UI local command release evidence for `test:vitest-ui` so maintainers can inspect or rerun unit-style JavaScript tests interactively without treating it as a CI-required command.
- Added CI policy docs command-surface and docs-entrypoint command-surface smoke coverage so `--list`, `--only`, `--self-test`, and registration guidance stay discoverable.
- Added CI changed-file routing coverage for workflow package/Docker lanes, package-sensitive Ruby release paths, and gem package install / require smoke evidence.
- Added CI policy guard evidence for public API manifest structure, Dependabot routing, and browser-smoke routing boundaries so entrypoint and CI policy checks stay aligned.
- Added Development docs command signal coverage for `npm run test:development-docs-commands` so narrow and suite-level maintainer command checks stay discoverable.
- Added Public API docs signal coverage for persisted-state setup surface and `initial_expansion` grouped option keys so manifest-backed docs signals stay aligned.
- Added README and Public API docs signal coverage for importmap package-root setup guidance so `tree_view/index.js` and `registerTreeViewControllers(application)` stay aligned.
- Added Development docs signal coverage for npm lockfile drift recovery guidance so `npm install` / `npm ci` recovery boundaries stay aligned with package metadata drift guidance.
- Added Development docs signal coverage for public API manifest duplicate-key guard guidance so duplicate YAML key handling stays visible in maintainer docs.
- Expanded package contents verification coverage for Dependabot Bundler recovery docs so packaged gems keep scoped recovery guidance available.
- Added row status builder docs signal coverage so grouped option docs keep row disabled, readonly, and disabled-reason builders aligned with the manifest and host-app responsibility boundary.
- Added repository-only maintainer docs routing signal coverage so CI policy docs keep AGENTS.md and Product Profile.md changed-file guidance aligned.
- Added helper method manifest-backed docs signal coverage so Public API helper signatures stay aligned with `config/public_api_manifest.yml`.
- Added docs-entrypoint suite registration and lazy-loading authorization docs signal coverage so manifest-backed public surface guards stay visible through `npm run test:docs-entrypoints`.
- Added public constants docs signal guard coverage for representative Public API constants so public constants stay aligned with `config/public_api_manifest.yml`.
- Added stylesheet state cue selector source-spec coverage for selected, collapsed, loading, error, disabled-drop, and drop-target cues in the packaged stylesheet.
- Added CSS custom property manifest-to-stylesheet sync guard evidence so manifest-listed `--tree-view-*` tokens and packaged stylesheet variable usage stay synchronized.
- Expanded package contents verification coverage for bilingual CI policy suite docs so packaged gems keep maintainer CI policy guidance available.
- Consolidated `test:ci-policy` package-script execution around the CI policy suite source of truth while preserving guard registration self-test coverage.
- Added CI policy suite explicit exclusion self-test coverage so unregistered guard scripts stay classified as registered checks or documented exclusions.
- Added Docker setup CI docs signal coverage so CI policy docs keep `docker_setup_sensitive`, `docker_development_setup`, Node 22, and `npm ci` guidance aligned.
- Added CI policy docs signal coverage for pull request changed-file detection and docs-only check retention so CI policy docs stay aligned with workflow routing evidence.
- Added CI routing output docs signal coverage for representative changed-file routing output guidance.
- Added CI policy suite docs routing signal coverage so bilingual CI policy suite paths stay represented in `ci_policy_sensitive` docs smoke.
- Added CI guard suite smoke coverage for the PR specs RSpec command and package guard suite composition signals.
- Added docs-entrypoint guard coverage for `TreeViewTransferDropPositions` and `TreeViewIntegrationHooks` so transfer and integration public API docs signals stay aligned with the manifest.
- Added CI policy suite and permissions smoke coverage so maintainers can verify read-only workflow permissions and guard group registration through `npm run test:ci-policy`.
- Added manifest-backed public surface docs smoke coverage for state / remote-state event detail keys, setup generator output, localized names, and public constants.
- Expanded package contents verification coverage for README-linked FAQ / Troubleshooting / API Overview / API Reference / Tree diagnostics docs so packaged gems keep those public reader guides available.
- Added controller registration docs signal coverage to the docs-entrypoint suite so controller registration guides and manifest controller entries stay aligned.
- Added CI changed-file detection workflow guard coverage for docs-entrypoints package script wiring so controller registration docs signals stay connected to `npm run test:docs-entrypoints`.
- Added CI changed-file policy coverage for Dependabot configuration changes so dependency automation config updates stay package-sensitive without Docker or docs-entrypoint routing.
- Expanded package contents verification coverage for README-linked Host App Extension Points docs so packaged gems keep those public extension guides.
- Expanded package contents verification coverage for README-linked Accessibility Semantics docs so packaged gems keep those public semantics guides.
- Expanded package contents verification coverage for README-linked Decision guide, Migration guide, Render Scale, and Rendering Boundaries docs so packaged gems keep those docs available.
- Expanded package contents verification coverage for README-linked Error hierarchy, Cookbook, and GraphAdapter docs so packaged gems keep those public guides available.
- Expanded package contents verification coverage for README-linked PathTreeBuilder, ReverseTree, first-time usage, and helper-adjacent row docs so packaged gems keep those public guides available.
- Expanded package contents verification coverage for README-linked styling state cue docs, maintainer policy docs, and demo application boundary docs so packaged gems keep those public docs available.
- Added ReleaseCheck metadata validation and tag alignment focused specs for representative release failure paths.
- Added CI changed-file policy coverage for runtime Ruby and locale paths so package-sensitive routing remains guarded.
- Expanded package contents verification coverage for README-linked Localized Names docs so packaged gems keep those public localization guides.
- Added localized names specs and public API compatibility coverage.
- Added Turbo Frame option unit and integration specs.
- Added toolbar helper specs.
- Added toolbar action/state manifest and docs drift guard coverage.
- Added `NodePresenter` specs and `RenderState` integration specs.
- Added generator specs for persisted state owner concern injection.
- Added RenderState specs for current node ancestor auto-expansion.
- Added accessibility semantics integration specs for row ARIA state in static, collapsed, selection, and windowed rendering.
- Added render traversal regression specs for deep trees, wide trees, collapsed render scope, filtered path trees, sorter call growth, children lookup scope, and max leaf distance behavior.
- Added specs for TreeView-specific error rescue behavior.
- Added Ruby and JavaScript specs for client-side toggle mode, mode builders, public API exports, and browser-local descendant visibility updates.
- Added specs for RenderState internal configuration objects and the consolidated diagnostics entrypoint.
- Added JavaScript public event contract specs for selection, remote state, and transfer events.
- Added package-root frozen object contract coverage for public JavaScript object exports.
- Added `TreeViewEventDetailKeys` manifest/export guard coverage in entrypoint smoke and focused Ruby specs.
- Added entrypoint smoke coverage for `TreeViewTransferDataAttributes` so the package-root export stays aligned with the manifest `transfer_data_attributes` contract.
- Added manifest structure smoke coverage for `transfer_data_attributes` so required `payload` / `disabled` keys stay guarded in `config/public_api_manifest.yml`.
- Added entrypoint smoke coverage that rejects package-root exports missing from `config/public_api_manifest.yml`.
- Added Node version source drift guard coverage for `.nvmrc`, `package.json` `engines.node`, workflow `node-version`, and development docs.
- Improved entrypoint smoke diagnostics for Ruby manifest loader and JSON parse failures without changing public export assertions.
- Improved declaration literal shape smoke diagnostics for Public API manifest Ruby loader and JSON parse failures without changing declaration shape assertions.
- Added transfer controller regression guards for drop position calculation and invalid payload event dispatch.
- Added selection controller disconnect cleanup specs for generated hidden input lifecycle.
- Added remote-state retry event contract coverage for the loading `change` event dispatched before retry.
- Added browser smoke coverage for the direction-aware hierarchy cue mockup across desktop and narrow viewports.
- Added browser smoke coverage for representative docs mockup pages and the review gallery.
- Added docs entrypoint guard coverage for keeping README feature links and docs index targets aligned.
- Added README orientation asset smoke coverage for the root README image, default-tree baseline mockup, and focused mockup review links.
- Expanded package verification coverage for TreeViewHelper subfiles, the breadcrumb helper, representative Japanese toolbar locale, and Japanese release docs files.
- Added docs smoke coverage for troubleshooting diagnostics reader journeys, toolbar contract source docs, public API hook signals, mockup review flow / gallery alignment, and docs entrypoint group selection.
- Added CI changed-file policy guard coverage for workflow output key drift, docs entrypoint routing, and JavaScript npm command references.
- Added package-sensitive CI guard coverage for `Gemfile` and `Gemfile.lock` changes so Ruby dependency updates reach gem package verification.
- Added maintenance guard coverage for Ruby version source drift, grouped package contents verification, and Public API manifest event classification.
- Added docs smoke and package verification coverage for grouped RenderState option docs signals, Public Setup Surface reader journeys, and README-linked public JavaScript / setup docs packaging.
- Added setup generator optional-argument manifest guard coverage and release-note candidate docs package verification.
- Added CI changed-file detection workflow signal and configuration docs signal coverage for base-ref diff routing and `TreeView.configure` option docs.
- Added controller entries contract smoke and `tree_view_rows` / Windowed Rendering docs signal coverage to the docs entrypoint suite.
- Added Docker Ruby base image source guard coverage to the Ruby version source drift smoke.
- Added Docker development setup workflow wiring coverage to the CI changed-file policy guard.
- Added `npm ci` CI and Docker setup smoke coverage so workflow routing, JavaScript setup, and docs install guidance stay aligned.
- Added a standalone Public API manifest structure command and docs entrypoint suite wiring for manifest structure smoke.
- Added Development docs command signal smoke coverage for maintainer npm command guidance.
- Added Development docs package verification coverage to the gem package contents guard.
- Added release:check package contents verification plus gem metadata URI and public runtime packaging guard coverage.
- Added package contents verification coverage for RubyGems `documentation_uri` metadata so packaged gems keep the docs entrypoint URI aligned with the gemspec.
- Added Public API manifest runtime surface guard coverage for documented module methods, constants, and helper methods.
- Added CI changed-file policy CLI output guard coverage for workflow `key=value` handoff formatting and stdin trimming.
- Added dependency spec, non-PR workflow output, public API manifest unknown-key, and duplicate YAML-key guard coverage for package-lock, CI changed-file policy, and manifest structure smoke.
- Added public setup generator file package contents guard coverage for install generator and state templates.
- Added public API manifest top-level key parity coverage to keep Ruby and Node manifest structure guards synchronized.
- Added nested Public API manifest key parity coverage so Ruby and Node manifest structure guards stay synchronized for option key and integration hook lists.
- Added release docs signal coverage for release metadata guards and docs-entrypoint sensitive CI routing.
- Added docs entrypoint suite self-test coverage for unregistered docs smoke / signal scripts.
- Added event names public API docs signal smoke coverage so manifest event-name groups and documented JavaScript event names stay aligned.
- Added CHANGELOG-only CI routing coverage to keep `CHANGELOG.md` changes on the docs-entrypoint and package verification paths.
- Added release note candidate helper contract specs for formatter output, CLI option validation, and since-tag reference collection without network access.
- Added mockup demo application boundary docs signal coverage for static mockup / future real Rails demo app responsibility boundaries.
- Added CI policy smoke coverage for gem package and JavaScript package install job signals, including package-sensitive routing and lockfile-backed `npm ci` expectations.
- Added CI policy smoke coverage for JavaScript `needs: changes`, lint Standard Ruby command, and pull request specs Ruby / RSpec gate signals.
- Added Development docs command smoke coverage for Docker setup command guidance and lockfile-backed Node/npm install signals.
- Added CI changed-file policy coverage for public API, public setup surface, and release docs package/docs-entrypoint routing cases.
- Expanded package contents verification coverage for README-linked public JavaScript docs, including controller registration and selection checkbox hook docs.
- Added gem package verification coverage for manifest-listed package-root JavaScript named exports in packaged `index.js` and `index.d.ts`.
- Added gem package verification coverage for README-linked render log level docs so the packaged gem keeps the docs reached from README's render logging guidance.
- Added Ruby version source guard coverage for the Rails 7.1 main-push matrix signal so workflow, Gemfile, Ruby version, and Development docs wording stay aligned.
- Added release docs signal coverage for controller registration troubleshooting and public setup generator packaging guidance.
- Added release and CI docs signal coverage for workflow action major versions, Ruby / Rails release evidence, and gem package install / require checks.
- Added `actions/checkout@v7` action-major guard evidence so representative CI jobs stay aligned with the workflow action-version signal without deciding SHA pinning policy.
- Added CI observation guidance signal coverage so maintainers verify GitHub Actions workflow runs when combined status is empty.
- Added CI policy smoke coverage for AGENTS.md routing and non-PR `ci_policy_sensitive` defaults so CI-policy-sensitive docs changes stay guarded.
- Expanded package contents verification coverage for README-linked Turbo Frame option, Direction-aware styling, and Public Name Decisions docs so packaged gems keep those public guides available.

## 0.1.0 - 2026-05-07

### Added

- Core tree rendering primitives for Rails applications.
- `TreeView::Tree` for parent-child records.
- `TreeView::GraphAdapter` for graph-like or heterogeneous node structures.
- `TreeView::PathTree` via `Tree#path_tree_for(items)` for rendering matched items with completed parent paths.
- `TreeView::ReverseTree` via `Tree#reverse_tree_for(items)` for rendering child-to-parent paths.
- `TreeView::RenderState` for screen-level rendering options.
- `tree_view_rows(render_state)` helper.
- `TreeView::RenderWindow` and opt-in windowed rendering through `tree_view_rows(render_state, window: { offset:, limit: })`.
- `tree_view_window(render_state, offset:, limit:)` for pagination metadata around visible rows.
- Static tree rendering.
- Turbo Stream path builder integration.
- Initial expansion controls:
  - `initial_state`
  - `expanded_keys`
  - `collapsed_keys`
  - `max_initial_depth`
- Render scope controls:
  - `max_render_depth`
  - `max_leaf_distance`
- Toggle scope controls:
  - `max_toggle_depth_from_root`
  - `max_toggle_leaf_distance`
- Grouped `RenderState` options:
  - `initial_expansion`
  - `render_scope`
  - `toggle_scope`
  - `selection`
- Row attribute builders:
  - `row_class_builder`
  - `row_data_builder`
- Row visual hooks:
  - `badge_builder`
  - `icon_builder`
- Checkbox selection support:
  - JSON payload values
  - custom checkbox name
  - per-node disabled state
  - disabled reason attributes
  - initial selected state via `selected_keys`
- Orphan handling strategies.
- Optional node key uniqueness validation.
- Optional DOM ID collision diagnostics via `RenderState#validate_unique_dom_ids!`.
- `TreeView::VisibleRows` for flattening currently visible rows with depth and expansion state.
- Lazy-loading row data hooks through `UiConfig#load_children_path_builder` and `RenderState#lazy_loading`.
- Persisted state support through `TreeView::PersistedState`, `TreeView::StateStore`, and the install generator.
- Breadcrumb rendering helper for parent paths.
- Standard Ruby linting in development dependencies and CI.
- Rails version matrix Gemfiles and a main-push-only Rails compatibility CI job.

### Documentation

- Added Japanese documentation under `docs/`.
- Added language-specific documentation trees under `docs/ja/` and `docs/en/`.
- Added documentation language selector and i18n audit.
- Added installation, minimal usage, usage, API overview, and API reference documentation in Japanese and English.
- Added language-specific public API and release checklist docs.
- Added feature docs in Japanese and English for selection, lazy loading, windowed rendering, persisted state, breadcrumb, drag and drop, and children pagination.
- Added supporting docs in Japanese and English for glossary, node keys, tree diagnostics, cookbook, depth labels, row status, filtered trees, rendering boundaries, render scale, host app extension points, design policy, development, and code quality.
- Expanded the default TreeView static HTML mock to cover root, child, leaf, expanded, collapsed, hidden-count, selection, disabled selection, badge, marker, depth label, data attributes, and row actions examples.
- Added concrete multi-key sorter cookbook examples, including nil handling and stable fallback keys.
- Clarified beta documentation cleanup responsibilities and the split between static mockups in this repository and Rails playground behavior in the demo repository.
- Clarified the persisted state generator output and owner-side usage.
- Added children pagination guidance for lazy loading examples.
- Clarified large-tree performance hardening boundaries between TreeView gem support and host app responsibilities.
- Clarified public API, semi-public API, internal helper module, JavaScript entrypoint, and compatibility policy.
- Clarified that releases are normally managed by tags on `main`, with release branches reserved for parallel maintenance.
- Converted root compatibility docs into short language selectors where practical.
- Removed root-level docs compatibility selectors where language-specific docs already exist, keeping `docs/README.md`, `docs/i18n-audit.md`, language directories, and technical mockup assets as the primary docs structure.

### Tests

- Added coverage for the persisted state install generator outputs.
- Added unit and integration coverage for windowed rendering.
- Added JavaScript controller tests for state, selection, transfer, and remote-state behavior.

### Notes

- This gem intentionally focuses on TreeView rendering primitives.
- CRUD, authorization, business-specific actions, and selection side effects remain the responsibility of the host Rails application.
- `TreeView::VERSION` is already set to `0.1.0` for this release.
