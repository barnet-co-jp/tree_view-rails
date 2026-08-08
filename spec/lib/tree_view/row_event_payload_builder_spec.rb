require "spec_helper"
RowEventNode = Struct.new(:id, :name)

RSpec.describe "TreeView row event payload builder" do
  let(:tree) { instance_double(TreeView::Tree) }
  let(:ui_config) { instance_double(TreeView::UiConfig) }

  it "stores a callable row event payload builder" do
    builder = ->(item) { {id: item.id} }

    state = TreeView::RenderState.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      row_event_payload_builder: builder
    )

    expect(state.row_event_payload_builder).to eq(builder)
  end

  it "rejects invalid row event payload builders" do
    expect do
      TreeView::RenderState.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        row_event_payload_builder: :invalid
      )
    end.to raise_error(ArgumentError, /row_event_payload_builder/)
  end

  it "builds transfer data attributes from a hash-like event payload" do
    helper = Object.new.extend(TreeViewHelper)
    item = RowEventNode.new(id: 1, name: "root")
    builder = ->(node) { {id: node.id, name: node.name} }

    allow(tree).to receive(:node_key_for).with(item).and_return("node-1")

    data = helper.tree_row_transfer_data(item, tree, builder)

    expect(data[:tree_transfer_node_key]).to eq("node-1")
    expect(JSON.parse(data[:tree_transfer_payload])).to eq("id" => 1, "name" => "root")
    expect(data[:action]).to include("dragstart->tree-view-transfer#start")
    expect(data[:action]).to include("dragover->tree-view-transfer#over")
    expect(data[:action]).to include("drop->tree-view-transfer#drop")
  end

  it "returns empty transfer data when no builder is given" do
    helper = Object.new.extend(TreeViewHelper)
    item = RowEventNode.new(id: 1, name: "root")

    expect(helper.tree_row_transfer_data(item, tree, nil)).to eq({})
  end

  it "raises a clear error when row event payload is not hash-like" do
    helper = Object.new.extend(TreeViewHelper)
    item = RowEventNode.new(id: 1, name: "root")

    allow(tree).to receive(:node_key_for).with(item).and_return("node-1")

    expect do
      helper.tree_row_transfer_data(item, tree, ->(_node) { "invalid" })
    end.to raise_error(ArgumentError, /row_event_payload_builder must return a Hash-like object/)
  end
end
