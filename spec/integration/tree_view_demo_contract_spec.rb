require "spec_helper"
require "action_view"
require "fileutils"
require "tmpdir"
DemoMachineNode = Struct.new(:id, :name, :children)

RSpec.describe "TreeView demo app integration contract" do
  let(:gem_view_path) { File.expand_path("../../app/views", __dir__) }
  let(:host_view_dir) { Dir.mktmpdir("tree_view_demo_host_views") }

  before do
    FileUtils.mkdir_p(File.join(host_view_dir, "machines"))
    File.write(
      File.join(host_view_dir, "machines", "_tree_columns.html.erb"),
      '<td class="machine-cell"><%= item.class.name %>:<%= item.name %></td>'
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

  it "renders GraphAdapter rows through direct tree_row partial rendering like the demo app" do
    child = DemoMachineNode.new(id: 2, name: "unit", children: [])
    root = DemoMachineNode.new(id: 1, name: "machine", children: [child])
    adapter = TreeView::GraphAdapter.new(
      roots: [root],
      children_resolver: ->(node) { node.children },
      node_key_resolver: ->(node) { [node.class.name, node.id] }
    )
    tree = TreeView::Tree.new(adapter: adapter)
    tree_ui = TreeView::UiConfigBuilder.new(
      context: Object.new,
      node_prefix: "node",
      key_resolver: ->(node_or_id) { node_or_id.respond_to?(:id) ? "#{node_or_id.class.name.downcase}_#{node_or_id.id}" : node_or_id }
    ).build_static
    view = build_view(tree_ui: tree_ui)

    rendered = view.render(
      partial: "tree_view/tree_row",
      collection: tree.root_items,
      as: :item,
      locals: {tree: tree, row_partial: "machines/tree_columns", collapsed: false}
    )

    expect(rendered).to include('id="node_demomachinenode_1"')
    expect(rendered).to include('id="node_demomachinenode_2"')
    expect(rendered).to include("DemoMachineNode:machine")
    expect(rendered).to include("DemoMachineNode:unit")
    expect(rendered).to include('aria-expanded="true"')
  end
end
