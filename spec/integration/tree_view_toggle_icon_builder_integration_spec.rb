require "spec_helper"
require "action_view"
require "fileutils"
require "tmpdir"

ToggleIconBuilderNode = Struct.new(:id, :parent_item_id, :name, :node_type)

RSpec.describe "TreeView toggle_icon_builder integration" do
  let(:root) { ToggleIconBuilderNode.new(id: 1, parent_item_id: nil, name: "root", node_type: :folder) }
  let(:child) { ToggleIconBuilderNode.new(id: 2, parent_item_id: 1, name: "child", node_type: :folder) }
  let(:leaf) { ToggleIconBuilderNode.new(id: 3, parent_item_id: 2, name: "leaf", node_type: :file) }
  let(:nodes) { [root, child, leaf] }
  let(:tree) { TreeView::Tree.new(records: nodes, parent_id_method: :parent_item_id) }
  let(:gem_view_path) { File.expand_path("../../app/views", __dir__) }
  let(:host_view_dir) { Dir.mktmpdir("tree_view_host_views") }

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

  def build_view(tree_ui:)
    view = ActionView::Base.with_empty_template_cache.with_view_paths([host_view_dir, gem_view_path], {}, nil)
    view.extend(TreeViewHelper)
    view.instance_variable_set(:@tree_ui, tree_ui)
    view
  end

  it "customizes static toggle content with state context" do
    tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
    render_state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "projects/tree_columns",
      ui_config: tree_ui,
      initial_state: :collapsed,
      toggle_icon_builder: ->(item, state, context) {
        {text: "#{state}:#{context[:depth]}:#{item.name}", class: "icon-#{state}"}
      }
    )
    view = build_view(tree_ui: nil)

    rendered = view.tree_view_rows(render_state)

    expect(rendered).to include('class="tree-toggle__icon icon-collapsed"')
    expect(rendered).to include("collapsed:0:root")
    expect(rendered).to include('aria-expanded="false"')
    expect(rendered).to include("tree-toggle__hidden-count")
  end

  it "customizes turbo toggle link labels while preserving link behavior and ARIA" do
    tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build(
      hide_descendants_path_builder: ->(item, depth, scope) { "/projects/#{item.id}/hide?depth=#{depth}&scope=#{scope}" },
      show_descendants_path_builder: ->(item, depth, scope) { "/projects/#{item.id}/show?depth=#{depth}&scope=#{scope}" },
      toggle_all_path_builder: ->(state) { "/projects/toggle_all?state=#{state}" }
    )
    render_state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "projects/tree_columns",
      ui_config: tree_ui,
      toggle_icon_builder: ->(item, state, _context) {
        {text: "#{state}:#{item.name}", class: ["chevron", "chevron-#{state}"]}
      }
    )
    view = build_view(tree_ui: nil)

    rendered = view.tree_view_rows(render_state, mode: :turbo)

    expect(rendered).to include("/projects/1/hide?depth=0&amp;scope=all")
    expect(rendered).to include('data-turbo-stream="true"')
    expect(rendered).to include('aria-expanded="true"')
    expect(rendered).to include('class="tree-toggle__icon chevron chevron-expanded"')
    expect(rendered).to include("expanded:root")
    expect(rendered).to include('class="tree-toggle__icon chevron chevron-leaf"')
    expect(rendered).to include("leaf:leaf")
  end

  it "selects toggle icons by type, depth, then state" do
    untyped_child = ToggleIconBuilderNode.new(id: 2, parent_item_id: 1, name: "child", node_type: nil)
    untyped_leaf = ToggleIconBuilderNode.new(id: 3, parent_item_id: 2, name: "leaf", node_type: nil)
    tree = TreeView::Tree.new(records: [root, untyped_child, untyped_leaf], parent_id_method: :parent_item_id)
    tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build(
      hide_descendants_path_builder: ->(item, depth, scope) { "/projects/#{item.id}/hide?depth=#{depth}&scope=#{scope}" },
      show_descendants_path_builder: ->(item, depth, scope) { "/projects/#{item.id}/show?depth=#{depth}&scope=#{scope}" },
      toggle_all_path_builder: ->(state) { "/projects/toggle_all?state=#{state}" }
    )
    render_state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "projects/tree_columns",
      ui_config: tree_ui,
      toggle_icons: {
        by_state: {
          expanded: "state-expanded",
          collapsed: "state-collapsed",
          leaf: "state-leaf"
        },
        by_depth: {
          1 => {expanded: "depth-1-expanded", collapsed: "depth-1-collapsed", leaf: "depth-1-leaf"}
        },
        by_type: {
          folder: {expanded: "folder-expanded", collapsed: "folder-collapsed"},
          file: {leaf: "file-leaf"}
        }
      }
    )
    view = build_view(tree_ui: nil)

    rendered = view.tree_view_rows(render_state, mode: :turbo)

    expect(rendered).to include("folder-expanded")
    expect(rendered).to include("depth-1-expanded")
    expect(rendered).to include("state-leaf")
  end

  it "uses toggle_icon_builder before toggle_icons when both are supplied" do
    tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
    render_state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "projects/tree_columns",
      ui_config: tree_ui,
      initial_state: :collapsed,
      toggle_icons: {
        by_state: {collapsed: "mapped-collapsed"}
      },
      toggle_icon_builder: ->(_item, state, _context) { "builder-#{state}" }
    )
    view = build_view(tree_ui: nil)

    rendered = view.tree_view_rows(render_state)

    expect(rendered).to include("builder-collapsed")
    expect(rendered).not_to include("mapped-collapsed")
  end
end
