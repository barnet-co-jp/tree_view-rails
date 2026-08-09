# tree_view

`tree_view` is a Rails gem for rendering parent-child records as tree-style UIs.

It provides reusable tree objects, render state, helpers, partials, and browser integration hooks while leaving application-specific CRUD, authorization, and business actions to the host Rails app.

日本語の説明、導入手順、API仕様は [日本語ドキュメント](docs/ja/README.md) を参照してください。

## Is this gem for you?

Use TreeView when you want Rails-friendly primitives for rendering tree or tree-table interfaces, not a complete file-manager application. It is a good fit when the host app owns the records, queries, routes, authorization, and business behavior, while TreeView handles reusable rendering and interaction hooks.

TreeView is useful for:

- Rails-friendly tree and table rendering
- accessibility-oriented row semantics for table-first tree UIs
- Turbo and Stimulus integration points
- expandable rows
- checkbox selection hooks
- lazy-loading hooks
- drag/drop hooks
- host-app-controlled queries and business behavior

TreeView does not provide:

- a complete file-manager application
- CRUD screens
- authorization policies
- product-specific context menus or bulk actions
- server-side pagination algorithms
- a full virtual scrolling engine

For very large trees, combine TreeView's render controls with host-app loading and paging strategies. Start with [Render Scale](docs/en/render-scale.md) and [Rendering Boundaries](docs/en/rendering-boundaries.md), then add [Lazy Loading](docs/en/lazy-loading.md), [Children Pagination](docs/en/children-pagination.md), or custom virtual scrolling owned by the host app when your UI needs it.

## FAQ

For short answers about responsibility boundaries and common misunderstandings, see:

- [English FAQ](docs/en/faq.md)
- [日本語FAQ](docs/ja/faq.md)

If you already know the symptom and want a faster reverse-lookup entry point, see:

- [English Troubleshooting](docs/en/troubleshooting.md)
- [日本語Troubleshooting](docs/ja/troubleshooting.md)

If you want static visual references for baseline DOM structure and interaction states before wiring a host app, choose the mockup entry point that matches your first review task:

- Start with [review-gallery.html](docs/mockups/review-gallery.html) when you want the fastest overview across focused static pages.
- Open [default-tree.html](docs/mockups/default-tree.html) when you want the baseline DOM structure and shared CSS reference directly.
- Use [TreeView mockups](docs/mockups/README.md) when you want the maintained mockup index and each page's role.

![Static TreeView mockup showing expanded and collapsed hierarchy rows with selection checkboxes, badges, and row actions.](docs/mockups/assets/readme-default-tree.svg)

The image above is a single orientation asset derived from the `default-tree.html` baseline rows. Use the linked mockups for full static review paths and focused state comparisons.

