require "spec_helper"
BaselineNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe "TreeView large tree baselines" do
  def build_chain(size)
    Array.new(size) do |index|
      BaselineNode.new(
        id: index + 1,
        parent_item_id: index.zero? ? nil : index,
        name: "node-#{index + 1}"
      )
    end
  end

  def build_wide_tree(width)
    root = BaselineNode.new(id: 1, parent_item_id: nil, name: "root")
    children = Array.new(width) do |index|
      BaselineNode.new(id: index + 2, parent_item_id: 1, name: "child-#{index + 1}")
    end

    [root, *children]
  end

  it "counts descendants for a moderately deep chain" do
    records = build_chain(120)
    tree = TreeView::Tree.new(records: records, parent_id_method: :parent_item_id)
    counts = tree.descendant_counts

    expect(counts[1]).to eq(119)
    expect(counts[60]).to eq(60)
    expect(counts[120]).to eq(0)
  end

  it "counts descendants for a very deep chain without recursive stack growth" do
    records = build_chain(1_500)
    tree = TreeView::Tree.new(records: records, parent_id_method: :parent_item_id)

    expect { tree.descendant_counts }.not_to raise_error
    expect(tree.descendant_counts[1]).to eq(1_499)
    expect(tree.descendant_counts[1_500]).to eq(0)
  end

  it "counts descendants for a moderately wide tree" do
    records = build_wide_tree(250)
    tree = TreeView::Tree.new(records: records, parent_id_method: :parent_item_id)
    counts = tree.descendant_counts

    expect(tree.root_items.size).to eq(1)
    expect(counts[1]).to eq(250)
    expect(counts[251]).to eq(0)
  end
end
