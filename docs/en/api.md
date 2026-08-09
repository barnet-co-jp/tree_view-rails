# API reference

This page summarizes the main public APIs in TreeView.

For practical usage, see [Usage](usage.md). For examples, see [Cookbook](cookbook.md). For concepts, see [Glossary](glossary.md).

## TreeView configuration

Host apps configure TreeView-wide defaults with `TreeView.configure`.

```ruby
TreeView.configure do |config|
  config.initial_state = :collapsed
  config.render_log_level = :warn
end
```

| Option | Default | Description |
|---|---|---|
| `initial_state` | `:expanded` | Global default expansion state when a screen-level `RenderState` does not override it. |
| `render_log_level` | `:warn` | Logger silence threshold used while TreeView helper-rendered partials are rendered. Set `nil` to keep Rails' normal partial render logging. |

`render_log_level` accepts `:debug`, `:info`, `:warn`, `:error`, `:fatal`, `:unknown`, `nil`, or the corresponding Ruby `Logger` level constants. See [Render log level](render-log-level.md) for details.

## TreeView localized names

Helpers for resolving display names through ActiveModel / I18n when available:

| Helper | Description |
|---|---|
| `TreeView.model_name_for(item_or_class, count: 1, default: nil)` | Resolves model names through `model_name.human`, falling back to a humanized class name. |
| `TreeView.attribute_name_for(item_or_class, attribute, default: nil)` | Resolves attribute names through `human_attribute_name`, falling back to a humanized attribute name. |
| `TreeView.type_name_for(item, count: 1, default: nil)` | Resolves `node_type` through `tree_view.node_types.*`, falling back to a humanized node type or model name. |

See [Localized names](localized-names.md) for locale examples and NodePresenter usage.

## TreeView errors

TreeView validation and configuration failures use a public error hierarchy rooted at `TreeView::Error`.

`TreeView::Error` inherits from `ArgumentError` for compatibility with existing host apps that already rescue TreeView validation failures as `ArgumentError`.

| Error class | Description |
|---|---|
| `TreeView::Error` | Base class for documented TreeView validation and configuration failures. |
| `TreeView::ConfigurationError` | Invalid options, invalid mode combinations, invalid builders, or unsupported configuration values. |
| `TreeView::InvalidTreeError` | Tree data cannot be treated as a valid tree. |
| `TreeView::DuplicateNodeKeyError` | Duplicate node keys are detected. |
| `TreeView::CycleDetectedError` | A parent/child cycle is detected. |
| `TreeView::InvalidRenderWindowError` | A render window receives an invalid `offset` or `limit`. |

See [Error hierarchy](errors.md) for rescue examples and compatibility guidance.

## TreeView::Tree

The central object for treating parent-child data as a tree.

### Records mode

```ruby
tree = TreeView::Tree.new(
  records: items,
  parent_id_method: :parent_item_id,
  id_method: :id,
  sorter: ->(nodes, _tree) { nodes.sort_by(&:name) },
  orphan_strategy: :ignore
)
```

| Argument | Required | Description |
|---|---:|---|
| `records:` | yes | Records to turn into a tree. |
| `parent_id_method:` | yes | Method name that returns the parent ID. |
| `id_method:` | no | Method name that returns the item's ID. Default: `:id`. |
| `sorter:` | no | Callable that orders roots and children. |
| `orphan_strategy:` | no | How records whose parent is missing from the record set are handled. |
| `validate_node_keys:` | no | Whether duplicate node keys are checked during initialization. |

### Resolver mode

```ruby
tree = TreeView::Tree.new(
  roots: roots,
  children_resolver: ->(node) { node.children },
  node_key_resolver: ->(node) { TreeView.node_key(node.class.name, node.id) }
)
```

### Adapter mode

```ruby
adapter = TreeView::GraphAdapter.new(
  roots: roots,
  children_resolver: ->(node) { node.children },
  node_key_resolver: ->(node) { TreeView.node_key(node.class.name, node.id) }
)

tree = TreeView::Tree.new(adapter: adapter)
```

