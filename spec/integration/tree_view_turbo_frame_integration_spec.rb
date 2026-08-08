# frozen_string_literal: true

require "spec_helper"
require "action_view"
require "fileutils"
require "tmpdir"

TurboFrameIntegrationNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe "TreeView turbo frame integration" do
  let(:root) { TurboFrameIntegrationNode.new(id: 1, parent_item_id: nil, name: "root") }
  let(:child) { TurboFrameIntegrationNode.new(id: 2, parent_item_id: 1, name: "child") }
  let(:tree) { TreeView::Tree.new(records: [root, child], parent_id_method: :parent_item_id) }
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

  it "adds data-turbo-frame to turbo toggle links when configured" do
    tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_turbo(
      hide_descendants_path_builder: ->(item, depth, scope) { "/projects/#{item.id}/hide?depth=#{depth}&scope=#{scope}" },
      show_descendants_path_builder: ->(item, depth, scope) { "/projects/#{item.id}/show?depth=#{depth}&scope=#{scope}" },
      toggle_all_path_builder: ->(state) { "/projects/toggle_all?state=#{state}" },
      turbo_frame: "projects_tree"
    )
    render_state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "projects/tree_columns",
      ui_config: tree_ui
    )

    rendered = build_view.tree_view_rows(render_state)

    expect(rendered).to include('data-turbo-stream="true"')
    expect(rendered).to include('data-turbo-frame="projects_tree"')
    expect(rendered).to include("/projects/1/hide?depth=0&amp;scope=all")
  end

  it "does not add data-turbo-frame when it is not configured" do
    tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_turbo(
      hide_descendants_path_builder: ->(item, depth, scope) { "/projects/#{item.id}/hide?depth=#{depth}&scope=#{scope}" },
      show_descendants_path_builder: ->(item, depth, scope) { "/projects/#{item.id}/show?depth=#{depth}&scope=#{scope}" },
      toggle_all_path_builder: ->(state) { "/projects/toggle_all?state=#{state}" }
    )
    render_state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "projects/tree_columns",
      ui_config: tree_ui
    )

    rendered = build_view.tree_view_rows(render_state)

    expect(rendered).to include('data-turbo-stream="true"')
    expect(rendered).not_to include("data-turbo-frame")
  end
end
