# frozen_string_literal: true

require "spec_helper"
require "yaml"

RSpec.describe "tree_view_window public helper option contract" do
  let(:manifest_path) { File.expand_path("../config/public_api_manifest.yml", __dir__) }
  let(:public_helper_option_keys) { YAML.safe_load_file(manifest_path).fetch("helper_option_keys") }

  it "keeps tree_view_window helper option keys aligned with the public helper signature" do
    helper_class = Class.new do
      include TreeViewHelper
    end
    helper = helper_class.new

    expected_keywords = public_helper_option_keys.fetch("tree_view_window")
    actual_required_keywords = helper.method(:tree_view_window).parameters.filter_map do |parameter_type, parameter_name|
      parameter_name.to_s if parameter_type == :keyreq
    end

    expect(actual_required_keywords).to eq(expected_keywords),
      "expected TreeViewHelper#tree_view_window required keywords to match the public helper option contract"
  end

  it "keeps representative tree_view_window metadata available" do
    node = Struct.new(:id, :parent_id, :name)
    root = node.new(id: 1, parent_id: nil, name: "Root")
    child = node.new(id: 2, parent_id: 1, name: "Child")
    tree = TreeView::Tree.new(records: [root, child], parent_id_method: :parent_id)
    ui_config = TreeView::UiConfig.new(
      node_dom_id_builder: ->(item_or_id) { "node_#{item_or_id.respond_to?(:id) ? item_or_id.id : item_or_id}" },
      button_dom_id_builder: ->(item_or_id) { "node_button_#{item_or_id.respond_to?(:id) ? item_or_id.id : item_or_id}" },
      show_button_dom_id_builder: ->(item_or_id) { "node_show_button_#{item_or_id.respond_to?(:id) ? item_or_id.id : item_or_id}" }
    )
    render_state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "items/tree_columns",
      ui_config: ui_config
    )
    helper_class = Class.new do
      include TreeViewHelper
    end
    helper = helper_class.new

    window = helper.tree_view_window(render_state, offset: 0, limit: 1)

    expect(public_helper_option_keys.fetch("tree_view_window")).to eq(%w[offset limit])
    expect(window).to be_a(TreeView::RenderWindow)
    expect(window.offset).to eq(0)
    expect(window.limit).to eq(1)
    expect(window.rows.length).to eq(1)
  end
end
