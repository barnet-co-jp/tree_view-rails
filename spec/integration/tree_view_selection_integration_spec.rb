require "spec_helper"
require "action_view"
require "fileutils"
require "tmpdir"
SelectionNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe "TreeView selection integration" do
  let(:root) { SelectionNode.new(id: 1, parent_item_id: nil, name: "root") }
  let(:child) { SelectionNode.new(id: 2, parent_item_id: 1, name: "child") }
  let(:grandchild) { SelectionNode.new(id: 3, parent_item_id: 2, name: "grandchild") }
  let(:tree) { TreeView::Tree.new(records: [root, child, grandchild], parent_id_method: :parent_item_id) }
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

  def build_render_state(render_tree, root_items, selection_options = {})
    tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
    TreeView::RenderState.new(
      tree: render_tree,
      root_items: root_items,
      row_partial: "projects/tree_columns",
      ui_config: tree_ui,
      selection: {
        enabled: true,
        checkbox_name: "selected_documents[]",
        payload_builder: ->(item) { {key: render_tree.node_key_for(item), id: item.id, type: item.class.name} }
      }.merge(selection_options)
    )
  end

  def render_rows(render_tree, root_items, selection_options = {})
    build_view.tree_view_rows(build_render_state(render_tree, root_items, selection_options))
  end

  it "renders selection checkboxes with JSON payload values" do
    rendered = render_rows(tree, tree.root_items)

    expect(rendered).to include('class="tree-selection-cell"')
    expect(rendered).to include('class="tree-selection-checkbox"')
    expect(rendered).to include('name="selected_documents[]"')
    expect(rendered).to include('id="project_1_selection"')
    expect(rendered).to include('aria-label="root"')
    expect(rendered).to include("&quot;key&quot;:1")
    expect(rendered).to include("&quot;id&quot;:1")
    expect(rendered).to include("&quot;type&quot;:")
  end

  it "renders selection checkboxes only for roots when visibility is roots" do
    rendered = render_rows(tree, tree.root_items, visibility: :roots)

    expect(rendered.scan('class="tree-selection-cell"').size).to eq(3)
    expect(rendered).to include('id="project_1_selection"')
    expect(rendered).not_to include('id="project_2_selection"')
    expect(rendered).not_to include('id="project_3_selection"')
  end

  it "renders selection checkboxes only for leaves when visibility is leaves" do
    rendered = render_rows(tree, tree.root_items, visibility: :leaves)

    expect(rendered.scan('class="tree-selection-cell"').size).to eq(3)
    expect(rendered).not_to include('id="project_1_selection"')
    expect(rendered).not_to include('id="project_2_selection"')
    expect(rendered).to include('id="project_3_selection"')
  end

  it "keeps empty selection cells when visibility is none" do
    rendered = render_rows(tree, tree.root_items, visibility: :none)

    expect(rendered.scan('class="tree-selection-cell"').size).to eq(3)
    expect(rendered).not_to include('class="tree-selection-checkbox"')
  end

  it "rejects invalid selection visibility values" do
    expect do
      render_rows(tree, tree.root_items, visibility: :middle)
    end.to raise_error(ArgumentError, /selection visibility must be one of/)
  end

  it "calls the selection payload builder once per rendered checkbox" do
    called_item_ids = []

    render_rows(
      tree,
      tree.root_items,
      payload_builder: lambda do |item|
        called_item_ids << item.id
        {key: tree.node_key_for(item), id: item.id, type: item.class.name}
      end
    )

    expect(called_item_ids).to eq([1, 2, 3])
  end

  it "rejects selection payload builder results that are not Hash-like" do
    expect do
      render_rows(tree, tree.root_items, payload_builder: ->(_item) { "not-a-hash" })
    end.to raise_error(ActionView::Template::Error) { |error|
      expect(error.cause).to be_a(ArgumentError)
      expect(error.cause.message).to include("selection_payload_builder")
      expect(error.cause.message).to include("Hash-like")
      expect(error.cause.message).to include("node_key=1")
    }
  end

  it "renders checked selection checkboxes for selected keys" do
    rendered = render_rows(tree, tree.root_items, selected_keys: [2])

    expect(rendered).to include('id="project_2_selection"')
    expect(rendered).to include('checked="checked"')
  end

  it "renders disabled selection checkboxes with reason attributes" do
    rendered = render_rows(
      tree,
      tree.root_items,
      disabled_builder: ->(item) { item.id == 2 },
      disabled_reason_builder: ->(item) { (item.id == 2) ? "Cannot select child" : nil }
    )

    expect(rendered).to include('id="project_2_selection"')
    expect(rendered).to include('disabled="disabled"')
    expect(rendered).to include('title="Cannot select child"')
    expect(rendered).to include('data-tree-selection-disabled-reason="Cannot select child"')
  end

  it "renders checked and disabled selection checkboxes together" do
    rendered = render_rows(
      tree,
      tree.root_items,
      selected_keys: [2],
      disabled_builder: ->(item) { item.id == 2 }
    )

    expect(rendered).to include('id="project_2_selection"')
    expect(rendered).to include('checked="checked"')
    expect(rendered).to include('disabled="disabled"')
  end

  it "keeps cascade and disabled-state selection options stable for mixed rows" do
    render_state = build_render_state(
      tree,
      tree.root_items,
      selected_keys: [2, 3],
      cascade: true,
      indeterminate: true,
      max_count: 2,
      disabled_builder: ->(item) { item.id == 2 },
      disabled_reason_builder: ->(item) { (item.id == 2) ? "Selection limit reached" : nil }
    )

    rendered = build_view.tree_view_rows(render_state)

    expect(render_state.selection_cascade?).to eq(true)
    expect(render_state.selection_indeterminate?).to eq(true)
    expect(render_state.selection_max_count).to eq(2)
    expect(render_state.selection_selected_keys).to eq([2, 3])
    expect(rendered).to include('id="project_2_selection"')
    expect(rendered).to include('id="project_3_selection"')
    expect(rendered.scan('checked="checked"').size).to eq(2)
    expect(rendered).to include('disabled="disabled"')
    expect(rendered).to include('data-tree-selection-disabled-reason="Selection limit reached"')
  end

  it "renders selection checkboxes for PathTree rows" do
    path_tree = tree.path_tree_for([grandchild])

    rendered = render_rows(path_tree, path_tree.root_items)

    expect(rendered).to include('id="project_1_selection"')
    expect(rendered).to include('id="project_2_selection"')
    expect(rendered).to include('id="project_3_selection"')
  end

  it "renders selection checkboxes for ReverseTree rows" do
    reverse_tree = tree.reverse_tree_for([grandchild])

    rendered = render_rows(reverse_tree, reverse_tree.root_items)

    expect(rendered).to include('id="project_3_selection"')
    expect(rendered).to include('id="project_2_selection"')
    expect(rendered).to include('id="project_1_selection"')
  end
end
