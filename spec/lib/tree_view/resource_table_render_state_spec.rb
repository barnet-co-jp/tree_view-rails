# frozen_string_literal: true

require "spec_helper"

ResourceTableRenderStateSpecNode = Struct.new(:id, :parent_id, :name)

RSpec.describe TreeView::ResourceTableRenderState do
  let(:root) { ResourceTableRenderStateSpecNode.new(id: 1, parent_id: nil, name: "root") }
  let(:child) { ResourceTableRenderStateSpecNode.new(id: 2, parent_id: 1, name: "child") }
  let(:records) { [root, child] }
  let(:context) { Object.new }
  let(:ui_config) { instance_double(TreeView::UiConfig) }

  def build_state(**options)
    described_class.call(
      records: records,
      context: context,
      parent_id_method: :parent_id,
      table_key: "projects_tree",
      ui_config: ui_config,
      **options
    )
  end

  it "passes grouped RenderState options through the resource-table bridge" do
    state = build_state(
      initial_expansion: {default: :collapsed},
      selection: {enabled: true, checkbox_name: "selected_resources[]"},
      lazy_loading: {enabled: true, loaded_keys: [1], scope: "children"}
    )

    expect(state).to be_a(TreeView::RenderState)
    expect(state.effective_initial_state).to eq(:collapsed)
    expect(state.selection_enabled?).to eq(true)
    expect(state.selection_checkbox_name).to eq("selected_resources[]")
    expect(state.lazy_loading_enabled?).to eq(true)
    expect(state.lazy_loading_loaded_keys).to eq([1])
    expect(state.lazy_loading_scope).to eq("children")
  end

  it "keeps the bridge-owned row data hooks without a host builder" do
    state = build_state

    expect(state.row_data_builder.call(root)).to include(
      rails_ui_row: true,
      tree_view_resource_table_row: true,
      rails_table_preferences_table_key: "projects_tree"
    )
  end

  it "adds host row data while preserving bridge-owned hooks" do
    state = build_state(
      row_data_builder: ->(item, row_context = {}) { {resource_name: item.name, row_depth: row_context.fetch(:depth)} }
    )

    expect(state.row_data_builder.call(root, {depth: 0})).to include(
      resource_name: "root",
      row_depth: 0,
      rails_ui_row: true,
      tree_view_resource_table_row: true,
      rails_table_preferences_table_key: "projects_tree"
    )
  end

  it "keeps bridge-owned hooks when host data uses reserved keys" do
    state = build_state(
      row_data_builder: ->(_item) {
        {
          rails_ui_row: false,
          tree_view_resource_table_row: false,
          rails_table_preferences_table_key: "host_value",
          host_row_state: "locked"
        }
      }
    )

    expect(state.row_data_builder.call(root)).to include(
      host_row_state: "locked",
      rails_ui_row: true,
      tree_view_resource_table_row: true,
      rails_table_preferences_table_key: "projects_tree"
    )
  end

  it "treats nil host row data as empty data" do
    state = build_state(row_data_builder: ->(_item, _row_context = {}) {})

    expect(state.row_data_builder.call(root, {depth: 0})).to eq(
      rails_ui_row: true,
      tree_view_resource_table_row: true,
      rails_table_preferences_table_key: "projects_tree"
    )
  end

  it "keeps one-argument host row_data_builder callables compatible" do
    state = build_state(row_data_builder: ->(item) { {resource_name: item.name} })

    expect(state.row_data_builder.call(child, {depth: 1})).to include(
      resource_name: "child",
      tree_view_resource_table_row: true
    )
  end
end
