# GraphAdapter

`TreeView::GraphAdapter` は、1つの parent id column では表しにくい異種 node や graph-like node を TreeView の行として描画したいときに使います。

GraphAdapter は意図的に小さい adapter です。`TreeView::Tree` に次の4つを渡せます。

| 入力 | 必須 | 役割 |
|---|---:|---|
| `roots:` | yes | TreeView が開始する top-level node。 |
| `children_resolver:` | yes | node の子を返す callable。`nil` は空配列になり、単一の child object は配列で包まれます。 |
| `node_key_resolver:` | no | 安定した node key を返す callable。省略時は `[node.class.name, node.public_send(id_method)]` を使います。 |
| `parent_resolver:` | no | node の親を返す callable。指定すると adapter mode でも `parent_for` / `ancestors_for` / `path_for` / `expanded_keys_for` と ancestor-aware filtering を利用できます。 |

## Public manifest boundary

initializer keyword surface は `graph_adapter_initializer` として machine-readable public API manifest に含まれます。manifest では `roots` と `children_resolver` を required keyword、`node_key_resolver` と `parent_resolver` を optional keyword として扱います。

## 最小例

```ruby
adapter = TreeView::GraphAdapter.new(
  roots: [workspace],
  children_resolver: ->(node) { children_by_node.fetch(node, []) },
  parent_resolver: ->(node) { parent_by_node[node] },
  node_key_resolver: ->(node) { TreeView.node_key(node.class.name, node.id) }
)

tree = TreeView::Tree.new(adapter: adapter)
```

`parent_resolver:` は optional です。描画だけなら従来どおり `roots:` と `children_resolver:` だけで使えます。

## parent path helper

`parent_resolver:` を渡した adapter tree では records mode と同じ parent path helper を使えます。

```ruby
path = tree.path_for(current_document)
expanded_keys = tree.expanded_keys_for(current_document)
filtered = tree.filtered_tree_for(matches, mode: :with_ancestors)
```

この形は、Project / generated folder / Document のような異種node treeで、検索結果の祖先を残したい場合や current node までの展開keyを得たい場合に有効です。

`parent_resolver:` を指定していない adapter tree、または resolver mode で parent path helper を呼ぶと `TreeView::ConfigurationError` になります。TreeView は `children_resolver:` から親関係を逆推定しません。

## 使う場面

GraphAdapter は次のような場合に使います。

- 1つの `parent_id_method` では hierarchy を表せない
- model class、外部 node、生成 node、edge 由来の child が同じ tree に混ざる
- host app 側に traversal policy があり、TreeView には描画と interaction hook だけを任せたい
- 異種nodeでも ancestor path、persisted expansion、ancestor-aware filteringを共通APIで扱いたい

すべての行が同じ model shape で parent-id column から tree を作れる場合は records mode を優先してください。record が path-like value を持ち、生成 folder node を作りたい場合は `PathTreeBuilder` を優先してください。

## 責務境界

TreeView は adapter が返す roots、child arrays、任意の parent relation を辿ります。次の責務は host app が持ちます。

- graph traversal policy と、どの node type を表示対象にするか
- children / parent を返す前の authorization / visibility filtering
- query planning、eager loading、cache、pagination strategy
- cycle prevention または cycle handling policy
- 異種 node 間で安定する node key 設計
- row partial、label、route、business action

GraphAdapter は authorization layer、query optimizer、persistence model、business graph DSL を追加しません。同じ node が複数 path から現れ得る場合は、それを画面上の正しい状態として扱うかどうかを TreeView に渡す前に host app 側で決めてください。

## Node key

異種 node を扱う場合は、type や source system で namespace した `node_key_resolver:` を渡します。

```ruby
node_key_resolver = ->(node) {
  TreeView.node_key(node.class.name, node.id)
}
```

initial expansion、persisted state、row ID、host-app route などで同じ logical node を参照する場合は、同じ key strategy を使ってください。詳しくは [Node key 設計](node-keys.md) を参照してください。

## 性能メモ

行が複数回描画され得る場合は、resolver から返す children / parent を事前に materialize してください。resolver の中で毎回 SQL を発行しないようにします。

## 関連ドキュメント

- [API判断ガイド](decision-guide.md)
- [API概要: adapter mode](api-overview.md#adapter-mode)
- [API仕様: TreeView::Tree](api.md#treeviewtree)
- [Node key 設計](node-keys.md)
- [Tree diagnostics](tree-diagnostics.md)
