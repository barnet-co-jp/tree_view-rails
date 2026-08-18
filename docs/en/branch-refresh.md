# Branch cue refresh after DOM reordering

TreeView renders hierarchy branch cues such as middle/last sibling lines on the server. The rendered markup uses `.tree-toggle__branch-slot` classes such as `is-middle`, `is-last`, `has-line`, and `is-empty` rather than CSS `:last-child` alone.

When a host app reorders already-rendered TreeView rows directly in the browser, those server-rendered branch classes do not automatically follow the new DOM order.

For host apps that use the bundled `tree-view-transfer` controller, v1.1.0 adds `TreeViewTransferController#refreshBranches()` as an explicit refresh primitive.

## Reordering rows in place

After the host app has moved the relevant `<tr>` elements into their final DOM order, call `refreshBranches()` on the controller instance:

```js
const element = document.querySelector("[data-controller~='tree-view-transfer']")
const controller = application.getControllerForElementAndIdentifier(
  element,
  "tree-view-transfer"
)

// Host app changes DOM order first.
moveRows()

controller.refreshBranches()
```

The refresh scans TreeView-owned `tr[data-tree-depth]` rows in DOM order and rebuilds the branch slots for each row. It recalculates both:

- whether the current row is the last sibling (`is-last` / `is-middle`)
- whether each rendered ancestor level continues a vertical line (`has-line` / `is-empty`)

Rows belonging to a nested `tree-view-transfer` controller are ignored.

`refreshBranches()` returns the number of TreeView rows it processed.

## Responsibility boundary

This method updates branch presentation only. It does not:

- reorder rows
- change `parent_id`
- update `data-tree-depth`
- persist the new order
- validate whether a move is allowed
- update authorization state
- recalculate the server-side `TreeView::Tree`

For a same-parent reorder, moving the full row/subtree DOM block and then calling `refreshBranches()` is normally sufficient for branch presentation.

For a parent change, the host app must also update the affected row and descendant `data-tree-depth` values before calling `refreshBranches()`. If the host app does not already maintain those structural attributes reliably, prefer a server-rendered Turbo Stream replacement instead.

## Partial tree boundaries

Branch refresh is intended for a complete rendered tree region where DOM order contains enough sibling/ancestor context to reconstruct the visible hierarchy.

Prefer server re-rendering when the displayed DOM is structurally incomplete, including cases such as:

- windowed rendering
- partially loaded lazy-loading branches
- children pagination where sibling context is outside the current DOM
- a fragment that starts below the real root and does not contain the ancestor context needed for branch lines

In those cases, a Turbo Stream replacement of the relevant table body or tree region keeps branch cues aligned with the server-side traversal.

## Drag-and-drop integration

The transfer controller still only reports transfer intent (`before`, `inside`, `after`) and payload information. The host app remains responsible for applying the business move and deciding when it is safe to update the DOM.

A typical single-user flow is:

```text
drop
 -> host app validates and persists
 -> host app reorders DOM rows
 -> refreshBranches()
```

If persistence returns Turbo Stream HTML, no client branch refresh is necessary because the server-rendered replacement already contains fresh branch information.
