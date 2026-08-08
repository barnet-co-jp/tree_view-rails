require "spec_helper"
CycleNodeForSpec = Struct.new(:id, :parent_id)

RSpec.describe "TreeView cycle diagnostics" do
  it "returns an empty report without cycles" do
    root = CycleNodeForSpec.new(id: 1, parent_id: nil)
    child = CycleNodeForSpec.new(id: 2, parent_id: 1)
    tree = TreeView::Tree.new(records: [root, child], parent_id_method: :parent_id)

    expect(tree.cycle_report).to eq([])
    expect(tree.validate_no_cycles!).to eq(true)
  end

  it "reports parent path cycles" do
    first = CycleNodeForSpec.new(id: 1, parent_id: 2)
    second = CycleNodeForSpec.new(id: 2, parent_id: 1)
    tree = TreeView::Tree.new(records: [first, second], parent_id_method: :parent_id)

    expect(tree.cycle_report.first[:cycle_keys]).to eq([1, 2])
    expect { tree.validate_no_cycles! }.to raise_error(ArgumentError, /cycle detected/)
  end
end
