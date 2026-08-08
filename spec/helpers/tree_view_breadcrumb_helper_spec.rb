require "spec_helper"
require "action_view"

BreadcrumbNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe TreeViewBreadcrumbHelper do
  def build_helper
    view = ActionView::Base.empty
    view.extend(TreeViewBreadcrumbHelper)
    view
  end

  def build_tree(records)
    TreeView::Tree.new(records: records, parent_id_method: :parent_item_id)
  end

  it "renders a breadcrumb from root to current node" do
    root = BreadcrumbNode.new(id: 1, parent_item_id: nil, name: "Root")
    child = BreadcrumbNode.new(id: 2, parent_item_id: 1, name: "Child")
    grandchild = BreadcrumbNode.new(id: 3, parent_item_id: 2, name: "Grandchild")
    tree = build_tree([root, child, grandchild])
    helper = build_helper

    rendered = helper.tree_view_breadcrumb(
      tree,
      grandchild,
      label_builder: ->(item) { item.name },
      path_builder: ->(item) { "/nodes/#{item.id}" }
    )

    expect(rendered).to include('class="tree-view-breadcrumb"')
    expect(rendered).to include('href="/nodes/1"')
    expect(rendered).to include('href="/nodes/2"')
    expect(rendered).to include('class="tree-view-breadcrumb__current"')
    expect(rendered).to include('aria-current="page"')
    expect(rendered).to include("Grandchild")
  end

  it "renders non-linkable ancestor crumbs as plain labels when path_builder returns nil" do
    root = BreadcrumbNode.new(id: 1, parent_item_id: nil, name: "Root")
    child = BreadcrumbNode.new(id: 2, parent_item_id: 1, name: "Child")
    grandchild = BreadcrumbNode.new(id: 3, parent_item_id: 2, name: "Grandchild")
    tree = build_tree([root, child, grandchild])
    helper = build_helper

    rendered = helper.tree_view_breadcrumb(
      tree,
      grandchild,
      label_builder: ->(item) { item.name },
      path_builder: ->(item) { (item == root) ? nil : "/nodes/#{item.id}" },
      link_html: ->(item) { {data: {crumb_id: item.id}} }
    )

    expect(rendered).to include('<span class="tree-view-breadcrumb__link">Root</span>')
    expect(rendered).not_to include('data-crumb-id="1"')
    expect(rendered).to include('href="/nodes/2"')
    expect(rendered).to include('data-crumb-id="2"')
    expect(rendered).not_to include('href=""')
    expect(rendered.scan('aria-current="page"').length).to eq(1)
  end

  it "renders plain labels when path_builder is omitted" do
    root = BreadcrumbNode.new(id: 1, parent_item_id: nil, name: "Root")
    child = BreadcrumbNode.new(id: 2, parent_item_id: 1, name: "Child")
    tree = build_tree([root, child])
    helper = build_helper

    rendered = helper.tree_view_breadcrumb(
      tree,
      child,
      label_builder: ->(item) { item.name }
    )

    expect(rendered).to include("Root")
    expect(rendered).to include("Child")
    expect(rendered).not_to include("href=")
  end

  it "allows custom classes and separator" do
    root = BreadcrumbNode.new(id: 1, parent_item_id: nil, name: "Root")
    child = BreadcrumbNode.new(id: 2, parent_item_id: 1, name: "Child")
    tree = build_tree([root, child])
    helper = build_helper

    rendered = helper.tree_view_breadcrumb(
      tree,
      child,
      label_builder: ->(item) { item.name },
      path_builder: ->(item) { "/nodes/#{item.id}" },
      separator: "/",
      nav_class: "breadcrumb",
      list_class: "breadcrumb-list",
      item_class: "breadcrumb-item",
      link_class: "breadcrumb-link",
      current_class: "breadcrumb-current",
      separator_class: "breadcrumb-separator",
      aria_label: "Node path"
    )

    expect(rendered).to include('class="breadcrumb"')
    expect(rendered).to include('class="breadcrumb-list"')
    expect(rendered).to include('class="breadcrumb-item"')
    expect(rendered).to include('class="breadcrumb-link"')
    expect(rendered).to include('class="breadcrumb-current"')
    expect(rendered).to include('class="breadcrumb-separator"')
    expect(rendered).to include('aria-label="Node path"')
  end

  it "merges additional HTML attributes into the breadcrumb container and list" do
    root = BreadcrumbNode.new(id: 1, parent_item_id: nil, name: "Root")
    child = BreadcrumbNode.new(id: 2, parent_item_id: 1, name: "Child")
    tree = build_tree([root, child])
    helper = build_helper

    rendered = helper.tree_view_breadcrumb(
      tree,
      child,
      label_builder: ->(item) { item.name },
      html: {class: "app-breadcrumb", data: {controller: "analytics"}, aria: {describedby: "breadcrumb-help"}},
      list_html: {data: {testid: "node-path"}},
      aria_label: "Node path"
    )

    expect(rendered).to include('class="tree-view-breadcrumb app-breadcrumb"')
    expect(rendered).to include('data-controller="analytics"')
    expect(rendered).to include('aria-describedby="breadcrumb-help"')
    expect(rendered).to include('aria-label="Node path"')
    expect(rendered).to include('data-testid="node-path"')
  end

  it "merges item-aware attributes into links and the current label" do
    root = BreadcrumbNode.new(id: 1, parent_item_id: nil, name: "Root")
    child = BreadcrumbNode.new(id: 2, parent_item_id: 1, name: "Child")
    tree = build_tree([root, child])
    helper = build_helper

    rendered = helper.tree_view_breadcrumb(
      tree,
      child,
      label_builder: ->(item) { item.name },
      path_builder: ->(item) { "/nodes/#{item.id}" },
      item_html: ->(item) { {data: {node_id: item.id}} },
      link_html: ->(item) { {rel: "up", data: {action_id: item.id}} },
      current_html: ->(item) { {class: "is-current", data: {current_id: item.id}, aria: {label: "Current #{item.name}"}} }
    )

    expect(rendered).to include('data-node-id="1"')
    expect(rendered).to include('data-node-id="2"')
    expect(rendered).to include('href="/nodes/1"')
    expect(rendered).to include('rel="up"')
    expect(rendered).to include('data-action-id="1"')
    expect(rendered).to include('class="tree-view-breadcrumb__current is-current"')
    expect(rendered).to include('data-current-id="2"')
    expect(rendered).to include('aria-label="Current Child"')
    expect(rendered).to include('aria-current="page"')
  end

  it "merges item-aware attributes into separators while preserving hidden semantics" do
    root = BreadcrumbNode.new(id: 1, parent_item_id: nil, name: "Root")
    child = BreadcrumbNode.new(id: 2, parent_item_id: 1, name: "Child")
    tree = build_tree([root, child])
    helper = build_helper

    rendered = helper.tree_view_breadcrumb(
      tree,
      child,
      label_builder: ->(item) { item.name },
      path_builder: ->(item) { "/nodes/#{item.id}" },
      separator_html: ->(item) { {class: "app-separator", data: {after_node: item.id}} }
    )

    expect(rendered).to include('class="tree-view-breadcrumb__separator app-separator"')
    expect(rendered).to include('data-after-node="1"')
    expect(rendered).to include('aria-hidden="true"')
  end

  it "rejects invalid HTML option values" do
    node = BreadcrumbNode.new(id: 1, parent_item_id: nil, name: "Root")
    tree = build_tree([node])
    helper = build_helper

    expect do
      helper.tree_view_breadcrumb(tree, node, label_builder: ->(item) { item.name }, html: "nav")
    end.to raise_error(ArgumentError, /html must be a Hash-like object or callable returning one/)

    expect do
      helper.tree_view_breadcrumb(tree, node, label_builder: ->(item) { item.name }, list_html: "list")
    end.to raise_error(ArgumentError, /list_html must be a Hash-like object or callable returning one/)
  end

  it "rejects invalid item-aware HTML option return values" do
    root = BreadcrumbNode.new(id: 1, parent_item_id: nil, name: "Root")
    child = BreadcrumbNode.new(id: 2, parent_item_id: 1, name: "Child")
    tree = build_tree([root, child])
    helper = build_helper

    expect do
      helper.tree_view_breadcrumb(
        tree,
        child,
        label_builder: ->(item) { item.name },
        path_builder: ->(item) { "/nodes/#{item.id}" },
        link_html: ->(_item) { "link" }
      )
    end.to raise_error(ArgumentError, /link_html must be a Hash-like object or callable returning one/)

    expect do
      helper.tree_view_breadcrumb(
        tree,
        child,
        label_builder: ->(item) { item.name },
        current_html: ->(_item) { "current" }
      )
    end.to raise_error(ArgumentError, /current_html must be a Hash-like object or callable returning one/)
  end

  it "rejects invalid builders" do
    node = BreadcrumbNode.new(id: 1, parent_item_id: nil, name: "Root")
    tree = build_tree([node])
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
    end.to raise_error(ArgumentError, /only supported in records mode/)
  end
end