### Main methods

| Method | Description |
|---|---|
| `root_items(root_parent_id = nil)` | Returns root nodes. |
| `children_for(item)` | Returns children for the given node. |
| `parent_for(item)` | Returns the parent for the given node. Records mode only. |
| `ancestors_for(item)` | Returns ancestors from root to parent. Records mode only. |
| `path_for(item)` | Returns the path from root to the item. Records mode only. |
| `paths_for(items)` | Returns paths for multiple items. Records mode only. |
| `path_tree_for(items)` | Returns a `PathTree` that fills ancestors for the given items. |
| `reverse_tree_for(items)` | Returns a `ReverseTree` that walks from the given items toward roots. |
| `filtered_tree_for(items, mode:)` | Returns a filtered tree around matched items. |
| `descendant_counts` | Returns descendant counts by node key. |
| `node_key_for(item)` | Returns the key that identifies the node. |
| `sort_items(items)` | Sorts items with the configured sorter. |
| `orphan_items` | Returns records whose parent is missing from the record set. |
| `validate_unique_node_keys!` | Checks duplicate node keys. |

## TreeView::PathTree / ReverseTree

`path_tree_for(items)` builds a normal-direction tree: root -> parent -> matched item.

`reverse_tree_for(items)` builds a reverse-direction tree: matched item -> parent -> root.

| API | Direction | Use case |
|---|---|---|
| `path_tree_for(items)` | root -> parent -> matched item | Show search results inside the normal hierarchy. |
| `reverse_tree_for(items)` | matched item -> parent -> root | Start from child nodes and walk toward parents. |

## TreeView::PathTreeBuilder

`PathTreeBuilder` builds generated folder nodes and record nodes from path-like record values. Use it when records expose paths but the host app does not have folder records in its database.

```ruby
builder = TreeView::PathTreeBuilder.new(
  records: documents,
  path_resolver: ->(document) { document.source_relative_path },
  label_resolver: ->(document) { document.title },
  id_resolver: ->(document) { TreeView.node_key(:document, document.id) },
  sort: { folders_first: true }
)

render_state = TreeView::RenderState.new(
  tree: builder.tree,
  root_items: builder.root_items,
  row_partial: "documents/tree_columns",
  ui_config: tree_ui
)
```

| Argument | Required | Description |
|---|---:|---|
| `records:` | yes | Source records that expose path-like values. |
| `path_resolver:` | yes | Callable returning a string path or array of path segments. |
| `label_resolver:` | no | Callable returning the record node label. |
| `id_resolver:` | no | Callable returning the record node key. Use this for stable typed keys. |
| `sorter:` | no | Custom `TreeView::Tree`-style sorter. |
| `sort:` | no | Hash options for default sorting. Supports `folders_first:`. |
| `separator:` | no | Path separator for string paths. Default: `/`. |
| `folder_key_prefix:` | no | Prefix for generated folder keys. Default: `folder`. |
| `record_key_prefix:` | no | Prefix for default record keys. Default: `record`. |

The builder exposes `nodes`, `paths`, `tree`, `root_items`, `children_for(node)`, and `node_key_for(node)`. Folder nodes are `TreeView::PathTreeBuilder::FolderNode`; record nodes are `TreeView::PathTreeBuilder::RecordNode` and keep the original record in `record`.

See [PathTreeBuilder](path-tree-builder.md) for examples and responsibility boundaries.

## TreeView::FilteredTree

A wrapper for rendering search or filter results as a tree.

```ruby
filtered_tree = tree.filtered_tree_for(matched_items, mode: :with_ancestors)
```

| mode | Description |
|---|---|
| `:matched_only` | Include matched nodes only. |
| `:with_ancestors` | Include matched nodes and ancestors. |
| `:with_descendants` | Include matched nodes and descendants. |
| `:with_ancestors_and_descendants` | Include matched nodes, ancestors, and descendants. |

