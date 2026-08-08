# frozen_string_literal: true

require "spec_helper"
require "action_view"

ResourceTableNode = Struct.new(:id, :parent_item_id, :name, :status)

RSpec.describe "Resource table render state integration" do
  let(:root) { ResourceTableNode.new(id: 1, parent_item_id: nil, name: "root", status: "active") }
  let(:child) { ResourceTableNode.new(id: 2, parent_item_id: 1, name: "child", status: "draft") }
  let(:nodes) { [root, child] }
  let(:gem_view_path) { File.expand_path("../../app/views", __dir__) }

  def build_view
    view = ActionView::Base.with_empty_template_cache.with_view_paths([gem_view_path], {}, nil)
    view.extend(TreeViewHelper)
    view
  end

  it "passes table_state visible columns to the default row partial" do
    render_state = TreeView::ResourceTableRenderState.call(
      records: nodes,
      context: Object.new,
      table_key: "projects_tree",
      parent_id_method: :parent_item_id,
      table_state: {
        "visible_columns" => [
          {"key" => "name"},
          {"key" => "status"}
        ]
      }
    )

    rendered = build_view.tree_view_rows(render_state)

    expect(rendered).to include('id="projects_tree_1"')
    expect(rendered).to include('data-rails-ui-row="true"')
    expect(rendered).to include('data-tree-view-resource-table-row="true"')
    expect(rendered).to include('data-rails-table-preferences-table-key="projects_tree"')
    expect(rendered).to include('data-rails-table-preferences-column-key="name"')
    expect(rendered).to include('data-rails-table-preferences-column-key="status"')
    expect(rendered).to include("root")
    expect(rendered).to include("active")
  end

  it "keeps node identity separate from table column keys" do
    render_state = TreeView::ResourceTableRenderState.call(
      records: [root],
      context: Object.new,
      table_key: "projects_tree",
      parent_id_method: :parent_item_id,
      table_state: {
        "visible_columns" => [
          {"key" => "name"},
          {"key" => "status"}
        ]
      }
    )

    rendered = build_view.tree_view_rows(render_state)

    expect(rendered).to include('id="projects_tree_1"')
    expect(rendered).to include('data-tree-view-resource-table-row="true"')
    expect(rendered).to include('data-rails-table-preferences-table-key="projects_tree"')
    expect(rendered).to include('data-rails-table-preferences-column-key="name"')
    expect(rendered).to include('data-rails-table-preferences-column-key="status"')
    expect(rendered).not_to include('data-rails-table-preferences-column-key="projects_tree_1"')
    expect(rendered).not_to include('data-rails-table-preferences-column-key="1"')
  end

  it "falls back to columns when table_state has no visible columns" do
    render_state = TreeView::ResourceTableRenderState.call(
      records: nodes,
      context: Object.new,
      parent_id_method: :parent_item_id,
      columns: [
        {"key" => "name"},
        {"key" => "status"}
      ]
    )

    rendered = build_view.tree_view_rows(render_state)

    expect(rendered).to include('data-rails-table-preferences-column-key="name"')
    expect(rendered).to include('data-rails-table-preferences-column-key="status"')
    expect(rendered).to include("child")
    expect(rendered).to include("draft")
  end

  it "uses table_preferences_value when the host view provides it" do
    view = build_view
    view.define_singleton_method(:table_preferences_value) do |item, column|
      "formatted-#{column.fetch("key")}-#{item.public_send(column.fetch("key"))}"
    end

    render_state = TreeView::ResourceTableRenderState.call(
      records: [root],
      context: Object.new,
      parent_id_method: :parent_item_id,
      columns: [{"key" => "name"}]
    )

    rendered = view.tree_view_rows(render_state)

    expect(rendered).to include("formatted-name-root")
  end

  it "passes row locals to windowed rendering" do
    render_state = TreeView::ResourceTableRenderState.call(
      records: nodes,
      context: Object.new,
      parent_id_method: :parent_item_id,
      columns: [{"key" => "name"}]
    )

    rendered = build_view.tree_view_rows(render_state, window: {offset: 0, limit: 1})

    expect(rendered).to include('data-rails-table-preferences-column-key="name"')
    expect(rendered).to include("root")
  end
end
