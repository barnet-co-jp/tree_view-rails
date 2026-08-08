# frozen_string_literal: true

require "spec_helper"
require "action_view"
require "fileutils"
require "tmpdir"
WindowNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe "TreeView windowed rendering" do
  let(:root) { WindowNode.new(id: 1, parent_item_id: nil, name: "root") }
  let(:child) { WindowNode.new(id: 2, parent_item_id: 1, name: "child") }
  let(:grandchild) { WindowNode.new(id: 3, parent_item_id: 2, name: "grandchild") }
  let(:sibling) { WindowNode.new(id: 4, parent_item_id: 1, name: "sibling") }
  let(:nodes) { [root, child, grandchild, sibling] }
  let(:tree) { TreeView::Tree.new(records: nodes, parent_id_method: :parent_item_id, sorter: ->(items, _tree) { items.sort_by(&:id) }) }
  let(:tree_ui) { TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "window").build_static }
  let(:gem_view_path) { File.expand_path("../../app/views", __dir__) }
  let(:host_view_dir) { Dir.mktmpdir("tree_view_window_host_views") }

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

  def build_render_state(**options)
    TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "projects/tree_columns",
      ui_config: tree_ui,
      **options
    )
  end

  it "renders only the requested visible rows" do
    rendered = build_view.tree_view_rows(build_render_state, window: {offset: 1, limit: 2})

    expect(rendered).not_to include('id="window_1"')
    expect(rendered).to include('id="window_2"')
    expect(rendered).to include('id="window_3"')
    expect(rendered).not_to include('id="window_4"')
    expect(rendered).to include("child")
    expect(rendered).to include("grandchild")
  end

  it "uses current expansion state before applying the window" do
    rendered = build_view.tree_view_rows(
      build_render_state(initial_state: :collapsed, expanded_keys: [1]),
      window: {offset: 0, limit: 10}
    )

    expect(rendered).to include('id="window_1"')
    expect(rendered).to include('id="window_2"')
    expect(rendered).to include('id="window_4"')
    expect(rendered).not_to include('id="window_3"')
  end

  it "exposes a RenderWindow helper for navigation metadata" do
    window = build_view.tree_view_window(build_render_state, offset: 1, limit: 2)

    expect(window.rows.map(&:node_key)).to eq([2, 3])
    expect(window.total_count).to eq(4)
    expect(window.previous_offset).to eq(0)
    expect(window.next_offset).to eq(3)
  end
end