## TreeView::VisibleRows

Returns the currently visible rows from a `RenderState` as a flat array.

```ruby
visible_rows = TreeView::VisibleRows.new(
  tree: tree,
  root_items: tree.root_items,
  render_state: render_state
).to_a
```

Each row exposes values such as:

| Attribute | Description |
|---|---|
| `item` | Original node. |
| `depth` | Root-based depth. |
| `node_key` | Value from `tree.node_key_for(item)`. |
| `parent_key` | Parent row's node key. `nil` for roots. |
| `has_children?` | Whether the node has children. |
| `expanded?` | Whether the node is expanded in the current state. |

## TreeView::RenderWindow

Slices `VisibleRows` by `offset` and `limit`.

```ruby
window = TreeView::RenderWindow.new(
  rows: visible_rows,
  offset: 0,
  limit: 50
)
```

| API | Description |
|---|---|
| `rows` | Rows inside the window. |
| `offset` | Start offset. |
| `limit` | Maximum count. |
| `total_count` | Count before windowing. |
| `has_previous?` | Whether a previous window exists. |
| `has_next?` | Whether a next window exists. |

## TreeView::ResourceTableRenderState

Builds a `TreeView::RenderState` for table-oriented screens where another layer already owns column definitions or table state.

```ruby
render_state = TreeView::ResourceTableRenderState.call(
  records: @projects,
  context: view_context,
  table_key: "projects_tree",
  parent_id_method: :parent_project_id,
  table_state: table_state,
  columns: columns
)
```

| Argument | Required | Description |
|---|---:|---|
| `records:` | yes | Records to turn into a tree-backed table body. |
| `context:` | yes | View context used to build the default `UiConfig` when `ui_config:` is not provided. |
| `row_partial:` | no | Row partial used for business columns. Default: `tree_view/resource_table_row`. |
| `parent_id_method:` | no | Method name that returns the parent ID. Default: `:parent_id`. |
| `id_method:` | no | Method name that returns the item ID. Default: `:id`. |
| `table_key:` | no | Stable table key used for DOM/data hooks and as the default node prefix. |
| `columns:` | no | Column definitions supplied by the host app or table layer. |
| `table_state:` | no | Table state supplied by the host app or table layer. |
| `ui_config:` | no | Prebuilt `TreeView::UiConfig` when the host app needs custom modes or path builders. |
| `**render_options` | no | Additional `TreeView::RenderState` options such as selection, lazy loading, row status, or render scope. |

The default row partial reads `table_state["visible_columns"]`, then `table_state[:visible_columns]`, and then falls back to `columns`. TreeView owns hierarchy, visible row order, render state, and row hooks; column inference, saved table preferences, filters, sorts, and table-wide state remain owned by the host app or table layer.

See [Resource table bridge](resource-table-bridge.md) for integration examples and responsibility boundaries.

## TreeView::RenderState

Screen-level rendering state.

```ruby
render_state = TreeView::RenderState.new(
  tree: tree,
  root_items: tree.root_items,
  row_partial: "documents/tree_columns",
  ui_config: tree_ui,
  initial_expansion: {
    default: :collapsed,
    max_depth: 2,
    expanded_keys: expanded_keys
  },
  render_scope: {
    max_depth: 3,
    max_leaf_distance: 2
  },
  selection: {
    enabled: true,
    visibility: :leaves
  }
)
```

