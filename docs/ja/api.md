# API仕様

このページでは、TreeView の主要な公開 API を日本語で整理します。

詳細な使い方は [使い方](usage.md)、具体例は [Cookbook](cookbook.md)、概念は [用語集](glossary.md) も参照してください。

## TreeView configuration

host app は `TreeView.configure` で TreeView 全体の既定値を設定できます。

```ruby
TreeView.configure do |config|
  config.initial_state = :collapsed
  config.render_log_level = :warn
end
```

| option | 既定値 | 説明 |
|---|---|---|
| `initial_state` | `:expanded` | 画面単位の `RenderState` が上書きしない場合のグローバルな初期展開状態。 |
| `render_log_level` | `:warn` | TreeView helper 経由の partial render 中に使う logger silence 閾値。`nil` にすると Rails 標準の partial render log をそのまま出します。 |

`render_log_level` は `:debug`, `:info`, `:warn`, `:error`, `:fatal`, `:unknown`, `nil`、または対応する Ruby `Logger` level constant を受け付けます。詳細は [render log level](render-log-level.md) を参照してください。

## TreeView localized names

利用可能な場合に ActiveModel / I18n 経由で表示名を解決する helper です。

| Helper | 説明 |
|---|---|
| `TreeView.model_name_for(item_or_class, count: 1, default: nil)` | `model_name.human` 経由で model 名を解決し、使えない場合は class 名を humanize します。 |
| `TreeView.attribute_name_for(item_or_class, attribute, default: nil)` | `human_attribute_name` 経由で attribute 名を解決し、使えない場合は attribute 名を humanize します。 |
| `TreeView.type_name_for(item, count: 1, default: nil)` | `node_type` を `tree_view.node_types.*` 経由で解決し、使えない場合は node type または model 名を humanize します。 |

locale 例と NodePresenter での利用例は [Localized names](localized-names.md) を参照してください。

## TreeView errors

TreeView の validation / configuration failure は、`TreeView::Error` を基底とする公開 error hierarchy を使います。

`TreeView::Error` は、既存 host app が TreeView の validation failure を `ArgumentError` として rescue している場合の互換性を保つため、`ArgumentError` を継承します。

| Error class | 説明 |
|---|---|
| `TreeView::Error` | documented された TreeView validation / configuration failure の基底 class。 |
| `TreeView::ConfigurationError` | 不正な option、不正な mode 組み合わせ、不正な builder、未対応の configuration value。 |
| `TreeView::InvalidTreeError` | tree data を有効な tree として扱えない場合。 |
| `TreeView::DuplicateNodeKeyError` | node key の重複が検出された場合。 |
| `TreeView::CycleDetectedError` | parent / child cycle が検出された場合。 |
| `TreeView::InvalidRenderWindowError` | render window に不正な `offset` または `limit` が渡された場合。 |

rescue 例と互換性方針は [Error hierarchy](errors.md) を参照してください。

## TreeView::Tree

親子データを tree として扱う中心オブジェクトです。

### records mode

```ruby
tree = TreeView::Tree.new(
  records: items,
  parent_id_method: :parent_item_id,
  id_method: :id,
  sorter: ->(nodes, _tree) { nodes.sort_by(&:name) },
  orphan_strategy: :ignore
)
```

| 引数 | 必須 | 説明 |
|---|---:|---|
| `records:` | yes | tree 化する records。 |
| `parent_id_method:` | yes | 親 ID を返す method 名。 |
| `id_method:` | no | 自身の ID を返す method 名。既定値は `:id`。 |
| `sorter:` | no | root / children の並び順を決める callable。 |
| `orphan_strategy:` | no | 親 record が records 内に存在しない node の扱い。 |
| `validate_node_keys:` | no | 初期化時に node_key 重複を検出するか。 |

### resolver mode

```ruby
tree = TreeView::Tree.new(
  roots: roots,
  children_resolver: ->(node) { node.children },
  node_key_resolver: ->(node) { TreeView.node_key(node.class.name, node.id) }
)
```

### adapter mode

```ruby
adapter = TreeView::GraphAdapter.new(
  roots: roots,
  children_resolver: ->(node) { node.children },
  node_key_resolver: ->(node) { TreeView.node_key(node.class.name, node.id) }
)

tree = TreeView::Tree.new(adapter: adapter)
```

### 主なメソッド

