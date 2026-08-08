require "spec_helper"
FilterNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe TreeView::FilteredTree do
  let(:root) { FilterNode.new(id: 1, parent_item_id: nil, name: "root") }
  let(:child) { FilterNode.new(id: 2, parent_item_id: 1, name: "child") }
  let(:grandchild) { FilterNode.new(id: 3, parent_item_id: 2, name: "grandchild") }
  let(:sibling) { FilterNode.new(id: 4, parent_item_id: 2, name: "sibling") }
  let(:other_root) { FilterNode.new(id: 5, parent_item_id: nil, name: "other-root") }
  let(:tree) do
    TreeView::Tree.new(
      records: [root, child, grandchild, sibling, other_root],
      parent_id_method: :parent_item_id
    )
  end

  def keys_for(items, filtered_tree)
    Array(items).map { |item| filtered_tree.node_key_for(item) }
  end

  it "includes only matched nodes in matched_only mode" do
    filtered_tree = described_class.new(base_tree: tree, matched_items: [grandchild, sibling], mode: :matched_only)

    expect(keys_for(filtered_tree.root_items, filtered_tree)).to contain_exactly(grandchild.id, sibling.id)
    expect(filtered_tree.children_for(grandchild)).to eq([])
    expect(filtered_tree.children_for(sibling)).to eq([])
  end

  it "includes matched nodes and ancestors in with_ancestors mode" do
    filtered_tree = described_class.new(base_tree: tree, matched_items: [grandchild], mode: :with_ancestors)

    expect(filtered_tree.root_items).to eq([root])
    expect(filtered_tree.children_for(root)).to eq([child])
    expect(filtered_tree.children_for(child)).to eq([grandchild])
    expect(filtered_tree.children_for(grandchild)).to eq([])
    expect(filtered_tree.descendant_counts[root.id]).to eq(2)
  end

  it "includes matched nodes and descendants in with_descendants mode" do
    filtered_tree = described_class.new(base_tree: tree, matched_items: [child], mode: :with_descendants)

    expect(filtered_tree.root_items).to eq([child])
    expect(filtered_tree.children_for(child)).to eq([grandchild, sibling])
    expect(filtered_tree.children_for(grandchild)).to eq([])
    expect(filtered_tree.children_for(sibling)).to eq([])
    expect(filtered_tree.descendant_counts[child.id]).to eq(2)
  end

  it "includes matched nodes, ancestors, and descendants in with_ancestors_and_descendants mode" do
    filtered_tree = described_class.new(base_tree: tree, matched_items: [child], mode: :with_ancestors_and_descendants)

    expect(filtered_tree.root_items).to eq([root])
    expect(filtered_tree.children_for(root)).to eq([child])
    expect(filtered_tree.children_for(child)).to eq([grandchild, sibling])
    expect(filtered_tree.descendant_counts[root.id]).to eq(3)
  end

  it "can be created through Tree#filtered_tree_for" do
    filtered_tree = tree.filtered_tree_for([grandchild], mode: :with_ancestors)

    expect(filtered_tree).to be_a(described_class)
    expect(filtered_tree.children_for(child)).to eq([grandchild])
  end

  it "rejects invalid modes" do
    expect do
      described_class.new(base_tree: tree, matched_items: [child], mode: :unknown)
    end.to raise_error(ArgumentError, /filter mode must be one of/)
  end
end
