# frozen_string_literal: true

require "rails_helper"

BreadcrumbNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe TreeViewBreadcrumbHelper do
  def build_helper
    Class.new do
      include ActionView::Helpers::TagHelper
      include ActionView::Helpers::UrlHelper
      include TreeViewBreadcrumbHelper
    end.new
  end

  def build_tree
    root = BreadcrumbNode.new(id: 1, parent_item_id: nil, name: "Root")
    child = BreadcrumbNode.new(id: 2, parent_item_id: 1, name: "Child")
    grandchild = BreadcrumbNode.new(id: 3, parent_item_id: 2, name: "Grandchild")
    [TreeView::Tree.new(records: [root, child, grandchild], parent_id_method: :parent_item_id), root, child, grandchild]
  end

  it "renders a breadcrumb from root to current node" do
    tree, root, child, grandchild = build_tree
    helper = build_helper

    html = helper.tree_view_breadcrumb(
      tree,
      grandchild,
      label_builder: ->(item) { item.name },
      path_builder: ->(item) { "/nodes/#{item.id}" }
    )

    expect(html).to include("Root")
    expect(html).to include("Child")
    expect(html).to include("Grandchild")
    expect(html).to include('href="/nodes/1"')
    expect(html).to include('href="/nodes/2"')
    expect(html).not_to include('href="/nodes/3"')
    expect(html).to include('aria-current="page"')
  end

  it "renders plain labels when path_builder is omitted" do
    tree, = build_tree
    grandchild = tree.records.last
    helper = build_helper

    html = helper.tree_view_breadcrumb(tree, grandchild, label_builder: ->(item) { item.name })

    expect(html).to include("Root")
    expect(html).to include("Child")
    expect(html).to include("Grandchild")
    expect(html).not_to include("href=")
  end

  it "renders non-linkable ancestor crumbs as plain labels when path_builder returns nil" do
    tree, root, child, grandchild = build_tree
    helper = build_helper

    html = helper.tree_view_breadcrumb(
      tree,
      grandchild,
      label_builder: ->(item) { item.name },
      path_builder: ->(item) { item == child ? nil : "/nodes/#{item.id}" }
    )

    expect(html).to include('href="/nodes/1"')
    expect(html).to include("Child")
    expect(html).not_to include('href="/nodes/2"')
  end

  it "allows custom classes and separator" do
    tree, = build_tree
    grandchild = tree.records.last
    helper = build_helper

    html = helper.tree_view_breadcrumb(
      tree,
      grandchild,
      label_builder: ->(item) { item.name },
      separator: ">",
      nav_class: "crumb-nav",
      list_class: "crumb-list",
      item_class: "crumb-item",
      current_class: "crumb-current"
    )

    expect(html).to include("crumb-nav")
    expect(html).to include("crumb-list")
    expect(html).to include("crumb-item")
    expect(html).to include("crumb-current")
    expect(html).to include("&gt;")
  end

  it "merges additional HTML attributes into the breadcrumb container and list" do
    tree, = build_tree
    grandchild = tree.records.last
    helper = build_helper

    html = helper.tree_view_breadcrumb(
      tree,
      grandchild,
      label_builder: ->(item) { item.name },
      html: {data: {testid: "breadcrumb"}},
      list_html: {data: {role: "path"}}
    )

    expect(html).to include('data-testid="breadcrumb"')
    expect(html).to include('data-role="path"')
  end

  it "merges item-aware attributes into links and the current label" do
    tree, root, _child, grandchild = build_tree
    helper = build_helper

    html = helper.tree_view_breadcrumb(
      tree,
      grandchild,
      label_builder: ->(item) { item.name },
      path_builder: ->(item) { "/nodes/#{item.id}" },
      link_html: ->(item) { {data: {node_id: item.id}} },
      current_html: ->(item) { {data: {current_id: item.id}} }
    )

    expect(html).to include("data-node-id=\"#{root.id}\"")
    expect(html).to include("data-current-id=\"#{grandchild.id}\"")
  end

  it "merges item-aware attributes into separators while preserving hidden semantics" do
    tree, = build_tree
    grandchild = tree.records.last
    helper = build_helper

    html = helper.tree_view_breadcrumb(
      tree,
      grandchild,
      label_builder: ->(item) { item.name },
      separator_html: ->(item) { {data: {after_id: item.id}} }
    )

    expect(html).to include('aria-hidden="true"')
    expect(html).to include('data-after-id="1"')
  end

  it "rejects invalid HTML option values" do
    tree, = build_tree
    grandchild = tree.records.last
    helper = build_helper

    expect do
      helper.tree_view_breadcrumb(tree, grandchild, label_builder: ->(item) { item.name }, html: "invalid")
    end.to raise_error(ArgumentError, /html must be Hash-like or callable/)
  end

  it "rejects invalid item-aware HTML option return values" do
    tree, = build_tree
    grandchild = tree.records.last
    helper = build_helper

    expect do
      helper.tree_view_breadcrumb(
        tree,
        grandchild,
        label_builder: ->(item) { item.name },
        item_html: ->(_item) { "invalid" }
      )
    end.to raise_error(ArgumentError, /item_html must return Hash-like/)
  end

  it "rejects invalid builders" do
    tree, = build_tree
    node = tree.records.first
    helper = build_helper

    expect do
      helper.tree_view_breadcrumb(tree, node, label_builder: "name")
    end.to raise_error(ArgumentError, /label_builder must respond to call/)

    expect do
      helper.tree_view_breadcrumb(tree, node, label_builder: ->(item) { item.name }, path_builder: "path")
    end.to raise_error(ArgumentError, /path_builder must respond to call/)
  end

  it "uses Tree path errors for unsupported modes" do
    root = BreadcrumbNode.new(id: 1, parent_item_id: nil, name: "Root")
    tree = TreeView::Tree.new(roots: [root], children_resolver: ->(_item) { [] })
    helper = build_helper

    expect do
      helper.tree_view_breadcrumb(tree, root, label_builder: ->(item) { item.name })
    end.to raise_error(TreeView::ConfigurationError, /parent path helpers require records mode or an adapter with parent_resolver/)
  end
end