| メソッド | 説明 |
|---|---|
| `root_items(root_parent_id = nil)` | root node を返す。 |
| `children_for(item)` | 指定 node の children を返す。 |
| `parent_for(item)` | 指定 node の親を返す。records mode のみ。 |
| `ancestors_for(item)` | root 側から親までの祖先配列を返す。records mode のみ。 |
| `path_for(item)` | root 側から指定 node までの path 配列を返す。records mode のみ。 |
| `paths_for(items)` | 複数 node の path 配列を返す。records mode のみ。 |
| `path_tree_for(items)` | 指定 items までの親階層を補完した `PathTree` を返す。 |
| `reverse_tree_for(items)` | 指定 items から親方向へ辿る `ReverseTree` を返す。 |
| `filtered_tree_for(items, mode:)` | match 周辺 node を含む filtered tree を返す。 |
| `descendant_counts` | node_key ごとの子孫数を返す。 |
| `node_key_for(item)` | node を識別する key を返す。 |
| `sort_items(items)` | sorter に従って items を並べ替える。 |
| `orphan_items` | records 内に親が存在しない node を返す。 |
| `validate_unique_node_keys!` | node_key 重複を検出する。 |

## TreeView::PathTree / ReverseTree

`path_tree_for(items)` は root -> parent -> matched item の通常向き tree を作ります。

`reverse_tree_for(items)` は matched item -> parent -> root の逆向き tree を作ります。

| API | 表示方向 | 主な用途 |
|---|---|---|
| `path_tree_for(items)` | root -> parent -> matched item | 検索結果を通常階層の中で見せる。 |
| `reverse_tree_for(items)` | matched item -> parent -> root | 子 node 一覧から親方向へ辿る。 |

## TreeView::PathTreeBuilder

`PathTreeBuilder` は、path らしい値を持つ records から生成 folder node と record node で構成された tree を作ります。database 上に folder record を持たず、record 側に path だけがある場合に使います。

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

| 引数 | 必須 | 説明 |
|---|---:|---|
| `records:` | yes | path らしい値を持つ source records。 |
| `path_resolver:` | yes | 文字列 path または path segment 配列を返す callable。 |
| `label_resolver:` | no | record node label を返す callable。 |
| `id_resolver:` | no | record node key を返す callable。安定した typed key を使う場合に指定します。 |
| `sorter:` | no | 独自の `TreeView::Tree` 形式 sorter。 |
| `sort:` | no | default sort 用 option。`folders_first:` をサポートします。 |
| `separator:` | no | 文字列 path 用 separator。既定値は `/`。 |
| `folder_key_prefix:` | no | 生成 folder key の prefix。既定値は `folder`。 |
| `record_key_prefix:` | no | 既定 record key の prefix。既定値は `record`。 |

builder は `nodes`, `paths`, `tree`, `root_items`, `children_for(node)`, `node_key_for(node)` を公開します。folder node は `TreeView::PathTreeBuilder::FolderNode`、record node は `TreeView::PathTreeBuilder::RecordNode` で、元 record を `record` に保持します。

具体例と責務境界は [PathTreeBuilder](path-tree-builder.md) を参照してください。

## TreeView::FilteredTree

検索や絞り込み結果を tree として表示するための wrapper です。

```ruby
filtered_tree = tree.filtered_tree_for(matched_items, mode: :with_ancestors)
```

| mode | 説明 |
|---|---|
| `:matched_only` | match した node だけを含める。 |
| `:with_ancestors` | match した node と祖先を含める。 |
| `:with_descendants` | match した node と子孫を含める。 |
| `:with_ancestors_and_descendants` | match、祖先、子孫を含める。 |

## TreeView::VisibleRows

現在の `RenderState` に基づく表示対象行を一次元配列として取得します。

```ruby
visible_rows = TreeView::VisibleRows.new(
  tree: tree,
  root_items: tree.root_items,
  render_state: render_state
).to_a
```

各 row は概ね以下を持ちます。

| 属性 | 説明 |
|---|---|
| `item` | 元の node。 |
| `depth` | root 基準 depth。 |
| `node_key` | `tree.node_key_for(item)` の値。 |
| `parent_key` | 親 row の node_key。root は `nil`。 |
| `has_children?` | child を持つか。 |
| `expanded?` | 現在の状態で展開扱いか。 |

## TreeView::RenderWindow

`VisibleRows` を `offset` / `limit` で切り出す windowing helper です。

```ruby
window = TreeView::RenderWindow.new(
  rows: visible_rows,
  offset: 0,
  limit: 50
)
```

| API | 説明 |
|---|---|
| `rows` | window 内の rows。 |
| `offset` | 開始位置。 |
| `limit` | 最大件数。 |
| `total_count` | window 前の件数。 |
| `has_previous?` | 前 window があるか。 |
| `has_next?` | 次 window があるか。 |

## TreeView::ResourceTableRenderState

