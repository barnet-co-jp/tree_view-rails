# PathTreeBuilder

`TreeView::PathTreeBuilder` は、path らしい値を持つ records から、生成フォルダnodeとrecord nodeで構成された描画可能なtreeを作るためのAPIです。

`guides/setup/install.md` のような path を持つ documents / attachments / generated artifacts などを扱いたいが、database上にfolder recordを持っていない場合に使います。

## 基本例

```ruby
builder = TreeView::PathTreeBuilder.new(
  records: documents,
  path_resolver: ->(document) { document.source_relative_path },
  label_resolver: ->(document) { document.title },
  id_resolver: ->(document) { "document:#{document.id}" },
  sort: { folders_first: true }
)

render_state = TreeView::RenderState.new(
  tree: builder.tree,
  root_items: builder.root_items,
  row_partial: "documents/tree_columns",
  ui_config: tree_ui
)
```

builder は以下の2種類の公開node形状を作ります。

| Node | fields | 説明 |
|---|---|---|
| `TreeView::PathTreeBuilder::FolderNode` | `key`, `parent_key`, `label`, `path`, `node_type`, `folder_node?`, `record_node?` | 生成された中間フォルダ。 |
| `TreeView::PathTreeBuilder::RecordNode` | `key`, `parent_key`, `label`, `path`, `record`, `node_type`, `folder_node?`, `record_node?` | host app recordを包むleaf node。 |

これらの field / predicate set は、node shape contract として public API manifest でも追跡されます。manifest が固定するのは生成 node の読み取り可能な形状であり、folder key generation strategy、sort algorithm、file-manager behavior、host app の row action design までは固定しません。

`RecordNode#record` には元のobjectが残るため、row partial 側で application-specific な列、link、status、action を描画できます。

## folder row と record row を描画する

同じ `row_partial` には、生成された folder node と record node の両方が渡されます。folder row は汎用metadataだけを表示し、record row は host app 固有の列やactionを出したい場合、`folder_node?` / `record_node?` で分岐します。

```erb
<!-- app/views/documents/_tree_columns.html.erb -->
<% if item.folder_node? %>
  <td><%= item.label %></td>
  <td><%= item.path %></td>
  <td>Folder</td>
  <td></td>
<% elsif item.record_node? %>
  <% document = item.record %>
  <td><%= item.label %></td>
  <td><%= item.path %></td>
  <td><%= document.status %></td>
  <td><%= link_to "Open", document_path(document) %></td>
<% end %>
```

`FolderNode` は TreeView が path segment から生成するため、folder row は汎用的な表示に留めます。record row では `item.record` を使って、product 固有の field、link、permission、status badge、action を host app 側で描画できます。

静的な visual reference として、[PathTreeBuilder row mockup](../mockups/path-tree-builder-rows.html) も参照できます。この mockup は生成 folder row と record-backed row を比較し、file-manager behavior、download action、authorization copy、最終的な row action design は gem contract の外に残す境界を示します。

predicate method は生成された node shape を判定するためのものなので、`folder_node_type:` や `record_node_type:` に custom 値を渡しても意味は変わりません。設定した type label を表示またはserializeしたい場合だけ、`node_type` を直接使ってください。

## path入力

`path_resolver` は callable である必要があります。戻り値は slash 区切り文字列、または segment 配列を使えます。

```ruby
path_resolver: ->(document) { document.source_relative_path }
path_resolver: ->(document) { [document.category_name, document.title] }
```

文字列pathは `separator` で分割されます。既定値は `/` です。

```ruby
TreeView::PathTreeBuilder.new(
  records: attachments,
  path_resolver: ->(attachment) { attachment.tree_path },
  separator: "::"
)
```

空segmentは無視します。

## keyとlabel

folder key は既定で folder path から `folder:` prefix 付きで作られます。record key は record が `id` に応答する場合 `record:<id>`、それ以外は `record:<object_id>` になります。

record keyを安定させたい場合や、node種別を含めたい場合は `id_resolver` を使います。

```ruby
id_resolver: ->(document) { TreeView.node_key(:document, document.id) }
```

persisted stateなどのために既存のfolder key形式を維持したい場合は `folder_key_resolver:` を使えます。resolverにはrootから現在folderまでのsegment配列が渡されます。

```ruby
folder_key_resolver: ->(segments) {
  TreeView.node_key("project_#{project.id}_folder", segments.join("/"))
}
```

これによりfolder生成自体はTreeViewに寄せつつ、project/tenant namespaceを含むhost app固有のstable key contractを維持できます。認可やnamespaceの業務的意味はhost app側の責務です。

record label は以下の順で解決されます。

1. `label_resolver.call(record)` が指定されている場合
2. record が `name` に応答する場合は `record.name`
3. 最後のpath segment
4. `record.to_s`

## sort

`sort: { folders_first: true }` を渡すと、各階層で生成folderをrecordより前に並べます。

独自順序にしたい場合は `sorter:` を渡します。`TreeView::Tree` の sorter と同じく `->(items, tree) { ... }` 形式です。

通常の `TreeView::Tree` は、入力配列やActiveRecordの `order` をそのまま表示順として保持する契約ではありません。表示順が画面仕様の場合は `sorter:` を明示してください。

## table header

`tree_view_rows` はhost appの `row_partial` より前にTreeView-ownedのtoggle cellを1列描画します。selectionを有効にした場合はselection cellも追加されます。host appが `<thead>` を持つ場合は、これらの列を含めてheader列数や `colspan` を合わせてください。

## 責務境界

`PathTreeBuilder` は path らしい値から汎用的な folder node / record node を作るだけです。query、権限、label、link、file download、status badge、row-specific action は引き続き host app 側の責務です。
