# tree_view docs

`tree_view` documentation is organized by language.

`tree_view` のドキュメントは言語別に管理します。

## Languages

- [日本語ドキュメント](ja/README.md)
- [English documentation](en/README.md)

## Recommended entry points

- [English first-time setup](en/installation.md): install TreeView first, then continue to [Minimal usage](en/minimal-usage.md) and [Usage](en/usage.md) for the smallest working host-app wiring.
- [日本語初回導入](ja/installation.md): まず TreeView を導入し、続けて [最小利用例](ja/minimal-usage.md) と [使い方](ja/usage.md) で host app の最小構成を確認します。
- [English decision guide](en/decision-guide.md): choose APIs and options by use case, including when to use GraphAdapter adapter mode for heterogeneous or graph-like nodes.
- [日本語API判断ガイド](ja/decision-guide.md): use caseからAPIやoptionを選ぶための入口。異種node混在やgraph-like nodeでGraphAdapter adapter modeを選ぶ場面も確認できます。
- [English API overview: adapter mode](en/api-overview.md#adapter-mode): quick GraphAdapter entry point before moving to the full API reference or cookbook performance notes.
- [日本語API概要: adapter mode](ja/api-overview.md#adapter-mode): API仕様やCookbookの性能メモへ進む前に確認するGraphAdapterの短い入口。
- [English GraphAdapter](en/graph-adapter.md): usage, node key strategy, and host-app responsibility boundary for heterogeneous or graph-like nodes.
- [日本語GraphAdapter](ja/graph-adapter.md): 異種nodeやgraph-like nodeを扱う場合の使い方、node key設計、host app責務境界。
- [English ReverseTree](en/reverse-tree.md): child-to-parent path entry point when matched records should be visible roots and ancestors should appear below them.
- [日本語ReverseTree](ja/reverse-tree.md): matched recordを表示上のrootにし、ancestorをその下に並べるchild-to-parent pathの入口。
- [English Filtered Trees](en/filtered-trees.md): render search or filter results as trees while keeping path-generated folders and child-to-parent paths separate.
- [日本語Filtered Trees](ja/filtered-trees.md): 検索・絞り込み結果をtreeとして表示する入口。path生成folderやchild-to-parent pathとは使い分けます。
- [English PathTreeBuilder](en/path-tree-builder.md): build generated folder rows and record rows from path-like record values.
- [日本語PathTreeBuilder](ja/path-tree-builder.md): pathらしいrecord値から生成folder行とrecord行を作る入口。
- [English FAQ](en/faq.md): quick answers about responsibility boundaries and common misunderstandings.
- [日本語FAQ](ja/faq.md): 責務境界とよくある誤解を短く確認する入口。
- [English Rendering Boundaries](en/rendering-boundaries.md): check which rendering responsibilities belong to TreeView and which remain in the host app.
- [日本語描画責務の境界](ja/rendering-boundaries.md): TreeView が担う描画責務と host app 側に残す責務を確認する入口。
- [English troubleshooting](en/troubleshooting.md): reverse-lookup entry point for common integration symptoms.
- [日本語Troubleshooting](ja/troubleshooting.md): よくある統合トラブルを症状から逆引きする入口。
- [English Tree diagnostics](en/tree-diagnostics.md): inspect node keys, DOM IDs, orphan nodes, and cycles before rendering.
- [日本語Tree diagnostics](ja/tree-diagnostics.md): node_key、DOM ID、orphan、cycle などの構造を描画前に確認する入口。
- [English Accessibility Semantics](en/accessibility-semantics.md): table-first ARIA policy, empty-state wrapper hooks, keyboard helper boundary, and intentional automated-check allowances.
- [日本語Accessibility Semantics](ja/accessibility-semantics.md): table-first ARIA 方針、empty-state wrapper hook、keyboard helper の責務境界、自動 accessibility check の意図的な許容事項。
- [English Selection](en/selection.md): checkbox selection hooks, hidden input form sync, max-count limits, multi-tree form boundaries, unloaded-descendant boundaries, and submitted value parsing.
- [日本語Selection](ja/selection.md): checkbox selection hooks、hidden input form sync、最大選択数、複数 tree form の境界、unloaded descendants の境界、submitted value parsing の入口。
- [English Lazy Loading](en/lazy-loading.md): load children on demand through host-app routes and TreeView remote-state hooks.
- [日本語Lazy Loading](ja/lazy-loading.md): host app の route と TreeView remote-state hooks で子nodeを必要時に読み込む入口。
- [English Children Pagination](en/children-pagination.md): combine lazy loading with server-side child paging when a parent has too many direct children to return at once.
- [日本語Children Pagination](ja/children-pagination.md): direct children が多すぎる親nodeで、lazy loading と server-side child paging を組み合わせる入口。
- [English Cookbook](en/cookbook.md): common host-app patterns that combine existing TreeView APIs while keeping CRUD, authorization, routes, and final copy in the host app.
- [日本語Cookbook](ja/cookbook.md): 既存TreeView APIを組み合わせるhost app向けpattern集。CRUD、authorization、route、最終copyはhost app側に残します。
- [English Windowed Rendering](en/windowed-rendering.md): render visible rows by offset and limit while host apps keep query and paging ownership.
- [日本語Windowed Rendering](ja/windowed-rendering.md): offset / limit で visible rows を描画し、query や paging は host app が所有する前提の入口。
- [English Render log level](en/render-log-level.md): configure TreeView helper-rendered partial log verbosity without changing the host app's global Rails logger level.
- [日本語Render log level](ja/render-log-level.md): host app 全体の Rails logger level を変えずに、TreeView helper-rendered partial log の出力を調整する入口。
- [English direction-aware styling boundary](en/direction-aware-styling.md): host-app override guidance for RTL, writing direction, current-row cues, hierarchy connectors, and toggle spacing.
- [日本語Direction-aware styling boundary](ja/direction-aware-styling.md): RTL、writing direction、current-row cue、hierarchy connector、toggle spacing の host-app override guidance。
- [English styling state cues](en/styling-state-cues.md): CSS custom properties for the packaged stylesheet's small state-cue surface.
- [日本語State cue のスタイリング](ja/styling-state-cues.md): 同梱 stylesheet の小さな state-cue surface 向け CSS custom properties。
- [TreeView mockups](mockups/README.md): static visual reference for baseline DOM structure, interaction states, and focused empty-state rows. Start with [review-gallery.html](mockups/review-gallery.html) for the fastest side-by-side first look, open [default-tree.html](mockups/default-tree.html) when you want the baseline DOM structure and shared CSS reference directly, and use [empty-state.html](mockups/empty-state.html) when checking no-root-items / no-results wrapper hooks and host-app-owned copy boundaries.
- [English demo application boundary](en/demo-application-boundary.md): decide when to use static mockups versus a real Rails demo app, without adding private or unavailable demo links.
- [日本語Demo application boundary](ja/demo-application-boundary.md): static mockup と real Rails demo app の役割分担、未公開 demo link を増やさない方針。
- [English Turbo Frame option](en/turbo-frame.md): target TreeView Turbo toggle links at a host-app Turbo Frame without custom JavaScript.
- [日本語Turbo Frame オプション](ja/turbo-frame.md): TreeView の Turbo toggle link を host app の Turbo Frame に向ける設定。
- [English Toolbar helper](en/toolbar.md): render tree-wide expand, collapse, and collapse-to-current-path actions while host apps own final placement and copy.
- [日本語Toolbar helper](ja/toolbar.md): tree全体のexpand / collapse / current pathへのcollapse actionを描画し、配置と文言はhost appが所有する入口。
- [English Breadcrumb helper](en/breadcrumb.md): render ancestor path context for a current or target node without taking over host-app routing or navigation policy.
- [日本語Breadcrumb helper](ja/breadcrumb.md): current nodeや対象nodeのancestor path contextを描画し、routeやnavigation policyはhost app側に残す入口。
- [English Persisted State](en/persisted-state.md): save, restore, clear, and prune TreeView expansion state through host-app-owned storage and retention policy boundaries.
- [日本語Persisted State](ja/persisted-state.md): TreeView の開閉状態を host app 側の保存先で保存・復元・clear・pruneし、retention policy / cleanup schedule の責務境界を確認する入口。
- [English Localized names](en/localized-names.md): resolve model, attribute, and node type labels through ActiveModel / I18n.
- [日本語ローカライズされた名前](ja/localized-names.md): ActiveModel / I18n 経由で model、attribute、node type の表示名を解決する入口。
- [English Public Setup Surface](en/public-setup-surface.md): path-level contract for the persisted-state install generator and the boundary between setup destinations and host-app review.
- [日本語Public Setup Surface](ja/public-setup-surface.md): persisted-state install generator の生成先 path-level contract と、setup surface / host-app review の責務境界。
- [English resource table bridge](en/resource-table-bridge.md): bridge TreeView row rendering with a separate table layer that owns columns and table state.
- [日本語Resource table bridge](ja/resource-table-bridge.md): 別table layerが列推論やtable stateを持つ場合のTreeView連携。

## Maintainer entry points

Maintainer entry points include both gem-packaged docs under `docs/**` and repository-only files at the repository root. The packaged docs are the public documentation shipped with the gem; the repository-only files are for maintainers, reviewers, and agents working from a checkout.

Maintainer entry points には、gem に同梱される `docs/**` と repository root の repository-only files が混在しています。packaged docs は gem と一緒に配布される公開ドキュメント、repository-only files は checkout で作業する maintainer、reviewer、agent 向けの入口です。

- [English documentation](en/README.md): full English docs map, reading order, and maintainer-facing entry points within the English tree.
- [日本語ドキュメント](ja/README.md): 日本語 docs tree の full map、reading order、maintainer-facing entry points。
- Repository-only Product Profile (`Product Profile.md` at the repository root): product positioning, source-of-truth order, host-app responsibility boundary, and non-goals for maintainers and reviewers. This file is not packaged in the gem and is not a host-app API guide; read it from a repository checkout before judging scope or docs sync.
- Repository-only agent workflow (`AGENTS.md` at the repository root): repository-specific workflow, first-read order, documentation update rules, and CI shortcut policy for maintainers and agents. This file is not packaged in the gem and is not user-facing integration guidance; read it from a repository checkout before changing maintainer workflow or docs policy.
- [Documentation maintenance checklist](i18n-audit.md): language-sync rules, technical-asset inventory, and cross-language update coverage.
- [Public API](en/public-api.md) / [公開 API](ja/public-api.md): compatibility contract and the surfaces host apps may use directly.
- [Public Setup Surface](en/public-setup-surface.md) / [Public Setup Surface](ja/public-setup-surface.md): generator name, optional owner argument, and generated destination path contract for persisted-state setup.
- [Migration guide](en/migration.md) / [移行ガイド](ja/migration.md): upgrade expectations, deprecations, and release-note reading order.
- [Design policy](en/design-policy.md) / [設計思想と責務範囲](ja/design-policy.md): repository scope, responsibility boundaries, and non-goals.
- [Demo application boundary](en/demo-application-boundary.md) / [Demo application boundary](ja/demo-application-boundary.md): handoff policy between static gem mockups and a future public Rails demo application.
- [Development](en/development.md) / [開発・保守方針](ja/development.md): CI, local checks, documentation update workflow, and maintenance habits.
- [Dependabot maintainer policy](en/dependabot-policy.md) / [Dependabot maintainer policy](ja/dependabot-policy.md): current Bundler and GitHub Actions Dependabot lanes, queue-size boundary, and triage scope without changing dependency policy.
- [JavaScript CI cache boundary](en/javascript-ci-cache-boundary.md) / [JavaScript CI cache boundary](ja/javascript-ci-cache-boundary.md): `actions/setup-node` npm cache scope, `npm ci`, and package-lock source-of-truth guidance.
- [CI policy suite](en/ci-policy-suite.md) / [CI policy suite](ja/ci-policy-suite.md): targeted CI policy guard runs, suite self-test behavior, and guard registration expectations.
- [Dependabot Bundler recovery](en/dependabot-bundler-recovery.md) / [Dependabot Bundler 復旧手順](ja/dependabot-bundler-recovery.md): lockfile metadata drift triage and scoped recovery paths for Bundler dependency PRs.
- [Code quality](en/code-quality.md) / [コード品質](ja/code-quality.md): lint, tests, error message quality, and documentation quality policy.
- [Release checklist](en/release.md) / [リリースチェックリスト](ja/release.md): release workflow, CI and package verification, and changelog expectations.
- [Release note candidate collector](en/release-note-candidates.md) / [Release note candidate collector](ja/release-note-candidates.md): maintainer review aid for collecting merged PR and closed Issue candidates without replacing `CHANGELOG.md` or release notes decisions.
- [CHANGELOG.md](../CHANGELOG.md): release-facing summary of shipped public changes, compatibility notes, and notable documentation additions.

## Maintenance

Documentation language-sync rules and ongoing maintenance checks are tracked in [Documentation maintenance checklist](i18n-audit.md).

ドキュメントの日英同期ルールと継続的な保守チェックは [Documentation maintenance checklist](i18n-audit.md) で管理します。

## Policy

- `docs/ja/` is the Japanese documentation tree and is the primary canonical source while Japanese coverage is more complete.
- `docs/en/` is the English documentation tree.
- Root-level docs should stay limited to intentional entry points, maintenance notes, and technical assets.
- New or substantially updated user-facing docs should be added under both `docs/ja/` and `docs/en/` when practical.

## 方針

- `docs/ja/` は日本語ドキュメントです。日本語側の内容がより充実している間は、主なcanonical sourceとして扱います。
- `docs/en/` は英語ドキュメントです。
- root直下のdocsは、意図した入口、保守メモ、technical asset に限定します。
- 利用者向けdocsを新規追加または大きく更新する場合は、可能な限り `docs/ja/` と `docs/en/` の両方に追加します。
