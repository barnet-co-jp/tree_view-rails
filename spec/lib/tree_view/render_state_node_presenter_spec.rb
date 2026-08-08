# frozen_string_literal: true

require "spec_helper"

RenderStateNodePresenterTestNode = Struct.new(:id, :name, :kind)

RSpec.describe "RenderState node presenter integration" do
  let(:tree) { instance_double(TreeView::Tree) }
  let(:ui_config) { instance_double(TreeView::UiConfig) }
  let(:node) { RenderStateNodePresenterTestNode.new(id: 1, name: "Guide", kind: "document") }

  it "uses node presenter builders when individual builders are not provided" do
    presenter = TreeView::NodePresenter.define do
      row_class { |item| "tree-node--#{item.kind}" }
      row_data { |item| {node_kind: item.kind} }
      badge { |item| item.name }
      icon { |item| item.kind }
    end

    state = TreeView::RenderState.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      node_presenter: presenter
    )

    expect(state.node_presenter).to eq(presenter)
    expect(state.row_class_builder.call(node)).to eq("tree-node--document")
    expect(state.row_data_builder.call(node)).to eq({node_kind: "document"})
    expect(state.badge_builder.call(node)).to eq("Guide")
    expect(state.icon_builder.call(node)).to eq("document")
  end

  it "prefers individual builders over node presenter builders" do
    presenter = TreeView::NodePresenter.define do
      row_class { |_item| "from-presenter" }
      badge { |_item| "presenter" }
    end

    row_class_builder = ->(_item) { "from-render-state" }
    badge_builder = ->(_item) { "render-state" }

    state = TreeView::RenderState.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      node_presenter: presenter,
      row_class_builder: row_class_builder,
      badge_builder: badge_builder
    )

    expect(state.row_class_builder.call(node)).to eq("from-render-state")
    expect(state.badge_builder.call(node)).to eq("render-state")
  end

  it "rejects incompatible node presenter objects" do
    expect do
      TreeView::RenderState.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        node_presenter: Object.new
      )
    end.to raise_error(TreeView::ConfigurationError, /node_presenter/)
  end
end
