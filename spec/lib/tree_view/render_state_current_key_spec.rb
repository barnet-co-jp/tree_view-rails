require "spec_helper"

CurrentKeyTestNode = Struct.new(:id, :parent_id, :name)

RSpec.describe TreeView::RenderState, "current_key" do
  let(:ui_config) { instance_double(TreeView::UiConfig) }

  it "honors the direct current_key keyword and expands its ancestors" do
    root = CurrentKeyTestNode.new(id: 1, parent_id: nil, name: "Root")
    folder = CurrentKeyTestNode.new(id: 2, parent_id: 1, name: "Folder")
    document = CurrentKeyTestNode.new(id: 3, parent_id: 2, name: "Document")
    tree = TreeView::Tree.new(records: [root, folder, document], parent_id_method: :parent_id)

    state = described_class.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      current_key: 3,
      auto_expand_ancestors: true,
      initial_expansion: {default: :collapsed}
    )

    expect(state.current_key).to eq(3)
    expect(state.expanded_keys).to eq([1, 2])
  end

  it "prefers the direct current_key keyword over grouped initial_expansion" do
    tree = instance_double(TreeView::Tree)

    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      current_key: "direct",
      initial_expansion: {current_key: "grouped"}
    )

    expect(state.current_key).to eq("direct")
  end
end