| Argument | Required | Description |
|---|---:|---|
| `tree:` | yes | `TreeView::Tree`-compatible object. |
| `root_items:` | yes | Root nodes to render. |
| `row_partial:` | yes | Host app partial for business columns. |
| `ui_config:` | yes | `TreeView::UiConfig`. |
| `initial_state:` | no | `:expanded` or `:collapsed`. |
| `expanded_keys:` | no | Tree-side node keys to expand. These must match `tree.node_key_for(item)`, not UI-only DOM IDs. |
| `collapsed_keys:` | no | Tree-side node keys to collapse. These must match `tree.node_key_for(item)`, not UI-only DOM IDs. |
| `current_item:` | no | Current node object. Used for row-state decisions and as the source item when ancestor auto-expansion is enabled. |
| `current_key:` | no | Current node key when the host app only has an identifier. TreeView resolves the matching node under `root_items` before ancestor auto-expansion. |
| `auto_expand_ancestors:` | no | Boolean that merges the current node's ancestor keys into `expanded_keys`. Requires `current_item` or a `current_key` that resolves to a node under `root_items`. |
| `initial_expansion:` | no | Grouped initial expansion settings. Supported keys are `default`, `max_depth`, `expanded_keys`, `collapsed_keys`, `current_item`, `current_key`, and `auto_expand_ancestors`. |
| `render_scope:` | no | Grouped render scope settings. |
| `toggle_scope:` | no | Grouped toggle scope settings. |
| `selection:` | no | Grouped checkbox selection settings. |
| `lazy_loading:` | no | Grouped lazy loading settings. |
| `row_class_builder:` | no | Callable that returns row CSS classes. |
| `row_data_builder:` | no | Callable that returns row data attributes. |
| `badge_builder:` | no | Callable that returns a row badge or marker value. |
| `icon_builder:` | no | Compatibility alias for row badge or marker display; prefer `badge_builder` in new code. |
| `depth_label_builder:` | no | Callable that returns a depth label. |
| `toggle_icons:` | no | Declarative map for toggle control icons. Supports `by_state`, `by_depth`, and `by_type`; see [Toggle icon customization](toggle-icons.md). |
| `toggle_icon_builder:` | no | Callable that returns toggle control content. Takes precedence over `toggle_icons:` when both are supplied. |
| `row_status_builder:` | no | Callable that returns row state. |
| `row_event_payload_builder:` | no | Callable that returns drag/drop transfer payloads. This is transfer-specific, not a generic row event hook. |
| `persisted_state:` | no | Saved expansion state. |
| `empty_message:` | no | String shown when root items are empty. Host app owns final copy and CTA. |
| `hidden_message_builder:` | no | Callable returning a message for hidden descendants. Receives the hidden count. Must respond to `call`. |
| `state_messages:` | no | Grouped state message settings. Supported keys are `empty` and `hidden_builder`. Flat options take priority when both are supplied. |

When both flat keyword options and `initial_expansion:` are supplied, the flat keyword options win. `auto_expand_ancestors:` only opens the current node's path; keep using `expanded_keys:` when sibling branches or additional paths should also start open. For a practical example, see [Cookbook: Expand only the current branch initially](cookbook.md#expand-only-the-current-branch-initially).

For focused naming decisions, see [Public Name Decisions](public-name-decisions.md). For ARIA placement, see [Accessibility Semantics](accessibility-semantics.md). For identifier design, see [Node keys](node-keys.md).

### Documented grouped option keys

The exact machine-readable grouped-option contract for `TreeView::RenderState` lives in `config/public_api_manifest.yml`, and `spec/public_api_compatibility_spec.rb` checks that manifest against the current constants and representative behavior.

| Grouped option | Supported keys | Notes |
|---|---|---|
| `initial_expansion:` | `default`, `max_depth`, `expanded_keys`, `collapsed_keys`, `current_item`, `current_key`, `auto_expand_ancestors` | Equivalent flat keyword options still take priority when both forms are supplied. |
| `render_scope:` | `max_depth`, `max_leaf_distance` | Use these grouped keys for the same render-depth and leaf-distance controls documented for `TreeView::RenderState`. |
| `toggle_scope:` | `max_depth_from_root`, `max_leaf_distance` | Use these grouped keys for the same toggle-depth and toggle leaf-distance controls documented for `TreeView::RenderState`. |
| `selection:` | `enabled`, `visibility`, `payload_builder`, `checkbox_name`, `disabled_builder`, `disabled_reason_builder`, `selected_keys`, `cascade`, `indeterminate`, `max_count` | Mirrors the documented `TreeView::RenderState::SelectionConfig` keys. See [Selection](selection.md) for behavior and host-app responsibilities. |
| `lazy_loading:` | `enabled`, `loaded_keys`, `scope` | Mirrors the documented lazy-loading row-state hooks and optional host-app scope passthrough. See [Lazy Loading](lazy-loading.md). |
| `row_status:` | `row_disabled_builder`, `row_readonly_builder`, `row_disabled_reason_builder` | Mirrors the documented row disabled / readonly state hooks and disabled-reason surface. |
| `state_messages:` | `empty`, `hidden_builder` | Grouped empty and hidden message settings. `empty` maps to `empty_message:` and `hidden_builder` maps to `hidden_message_builder:`. Flat options take priority. |

