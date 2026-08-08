require "spec_helper"
require "action_view"
require "fileutils"
require "tmpdir"
ToggleLeafNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe "TreeView leaf-based toggle scope integration" do
  let(:root) { ToggleLeafNode.new(id: 1, parent_item_id: nil, name: "root") }
  let(:child) { ToggleLeafNode.new(id: 2, parent_item_id: 1, name: "child") }
  let(:grandchild) { ToggleLeafNode.new(id: 3, parent_item_id: 2, name: "grandchild") }
  let(:leaf) { ToggleLeafNode.new(id: 4, parent_item_id: 3, name: "leaf") }
  let(:tree) { TreeView::Tree.new(records: [root, child, grandchild, leaf], parent_id_method: :parent_item_id) }
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

  def build_view
    view = ActionView::Base.with_empty_template_cache.with_view_paths([host_view_dir, gem_view_path], {}, nil)
    view.extend(TreeViewHelper)
    view
  end

  it "passes leaf distance information to object toggle scope" do
    tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build(
      hide_descendants_path_builder: ->(item, depth, scope) {
        "/projects/#{item.id}/hide?depth=#{depth}&toggle_leaf_distance=#{scope.toggle_leaf_distance}&within_scope=#{scope.within_scope?}"
      },
      show_descendants_path_builder: ->(item, depth, scope) {
        "/projects/#{item.id}/show?depth=#{depth}&toggle_leaf_distance=#{scope.toggle_leaf_distance}&within_scope=#{scope.within_scope?}"
      },
      toggle_all_path_builder: ->(state) { "/projects/toggle_all?state=#{state}" },
      scope_format: :object
    )
    render_state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "projects/tree_columns",
      ui_config: tree_ui,
      max_toggle_leaf_distance: 2
    )
    view = build_view

    rendered = view.tree_view_rows(render_state)

    expect(rendered).to include("/projects/3/hide?depth=2&amp;toggle_leaf_distance=2&amp;within_scope=true")
    expect(rendered).to include("/projects/2/hide?depth=1&amp;toggle_leaf_distance=2&amp;within_scope=false")
  end
end
