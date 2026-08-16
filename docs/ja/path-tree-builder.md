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
```

builder は `FolderNode` と `RecordNode` を生成し、`RecordNode#record` から元のhost app recordを参照できます。

## path入力

`path_resolver` は callable である必要があります。戻り値は slash 区切り文字列、または segment 配列を使えます。文字列pathは `separator` で分割され、空segmentは無視されます。

## keyとlabel

folder key は既定で folder path から `folder:` prefix 付きで作られます。record key は record が `id` に応答する場合 `record:<id>`、それ以外は `record:<object_id>` になります。

record keyを安定させたい場合は `id_resolver:` を使います。

```ruby
id_resolver: ->(document) { TreeView.node_key(:document, document.id) }
```

### host app固有のfolder key

persisted stateなどのために、project namespaceを含む既存folder key形式を維持したい場合は `folder_key_resolver:` を使えます。resolverにはrootから現在folderまでのsegment配列が渡されます。

```ruby
builder = TreeView::PathTreeBuilder.new(
  records: documents,
  path_resolver: ->(document) { document.source_relative_path },
  folder_key_resolver: ->(segments) {
    TreeView.node_key("project_#{project.id}_folder", segments.join("/"))
  }
)
```

このoptionはfolder生成ロジックをTreeViewに任せつつ、host appのstable persisted key contractを保つためのものです。認可、project context、業務IDの意味そのものはhost app側に残ります。

## sort

`sort: { folders_first: true }` を渡すと、各階層で生成folderをrecordより前に並べます。独自順序にしたい場合は `sorter:` を渡します。

なお、通常の `TreeView::Tree` は入力配列やActiveRecordの `order` をそのまま表示順として保持する契約ではありません。表示順が業務仕様の場合は `sorter:` を明示してください。

## table header

`tree_view_rows` はhost appの `row_partial` より前にTreeViewのtoggle cellを1列描画します。selection有効時はselection cellも追加されます。host appが `<thead>` を持つ場合は、このTreeView-owned列を含めて `colspan` やheader列数を合わせてください。

## 責務境界

`PathTreeBuilder` は path らしい値から汎用的な folder node / record node を作るだけです。query、権限、label、link、file download、status badge、row-specific action は引き続き host app 側の責務です。
