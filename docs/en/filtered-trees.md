# Filtered Trees

This page explains filtered trees for rendering search or filter results as TreeView structures.

## Overview

A filtered tree selects matching nodes from a base tree and includes the surrounding nodes needed for display.

Common use cases:

- render only matched nodes
- render matched nodes and ancestors
- render matched nodes and descendants
- render matched nodes, ancestors, and descendants together

## Basic example

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

`TreeView::FilteredTree` is a manifest-backed public constant, but host apps should usually obtain instances through `TreeView::Tree#filtered_tree_for` so mode validation and base-tree behavior stay in one place.

## Modes

The mode set below is a manifest-backed public contract tracked in `config/public_api_manifest.yml` and guarded against `TreeView::FilteredTree::VALID_MODES`.

| mode | meaning |
|---|---|
| `:matched_only` | Include only matched nodes. |
| `:with_ancestors` | Include matched nodes and ancestors. |
| `:with_descendants` | Include matched nodes and descendants. |
| `:with_ancestors_and_descendants` | Include matched nodes, ancestors, and descendants. |

## Combining ActiveRecord filtering, pagination, and sorting

The record set passed to TreeView must include the nodes required to reconstruct the relevant parent-child relationships. Applying ordinary list-oriented `where`, `page`, or `limit` operations before `TreeView::Tree.new` can leave records whose parents are outside the filtered page.

With the default `orphan_strategy: :ignore`, those orphaned records are not reachable from a root and therefore are not rendered. A host app can otherwise end up with a record that exists in the flat result set but disappears from the tree view.

For hierarchical search results, prefer this order:

1. Build the base tree from the authorized base record set.
2. Identify the items that match the search condition.
3. Use `filtered_tree_for(..., mode: :with_ancestors)` or another suitable mode to retain the structural context required for display.
4. For data sets where loading the complete authorized tree is inappropriate, use a host-app query that fetches ancestor closure, Children Pagination, or Lazy Loading rather than flat pagination.

```ruby
records = policy_scope(Document).to_a
base_tree = TreeView::Tree.new(records: records, parent_id_method: :parent_document_id)

matches = records.select { |record| record.name.include?(params[:q].to_s) }
visible_tree = base_tree.filtered_tree_for(matches, mode: :with_ancestors)
```

### Do not treat flat pagination as tree pagination

`pagy(relation)` and `relation.limit(...).offset(...)` are flat row pagination strategies. Applying them before TreeView construction can split parents and children across pages, so they are not generally valid tree pagination strategies.

TreeView does not own the host app's server-side paging query. For large data sets, design a hierarchy-preserving boundary such as root-level pagination, per-parent children pagination, or lazy loading.

### SQL order and TreeView sibling order are separate

An `ORDER BY` on the ActiveRecord relation does not by itself define the final TreeView sibling order. After construction, TreeView sorts each sibling group with its configured `sorter`. If the host app needs a specific sibling order, provide a sorter that expresses that requirement. A flat-list sort and a hierarchy-local sibling sort are different concerns.

## Visual reference

For a static comparison of representative matched-only, ancestor-retaining, and descendant-retaining output, see [filtered-tree-modes.html](../mockups/filtered-tree-modes.html).

Use that mockup together with the mode table above. `:with_ancestors_and_descendants` remains the combined case described on this page, while search queries, ranking, and highlighting stay host-app concerns.

## Difference from PathTree

`path_tree_for` fills paths from roots to specified items.

Filtered trees build a node set around matches according to a filter mode.

| Goal | API |
|---|---|
| Show paths to search results | `path_tree_for(items)` |
| Switch between matches, ancestors, and descendants by mode | `filtered_tree_for(items, mode:)` |

## Responsibility boundary

| Area | TreeView | Host app |
|---|---|---|
| filtered tree construction | yes | provides matched items |
| filter modes | yes | chooses mode |
| search query | no | yes |
| authorization | no | yes |
| result ranking | no | yes |
| flat/server-side pagination strategy | no | yes |
| sibling sort policy | applies configured sorter | chooses sorter |
| text highlighting | no | yes |