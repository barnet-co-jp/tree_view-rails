# frozen_string_literal: true

require "spec_helper"

TreeViewErrorMessageSpecNode = Struct.new(:id, :parent_id)

RSpec.describe "TreeView error message quality" do
  def build_node(id, parent_id = nil)
    TreeViewErrorMessageSpecNode.new(id: id, parent_id: parent_id)
  end

  def build_tree(records, **options)
    TreeView::Tree.new(records: records, parent_id_method: :parent_id, **options)
  end

  def ui_config
    TreeView::UiConfig.new(
      node_dom_id_builder: ->(item_or_id) { "node_#{item_or_id.respond_to?(:id) ? item_or_id.id : item_or_id}" },
      button_dom_id_builder: ->(item_or_id) { "node_button_#{item_or_id.respond_to?(:id) ? item_or_id.id : item_or_id}" },
      show_button_dom_id_builder: ->(item_or_id) { "node_show_button_#{item_or_id.respond_to?(:id) ? item_or_id.id : item_or_id}" }
    )
  end

  def build_render_state(tree:, **options)
    TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "documents/tree_row",
      ui_config: ui_config,
      **options
    )
  end

  it "describes unknown grouped option keys with supported keys" do
    tree = build_tree([build_node(1)])

    expect do
      build_render_state(tree: tree, render_scope: {max_depths: 2})
    end.to raise_error(
      TreeView::ConfigurationError,
      /render_scope contains unknown keys: max_depths; supported keys are: max_depth, max_leaf_distance/
    )
  end

  it "describes invalid enum-like initial_state values with allowed choices" do
    tree = build_tree([build_node(1)])

    expect do
      build_render_state(tree: tree, initial_state: :sideways)
    end.to raise_error(
      TreeView::ConfigurationError,
      /initial_state must be one of: expanded, collapsed; use :expanded or :collapsed/
    )
  end

  it "describes non-boolean boolean options with a fix direction" do
    tree = build_tree([build_node(1)])

    expect do
      build_render_state(tree: tree, auto_expand_ancestors: "yes")
    end.to raise_error(
      TreeView::ConfigurationError,
      /auto_expand_ancestors must be true or false; pass true, false, or nil/
    )
  end

  it "describes conflicting expansion keys with the offending key" do
    tree = build_tree([build_node(1)])

    expect do
      build_render_state(tree: tree, expanded_keys: ["node:1"], collapsed_keys: ["node:1"])
    end.to raise_error(
      TreeView::ConfigurationError,
      /expanded_keys and collapsed_keys cannot include the same keys: "node:1"; remove each key from one side/
    )
  end

  it "describes non-callable builders with the expected contract" do
    expect do
      build_tree([build_node(1)], sorter: Object.new)
    end.to raise_error(
      TreeView::ConfigurationError,
      /sorter must respond to call; pass a callable such as ->\(items, tree\) \{ items \}/
    )
  end

  it "describes invalid orphan strategies with allowed values" do
    expect do
      build_tree([build_node(1)], orphan_strategy: :lift)
    end.to raise_error(
      TreeView::ConfigurationError,
      /orphan_strategy must be one of: ignore, as_root, raise, orphans_only; choose how records with missing parents should be handled/
    )
  end

  it "describes duplicate node keys with the offending key and next step" do
    tree = build_tree([build_node(1), build_node(1)])

    expect do
      tree.validate_unique_node_keys!
    end.to raise_error(
      TreeView::DuplicateNodeKeyError,
      /duplicate node_key detected: 1; configure node_key_resolver or ensure records expose unique IDs before rendering/
    )
  end

  it "describes invalid render-window offsets with the valid range" do
    expect do
      TreeView::RenderWindow.new([], offset: -1, limit: 10)
    end.to raise_error(
      TreeView::InvalidRenderWindowError,
      /offset must be a non-negative Integer; pass 0 or a positive row offset/
    )
  end

  it "describes invalid render-window limits with the expected meaning" do
    expect do
      TreeView::RenderWindow.new([], offset: 0, limit: 0)
    end.to raise_error(
      TreeView::InvalidRenderWindowError,
      /limit must be a positive Integer; pass the maximum number of rows to render/
    )
  end
end
