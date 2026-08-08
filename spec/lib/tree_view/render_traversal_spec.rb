require "spec_helper"
RenderTraversalNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe TreeView::RenderTraversal do
  def build_tree
    root_a = RenderTraversalNode.new(id: 1, parent_item_id: nil, name: "root-a")
    root_b = RenderTraversalNode.new(id: 2, parent_item_id: nil, name: "root-b")
    child_a1 = RenderTraversalNode.new(id: 3, parent_item_id: 1, name: "child-a1")
    child_a2 = RenderTraversalNode.new(id: 4, parent_item_id: 1, name: "child-a2")
    grandchild_a1 = RenderTraversalNode.new(id: 5, parent_item_id: 3, name: "grandchild-a1")

    tree = TreeView::Tree.new(
      records: [root_a, root_b, child_a1, child_a2, grandchild_a1],
      parent_id_method: :parent_item_id
    )

    [tree, root_a, root_b, child_a1, child_a2, grandchild_a1]
  end

  it "calculates max depth for rendering" do
    tree, = build_tree

    expect(described_class.new(tree).max_depth).to eq(2)
  end

  it "calculates leaf distances for rendering" do
    tree, root_a, root_b, child_a1, child_a2, grandchild_a1 = build_tree
    traversal = described_class.new(tree)

    expect(traversal.leaf_distance_for(root_a)).to eq(1)
    expect(traversal.leaf_distance_for(root_b)).to eq(0)
    expect(traversal.leaf_distance_for(child_a1)).to eq(1)
    expect(traversal.leaf_distance_for(child_a2)).to eq(0)
    expect(traversal.leaf_distance_for(grandchild_a1)).to eq(0)
  end

  it "calculates branch info for rendering" do
    tree, root_a, root_b, child_a1, _child_a2, grandchild_a1 = build_tree
    traversal = described_class.new(tree)

    expect(traversal.branch_info_for(root_a)).to eq(depth: 0, ancestor_last_states: [], is_last: true)
    expect(traversal.branch_info_for(child_a1)).to eq(depth: 1, ancestor_last_states: [], is_last: true)
    expect(traversal.branch_info_for(grandchild_a1)).to eq(depth: 2, ancestor_last_states: [true], is_last: true)
    expect(traversal.branch_info_for(root_b)).to eq(depth: 0, ancestor_last_states: [], is_last: false)
  end
end
