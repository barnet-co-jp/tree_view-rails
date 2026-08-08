# frozen_string_literal: true

require "spec_helper"
require "action_view"
require "fileutils"
require "tmpdir"

AccessibilityNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe "TreeView accessibility semantics" do
  let(:root) { AccessibilityNode.new(id: 1, parent_item_id: nil, name: "root") }
  let(:child) { AccessibilityNode.new(id: 2, parent_item_id: 1, name: "child") }
  let(:leaf) { AccessibilityNode.new(id: 3, parent_item_id: 2, name: "leaf") }
  let(:tree) { TreeView::Tree.new(records: [root, child, leaf], parent_id_method: :parent_item_id) }
  let(:tree_ui) { TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static }
  let(:gem_view_path) { File.expand_path("../../app/views", __dir__) }
  let(:host_view_dir) { Dir.mktmpdir("tree_view_accessibility_views") }

  before do
    FileUtils.mkdir_p(File.join(host_view_dir, "projects"))
    File.write(
      File.join(host_view_dir, "projects", "_tree_columns.html.erb"),
      '<td class="project-cell"><%= item.name %></td>'
    )
  end

  after do
    FileUtils.remove_entry(host_view_dir) if Dir.exist?(host_view_dir)
  end

  def build_view
    view = ActionView::Base.with_empty_template_cache.with_view_paths([host_view_dir, gem_view_path], {}, nil)
    view.extend(TreeViewHelper)
    view
  end

  def render_rows(**render_state_options)
    options = {
      tree: tree,
      root_items: tree.root_items,
      row_partial: "projects/tree_columns",
      ui_config: tree_ui
    }.merge(render_state_options)
    render_state = TreeView::RenderState.new(**options)

    build_view.tree_view_rows(render_state)
  end

  it "documents current table-first ARIA row semantics for static rendering" do
    rendered = render_rows(current_key: tree.node_key_for(child))

    expect(rendered).to include('id="project_1"')
    expect(rendered).to include('aria-level="1"')
    expect(rendered).to include('aria-expanded="true"')
    expect(rendered).to include('id="project_2"')
    expect(rendered).to include('aria-level="2"')
    expect(rendered).to include('aria-current="page"')
    expect(rendered).not_to include('role="tree"')
    expect(rendered).not_to include('role="treeitem"')
  end

  it "protects collapsed branch ARIA semantics" do
    rendered = render_rows(initial_state: :collapsed)

    expect(rendered).to include('id="project_1"')
    expect(rendered).to include('aria-expanded="false"')
    expect(rendered).not_to include('id="project_2"')
  end

  it "protects checkbox selection ARIA semantics" do
    rendered = render_rows(
      selection: {
        enabled: true,
        selected_keys: [tree.node_key_for(child)]
      }
    )

    expect(rendered).to include('id="project_1"')
    expect(rendered).to include('aria-selected="false"')
    expect(rendered).to include('id="project_2"')
    expect(rendered).to include('aria-selected="true"')
  end

  it "protects windowed rendering ARIA semantics" do
    render_state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "projects/tree_columns",
      ui_config: tree_ui
    )

    rendered = build_view.tree_view_rows(render_state, window: {offset: 1, limit: 1})

    expect(rendered).to include('id="project_2"')
    expect(rendered).to include('aria-level="2"')
    expect(rendered).to include('aria-expanded="true"')
    expect(rendered).not_to include('id="project_1"')
  end
end
