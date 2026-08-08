# Selection

TreeView can render checkbox cells for selecting nodes.

## Overview

Selection lets host apps render checkboxes for TreeView nodes and pass checked values to forms or JavaScript behavior.

TreeView is responsible for:

- rendering checkbox cells
- generating JSON payloads for checkbox values
- controlling checkbox visibility for rendered rows
- rendering disabled checkboxes and disabled reasons
- collecting checked payloads through the JavaScript controller
- updating cascade and indeterminate state for rendered rows
- dispatching max-count exceeded events

The host app remains responsible for deleting, moving, relating, API calls, authorization, and business-specific messages.

## Minimal setup

```ruby
render_state = TreeView::RenderState.new(
  tree: tree,
  root_items: tree.root_items,
  row_partial: "documents/tree_columns",
  ui_config: tree_ui,
  selection: {
    enabled: true,
    checkbox_name: "selected_nodes[]",
    visibility: :leaves
  }
)
```

## Visibility

Use `selection[:visibility]` to control which rows render checkboxes.

| value | meaning |
|---|---|
| `:all` | Render checkboxes for all rendered nodes. |
| `:roots` | Render checkboxes only for root rows in the current rendered tree. |
| `:leaves` | Render checkboxes only for rows whose children are empty in the current rendered tree. |
| `:none` | Render no checkboxes while keeping empty selection cells. |

The default is `:all`.

When `selection[:enabled]` is `false`, TreeView does not render selection cells at all. When selection is enabled but a row is outside the configured visibility, TreeView renders an empty selection cell to keep table columns aligned.

## Parsing submitted values

The checkbox value is a JSON string. When customizing it with `selection[:payload_builder]`, the builder must return a `Hash` or another Hash-like object that responds to `to_h`; TreeView serializes that result into the checkbox JSON value. An invalid return value produces an underlying `ArgumentError` that identifies the failing node key. Rendering through ActionView may expose it as the `cause` of an `ActionView::Template::Error`. This render-time builder contract is separate from the request-time `TreeView.parse_selection_params` boundary below.

Host apps can parse submitted values with:

```ruby
selected_nodes = TreeView.parse_selection_params(params[:selected_nodes])
```

`TreeView.parse_selection_params` accepts arrays of JSON strings and returns parsed hash-like values. Invalid JSON raises a clear error so the host app can handle malformed submissions.

Nil and empty string entries are skipped, which keeps optional checkbox params easy to pass through when nothing was selected. Hash-like entries and JSON objects are accepted as the current server-side parser surface. Malformed JSON and JSON values that are not objects raise `ArgumentError`; host apps own whether to rescue that error, reject the request, show validation copy, or log the malformed submission.

## Disabled checkboxes

Use `disabled_builder` when some nodes cannot be selected.

```ruby
selection: {
  enabled: true,
  disabled_builder: ->(document) { document.archived? },
  disabled_reason_builder: ->(document) {
    document.archived? ? "Cannot select archived documents" : nil
  }
}
```

The return value from `disabled_reason_builder` is rendered as the checkbox `title` and `data-tree-selection-disabled-reason`.

If host-app JavaScript or browser tests need to find rendered selection checkboxes or the disabled-reason attribute without hand-copying raw strings, use `TreeViewSelectionCheckboxHooks.checkboxClass` and `TreeViewSelectionCheckboxHooks.disabledReasonAttribute` from the package root. The raw `.tree-selection-checkbox` class and `data-tree-selection-disabled-reason` attribute remain the documented DOM contract; the export is a machine-readable reference to those names. See [Selection checkbox hooks](selection-checkbox-hooks.md).

## JavaScript selection API

`tree-view-selection` can collect checked node payloads from rendered selection checkboxes.

```erb
<tbody data-controller="tree-view-selection">
  <%= tree_view_rows(@render_state) %>
</tbody>

<button data-action="tree-view-selection#submit">
  Process selected nodes
</button>
```

If your host app already imports `tree_view/index.js`, prefer `TreeViewEventNames` when wiring listeners so you do not have to hand-copy raw event-name strings. The raw strings remain part of the documented event contract. See [JavaScript event contract](js-events.md) and [Public API](public-api.md).

When `submit` runs, the controller dispatches a `tree-view-selection:selected` event.

```js
import { TreeViewEventNames } from "tree_view"

document.addEventListener(TreeViewEventNames.selection.selected, (event) => {
  console.log(event.detail.payloads)
})
```

When the controller connects or selection changes, it dispatches `tree-view-selection:change`.

```js
import { TreeViewEventNames } from "tree_view"

document.addEventListener(TreeViewEventNames.selection.change, (event) => {
  const { selectedCount, selectedValues, selectedPayloads } = event.detail
})
```

Only checked and enabled `.tree-selection-checkbox` elements are included. Invalid JSON values are skipped and reported through the same documented invalid-payload event (`TreeViewEventNames.selection.invalidPayload` or raw `tree-view-selection:invalid-payload`).

### Selected count target

When the host app only needs the current selected count as text, add an optional `selectedCount` target inside the `tree-view-selection` controller.

```erb
<p>
  Selected nodes:
  <strong data-tree-view-selection-target="selectedCount">0</strong>
</p>

<tbody
  data-controller="tree-view-selection"
  data-action="change->tree-view-selection#toggle">
  <%= tree_view_rows(@render_state) %>
</tbody>
```

The controller writes the numeric `selectedCount` into every `selectedCount` target on connect and after selection changes. If the target is omitted, existing event-only usage is unchanged.

