require "spec_helper"
require "action_view"
require "fileutils"
require "tmpdir"
IconNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe "TreeView icon builder integration" do
  let(:root) { IconNode.new(id: 1, parent_item_id: nil, name: "root") }
  let(:tree) { TreeView::Tree.new(records: [root], parent_id_method: :parent_item_id) }
  let(:gem_view_path) { File.expand_path("../../app/views", __dir__) }
  let(:host_view_dir) { Dir.mktmpdir("tree_view_icon_host_views") }

  before do
    FileUtils.mkdir_p(File.join(host_view_dir, "items"))
    File.write(
      File.join(host_view_dir, "items", "_tree_columns.html.erb"),
      '<td class="item-cell"><%= item.name %></td>'
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

  it "renders icon_builder output through the row visual slot when no badge_builder is configured" do
    tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "item").build_static
    render_state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "items/tree_columns",
      ui_config: tree_ui,
      icon_builder: ->(_item) { {text: "folder", title: "Folder", class: "node-icon"} }
    )
    view = build_view(tree_ui: nil)

    rendered = view.tree_view_rows(render_state)

    expect(rendered).to include("folder")
    expect(rendered).to include('title="Folder"')
    expect(rendered).to include("node-icon")
  end

  it "keeps badge_builder precedence over icon_builder" do
    tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "item").build_static
    render_state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "items/tree_columns",
      ui_config: tree_ui,
      badge_builder: ->(_item) { "badge" },
      icon_builder: ->(_item) { "icon" }
    )
    view = build_view(tree_ui: nil)

    rendered = view.tree_view_rows(render_state)

    expect(rendered).to include("badge")
    expect(rendered).not_to include("icon")
  end
end
