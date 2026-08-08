# NodePresenter row partial patterns

この cookbook は、TreeView 本体に汎用的な Column / Action DSL を追加せず、host app の row partial から `TreeView::NodePresenter` を使うための方針を示します。

目的は、共通の tree 概念を gem 側に置きつつ、table cell、action、permission、formatting、modal、download、inline editing などの product-specific な描画を host app 側に残すことです。

## 関連 guide

- presenter の label、tooltip、badge、node type 名を host app の locale に合わせたい場合は [Localized names](localized-names.md) を参照してください。
- その関心ごとを `row_partial`、builder、host app 側 UI code のどこに置くべきか迷う場合は [Host app extension points](host-app-extension-points.md#row_partial) を参照してください。
- resolver が返す label、link、badge、icon、任意 action を host app 側の column や permission と並べて確認したい場合は、静的な visual reference として [node-presenter-row-partials.html](../mockups/node-presenter-row-partials.html) を使ってください。この mockup は review aid であり、Column / Action DSL や最終的な business UI contract ではありません。

## なぜ今 Column / Action DSL を入れないのか

column と action は product ごとの差分が広がりやすい領域です。

- authorization / policy check
- download、preview、edit、delete、modal action
- responsive layout
- dropdown / bulk action
- inline editing / forms
- date、status、domain-specific formatting

これらは多くの場合 tree-specific ではありません。TreeView に取り込むのは、複数の tree UI に共通する薄い抽象に限定します。

## 推奨する責務分担

TreeView が提供するもの:

- tree structure
- generated path trees
- current path expansion
- persisted expansion state
- `NodePresenter` resolvers
- toolbar shell
- stable row context and partial locals

Host app が担当するもの:

- table cells
- links and actions
- authorization
- dialogs and forms
- domain-specific labels and formatting

`TreeView::NodePresenter` とその builder 名は public compatibility contract の一部です。machine-readable な builder list は `config/public_api_manifest.yml` の `node_presenter_builder_names` に置き、compatibility spec で `TreeView::NodePresenter::BUILDER_NAMES` と照合します。

公開 builder 名は `key`、`label`、`href`、`tooltip`、`row_class`、`row_data`、`icon`、`badge`、`actions` です。

この contract が安定させるのは利用可能な builder 名です。返される label、link、row data、action identifier、badge、icon の意味や、authorization / formatting の判断は host app 側の責務であり、この guide では cookbook として例示します。

## presenter 例

```ruby
presenter = TreeView::NodePresenter.define do
  label { |item| item.title }
  href { |item| item.file? ? Rails.application.routes.url_helpers.document_path(item) : nil }
  tooltip { |item| item.summary }
  row_data { |item| { node_type: item.node_type } }
  badge { |item| item.status_label }
  icon { |item| item.node_type }
  actions { |item| item.file? ? [:download] : [] }
end
```

`RenderState` に渡します。

```ruby
@render_state = TreeView::RenderState.new(
  tree: tree,
  root_items: tree.root_items,
  row_partial: "documents/tree_columns",
  ui_config: tree_ui,
  node_presenter: presenter
)
```

TreeView が `row_partial` を描画する時は、partial に `item`、`tree`、`render_state`、`row_context`、`node_presenter` が渡されます。`row_actions_partial` にも同じ local が渡されます。

## row partial 例

```erb
<td>
  <% label = node_presenter&.label_for(item) || item.to_s %>
  <% href = node_presenter&.href_for(item) %>

  <% if href %>
    <%= link_to label, href, title: node_presenter&.tooltip_for(item) %>
  <% else %>
    <%= label %>
  <% end %>

  <% if (badge = node_presenter&.badge_for(item)) %>
    <span class="badge"><%= badge %></span>
  <% end %>
</td>

<td>
  <%= item.updated_at.to_fs(:short) %>
</td>

<td>
  <% if node_presenter&.actions_for(item)&.include?(:download) && policy(item).download? %>
    <%= link_to "Download", download_document_path(item) %>
  <% end %>
</td>
```

共通 resolver logic は `NodePresenter` に置き、action の詳細や authorization は host app に残します。

## TreeView へ昇格する判断基準

cookbook の pattern を TreeView 本体へ移すのは、以下を満たす場合に限定します。

- product-specific ではなく tree-specific である
- 複数の host app で有用である
- 薄い resolver / helper として表現できる
- authorization、forms、modals、domain workflow と密結合しない

それまでは host app の row partial、helper、component、ViewComponent に残すことを推奨します。