## TreeView::UiConfig / UiConfigBuilder

Configuration for DOM IDs, toggle mode, path builders, and optional Turbo Frame targeting.

| Builder | Mode | Description |
|---|---|---|
| `build_turbo(...)` | `:turbo` | Builds Turbo Stream expand/collapse URLs with host-app path builders. Accepts `turbo_frame:` to add `data-turbo-frame` to toggle links. |
| `build(...)` | `:turbo` | Backward-compatible alias for `build_turbo`. Accepts the same `turbo_frame:` option. |
| `build_static` | `:static` | Builds a static snapshot config with no expand/collapse URLs. |
| `build_client_side` | `:client` | Builds a browser-local expand/collapse config with no Turbo endpoints. |

`UiConfig#mode` returns `:turbo`, `:static`, or `:client`. `UiConfig#turbo_frame` returns the configured frame target or `nil`. Convenience predicates `turbo?`, `static?`, and `client?` are available.

### Static

```ruby
tree_ui = TreeView::UiConfigBuilder.new(
  context: view_context,
  node_prefix: "document"
).build_static
```

### Turbo

```ruby
tree_ui = TreeView::UiConfigBuilder.new(
  context: view_context,
  node_prefix: "document"
).build_turbo(
  hide_descendants_path_builder: ->(item, depth, scope) { hide_document_path(item, depth: depth, scope: scope) },
  show_descendants_path_builder: ->(item, depth, scope) { show_document_path(item, depth: depth, scope: scope) },
  load_children_path_builder: ->(item, depth, scope) { children_document_path(item, depth: depth, scope: scope) },
  toggle_all_path_builder: ->(state) { documents_path(state: state) },
  turbo_frame: "documents_tree"
)
```

When `turbo_frame:` is set, TreeView adds `data-turbo-frame` to Turbo toggle links. See [Turbo Frame option](turbo-frame.md) for scope and host-app responsibilities.

### Client-side

```ruby
tree_ui = TreeView::UiConfigBuilder.new(
  context: view_context,
  node_prefix: "document"
).build_client_side
```

Client-side mode renders collapsed descendants inside the render scope into the initial HTML with `hidden`, then uses the bundled `tree-view-client` controller to toggle row visibility in the browser. It is intended for small to medium trees where initial HTML volume is acceptable.

## TreeView::PersistedState / StateStore

APIs for saving, restoring, and clearing expansion state through the generated host app model.

```ruby
store = TreeView::StateStore.new(model: TreeViewState)

persisted_state = store.find(
  owner: current_user,
  tree_instance_key: "documents:index"
)

store.save!(
  owner: current_user,
  tree_instance_key: "documents:index",
  expanded_keys: expanded_keys
)

store.clear!(
  owner: current_user,
  tree_instance_key: "documents:index"
)
```

