# NodePresenter row partial patterns

This cookbook shows how to use `TreeView::NodePresenter` from host-app row partials without adding a generic Column / Action DSL to TreeView.

The goal is to keep shared tree concepts in the gem and leave app-specific table cells, actions, permissions, formatting, modals, downloads, and inline editing in the host app.

## Related guides

- Use [Localized names](localized-names.md) when presenter labels, tooltips, badges, or node type names should follow the host app locale.
- Use [Host app extension points](host-app-extension-points.md#row_partial) to decide whether a concern belongs in `row_partial`, a builder, or host-app UI code.
- Use [node-presenter-row-partials.html](../mockups/node-presenter-row-partials.html) as the static visual reference when reviewing resolver-provided labels, links, badges, icons, and optional actions beside host-app-owned columns and permissions. The mockup is a review aid, not a Column / Action DSL or final business UI contract.

## Why not a Column / Action DSL yet?

Columns and actions vary quickly by product:

- authorization and policy checks
- download, preview, edit, delete, and modal actions
- responsive layout
- dropdowns and bulk actions
- inline editing and forms
- date, status, and domain-specific formatting

Those concerns are often not tree-specific. TreeView should only absorb abstractions that are common across many tree UIs.

## Recommended split

TreeView provides reusable structure and resolvers:

- tree structure
- generated path trees
- current path expansion
- persisted expansion state
- `NodePresenter` resolvers
- toolbar shell
- stable row context and partial locals

Host apps own product-specific rendering:

- table cells
- links and actions
- authorization
- dialogs and forms
- domain-specific labels and formatting

`TreeView::NodePresenter` and its builder names are part of the public compatibility contract. The machine-readable builder list lives in `config/public_api_manifest.yml` as `node_presenter_builder_names`, and compatibility specs check it against `TreeView::NodePresenter::BUILDER_NAMES`.

The public builder names are `key`, `label`, `href`, `tooltip`, `row_class`, `row_data`, `icon`, `badge`, and `actions`.

That contract stabilizes the available builder names only. The meaning of returned labels, links, row data, action identifiers, badges, icons, and any authorization or formatting decisions remains host-app owned and is intentionally shown here as cookbook guidance.

## Example presenter

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

Pass it to `RenderState`:

```ruby
@render_state = TreeView::RenderState.new(
  tree: tree,
  root_items: tree.root_items,
  row_partial: "documents/tree_columns",
  ui_config: tree_ui,
  node_presenter: presenter
)
```

When TreeView renders `row_partial`, the partial receives `item`, `tree`, `render_state`, `row_context`, and `node_presenter`. `row_actions_partial` receives the same locals.

## Example row partial

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

This keeps the reusable resolver logic in `NodePresenter` while leaving action details and authorization in the host app.

## When to promote a pattern into TreeView

Consider moving a pattern from cookbook to TreeView only when it is:

- tree-specific rather than product-specific
- useful across multiple host apps
- expressible as a thin resolver or helper
- not coupled to authorization, forms, modals, or domain workflows

Until those conditions are met, prefer row partials, helpers, components, or ViewComponent in the host app.
