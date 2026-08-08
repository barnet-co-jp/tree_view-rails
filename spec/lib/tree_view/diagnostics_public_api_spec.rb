# frozen_string_literal: true

require "spec_helper"

DiagnosticsPublicApiTestNode = Struct.new(:id, :parent_id, :name)

RSpec.describe TreeView::Diagnostics do
  def dom_id_suffix(item_or_id)
    return item_or_id.id if item_or_id.respond_to?(:id)

    item_or_id
  end

  def public_tree
    root = DiagnosticsPublicApiTestNode.new(id: 1, parent_id: nil, name: "Root")
    child = DiagnosticsPublicApiTestNode.new(id: 2, parent_id: 1, name: "Child")

    TreeView::Tree.new(records: [root, child], parent_id_method: :parent_id)
  end

  def public_ui_config
    TreeView::UiConfig.new(
      node_dom_id_builder: ->(item_or_id) { "node_#{dom_id_suffix(item_or_id)}" },
      button_dom_id_builder: ->(item_or_id) { "node_button_#{dom_id_suffix(item_or_id)}" },
      show_button_dom_id_builder: ->(item_or_id) { "node_show_button_#{dom_id_suffix(item_or_id)}" }
    )
  end

  def public_render_state(tree)
    TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "items/tree_columns",
      ui_config: public_ui_config
    )
  end

  it "returns a successful Result for the default diagnostics checks" do
    tree = public_tree
    result = described_class.run(tree: tree, render_state: public_render_state(tree))

    expect(result).to be_a(TreeView::Diagnostics::Result)
    expect(result.checks).to eq(TreeView::Diagnostics::DEFAULT_CHECKS)
    expect(result.errors).to eq([])
    expect(result.warnings).to eq([])
    expect(result.success?).to be(true)
  end

  it "runs only the requested diagnostics checks" do
    tree = public_tree
    result = described_class.run(render_state: public_render_state(tree), checks: :dom_ids)

    expect(result.checks).to eq([:dom_ids])
    expect(result.errors).to eq([])
    expect(result.success?).to be(true)
  end

  it "records unknown checks unless raise_errors is enabled" do
    result = described_class.run(tree: public_tree, checks: :unknown)

    expect(result.success?).to be(false)
    expect(result.errors.length).to eq(1)
    expect(result.errors.first).to include(check: :unknown)
    expect(result.errors.first.fetch(:error)).to be_a(TreeView::ConfigurationError)
    expect(result.errors.first.fetch(:message)).to include("unknown diagnostics check: :unknown")

    expect do
      described_class.run(tree: public_tree, checks: :unknown, raise_errors: true)
    end.to raise_error(TreeView::ConfigurationError, /unknown diagnostics check: :unknown/)
  end

  it "reports representative missing input errors" do
    missing_tree = described_class.run(checks: :node_keys)
    missing_render_state = described_class.run(tree: public_tree, checks: :dom_ids)

    expect(missing_tree.success?).to be(false)
    expect(missing_tree.errors.first).to include(check: :node_keys)
    expect(missing_tree.errors.first.fetch(:message)).to eq("node_keys diagnostics require tree: or render_state:")

    expect(missing_render_state.success?).to be(false)
    expect(missing_render_state.errors.first).to include(check: :dom_ids)
    expect(missing_render_state.errors.first.fetch(:message)).to eq("dom_ids diagnostics require render_state:")
  end
end