For no-root-items or no-results empty-state styling hooks, see [Accessibility Semantics](docs/en/accessibility-semantics.md#empty-state-and-hidden-count-hooks) / [日本語](docs/ja/accessibility-semantics.md) and the focused [empty-state.html](docs/mockups/empty-state.html) mockup. TreeView exposes reusable wrapper hooks for styling; final empty copy, CTAs, and filter-reset behavior stay in the host app.

For the boundary between static mockups and a future real Rails demo app, see [Demo application boundary](docs/en/demo-application-boundary.md) / [日本語](docs/ja/demo-application-boundary.md). The public docs intentionally avoid direct demo repository links until a demo repository is public.

## Features

- Build trees from parent-child records.
- Build generated folder trees from path-like record values with `PathTreeBuilder`.
- Count descendants.
- Sort root and child items.
- Render static tree rows.
- Protect table-first accessibility semantics with documented ARIA placement for level, expansion, selection, and current-row state.
- Suppress TreeView partial render noise by default with configurable render log silencing.
- Integrate Turbo Stream expand/collapse actions through path builders.
- Expand/collapse small to medium trees in the browser with client-side toggle mode.
- Use `GraphAdapter` for heterogeneous or graph-like nodes.
- Use `PathTree` for matched nodes with ancestor paths.
- Use `ReverseTree` for child-to-parent paths.
- Render rows from `TreeView::RenderState` with `tree_view_rows`.
- Build a resource-table-oriented render state with `TreeView::ResourceTableRenderState` when another table layer owns columns and table state.
- Flatten currently visible rows with `TreeView::VisibleRows`.
- Render currently visible rows by offset and limit with `TreeView::RenderWindow` and windowed rendering. This limits HTML output only; it does not reduce host-app queries or fetched records.
- Customize host-app row content through `row_partial`.
- Render host-app row action slots through `row_actions_partial` while action availability, routes, authorization, and final copy stay in the host app.
- Customize transfer payload data through `row_event_payload_builder` while drag/drop business behavior stays in the host app.
- Control initial expansion with `initial_state`, `expanded_keys`, `collapsed_keys`, and `max_initial_depth`.
- Limit render scope with `max_render_depth` and `max_leaf_distance`.
- Limit toggle scope with `max_toggle_depth_from_root` and `max_toggle_leaf_distance`.
- Customize row attributes with `row_class_builder` and `row_data_builder`.
- Add lazy loading hooks with `load_children_path_builder` and `RenderState#lazy_loading`.
- Add checkbox selection with JSON payloads, disabled states, selected keys, cascade, indeterminate state, and max-count limits.
- Persist, restore, clear, and prune expansion state through `TreeView::PersistedState`, `TreeView::StateStore`, and `rails g tree_view:state:install` while leaving retention policy to the host app.
- Register JavaScript controllers for state tracking, client-side toggling, selection, transfer payloads, and remote loading state.

## Out of scope

This gem focuses on tree rendering primitives. Host applications are responsible for:

- CRUD
- controllers, models, and forms
- authentication and authorization
- application-specific labels, routes, and actions
- Turbo Frame modals
- context menus
- business actions after checkbox selection, such as delete, move, or attach
- server-side children pagination query and cursor strategy
- data-fetching reductions beyond TreeView's lazy-loading hooks
- JavaScript control for infinite scroll or full virtual scroll
- demo data and seeds
- table column inference and saved table preferences unless a separate table layer provides them

## Installation

Minimum supported environment:

- Ruby 3.2 or later
- Rails 7.0 or later

When you are installing a published release, add the gem normally:

```ruby
gem "tree_view"
```

If you need unreleased `main` changes, use the GitHub source explicitly:

```ruby
gem "tree_view", git: "https://github.com/barnet-co-jp/tree_view-rails.git"
```

Then run `bundle install` as usual.

```bash
bundle install
```

Import the CSS:

```scss
@import "tree_view";
```

Add the importmap pin when needed:

```ruby
pin "tree_view", to: "tree_view/index.js"
```

Host apps that write tests or custom renderers against TreeView browser hooks can avoid raw event names, data attributes, and controller identifiers by using the package-root exports from `tree_view/index.js`, such as `TreeViewEventNames`, `TreeViewEventDetailKeys`, `TreeViewControllerEntries`, `TreeViewIntegrationHooks`, and documented data hook objects like `TreeViewRemoteStateDataHooks`, `TreeViewToolbarDataHooks`, `TreeViewTransferDataAttributes`, `TreeViewSelectionCheckboxHooks`, and `TreeViewEmptyStateHooks`. See the [Public API JavaScript surface](docs/en/public-api.md#javascript-surface) / [日本語](docs/ja/public-api.md#javascript-surface), the [JavaScript event contract](docs/en/js-events.md) / [日本語](docs/ja/js-events.md), and [Immutable JavaScript package-root exports](docs/en/public-api-immutable-exports.md) / [日本語](docs/ja/public-api-immutable-exports.md) for the immutable reference-constant boundary.

See [Installation](docs/en/installation.md) for details.

日本語の導入手順は [docs/ja/installation.md](docs/ja/installation.md) を参照してください。

## Quick Start

Controller:

```ruby
tree = TreeView::Tree.new(
  records: @projects,
  parent_id_method: :parent_project_id
)

@tree_ui = TreeView::UiConfigBuilder.new(
  context: view_context,
  node_prefix: "project"
).build_static

@render_state = TreeView::RenderState.new(
  tree: tree,
  root_items: tree.root_items,
  row_partial: "projects/tree_columns",
  ui_config: @tree_ui
)
```

View:

```erb
<table class="tree-view-table">
  <tbody>
    <%= tree_view_rows(@render_state) %>
  </tbody>
</table>
```

Row partial:

```erb
<!-- app/views/projects/_tree_columns.html.erb -->
<td><%= item.name %></td>
<td><%= item.owner_name %></td>
```

You can also render the `tree_view/tree_row` partial directly when needed.

TreeView silences its own helper-rendered partial logs at `:warn` by default to avoid noisy `Rendered tree_view/...` entries in the host app log. Change or disable this with `TreeView.configure { |config| config.render_log_level = :info }` or `nil`. See [Render log level](docs/en/render-log-level.md) / [日本語](docs/ja/render-log-level.md) for accepted values and the boundary with the host app's global Rails logger level.

See [Usage](docs/en/usage.md) for details.

日本語の使い方は [docs/ja/usage.md](docs/ja/usage.md) を参照してください。

## Documentation

Documentation is organized by language.

If you know the use case but are not sure which API or option to use, start with the [Decision guide](docs/en/decision-guide.md).

使いたい場面からAPIやoptionを選びたい場合は [API判断ガイド](docs/ja/decision-guide.md) を参照してください。

| Language | Entry point |
|---|---|
| English | [docs/en/README.md](docs/en/README.md) |
| 日本語 | [docs/ja/README.md](docs/ja/README.md) |

Key documents:

| Topic | English | 日本語 |
|---|---|---|
| Installation | [Installation](docs/en/installation.md) | [導入手順](docs/ja/installation.md) |
| Minimal usage | [Minimal usage](docs/en/minimal-usage.md) | [最小利用例](docs/ja/minimal-usage.md) |
| Usage | [Usage](docs/en/usage.md) | [使い方](docs/ja/usage.md) |
| Selection | [Selection](docs/en/selection.md) | [Selection](docs/ja/selection.md) |
| Toolbar helper (`tree_view_toolbar`) | [Toolbar helper](docs/en/toolbar.md) | [Toolbar helper](docs/ja/toolbar.md) |
| Breadcrumb helper (`tree_view_breadcrumb`) | [Breadcrumb helper](docs/en/breadcrumb.md) | [Breadcrumb helper](docs/ja/breadcrumb.md) |
| Depth labels and row status | [Depth Labels](docs/en/depth-labels.md) and [Row Status](docs/en/row-status.md) | [Depth Labels](docs/ja/depth-labels.md) and [Row Status](docs/ja/row-status.md) |
| Turbo Frame option | [Turbo Frame option](docs/en/turbo-frame.md) | [Turbo Frame オプション](docs/ja/turbo-frame.md) |
| Persisted State | [Persisted State](docs/en/persisted-state.md) | [Persisted State](docs/ja/persisted-state.md) |
| Localized names | [Localized names](docs/en/localized-names.md) | [ローカライズされた名前](docs/ja/localized-names.md) |
| NodePresenter row partial patterns | [NodePresenter row partial patterns](docs/en/node-presenter-row-partials.md) | [NodePresenter row partial パターン](docs/ja/node-presenter-row-partials.md) |
| Decision guide | [Decision guide](docs/en/decision-guide.md) | [API判断ガイド](docs/ja/decision-guide.md) |
| FAQ | [FAQ](docs/en/faq.md) | [FAQ](docs/ja/faq.md) |
| Troubleshooting | [Troubleshooting](docs/en/troubleshooting.md) | [Troubleshooting](docs/ja/troubleshooting.md) |
| Visual reference mockups | [TreeView mockups](docs/mockups/README.md), [review-gallery.html](docs/mockups/review-gallery.html), and [default-tree.html](docs/mockups/default-tree.html) | [TreeView mockups](docs/mockups/README.md), [review-gallery.html](docs/mockups/review-gallery.html), and [default-tree.html](docs/mockups/default-tree.html) |
| JavaScript event contract | [JavaScript event contract](docs/en/js-events.md) | [JavaScript イベント契約](docs/ja/js-events.md) |
| Accessibility semantics | [Accessibility Semantics](docs/en/accessibility-semantics.md) | [Accessibility Semantics](docs/ja/accessibility-semantics.md) |
| Cookbook | [Cookbook](docs/en/cookbook.md) | [Cookbook](docs/ja/cookbook.md) |
| Forms and editing rows | [Forms and editing rows](docs/en/form-editing.md) | [Form と編集行](docs/ja/form-editing.md) |
| Resource table bridge | [Resource table bridge](docs/en/resource-table-bridge.md) | [Resource table bridge](docs/ja/resource-table-bridge.md) |
| Drag and drop | [Drag and Drop](docs/en/drag-and-drop.md) | [Drag and Drop](docs/ja/drag-and-drop.md) |
| Children pagination | [Children Pagination](docs/en/children-pagination.md) | [Children Pagination](docs/ja/children-pagination.md) |
| Tree identity and diagnostics | [Node keys](docs/en/node-keys.md) and [Tree diagnostics](docs/en/tree-diagnostics.md) | [Node key 設計](docs/ja/node-keys.md) and [Tree diagnostics](docs/ja/tree-diagnostics.md) |
| Large tree rendering strategy | [Render Scale](docs/en/render-scale.md), [Lazy Loading](docs/en/lazy-loading.md), [Children Pagination](docs/en/children-pagination.md), [Windowed Rendering](docs/en/windowed-rendering.md), and [Render log level](docs/en/render-log-level.md) | [描画スケール](docs/ja/render-scale.md), [Lazy Loading](docs/ja/lazy-loading.md), [Children Pagination](docs/ja/children-pagination.md), [Windowed Rendering](docs/ja/windowed-rendering.md), [描画責務の境界](docs/ja/rendering-boundaries.md), and [render log レベル](docs/ja/render-log-level.md) |
| Styling and direction-aware boundary | [Direction-aware styling boundary](docs/en/direction-aware-styling.md) | [Direction-aware styling boundary](docs/ja/direction-aware-styling.md) |
| Packaged stylesheet state cues | [Styling state cues](docs/en/styling-state-cues.md) | [State cue のスタイリング](docs/ja/styling-state-cues.md) |
| API overview | [API overview](docs/en/api-overview.md) | [API概要](docs/ja/api-overview.md) |
| GraphAdapter | [GraphAdapter](docs/en/graph-adapter.md) | [GraphAdapter](docs/ja/graph-adapter.md) |
| API reference | [API reference](docs/en/api.md) | [API仕様](docs/ja/api.md) |
| Error hierarchy | [Error hierarchy](docs/en/errors.md) | [エラー階層](docs/ja/errors.md) |
| PathTreeBuilder | [PathTreeBuilder](docs/en/path-tree-builder.md) | [PathTreeBuilder](docs/ja/path-tree-builder.md) |
| ReverseTree | [ReverseTree](docs/en/reverse-tree.md) | [ReverseTree](docs/ja/reverse-tree.md) |
| Filtered Trees | [Filtered Trees](docs/en/filtered-trees.md) | [Filtered Trees](docs/ja/filtered-trees.md) |
| Public API compatibility policy | [Public API](docs/en/public-api.md) | [Public API](docs/ja/public-api.md) |
| Host app extension boundary | [Host App Extension Points](docs/en/host-app-extension-points.md) | [Host App 拡張ポイント](docs/ja/host-app-extension-points.md) |
| Migration and upgrade guide | [Migration guide](docs/en/migration.md) | [移行ガイド](docs/ja/migration.md) |
| Release checklist | [Release checklist](docs/en/release.md) | [Release checklist](docs/ja/release.md) |

Additional docs:

- [Documentation index](docs/README.md)
- [Visual reference mockups](docs/mockups/README.md)
- [Documentation maintenance checklist](docs/i18n-audit.md)
- [Product Profile](Product%20Profile.md)
- [Maintainer guide](AGENTS.md)
- [CHANGELOG.md](CHANGELOG.md)

## Development

```bash
bundle install
bundle exec standardrb
bundle exec rspec
bundle exec rake build
npm ci
npm run test:js
npm run test:entrypoints
npm run test:docs-entrypoints
npm run test:release-docs
npm run test:release-package-contents
npm run test:ci-policy
```

Use Node 22 for local JavaScript work. The repository root `.nvmrc` matches the CI JavaScript lane and is the source of truth for the recommended local Node major version.

`npm run test:js` runs the documented JavaScript pull-request checks together: entrypoint smoke (`npm run test:entrypoints`), Vitest (`npm test`), and Playwright browser smoke (`npm run test:browser`). Use the focused guard commands when you are narrowing maintenance failures: `npm run test:entrypoints` covers package-root exports, controller registrations, docs entrypoints, CI policy, and version-source guards; `npm run test:docs-entrypoints` covers README/docs/Public API/i18n signals without the broader JavaScript suite; `npm run test:release-docs` and `npm run test:release-package-contents` are narrow local release triage aliases for the `Release docs signals` and `Release package contents signals` docs-entrypoint groups, not replacements for the full `npm run test:docs-entrypoints`, `npm run test:entrypoints`, or CI-required suite; and `npm run test:ci-policy` covers changed-file routing, workflow detection, CI observation guidance, and lockfile drift. See the [English development guide](docs/en/development.md) and [日本語の開発・保守方針](docs/ja/development.md) for details.

Use `npm ci` for local JavaScript setup. The committed `package-lock.json` is the source of truth for repeatable installs, and CI/Docker setup use the same lockfile-backed install path.

## Support

Bug reports and feature requests are welcome on [GitHub Issues](https://github.com/barnet-co-jp/tree_view-rails/issues).
