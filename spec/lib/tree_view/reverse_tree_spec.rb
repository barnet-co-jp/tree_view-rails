require "spec_helper"
ReverseTreeNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe TreeView::ReverseTree do
  def build_base_tree(records)
    TreeView::Tree.new(records: records, parent_id_method: :parent_item_id, sorter: ->(items, _tree) { items.sort_by(&:id) })
  end

  it "builds a reverse direction tree from paths" do
    root = ReverseTreeNode.new(id: 1, parent_item_id: nil, name: "root")
    parent = ReverseTreeNode.new(id: 2, parent_item_id: 1, name: "parent")
    child = ReverseTreeNode.new(id: 3, parent_item_id: 2, name: "child")
    base_tree = build_base_tree([root, parent, child])

    reverse_tree = base_tree.reverse_tree_for([child])

    expect(reverse_tree.root_items).to eq([child])
    expect(reverse_tree.children_for(child)).to eq([parent])
    expect(reverse_tree.children_for(parent)).to eq([root])
    expect(reverse_tree.children_for(root)).to eq([])
  end

  it "keeps orphan paths as root items" do
    orphan = ReverseTreeNode.new(id: 1, parent_item_id: 999, name: "orphan")
    base_tree = build_base_tree([orphan])

    reverse_tree = base_tree.reverse_tree_for([orphan])

    expect(reverse_tree.root_items).to eq([orphan])
    expect(reverse_tree.children_for(orphan)).to eq([])
  end

  it "delegates node keys and sorting to the base tree" do
    child_b = ReverseTreeNode.new(id: 2, parent_item_id: nil, name: "child-b")
    child_a = ReverseTreeNode.new(id: 1, parent_item_id: nil, name: "child-a")
    base_tree = build_base_tree([child_b, child_a])

    reverse_tree = base_tree.reverse_tree_for([child_b, child_a])

    expect(reverse_tree.node_key_for(child_a)).to eq(base_tree.node_key_for(child_a))
    expect(reverse_tree.root_items).to eq([child_a, child_b])
  end

  it "attaches shared ancestors only to the first encountered reverse path" do
    root = ReverseTreeNode.new(id: 1, parent_item_id: nil, name: "root")
    parent = ReverseTreeNode.new(id: 2, parent_item_id: 1, name: "parent")
    child_a = ReverseTreeNode.new(id: 3, parent_item_id: 2, name: "child-a")
    child_b = ReverseTreeNode.new(id: 4, parent_item_id: 2, name: "child-b")
    base_tree = build_base_tree([root, parent, child_a, child_b])

    reverse_tree = base_tree.reverse_tree_for([child_a, child_b])

    expect(reverse_tree.root_items).to eq([child_a, child_b])
    expect(reverse_tree.children_for(child_a)).to eq([parent])
    expect(reverse_tree.children_for(child_b)).to eq([])
    expect(reverse_tree.children_for(parent)).to eq([root])
  end

  it "calculates descendant counts within the reverse tree only" do
    root = ReverseTreeNode.new(id: 1, parent_item_id: nil, name: "root")
    parent = ReverseTreeNode.new(id: 2, parent_item_id: 1, name: "parent")
    child = ReverseTreeNode.new(id: 3, parent_item_id: 2, name: "child")
    base_tree = build_base_tree([root, parent, child])

    reverse_tree = base_tree.reverse_tree_for([child])

    expect(reverse_tree.descendant_counts[reverse_tree.node_key_for(child)]).to eq(2)
    expect(reverse_tree.descendant_counts[reverse_tree.node_key_for(parent)]).to eq(1)
    expect(reverse_tree.descendant_counts[reverse_tree.node_key_for(root)]).to eq(0)
  end

  it "raises a clear error when descendant count paths contain a cycle" do
    node_a = ReverseTreeNode.new(id: 1, parent_item_id: 2, name: "node-a")
    node_b = ReverseTreeNode.new(id: 2, parent_item_id: 1, name: "node-b")
    base_tree = build_base_tree([node_a, node_b])
    reverse_tree = described_class.new(base_tree: base_tree, paths: [[node_a, node_b, node_a]])

    expect do
      reverse_tree.descendant_counts
    end.to raise_error(ArgumentError, /cycle detected in reverse tree/)
  end

  it "raises a records mode error through parent path helpers for resolver mode" do
    root = ReverseTreeNode.new(id: 1, parent_item_id: nil, name: "root")
    tree = TreeView::Tree.new(roots: [root], children_resolver: ->(_node) { [] })

    expect { tree.reverse_tree_for([root]) }.to raise_error(ArgumentError, /records mode/)
  end
end
