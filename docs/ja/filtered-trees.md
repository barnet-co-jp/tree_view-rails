# Filtered Trees

このページでは、検索結果や絞り込み結果をTreeViewとして表示するための filtered tree を説明します。

## 概要

filtered tree は、base treeから条件に合うnodeと、その表示に必要な周辺nodeを取り出して描画するための仕組みです。

主な用途:

- 検索にmatchしたnodeだけを表示する
- matchしたnodeと祖先を表示する
- matchしたnodeと子孫を表示する
- matchしたnode、祖先、子孫をまとめて表示する

## 基本例

```ruby
matched_documents = documents.select { |document| document.name.include?(params[:q].to_s) }
filtered_tree = tree.filtered_tree_for(matched_documents, mode: :with_ancestors)

render_state = TreeView::RenderState.new(
  tree: filtered_tree,
  root_items: filtered_tree.root_items,
  row_partial: "documents/tree_columns",
  ui_config: tree_ui
)
```

`TreeView::FilteredTree` は manifest-backed public constant です。ただし host app は通常 `TreeView::Tree#filtered_tree_for` 経由で instance を取得し、mode validation と base-tree behavior を同じ入口に保ってください。

## mode

下の mode set は `config/public_api_manifest.yml` に記録され、`TreeView::FilteredTree::VALID_MODES` と照合される manifest-backed public contract です。

| mode | 意味 |
|---|---|
| `:matched_only` | matchしたnodeだけを含めます。 |
| `:with_ancestors` | matchしたnodeと祖先を含めます。 |
| `:with_descendants` | matchしたnodeと子孫を含めます。 |
| `:with_ancestors_and_descendants` | matchしたnode、祖先、子孫を含めます。 |

## ActiveRecord の filter / pagination / sort と組み合わせる場合

TreeView に渡す record 集合は、**親子関係を組み立てるために必要な node を含んでいる必要があります**。通常の一覧画面のように ActiveRecord relation を先に `where` / `page` / `limit` してから `TreeView::Tree.new` に渡すと、page 外や filter 外の親を持つ record が orphan になります。

既定の `orphan_strategy: :ignore` では、その orphan は root から到達できないため描画されません。したがって「一覧では存在するのに tree view では行が消える」という状態になり得ます。

検索結果を階層として見せる場合は、次の順序を推奨します。

1. authorization を適用した base record 集合から TreeView の base tree を構築する。
2. 検索条件に一致する item を求める。
3. `filtered_tree_for(..., mode: :with_ancestors)` などで表示に必要な祖先を保持する。
4. 大規模データで全件構築が不適切な場合は、host app 側で ancestor closure を取得する query、Children Pagination、Lazy Loading などを使う。

```ruby
records = policy_scope(Document).to_a
base_tree = TreeView::Tree.new(records: records, parent_id_method: :parent_document_id)

matches = records.select { |record| record.name.include?(params[:q].to_s) }
visible_tree = base_tree.filtered_tree_for(matches, mode: :with_ancestors)
```

### flat pagination を tree pagination として扱わない

`pagy(relation)` や `relation.limit(...).offset(...)` のような **flat row pagination を TreeView 構築前に適用する方法は、一般には tree pagination ではありません**。親と子が別 page に分断されるためです。

TreeView 自体は server-side の page query strategy を所有しません。大量データでは、root 単位の pagination、children 単位の pagination、lazy loading など、階層を壊さない取得単位を host app 側で設計してください。

### SQL の並び順と TreeView の sibling sort は別

relation に `ORDER BY` を付けても、TreeView は構築後に sibling group を `sorter` で並べます。SQL の並び順をそのまま tree の sibling 順として保持したい場合は、host app の要件に合う `sorter` を明示してください。flat list の sort と hierarchy 内の sibling sort は同じ意味ではありません。

## Visual reference

match-only、ancestor-retaining、descendant-retaining の代表的な出力を静的に見比べたい場合は [filtered-tree-modes.html](../mockups/filtered-tree-modes.html) を参照してください。

この mockup は上の mode table を視覚的に補うためのものです。`:with_ancestors_and_descendants` はこのページで説明している combined case として扱い、search query、ranking、highlighting は引き続き host app 側の責任です。

## PathTreeとの違い

`path_tree_for` は、指定itemまでのpathを補完して表示します。

filtered tree は、filter modeに応じてmatch周辺のnode集合を作ります。

| 目的 | API |
|---|---|
| 検索結果までのpathを表示 | `path_tree_for(items)` |
| matchと祖先/子孫をmodeで切り替える | `filtered_tree_for(items, mode:)` |

## 責務範囲

| Area | TreeView | Host app |
|---|---|---|
| filtered tree construction | yes | provides matched items |
| filter modes | yes | chooses mode |
| search query | no | yes |
| authorization | no | yes |
| result ranking | no | yes |
| flat/server-side pagination strategy | no | yes |
| sibling sort policy | applies configured sorter | chooses sorter |
| highlighting text | no | yes |