The target owns the number only. Surrounding copy, bulk action enable/disable, max-count messages, and business-specific behavior remain host-app responsibility. The `tree-view-selection:change` event still carries the full `selectedCount`, `selectedValues`, and `selectedPayloads` detail for richer integrations.

## Hidden input sync for regular form submit

When the tree sits inside a normal HTML form, the same controller can mirror checked payloads into hidden inputs on the nearest form.

```erb
<form action="/documents/bulk_update" method="post">
  <table>
    <tbody
      data-controller="tree-view-selection"
      data-action="change->tree-view-selection#toggle"
      data-tree-view-selection-hidden-input-name-value="selected_nodes[]">
      <%= tree_view_rows(@render_state) %>
    </tbody>
  </table>
</form>
```

With `data-tree-view-selection-hidden-input-name-value`, TreeView writes one hidden input per valid checked payload and keeps those inputs in sync on connect, change, submit, and manual refresh.

If your host app already imports the package root, use `TreeViewSelectionDataHooks.hiddenInputNameValue` when you need to reference the host-authored attribute name from JavaScript without hand-copying the raw string.

```js
import { TreeViewSelectionDataHooks } from "tree_view"

const hiddenInputNameAttribute = TreeViewSelectionDataHooks.hiddenInputNameValue
```

- The hidden input `name` stays host-app controlled.
- Values are written as JSON strings, so `TreeView.parse_selection_params(params[:selected_nodes])` keeps working.
- Disabled checkboxes and invalid JSON payloads are skipped, matching the existing event payload behavior.
- If the tree is not inside a form, TreeView keeps dispatching selection events and does not create hidden inputs.
- Generated hidden input marker attributes and source-id attributes are managed by TreeView and are not host-authored public hooks.

When one form contains multiple `tree-view-selection` controllers, TreeView tags each generated hidden input with `data-tree-view-selection-source-id` so one controller only removes and rewrites its own generated inputs. Hidden inputs also carry `data-tree-view-selection-generated-hidden-input`; both generated-input attributes are TreeView-owned bookkeeping, not attributes host apps should author, query, or delete as public hooks.

The controller element can carry `data-tree-view-selection-source-id` as a narrow override for that bookkeeping id. Use the override only when a multi-tree form needs a stable source id for deterministic browser assertions, server-rendered replacement, or similar coordination. Most host apps should omit it and let TreeView assign the source id on connect. This override is intentionally not part of `TreeViewSelectionDataHooks`, which covers the host-authored value attributes listed above.

Use separate `data-tree-view-selection-hidden-input-name-value` names when the host app wants separate submitted params for each tree. Reuse a name only when the server-side action intentionally accepts one combined array.

Static mockups such as [selection-multi-tree-form.html](../mockups/selection-multi-tree-form.html) can show generated hidden inputs as a review aid, but this section is the submission contract: TreeView mirrors one JSON payload per hidden input, while the host app owns final params grouping and summary copy.

## Selection max count

Host apps can limit the number of checked boxes on the JavaScript controller.

```erb
<tbody
  data-controller="tree-view-selection"
  data-action="change->tree-view-selection#toggle"
  data-tree-view-selection-max-count-value="10">
  <%= tree_view_rows(@render_state) %>
</tbody>
```

When your JavaScript authors or queries the host element, use `TreeViewSelectionDataHooks.maxCountValue` to reference that documented attribute name without hand-copying `data-tree-view-selection-max-count-value`.

When a user exceeds the limit, TreeView unchecks the attempted checkbox and dispatches `tree-view-selection:limit-exceeded`.

```js
import { TreeViewEventNames } from "tree_view"

document.addEventListener(TreeViewEventNames.selection.limitExceeded, (event) => {
  const { maxCount, attemptedCount } = event.detail
})
```

The controller reports the limit event only. Business-specific messaging and API behavior remain the host app's responsibility.

## Linked checkbox behavior

The Stimulus controller can also update rendered child rows and parent mixed states.

```erb
<tbody
  data-controller="tree-view-selection"
  data-action="change->tree-view-selection#toggle"
  data-tree-view-selection-cascade-value="true"
  data-tree-view-selection-indeterminate-value="true">
  <%= tree_view_rows(@render_state) %>
</tbody>
```

Use `TreeViewSelectionDataHooks.cascadeValue` and `TreeViewSelectionDataHooks.indeterminateValue` when JavaScript needs the documented attribute names for host-authored cascade and indeterminate wiring. The raw attributes remain part of the public docs, and the package-root export is only a machine-readable reference to those names.

This behavior is DOM-based. It affects rendered rows only and skips disabled checkboxes.

The controller reads checkbox elements that are currently present in the page. It does not create selection semantics for descendants that lazy loading or children pagination has not rendered yet. When a bulk action should include unloaded descendants, submit a host-app-owned server-side intent or query filter in addition to the loaded-row checkbox payloads.

See [Children Pagination](children-pagination.md#selection-and-dragdrop-interactions) for the pagination-specific boundary and [children-pagination-selection-boundary.html](../mockups/children-pagination-selection-boundary.html) for a static visual reference.

## Responsibility boundary

| Area | TreeView | Host app |
|---|---|---|
| Rendering checkboxes | yes | no |
| JSON payload generation | yes | optional customization |
| Submitted value parsing and hidden input sync | helper provided, optional form bridge | owns controller placement and business action |
| Selected count target | syncs the numeric count when the optional target is present | owns surrounding copy, action state, and messages |
| Cascade / indeterminate | rendered DOM only | decides unloaded/server-side semantics |
| Max count event | dispatches event | shows message or blocks business action |
| Delete / move / relate / API calls | no | yes |
| Authorization | no | yes |
