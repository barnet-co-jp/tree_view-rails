# GraphAdapter

Use `TreeView::GraphAdapter` when the host app needs TreeView rows for heterogeneous or graph-like nodes that do not fit one parent-id column.

GraphAdapter is intentionally small. It gives `TreeView::Tree` four inputs:

| Input | Required | Purpose |
|---|---:|---|
| `roots:` | yes | Top-level nodes TreeView starts from. |
| `children_resolver:` | yes | Callable that returns the children for a node. `nil` becomes an empty array, and a single child is wrapped in an array. |
| `node_key_resolver:` | no | Callable that returns the stable node key. Without it, TreeView uses `[node.class.name, node.public_send(id_method)]`. |
| `parent_resolver:` | no | Callable that returns the parent for a node. When supplied, adapter mode can use parent-path helpers and ancestor-aware filtering. |

## Public manifest boundary

The initializer keyword surface is part of the machine-readable public API manifest under `graph_adapter_initializer`. The manifest keeps `roots` and `children_resolver` as required keywords and `node_key_resolver` plus `parent_resolver` as optional keywords.

That manifest entry describes the constructor surface, not the traversal semantics. Child normalization, node key fallback behavior, repeated-node policy, cycle handling, authorization, and query planning stay documented behavior and host-app responsibility rather than separate manifest schema for this slice.

## Minimal example

```ruby
adapter = TreeView::GraphAdapter.new(
  roots: [workspace],
  children_resolver: ->(node) {
    case node
    when Workspace
      node.projects.visible_to(current_user).to_a
    when Project
      node.documents.visible_to(current_user).to_a
    else
      []
    end
  },
  node_key_resolver: ->(node) { TreeView.node_key(node.class.name, node.id) }
)

tree = TreeView::Tree.new(adapter: adapter)

render_state = TreeView::RenderState.new(
  tree: tree,
  root_items: tree.root_items,
  row_partial: "workspaces/tree_columns",
  ui_config: tree_ui
)
```

This keeps the tree rendering API the same as records mode while letting the host app decide how each node type finds its children.

## Parent path helpers

Add `parent_resolver:` when the heterogeneous tree also needs to walk toward parents.

```ruby
adapter = TreeView::GraphAdapter.new(
  roots: [workspace],
  children_resolver: ->(node) { children_by_node.fetch(node, []) },
  parent_resolver: ->(node) { parent_by_node[node] },
  node_key_resolver: ->(node) { TreeView.node_key(node.class.name, node.id) }
)

tree = TreeView::Tree.new(adapter: adapter)
path = tree.path_for(current_document)
expanded_keys = tree.expanded_keys_for(current_document)
filtered = tree.filtered_tree_for(matches, mode: :with_ancestors)
```

Adapter trees with `parent_resolver:` support `parent_for`, `ancestors_for`, `path_for`, `paths_for`, and `expanded_keys_for`. This lets heterogeneous Project / generated-folder / Document trees use the same ancestor-preserving search and current-node expansion helpers as records mode.

Calling parent-path helpers on an adapter without `parent_resolver:` or on resolver mode raises `TreeView::ConfigurationError`. TreeView does not infer parents by reversing `children_resolver:`.

## When to use it

Use GraphAdapter when:

- one `parent_id_method` cannot describe the hierarchy;
- a tree mixes model classes, external nodes, generated nodes, or edge-derived children;
- the host app already has a traversal policy and only needs TreeView rendering and interaction hooks;
- a heterogeneous tree also needs shared ancestor-path, persisted-expansion, or ancestor-aware filtering APIs.

Prefer records mode when every row is the same model shape and a parent-id column describes the tree. Prefer `PathTreeBuilder` when records expose path-like values and the host app wants generated folder nodes.

## Responsibility boundary

TreeView traverses the roots and child arrays returned by the adapter, plus the parent relationship when supplied. The host app owns:

- graph traversal policy and which node types may appear;
- authorization and visibility filtering before children or parents are returned;
- query planning, eager loading, caching, and pagination strategy;
- cycle prevention or cycle handling policy;
- stable node key design across heterogeneous node types;
- row partials, labels, routes, and business actions.

GraphAdapter does not add a cycle-detection engine, authorization layer, query optimizer, persistence model, or business graph DSL. If the same node can appear through multiple paths, decide whether that is valid for your screen before passing nodes to TreeView.

## Node keys

For heterogeneous nodes, pass a `node_key_resolver:` that namespaces by type or source system.

```ruby
node_key_resolver = ->(node) {
  TreeView.node_key(node.class.name, node.id)
}
```

Use the same key strategy when configuring initial expansion, persisted state, row IDs, or host-app routes that need to refer to the same logical node. See [Node keys](node-keys.md) and [API overview: Node keys and UI identifiers](api-overview.md#node-keys-and-ui-identifiers) for details.

## Performance notes

Materialize children before returning them from the resolver when rows may be rendered more than once. When using `parent_resolver:`, precompute parent lookup too so the resolver does not issue SQL on every call.

```ruby
children_by_project_id = Project.visible_to(current_user).to_a.index_with do |project|
  project.documents.visible_to(current_user).includes(:latest_version).to_a
end

adapter = TreeView::GraphAdapter.new(
  roots: projects,
  children_resolver: ->(node) {
    node.is_a?(Project) ? children_by_project_id.fetch(node.id, []) : []
  },
  node_key_resolver: ->(node) { TreeView.node_key(node.class.name, node.id) }
)
```

For more practical checklist items, see [Cookbook: GraphAdapter and ActiveRecord performance](cookbook.md#graphadapter-and-activerecord-performance).

## Related documents

- [Decision guide](decision-guide.md)
- [API overview: adapter mode](api-overview.md#adapter-mode)
- [API reference: TreeView::Tree](api.md#treeviewtree)
- [Node keys](node-keys.md)
- [Tree diagnostics](tree-diagnostics.md)
- [Cookbook: GraphAdapter and ActiveRecord performance](cookbook.md#graphadapter-and-activerecord-performance)
