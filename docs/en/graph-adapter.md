# GraphAdapter

Use `TreeView::GraphAdapter` when the host app needs TreeView rows for heterogeneous or graph-like nodes that do not fit one parent-id column.

GraphAdapter is intentionally small. It can provide `TreeView::Tree` with four inputs:

| Input | Required | Purpose |
|---|---:|---|
| `roots:` | yes | Top-level nodes TreeView starts from. |
| `children_resolver:` | yes | Callable that returns the children for a node. `nil` becomes an empty array, and a single child is wrapped in an array. |
| `node_key_resolver:` | no | Callable that returns the stable node key. Without it, TreeView uses `[node.class.name, node.public_send(id_method)]`. |
| `parent_resolver:` | no | Callable that returns a node's parent. When supplied, adapter mode can use `parent_for`, `ancestors_for`, `path_for`, `expanded_keys_for`, and ancestor-aware filtering. |

## Public manifest boundary

The initializer keyword surface is part of the machine-readable public API manifest under `graph_adapter_initializer`. The manifest keeps `roots` and `children_resolver` as required keywords and `node_key_resolver` plus `parent_resolver` as optional keywords.

## Minimal example

```ruby
adapter = TreeView::GraphAdapter.new(
  roots: [workspace],
  children_resolver: ->(node) { children_by_node.fetch(node, []) },
  parent_resolver: ->(node) { parent_by_node[node] },
  node_key_resolver: ->(node) { TreeView.node_key(node.class.name, node.id) }
)

tree = TreeView::Tree.new(adapter: adapter)
```

`parent_resolver:` is optional. Rendering-only adapter trees continue to work with just `roots:` and `children_resolver:`.

## Parent path helpers

When `parent_resolver:` is supplied, adapter trees can use the same parent path helpers as records mode:

```ruby
path = tree.path_for(current_document)
expanded_keys = tree.expanded_keys_for(current_document)
filtered = tree.filtered_tree_for(matches, mode: :with_ancestors)
```

This is useful for heterogeneous Project / generated-folder / Document trees that need ancestor-preserving search or expansion keys for a current node.

Calling parent path helpers on an adapter without `parent_resolver:` or on resolver mode raises `TreeView::ConfigurationError`. TreeView does not infer parents by reversing `children_resolver:`.

## When to use it

Use GraphAdapter when:

- one `parent_id_method` cannot describe the hierarchy;
- a tree mixes model classes, external nodes, generated nodes, or edge-derived children;
- the host app already has a traversal policy and only needs TreeView rendering and interaction hooks;
- heterogeneous nodes still need shared ancestor-path, persisted-expansion, or ancestor-aware filtering APIs.

Prefer records mode when every row is the same model shape and a parent-id column describes the tree. Prefer `PathTreeBuilder` when records expose path-like values and the host app wants generated folder nodes.

## Responsibility boundary

TreeView traverses roots, child arrays, and the optional parent relationship returned by the adapter. The host app owns authorization/visibility filtering, query planning, eager loading, caching, pagination strategy, stable node key design, and business-specific rows/routes/actions.

GraphAdapter does not add an authorization layer, query optimizer, persistence model, or business graph DSL. If the same node can appear through multiple paths, decide whether that is valid for the screen before passing nodes to TreeView.

## Node keys

For heterogeneous nodes, pass a `node_key_resolver:` that namespaces by type or source system.

```ruby
node_key_resolver = ->(node) {
  TreeView.node_key(node.class.name, node.id)
}
```

Use the same key strategy for initial expansion, persisted state, row IDs, and host-app routes that refer to the same logical node.

## Performance notes

Materialize child and parent lookups before rendering when resolvers may be called repeatedly. Avoid issuing SQL from every resolver invocation.

## Related documents

- [Decision guide](decision-guide.md)
- [API overview: adapter mode](api-overview.md#adapter-mode)
- [API reference: TreeView::Tree](api.md#treeviewtree)
- [Node keys](node-keys.md)
- [Tree diagnostics](tree-diagnostics.md)
