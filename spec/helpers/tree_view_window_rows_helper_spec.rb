# frozen_string_literal: true

require "spec_helper"

TreeViewWindowRowsHelperSpecNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe "tree_view_rows window option" do
  let(:ui_config) do
    TreeView::UiConfig.new(
      node_dom_id_builder: ->(item_or_id) { dom_id_for(item_or_id, "item") },
      button_dom_id_builder: ->(item_or_id) { dom_id_for(item_or_id, "item_button_box") },
      show_button_dom_id_builder: ->(item_or_id) { dom_id_for(item_or_id, "item_show_button") }
    )
  end

  let(:helper_host_class) do
    Class.new do
      include TreeViewHelper

      attr_reader :render_calls

      def initialize(tree_ui: nil)
        @tree_ui = tree_ui
        @render_calls = []
      end

      def render(**options)
        render_calls << options
        options
      end
    end
  end

  let(:nodes) do
    [
      TreeViewWindowRowsHelperSpecNode.new(id: 1, parent_item_id: nil, name: "Root"),
      TreeViewWindowRowsHelperSpecNode.new(id: 2, parent_item_id: 1, name: "Child A"),
      TreeViewWindowRowsHelperSpecNode.new(id: 3, parent_item_id: 1, name: "Child B")
    ]
  end
  let(:tree) do
    TreeView::Tree.new(
      records: nodes,
      parent_id_method: :parent_item_id,
      sorter: ->(items, _tree) { items.sort_by(&:id) }
    )
  end

  def dom_id_for(item_or_id, prefix)
    identifier = item_or_id.respond_to?(:id) ? item_or_id.id : item_or_id
    "#{prefix}_#{identifier}"
  end

  def build_render_state(tree:, ui_config:, empty_message: nil)
    render_state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "items/tree_columns",
      ui_config: ui_config
    )
    render_state.define_singleton_method(:empty_message) { empty_message }
    render_state
  end

  it "renders hash window options through the window row partial" do
    helper = helper_host_class.new(tree_ui: ui_config)
    render_state = build_render_state(tree: tree, ui_config: ui_config)

    result = helper.tree_view_rows(render_state, window: {offset: 1, limit: 2})

    expect(result[:partial]).to eq("tree_view/tree_window_row")
    expect(result[:as]).to eq(:visible_row)
    expect(result[:collection].map(&:node_key)).to eq([2, 3])
    expect(result[:locals].fetch(:render_context).render_state).to eq(render_state)
    expect(helper.render_calls).to contain_exactly(result)
  end

  it "accepts a prebuilt RenderWindow instance" do
    helper = helper_host_class.new(tree_ui: ui_config)
    render_state = build_render_state(tree: tree, ui_config: ui_config)
    window = helper.tree_view_window(render_state, offset: 0, limit: 1)

    result = helper.tree_view_rows(render_state, window: window)

    expect(result[:partial]).to eq("tree_view/tree_window_row")
    expect(result[:collection]).to eq(window.rows)
    expect(result[:collection].map(&:node_key)).to eq([1])
  end

  it "raises a clear error for unsupported window objects" do
    helper = helper_host_class.new(tree_ui: ui_config)
    render_state = build_render_state(tree: tree, ui_config: ui_config)

    expect do
      helper.tree_view_rows(render_state, window: Object.new)
    end.to raise_error(ArgumentError, /window must be a TreeView::RenderWindow or Hash-like object/)
  end

  it "renders the empty row partial for empty windows with an empty message" do
    helper = helper_host_class.new(tree_ui: ui_config)
    render_state = build_render_state(tree: tree, ui_config: ui_config, empty_message: "No matching nodes")

    result = helper.tree_view_rows(render_state, window: {offset: 20, limit: 5})

    expect(result).to eq(
      partial: "tree_view/tree_empty_row",
      locals: {empty_message: "No matching nodes"}
    )
  end
end