別 layer が column definitions や table state を持つ table-oriented screen 向けに、`TreeView::RenderState` を組み立てる bridge API です。

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

| 引数 | 必須 | 説明 |
|---|---:|---|
| `records:` | yes | tree-backed table body にする records。 |
| `context:` | yes | `ui_config:` を指定しない場合に default `UiConfig` を作るための view context。 |
| `row_partial:` | no | business columns を描画する row partial。既定値は `tree_view/resource_table_row`。 |
| `parent_id_method:` | no | 親 ID を返す method 名。既定値は `:parent_id`。 |
| `id_method:` | no | 自身の ID を返す method 名。既定値は `:id`。 |
| `table_key:` | no | DOM / data hook と default node prefix に使う安定した table key。 |
| `columns:` | no | host app または table layer が渡す column definitions。 |
| `table_state:` | no | host app または table layer が渡す table state。 |
| `ui_config:` | no | host app が custom mode や path builder を必要とする場合の prebuilt `TreeView::UiConfig`。 |
| `**render_options` | no | selection、lazy loading、row status、render scope など追加の `TreeView::RenderState` options。 |

既定の row partial は `table_state["visible_columns"]`、次に `table_state[:visible_columns]` を読み、最後に `columns` へ fallback します。TreeView は hierarchy、visible row order、render state、row hooks を所有します。column inference、saved table preferences、filter、sort、table-wide state は host app または table layer の責務です。

連携例と責務境界は [Resource table bridge](resource-table-bridge.md) を参照してください。

## TreeView::RenderState

画面単位の描画状態をまとめるオブジェクトです。

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

| 引数 | 必須 | 説明 |
|---|---:|---|
| `tree:` | yes | `TreeView::Tree` 相当の object。 |
| `root_items:` | yes | 描画 root node 配列。 |
| `row_partial:` | yes | host app 側の列描画 partial。 |
| `ui_config:` | yes | `TreeView::UiConfig`。 |
| `initial_state:` | no | `:expanded` または `:collapsed`。 |
| `expanded_keys:` | no | 展開する tree 側 node key 配列。`tree.node_key_for(item)` と一致する必要があり、UI だけの DOM ID ではありません。 |
| `collapsed_keys:` | no | 折りたたむ tree 側 node key 配列。`tree.node_key_for(item)` と一致する必要があり、UI だけの DOM ID ではありません。 |
| `current_item:` | no | 現在 node の object。row 状態判定に使えるほか、ancestor 自動展開時の起点にもなります。 |
| `current_key:` | no | host app 側が key だけ持っている場合の現在 node key。ancestor 自動展開の前に、TreeView が `root_items` 配下から対応 node を解決します。 |
| `auto_expand_ancestors:` | no | 現在 node の ancestor key を `expanded_keys` に自動で足す boolean。`current_item`、または `root_items` 配下で解決できる `current_key` が必要です。 |
| `initial_expansion:` | no | 初期展開設定 group。`default`、`max_depth`、`expanded_keys`、`collapsed_keys`、`current_item`、`current_key`、`auto_expand_ancestors` を使えます。 |
| `render_scope:` | no | 描画範囲設定 group。 |
| `toggle_scope:` | no | 開閉操作範囲設定 group。 |
| `selection:` | no | checkbox selection 設定 group。 |
| `lazy_loading:` | no | lazy loading 設定 group。 |
| `row_class_builder:` | no | `tr` class を返す callable。 |
| `row_data_builder:` | no | `tr` data 属性を返す callable。 |
| `badge_builder:` | no | row badge / marker 表示値を返す callable。 |
| `icon_builder:` | no | row badge / marker 表示の compatibility alias。新しい code では `badge_builder` を推奨。 |
| `depth_label_builder:` | no | depth label を返す callable。 |
| `toggle_icons:` | no | toggle control icon の宣言的 map。`by_state`、`by_depth`、`by_type` を指定できます。詳細は [toggle icon のカスタマイズ](toggle-icons.md) を参照してください。 |
| `toggle_icon_builder:` | no | toggle control content を返す callable。`toggle_icons:` と両方指定した場合はこちらを優先します。 |
| `row_status_builder:` | no | row 状態を返す callable。 |
| `row_event_payload_builder:` | no | drag/drop transfer payload を返す callable。transfer 専用であり、汎用 row event hook ではない。 |
| `persisted_state:` | no | 保存済み展開状態。 |
| `empty_message:` | no | root items が空のときに表示する文字列。最終文言と CTA は host app の責務。 |
| `hidden_message_builder:` | no | 非表示 descendant 件数を受け取りメッセージを返す callable。`call` に応答する必要がある。 |
| `state_messages:` | no | グループ化された state message 設定。サポートキーは `empty` と `hidden_builder`。同名の flat option が優先。 |

