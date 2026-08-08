require "spec_helper"
PathTreeNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe TreeView::PathTree do
  def build_base_tree(records)
    TreeView::Tree.new(records: records, parent_id_method: :parent_item_id, sorter: ->(items, _tree) { items.sort_by(&:id) })
  end

  it "builds a normal direction tree from paths" do
    root = PathTreeNode.new(id: 1, parent_item_id: nil, name: "root")
    parent = PathTreeNode.new(id: 2, parent_item_id: 1, name: "parent")
    child = PathTreeNode.new(id: 3, parent_item_id: 2, name: "child")
    base_tree = build_base_tree([root, parent, child])

    path_tree = base_tree.path_tree_for([child])

    expect(path_tree.root_items).to eq([root])
    expect(path_tree.children_for(root)).to eq([parent])
    expect(path_tree.children_for(parent)).to eq([child])
    expect(path_tree.children_for(child)).to eq([])
  end

  it "deduplicates shared ancestors and edges" do
    root = PathTreeNode.new(id: 1, parent_item_id: nil, name: "root")
    parent = PathTreeNode.new(id: 2, parent_item_id: 1, name: "parent")
    child_a = PathTreeNode.new(id: 3, parent_item_id: 2, name: "child-a")
    child_b = PathTreeNode.new(id: 4, parent_item_id: 2, name: "child-b")
    base_tree = build_base_tree([root, parent, child_a, child_b])

    path_tree = base_tree.path_tree_for([child_a, child_b])

    expect(path_tree.root_items).to eq([root])
    expect(path_tree.children_for(root)).to eq([parent])
    expect(path_tree.children_for(parent)).to eq([child_a, child_b])
  end

  it "keeps orphan paths as root items" do
    orphan = PathTreeNode.new(id: 1, parent_item_id: 999, name: "orphan")
    base_tree = build_base_tree([orphan])

    path_tree = base_tree.path_tree_for([orphan])

    expect(path_tree.root_items).to eq([orphan])
    expect(path_tree.children_for(orphan)).to eq([])
  end

  it "delegates node keys and sorting to the base tree" do
    root_b = PathTreeNode.new(id: 2, parent_item_id: nil, name: "root-b")
    root_a = PathTreeNode.new(id: 1, parent_item_id: nil, name: "root-a")
    base_tree = build_base_tree([root_b, root_a])

    path_tree = base_tree.path_tree_for([root_b, root_a])

    expect(path_tree.node_key_for(root_a)).to eq(base_tree.node_key_for(root_a))
    expect(path_tree.root_items).to eq([root_a, root_b])
  end

  it "calculates descendant counts within the path tree only" do
    root = PathTreeNode.new(id: 1, parent_item_id: nil, name: "root")
    parent = PathTreeNode.new(id: 2, parent_item_id: 1, name: "parent")
    matched_child = PathTreeNode.new(id: 3, parent_item_id: 2, name: "matched-child")
    excluded_child = PathTreeNode.new(id: 4, parent_item_id: 2, name: "excluded-child")
    base_tree = build_base_tree([root, parent, matched_child, excluded_child])

    path_tree = base_tree.path_tree_for([matched_child])

    expect(path_tree.descendant_counts[path_tree.node_key_for(root)]).to eq(2)
    expect(path_tree.descendant_counts[path_tree.node_key_for(parent)]).to eq(1)
    expect(path_tree.descendant_counts[path_tree.node_key_for(matched_child)]).to eq(0)
  end

  it "raises a clear error when descendant count paths contain a cycle" do
    node_a = PathTreeNode.new(id: 1, parent_item_id: 2, name: "node-a")
    node_b = PathTreeNode.new(id: 2, parent_item_id: 1, name: "node-b")
    base_tree = build_base_tree([node_a, node_b])
    path_tree = described_class.new(base_tree: base_tree, paths: [[node_a, node_b, node_a]])

    expect do
      path_tree.descendant_counts
    end.to raise_error(ArgumentError, /cycle detected in path tree/)
  end
end
