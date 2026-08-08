require "spec_helper"
require "action_view"
require "fileutils"
require "tmpdir"

ClientModeNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe "TreeView client-side toggle mode" do
  let(:root) { ClientModeNode.new(id: 1, parent_item_id: nil, name: "root") }
  let(:child) { ClientModeNode.new(id: 2, parent_item_id: 1, name: "child") }
  let(:grandchild) { ClientModeNode.new(id: 3, parent_item_id: 2, name: "grandchild") }
  let(:sibling) { ClientModeNode.new(id: 4, parent_item_id: 1, name: "sibling") }
  let(:tree) { TreeView::Tree.new(records: [root, child, grandchild, sibling], parent_id_method: :parent_item_id) }
  let(:gem_view_path) { File.expand_path("../../app/views", __dir__) }
  let(:host_view_dir) { Dir.mktmpdir("tree_view_client_mode_views") }

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

  it "renders collapsed descendants into the initial HTML as hidden rows" do
    tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_client_side
    render_state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "projects/tree_columns",
      ui_config: tree_ui,
      initial_state: :collapsed
    )
    view = build_view(tree_ui: nil)

    rendered = view.tree_view_rows(render_state)

    expect(rendered).to include('id="project_1"')
    expect(rendered).to include('id="project_2"')
    expect(rendered).to include('id="project_3"')
    expect(rendered).to include('id="project_4"')
    expect(rendered).to include('data-tree-view-client-node-key="1"')
    expect(rendered).to include('data-tree-view-client-node-key="2"')
    expect(rendered).to include('data-tree-view-client-depth="0"')
    expect(rendered).to include('data-tree-view-client-depth="1"')
    expect(rendered).to include('data-tree-view-client-expanded="false"')
    expect(rendered).to include('hidden="hidden"')
    expect(rendered).to include('data-tree-view-client-hidden-count-for="1"')
  end

  it "does not render client toggle buttons when children are outside the render scope" do
    tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_client_side
    render_state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "projects/tree_columns",
      ui_config: tree_ui,
      initial_state: :collapsed,
      max_render_depth: 1
    )
    view = build_view(tree_ui: nil)

    rendered = view.tree_view_rows(render_state)

    expect(rendered).to include('id="project_1"')
    expect(rendered).to include('id="project_2"')
    expect(rendered).to include('id="project_4"')
    expect(rendered).not_to include('id="project_3"')
    expect(rendered).to include('data-action="tree-view-client#toggle" data-tree-view-client-node-key="1"')
    expect(rendered).not_to include('data-action="tree-view-client#toggle" data-tree-view-client-node-key="2"')
    expect(rendered).to include('data-tree-view-client-hidden-count-for="1"')
  end

  it "renders client toggle buttons when children are present in the render scope" do
    tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_client_side
    render_state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "projects/tree_columns",
      ui_config: tree_ui,
      initial_state: :collapsed,
      max_render_depth: 2
    )
    view = build_view(tree_ui: nil)

    rendered = view.tree_view_rows(render_state)

    expect(rendered).to include('data-action="tree-view-client#toggle"')
  end

  it "adds the client controller to tree_view_state_data for client-side UiConfig" do
    tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_client_side
    render_state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "projects/tree_columns",
      ui_config: tree_ui
    )
    view = build_view(tree_ui: nil)

    expect(view.tree_view_state_data(render_state)).to eq(controller: "tree-view-state tree-view-client")
  end
end
