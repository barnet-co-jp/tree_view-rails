require "spec_helper"
DiagnosticNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe "TreeView builder diagnostics" do
  let(:helper_host_class) do
    Class.new do
      include TreeViewHelper
    end
  end

  let(:helper) { helper_host_class.new }
  let(:node) { DiagnosticNode.new(id: 42, parent_item_id: nil, name: "sample") }
  let(:tree) { TreeView::Tree.new(records: [node], parent_id_method: :parent_item_id) }

  it "includes item id when row_data_builder returns an invalid value without tree context" do
    expect do
      helper.tree_row_data(node, ->(_item) { "invalid" })
    end.to raise_error(ArgumentError, /row_data_builder.*item_id=42/)
  end

  it "includes node key when row_data_builder returns an invalid value with tree context" do
    expect do
      helper.tree_row_data(node, ->(_item) { "invalid" }, tree: tree)
    end.to raise_error(ArgumentError, /row_data_builder.*node_key=42/)
  end

  it "includes node key when selection_payload_builder returns an invalid value" do
    expect do
      helper.tree_selection_payload(node, tree, ->(_item) { "invalid" })
    end.to raise_error(ArgumentError, /selection_payload_builder.*node_key=42/)
  end
end
