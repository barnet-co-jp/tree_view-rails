# PathTreeBuilder

`TreeView::PathTreeBuilder` turns records with path-like values into a renderable tree made of generated folder nodes and record nodes.

Use it when the host app has flat records such as documents, attachments, or generated artifacts that expose paths like `guides/setup/install.md`, but does not already have folder records in the database.

## Basic usage

```ruby
builder = TreeView::PathTreeBuilder.new(
  records: documents,
  path_resolver: ->(document) { document.source_relative_path },
  label_resolver: ->(document) { document.title },
  id_resolver: ->(document) { "document:#{document.id}" },
  sort: { folders_first: true }
)
```

The builder generates `FolderNode` and `RecordNode` values. `RecordNode#record` keeps the original host-app record available to row partials.

## Path inputs

`path_resolver` must be callable. It may return either a slash-separated string or an array of segments. String paths are split with `separator`, and blank segments are ignored.

## Keys and labels

By default, folder keys are generated from folder paths with the `folder:` prefix. Record keys use `record:<id>` when the record responds to `id`, otherwise `record:<object_id>`.

Use `id_resolver:` when records need stable or typed keys.

```ruby
id_resolver: ->(document) { TreeView.node_key(:document, document.id) }
```

### Host-defined folder keys

Use `folder_key_resolver:` when persisted state or another stable host contract requires a project- or tenant-namespaced folder key. The resolver receives the path segments from the root through the current folder.

```ruby
builder = TreeView::PathTreeBuilder.new(
  records: documents,
  path_resolver: ->(document) { document.source_relative_path },
  folder_key_resolver: ->(segments) {
    TreeView.node_key("project_#{project.id}_folder", segments.join("/"))
  }
)
```

This keeps generic folder generation in TreeView while letting the host app preserve its stable persisted-key contract. Authorization and the business meaning of the namespace remain host-app responsibilities.

## Sorting

Pass `sort: { folders_first: true }` to keep generated folders before records at each level. For custom ordering, pass `sorter:`.

A regular `TreeView::Tree` does not promise to preserve input-array or ActiveRecord `order` as rendered sibling order. When ordering is part of the screen contract, pass an explicit `sorter:`.

## Table headers

`tree_view_rows` renders a TreeView-owned toggle cell before the host app's `row_partial`. Selection mode can add another TreeView-owned selection cell. If the host app renders a `<thead>`, account for those columns in header counts or `colspan` values.

## Responsibility boundary

`PathTreeBuilder` only generates generic folder and record nodes from path-like values. Host apps still own queries, permissions, labels, links, file downloads, status badges, and row-specific actions.