`clear!` deletes the matching saved expansion-state record when one exists. When no record exists, it still returns an empty `TreeView::PersistedState` for the requested owner and `tree_instance_key`. See [Persisted State](persisted-state.md#statestore) for reset-route and authorization responsibilities.

## Helpers

| Helper | Description |
|---|---|
| `tree_view_rows(render_state, window: nil)` | Renders TreeView rows. |
| `tree_view_window(render_state, offset:, limit:)` | Returns windowing metadata. |
| `tree_node_dom_id(item_or_id, ui: @tree_ui)` | Builds a node DOM ID through the resolved `UiConfig`. |
| `tree_children_container_dom_id(item_or_id, ui: @tree_ui)` | Builds the children container DOM ID used by lazy-loading placeholder regions and Turbo Stream replacements. |
| `tree_remote_state_placeholder_dom_id(item_or_id, ui: @tree_ui)` | Builds the remote-state placeholder DOM ID for a lazy-loaded row. |
| `tree_remote_state_placeholder_attributes(item_or_id, state: nil, ui: @tree_ui)` | Returns the documented data attributes for the remote-state placeholder element. |
| `tree_selection_value(item, tree, builder = nil)` | Builds the JSON checkbox value from the default or custom selection payload builder. |
| `tree_view_breadcrumb(tree, item, ...)` | Renders breadcrumbs. |
| `tree_view_toolbar(render_state, actions: ..., labels: ..., class_name: ..., button_class_name: ...)` | Renders TreeView's bundled toolbar markup. |
| `tree_view_toolbar_supported_actions` | Returns the documented toolbar action keys TreeView can validate and describe. |
| `tree_view_toolbar_actions(render_state, actions: ..., labels: {})` | Returns toolbar action hashes so the host app can render its own markup. |
| `tree_view_toolbar_action_metadata(render_state, action, label: nil)` | Returns metadata for one supported toolbar action. |

Use the remote-state placeholder helpers with the lazy-loading placeholder and Turbo Stream patterns in [Lazy Loading](lazy-loading.md). Use the toolbar helper family with the supported action and metadata boundary in [Toolbar helper](toolbar.md).

The public helper compatibility contract follows the documented helper-method set in `config/public_api_manifest.yml`. Internal helper plumbing used by bundled partials is intentionally omitted from this table.

### Toolbar helpers

Use `tree_view_toolbar` when TreeView's default toolbar markup is enough.

Use `tree_view_toolbar_actions` or `tree_view_toolbar_action_metadata` when the host app owns the final HTML, classes, icons, or authorization rules and only wants TreeView to provide the supported action metadata.

Each action metadata hash includes:

- `:action`
- `:state`
- `:label`
- `:path`
- `:disabled`
- `:data`

Supported toolbar actions are:

| Action | Requested tree-wide state | Notes |
|---|---|---|
| `:expand_all` | `:expanded` | Uses the host app's `toggle_all_path_builder` for the expanded state. |
| `:collapse_all` | `:collapsed` | Uses the host app's `toggle_all_path_builder` for the collapsed state. |
| `:collapse_all_except_current_path` | `:current_path` | Uses the host app's `toggle_all_path_builder` for the current-path state. |

When the current UI mode does not expose `toggle_all_path_builder`, toolbar metadata returns `path: nil` and `disabled: true`. TreeView still documents the action/state pair, but fallback UI and messaging remain the host app's responsibility.

The internal constants that back these helpers are not public API. Depend on the documented helper methods and returned metadata shape instead of referencing those constants directly.

## JavaScript entrypoint

```js
import { registerTreeViewControllers } from "tree_view"

registerTreeViewControllers(application)
```

Main controllers:

- `tree-view-state`
- `tree-view-client`
- `tree-view-selection`
- `tree-view-transfer`
- `tree-view-remote-state`

## Related docs

- [API overview](api-overview.md)
- [Usage](usage.md)
- [Turbo Frame option](turbo-frame.md)
- [Cookbook](cookbook.md)
- [PathTreeBuilder](path-tree-builder.md)
- [Accessibility Semantics](accessibility-semantics.md)
- [Error hierarchy](errors.md)
- [Render log level](render-log-level.md)
- [Node keys](node-keys.md)
- [Persisted State](persisted-state.md)
- [Tree diagnostics](tree-diagnostics.md)
- [Public API policy](public-api.md)
