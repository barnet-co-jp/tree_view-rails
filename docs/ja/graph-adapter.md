# GraphAdapter

`TreeView::GraphAdapter` は、1つの parent id column では表しにくい異種 node や graph-like node を TreeView の行として描画したいときに使います。

GraphAdapter は意図的に小さい adapter です。`TreeView::Tree` に次の4つを渡します。

| 入力 | 必須 | 役割 |
|---|---:|---|
| `roots:` | yes | TreeView が開始する top-level node。 |
| `children_resolver:` | yes | node の子を返す callable。`nil` は空配列になり、単一の child object は配列で包まれます。 |
| `node_key_resolver:` | no | 安定した node key を返す callable。省略時は `[node.class.name, node.public_send(id_method)]` を使います。 |
| `parent_resolver:` | no | node の親を返す callable。指定すると adapter mode でも parent path helper と ancestor-aware filtering を利用できます。 |

## Public manifest boundary

initializer keyword surface は `graph_adapter_initializer` として machine-readable public API manifest に含まれます。manifest では `roots` と `children_resolver` を required keyword、`node_key_resolver` と `parent_resolver` を optional keyword として扱います。

この manifest entry は constructor surface を説明するもので、traversal semantics そのものを細かい schema にするものではありません。children normalization、node key fallback、repeated-node policy、cycle handling、authorization、query planning はこの slice では docs 上の挙動と host-app responsibility に留めます。

## 最小例

```ruby
adapter = TreeView::GraphAdapter.new(
  roots: [workspace],
  children_resolver: ->(node) {
    case node
    when Workspace
      node.projects.visible_to(current_user).to_a
    when Project
      node.documents.visible_to(current_user).to_a
    else
      []
    end
  },
  node_key_resolver: ->(node) { TreeView.node_key(node.class.name, node.id) }
)

tree = TreeView::Tree.new(adapter: adapter)

render_state = TreeView::RenderState.new(
  tree: tree,
  root_items: tree.root_items,
  row_partial: "workspaces/tree_columns",
  ui_config: tree_ui
)
```

records mode と同じ描画 API を使いつつ、各 node type が子をどう見つけるかは host app 側で決められます。

## Parent path helper

異種node treeでも親方向を辿りたい場合は `parent_resolver:` を追加します。

```ruby
adapter = TreeView::GraphAdapter.new(
  roots: [workspace],
  children_resolver: ->(node) { children_by_node.fetch(node, []) },
  parent_resolver: ->(node) { parent_by_node[node] },
  node_key_resolver: ->(node) { TreeView.node_key(node.class.name, node.id) }
)

tree = TreeView::Tree.new(adapter: adapter)
path = tree.path_for(current_document)
expanded_keys = tree.expanded_keys_for(current_document)
filtered = tree.filtered_tree_for(matches, mode: :with_ancestors)
```

`parent_resolver:` を指定した adapter tree では `parent_for`、`ancestors_for`、`path_for`、`paths_for`、`expanded_keys_for` を利用できます。これにより、Project / generated folder / Document のような異種node treeでも ancestor-preserving search や current node までの展開keyを共通APIで扱えます。

`parent_resolver:` を指定していない adapter tree、または resolver mode で parent path helper を呼ぶと `TreeView::ConfigurationError` になります。TreeView は `children_resolver:` を逆引きして親を推測しません。

## 使う場面

GraphAdapter は次のような場合に使います。

- 1つの `parent_id_method` では hierarchy を表せない
- model class、外部 node、生成 node、edge 由来の child が同じ tree に混ざる
- host app 側に traversal policy があり、TreeView には描画と interaction hook だけを任せたい
- 異種node treeでも ancestor path / persisted expansion / ancestor-aware filtering を共通APIで扱いたい

すべての行が同じ model shape で parent-id column から tree を作れる場合は records mode を優先してください。record が path-like value を持ち、生成 folder node を作りたい場合は `PathTreeBuilder` を優先してください。

## 責務境界

TreeView は adapter が返す roots と child arrays、指定されている場合は parent relation を辿ります。次の責務は host app が持ちます。

- graph traversal policy と、どの node type を表示対象にするか
- children / parent を返す前の authorization / visibility filtering
- query planning、eager loading、cache、pagination strategy
- cycle prevention または cycle handling policy
- 異種 node 間で安定する node key 設計
- row partial、label、route、business action

GraphAdapter は cycle-detection engine、authorization layer、query optimizer、persistence model、business graph DSL を追加しません。同じ node が複数 path から現れ得る場合は、それを画面上の正しい状態として扱うかどうかを TreeView に渡す前に host app 側で決めてください。

## Node key

異種 node を扱う場合は、type や source system で namespace した `node_key_resolver:` を渡します。

```ruby
node_key_resolver = ->(node) {
  TreeView.node_key(node.class.name, node.id)
}
```

initial expansion、persisted state、row ID、host-app route などで同じ logical node を参照する場合は、同じ key strategy を使ってください。詳しくは [Node key 設計](node-keys.md) と [API概要: Node keys and UI identifiers](api-overview.md#node-keys-and-ui-identifiers) を参照してください。

## 性能メモ

行が複数回描画され得る場合は、resolver から返す children を事前に materialize してください。`parent_resolver:` を使う場合も、親lookupを事前に構築して resolver 内で毎回SQLを発行しないようにします。

```ruby
children_by_project_id = Project.visible_to(current_user).to_a.index_with do |project|
  project.documents.visible_to(current_user).includes(:latest_version).to_a
end

adapter = TreeView::GraphAdapter.new(
  roots: projects,
  children_resolver: ->(node) {
    node.is_a?(Project) ? children_by_project_id.fetch(node.id, []) : []
  },
  node_key_resolver: ->(node) { TreeView.node_key(node.class.name, node.id) }
)
```

実装時の checklist は [Cookbook: GraphAdapter と ActiveRecord の性能](cookbook.md#graphadapter-と-activerecord-の性能) も参照してください。

## 関連ドキュメント

- [API判断ガイド](decision-guide.md)
- [API概要: adapter mode](api-overview.md#adapter-mode)
- [API仕様: TreeView::Tree](api.md#treeviewtree)
- [Node key 設計](node-keys.md)
- [Tree diagnostics](tree-diagnostics.md)
- [Cookbook: GraphAdapter と ActiveRecord の性能](cookbook.md#graphadapter-と-activerecord-の性能)
