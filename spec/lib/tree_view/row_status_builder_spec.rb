require "spec_helper"
RowStatusSpecNode = Struct.new(:id, :parent_item_id, :name, :locked, :readonly)

RSpec.describe "TreeView row status builders" do
  let(:root) { RowStatusSpecNode.new(id: 1, parent_item_id: nil, name: "root", locked: true, readonly: false) }
  let(:child) { RowStatusSpecNode.new(id: 2, parent_item_id: 1, name: "child", locked: false, readonly: true) }
  let(:tree) { TreeView::Tree.new(records: [root, child], parent_id_method: :parent_item_id) }
  let(:ui_config) { instance_double(TreeView::UiConfig) }

  it "combines status classes with host classes" do
    state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      row_class_builder: ->(item) { "host-#{item.name}" },
      row_disabled_builder: ->(item) { item.locked },
      row_readonly_builder: ->(item) { item.readonly }
    )

    expect(state.row_class_builder.call(root)).to include("host-root", "tree-view-row--disabled")
    expect(state.row_class_builder.call(child)).to include("host-child", "tree-view-row--readonly")
  end

  it "combines status data with host data" do
    state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      row_data_builder: ->(item) { {name: item.name} },
      row_disabled_builder: ->(item) { item.locked },
      row_readonly_builder: ->(item) { item.readonly },
      row_disabled_reason_builder: ->(item) { item.locked ? "locked" : nil }
    )

    expect(state.row_data_builder.call(root)).to include(name: "root", tree_view_row_disabled: true, tree_view_row_disabled_reason: "locked")
    expect(state.row_data_builder.call(child)).to include(name: "child", tree_view_row_readonly: true)
  end

  it "preserves host data while TreeView-owned status keys describe row status" do
    state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      row_data_builder: ->(item) { {name: item.name, tree_view_row_disabled: false, tree_view_row_disabled_reason: "host"} },
      row_disabled_builder: ->(item) { item.locked },
      row_disabled_reason_builder: ->(item) { item.locked ? "locked" : nil }
    )

    expect(state.row_data_builder.call(root)).to include(
      name: "root",
      tree_view_row_disabled: true,
      tree_view_row_disabled_reason: "locked"
    )
  end
end