個別引数と `initial_expansion:` を同時に指定した場合は、個別引数を優先します。`auto_expand_ancestors:` が開くのは current node に至る path だけなので、兄弟 branch や別 path も最初から開きたい場合は引き続き `expanded_keys:` を併用してください。実用例は [Cookbook の「現在のブランチだけ初期展開する」](cookbook.md#現在のブランチだけ初期展開する) を参照してください。

公開名の判断は [Public Name Decisions](public-name-decisions.md)、ARIA 配置は [Accessibility Semantics](accessibility-semantics.md) を参照してください。識別子設計は [Node keys](node-keys.md) を参照してください。

### Documented grouped option keys

`TreeView::RenderState` の grouped-option contract の exact key set は `config/public_api_manifest.yml` を machine-readable source of truth にし、`spec/public_api_compatibility_spec.rb` が current constant と representative behavior に対してその manifest を照合します。

| Grouped option | supported keys | 補足 |
|---|---|---|
| `initial_expansion:` | `default`, `max_depth`, `expanded_keys`, `collapsed_keys`, `current_item`, `current_key`, `auto_expand_ancestors` | 個別 keyword option と両方書いた場合でも、優先されるのは個別 keyword option です。 |
| `render_scope:` | `max_depth`, `max_leaf_distance` | `TreeView::RenderState` で documented されている render-depth / leaf-distance control と同じ契約です。 |
| `toggle_scope:` | `max_depth_from_root`, `max_leaf_distance` | `TreeView::RenderState` で documented されている toggle-depth / toggle leaf-distance control と同じ契約です。 |
| `selection:` | `enabled`, `visibility`, `payload_builder`, `checkbox_name`, `disabled_builder`, `disabled_reason_builder`, `selected_keys`, `cascade`, `indeterminate`, `max_count` | documented された `TreeView::RenderState::SelectionConfig` key と対応します。挙動と host app の責務は [Selection](selection.md) を参照してください。 |
| `lazy_loading:` | `enabled`, `loaded_keys`, `scope` | lazy-loading row-state hook と任意の host-app scope passthrough に対応します。詳細は [Lazy Loading](lazy-loading.md) を参照してください。 |
| `row_status:` | `row_disabled_builder`, `row_readonly_builder`, `row_disabled_reason_builder` | row disabled / readonly state hook と disabled reason surface に対応します。 |
| `state_messages:` | `empty`, `hidden_builder` | empty/hidden message のグループ設定。`empty` は `empty_message:` に、`hidden_builder` は `hidden_message_builder:` に対応します。flat option が優先。 |

## TreeView::UiConfig / UiConfigBuilder

DOM ID、toggle mode、path builder、任意の Turbo Frame target をまとめる設定 object です。

| Builder | Mode | 説明 |
|---|---|---|
| `build_turbo(...)` | `:turbo` | host app の path builder で Turbo Stream 開閉 URL を作る。`turbo_frame:` を指定すると toggle link に `data-turbo-frame` を追加する。 |
| `build(...)` | `:turbo` | 後方互換のための `build_turbo` alias。`turbo_frame:` も同様に指定できる。 |
| `build_static` | `:static` | 開閉 URL を持たない静的 snapshot 設定を作る。 |
| `build_client_side` | `:client` | Turbo endpoint を使わない browser-local 開閉設定を作る。 |

`UiConfig#mode` は `:turbo`、`:static`、`:client` を返します。`UiConfig#turbo_frame` は設定された frame target または `nil` を返します。`turbo?`、`static?`、`client?` predicate も使えます。

### static

```ruby
tree_ui = TreeView::UiConfigBuilder.new(
  context: view_context,
  node_prefix: "document"
).build_static
```

### turbo

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

`turbo_frame:` を指定すると、TreeView は Turbo toggle link に `data-turbo-frame` を追加します。scope と host app 側の責務は [Turbo Frame option](turbo-frame.md) を参照してください。

### client-side

```ruby
tree_ui = TreeView::UiConfigBuilder.new(
  context: view_context,
  node_prefix: "document"
).build_client_side
```

client-side mode では、render scope 内の collapsed descendants を初期 HTML に `hidden` 付きで描画し、bundled `tree-view-client` controller で browser 内の行表示を切り替えます。初期 HTML 量を許容できる小〜中規模 tree 向けです。

## TreeView::PersistedState / StateStore

生成された host app model 経由で開閉状態を保存・復元・クリアするための API です。

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

`clear!` は一致する保存済み展開状態 record があれば削除します。record が存在しない場合も、指定した owner と `tree_instance_key` の空の `TreeView::PersistedState` を返します。reset route と authorization の責務は [Persisted State](persisted-state.md#statestore) を参照してください。

## Helpers

| Helper | 説明 |
|---|---|
| `tree_view_rows(render_state, window: nil)` | TreeView rows を描画する。 |
| `tree_view_window(render_state, offset:, limit:)` | windowing metadata を返す。 |
| `tree_node_dom_id(item_or_id, ui: @tree_ui)` | 解決された `UiConfig` を通して node DOM ID を組み立てる。 |
| `tree_children_container_dom_id(item_or_id, ui: @tree_ui)` | lazy-loading placeholder region と Turbo Stream replacement で使う children container DOM ID を組み立てる。 |
| `tree_remote_state_placeholder_dom_id(item_or_id, ui: @tree_ui)` | lazy-loaded row 用の remote-state placeholder DOM ID を組み立てる。 |
| `tree_remote_state_placeholder_attributes(item_or_id, state: nil, ui: @tree_ui)` | remote-state placeholder element 用の documented data 属性を返す。 |
| `tree_selection_value(item, tree, builder = nil)` | default または custom の selection payload builder から checkbox value 用 JSON を作る。 |
| `tree_view_breadcrumb(tree, item, ...)` | breadcrumb を描画する。 |
| `tree_view_toolbar(render_state, actions: ..., labels: ..., class_name: ..., button_class_name: ...)` | TreeView bundled toolbar の markup を描画する。 |
| `tree_view_toolbar_supported_actions` | TreeView が validate / describe できる documented toolbar action key を返す。 |
| `tree_view_toolbar_actions(render_state, actions: ..., labels: {})` | host app が独自 markup を組み立てるための toolbar action hash を返す。 |
| `tree_view_toolbar_action_metadata(render_state, action, label: nil)` | 1 つの supported toolbar action 用 metadata を返す。 |

remote-state placeholder helpers は [Lazy Loading](lazy-loading.md) の placeholder / Turbo Stream pattern と合わせて使います。toolbar helper family は [Toolbar helper](toolbar.md) の supported action と metadata boundary を参照してください。

public helper の compatibility contract は `config/public_api_manifest.yml` に documented された helper-method set に従います。bundled partial の内部 plumbing 用 helper は、この表から意図的に外しています。

### Toolbar helpers

TreeView 既定の toolbar markup で十分な場合は `tree_view_toolbar` を使います。

最終的な HTML、class、icon、authorization rule を host app が持ちたい場合は、`tree_view_toolbar_actions` または `tree_view_toolbar_action_metadata` を使って、TreeView から supported action metadata だけを受け取ります。

各 action metadata hash には次の key が入ります。

- `:action`
- `:state`
- `:label`
- `:path`
- `:disabled`
- `:data`

公開されている toolbar action は次の 3 つです。

| Action | 要求する tree-wide state | 補足 |
|---|---|---|
| `:expand_all` | `:expanded` | host app の `toggle_all_path_builder` に expanded state を渡します。 |
| `:collapse_all` | `:collapsed` | host app の `toggle_all_path_builder` に collapsed state を渡します。 |
| `:collapse_all_except_current_path` | `:current_path` | host app の `toggle_all_path_builder` に current-path state を渡します。 |

現在の UI mode が `toggle_all_path_builder` を持たない場合、toolbar metadata は `path: nil` と `disabled: true` を返します。TreeView は action/state の対応だけを公開し、fallback UI や表示文言の判断は host app 側に残します。

これらの helper を支える内部 constant は public API ではありません。constant 名ではなく、documented helper method と返り値の metadata shape に依存してください。

## JavaScript entrypoint

```js
import { registerTreeViewControllers } from "tree_view"

registerTreeViewControllers(application)
```

主な controller:

- `tree-view-state`
- `tree-view-client`
- `tree-view-selection`
- `tree-view-transfer`
- `tree-view-remote-state`

## 関連 docs

- [API概要](api-overview.md)
- [使い方](usage.md)
- [Turbo Frame option](turbo-frame.md)
- [Cookbook](cookbook.md)
- [PathTreeBuilder](path-tree-builder.md)
- [Accessibility Semantics](accessibility-semantics.md)
- [Error hierarchy](errors.md)
- [render log level](render-log-level.md)
- [Node keys](node-keys.md)
- [Persisted State](persisted-state.md)
- [Tree diagnostics](tree-diagnostics.md)
- [Public API policy](public-api.md)
