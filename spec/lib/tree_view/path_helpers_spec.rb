require "spec_helper"
PathNode = Struct.new(:id, :parent_item_id, :name)
PathCountry = Struct.new(:id, :name, :children)

RSpec.describe "TreeView::Tree parent path helpers" do
  def build_tree(records, **options)
    TreeView::Tree.new(records: records, parent_id_method: :parent_item_id, **options)
  end

  it "returns the parent record" do
    root = PathNode.new(id: 1, parent_item_id: nil, name: "root")
    child = PathNode.new(id: 2, parent_item_id: 1, name: "child")
    tree = build_tree([root, child])

    expect(tree.parent_for(child)).to eq(root)
    expect(tree.parent_for(root)).to be_nil
  end

  it "returns nil when the parent is missing from records" do
    orphan = PathNode.new(id: 2, parent_item_id: 999, name: "orphan")
    tree = build_tree([orphan])

    expect(tree.parent_for(orphan)).to be_nil
    expect(tree.ancestors_for(orphan)).to eq([])
    expect(tree.path_for(orphan)).to eq([orphan])
  end

  it "returns ancestors from root to parent" do
    root = PathNode.new(id: 1, parent_item_id: nil, name: "root")
    parent = PathNode.new(id: 2, parent_item_id: 1, name: "parent")
    child = PathNode.new(id: 3, parent_item_id: 2, name: "child")
    tree = build_tree([root, parent, child])

    expect(tree.ancestors_for(child)).to eq([root, parent])
  end

  it "returns a path from root to item" do
    root = PathNode.new(id: 1, parent_item_id: nil, name: "root")
    parent = PathNode.new(id: 2, parent_item_id: 1, name: "parent")
    child = PathNode.new(id: 3, parent_item_id: 2, name: "child")
    tree = build_tree([root, parent, child])

    expect(tree.path_for(child)).to eq([root, parent, child])
  end

  it "returns paths for multiple items" do
    root = PathNode.new(id: 1, parent_item_id: nil, name: "root")
    child_a = PathNode.new(id: 2, parent_item_id: 1, name: "child-a")
    child_b = PathNode.new(id: 3, parent_item_id: 1, name: "child-b")
    tree = build_tree([root, child_a, child_b])

    expect(tree.paths_for([child_a, child_b])).to eq([[root, child_a], [root, child_b]])
  end

  it "returns unique expanded keys for one item path" do
    root = PathNode.new(id: 1, parent_item_id: nil, name: "root")
    parent = PathNode.new(id: 2, parent_item_id: 1, name: "parent")
    child = PathNode.new(id: 3, parent_item_id: 2, name: "child")
    tree = build_tree([root, parent, child])

    expect(tree.expanded_keys_for(child)).to eq([1, 2, 3])
  end

  it "returns unique expanded keys for multiple item paths" do
    root = PathNode.new(id: 1, parent_item_id: nil, name: "root")
    child_a = PathNode.new(id: 2, parent_item_id: 1, name: "child-a")
    child_b = PathNode.new(id: 3, parent_item_id: 1, name: "child-b")
    tree = build_tree([root, child_a, child_b])

    expect(tree.expanded_keys_for([child_a, child_b])).to eq([1, 2, 3])
  end

  it "rejects expanded key helpers in resolver mode" do
    country = PathCountry.new(1, "japan", [])
    tree = TreeView::Tree.new(
      roots: [country],
      children_resolver: ->(node) { node.children }
    )

    expect do
      tree.expanded_keys_for(country)
    end.to raise_error(ArgumentError, /only supported in records mode/)
  end

  it "returns orphan diagnostics with missing parent ids" do
    root = PathNode.new(id: 1, parent_item_id: nil, name: "root")
    orphan = PathNode.new(id: 2, parent_item_id: 999, name: "orphan")
    tree = build_tree([root, orphan])

    expect(tree.orphan_report).to eq([
      {item: orphan, key: 2, missing_parent_id: 999}
    ])
  end

  it "returns tree stats for reachable nodes" do
    root = PathNode.new(id: 1, parent_item_id: nil, name: "root")
    child = PathNode.new(id: 2, parent_item_id: 1, name: "child")
    grandchild = PathNode.new(id: 3, parent_item_id: 2, name: "grandchild")
    sibling = PathNode.new(id: 4, parent_item_id: 1, name: "sibling")
    orphan = PathNode.new(id: 5, parent_item_id: 999, name: "orphan")
    tree = build_tree([root, child, grandchild, sibling, orphan])

    expect(tree.stats).to eq(
      nodes: 4,
      roots: 1,
      leaves: 2,
      max_depth: 2,
      orphans: 1,
      max_descendant_count: 3
    )
  end

  it "includes orphan roots in stats when orphan_strategy is as_root" do
    root = PathNode.new(id: 1, parent_item_id: nil, name: "root")
    orphan = PathNode.new(id: 2, parent_item_id: 999, name: "orphan")
    tree = build_tree([root, orphan], orphan_strategy: :as_root)

    expect(tree.stats).to include(nodes: 2, roots: 2, leaves: 2, orphans: 1)
  end

  it "detects cycles while walking parent paths" do
    node_a = PathNode.new(id: 1, parent_item_id: 2, name: "a")
    node_b = PathNode.new(id: 2, parent_item_id: 1, name: "b")
    tree = build_tree([node_a, node_b])

    expect do
      tree.path_for(node_a)
    end.to raise_error(ArgumentError, /cycle detected in parent path/)
  end

  it "rejects parent path helpers in resolver mode" do
    country = PathCountry.new(1, "japan", [])
    tree = TreeView::Tree.new(
      roots: [country],
      children_resolver: ->(node) { node.children }
    )

    expect do
      tree.parent_for(country)
    end.to raise_error(ArgumentError, /only supported in records mode/)
  end
end
