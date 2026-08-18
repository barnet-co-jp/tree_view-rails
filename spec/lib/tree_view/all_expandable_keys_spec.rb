# frozen_string_literal: true

require "spec_helper"

RSpec.describe "TreeView::Tree#all_expandable_keys" do
  Node = Struct.new(:id, :parent_id)

  it "returns keys for reachable records that have children" do
    records = [
      Node.new(1, nil),
      Node.new(2, 1),
      Node.new(3, 2),
      Node.new(4, nil)
    ]
    tree = TreeView::Tree.new(records: records, parent_id_method: :parent_id, sorter: ->(items, _tree) { items })

    expect(tree.all_expandable_keys).to eq([1, 2])
  end

  it "works in resolver mode" do
    children = {
      root: [:branch],
      branch: [:leaf],
      leaf: []
    }
    tree = TreeView::Tree.new(
      roots: [:root],
      children_resolver: ->(node) { children.fetch(node) },
      node_key_resolver: ->(node) { node },
      sorter: ->(items, _tree) { items }
    )

    expect(tree.all_expandable_keys).to eq([:root, :branch])
  end

  it "works in adapter mode" do
    children = {
      root: [:branch],
      branch: [:leaf],
      leaf: []
    }
    adapter = TreeView::GraphAdapter.new(
      roots: [:root],
      children_resolver: ->(node) { children.fetch(node) },
      node_key_resolver: ->(node) { node }
    )
    tree = TreeView::Tree.new(adapter: adapter, sorter: ->(items, _tree) { items })

    expect(tree.all_expandable_keys).to eq([:root, :branch])
  end
end
