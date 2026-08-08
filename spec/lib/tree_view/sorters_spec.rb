require "spec_helper"
SortPresetNode = Struct.new(:id, :parent_id, :position, :name)

RSpec.describe TreeView::Sorters do
  it "sorts by one or more methods" do
    first = SortPresetNode.new(id: 1, parent_id: nil, position: 2, name: "B")
    second = SortPresetNode.new(id: 2, parent_id: nil, position: 1, name: "C")
    third = SortPresetNode.new(id: 3, parent_id: nil, position: 1, name: "A")

    tree = TreeView::Tree.new(
      records: [first, second, third],
      parent_id_method: :parent_id,
      sorter: described_class.by(:position, :name)
    )

    expect(tree.root_items).to eq([third, second, first])
  end
end
