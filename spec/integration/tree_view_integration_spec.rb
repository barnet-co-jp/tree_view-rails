require "spec_helper"
require "action_view"
require "bigdecimal"
require "fileutils"
require "tmpdir"
IntegrationNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe "TreeView integration" do
  let(:root) { IntegrationNode.new(id: 1, parent_item_id: nil, name: "root") }
  let(:child) { IntegrationNode.new(id: 2, parent_item_id: 1, name: "child") }
  let(:grandchild) { IntegrationNode.new(id: 3, parent_item_id: 2, name: "grandchild") }
  let(:sibling) { IntegrationNode.new(id: 4, parent_item_id: 2, name: "sibling") }
  let(:nodes) { [root, child, grandchild, sibling] }
  let(:tree) { TreeView::Tree.new(records: nodes, parent_id_method: :parent_item_id) }
  let(:gem_view_path) { File.expand_path("../../app/views", __dir__) }
  let(:host_view_dir) { Dir.mktmpdir("tree_view_host_views") }

  before do
    FileUtils.mkdir_p(File.join(host_view_dir, "projects"))
    File.write(
      File.join(host_view_dir, "projects", "_tree_columns.html.erb"),
      '<td class="project-cell"><%= tree_node_dom_id(item) %>:<%= item.name %></td>'
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

  describe "static host app usage" do
    it "renders tree_view/tree_row from a host partial and exposes helper methods" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
      view = build_view(tree_ui: tree_ui)

      rendered = view.render(
        partial: "tree_view/tree_row",
        locals: {item: root, tree: tree, row_partial: "projects/tree_columns", mode: :static}
      )

      expect(view.tree_node_dom_id(root)).to eq("project_1")
      expect(rendered).to include('id="project_1"')
      expect(rendered).to include('aria-level="1"')
      expect(rendered).to include('aria-expanded="true"')
      expect(rendered).to include("project_1:root")
      expect(rendered).to include("tree-toggle__level")
    end

    it "renders root rows through tree_view_rows helper" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
      render_state = TreeView::RenderState.new(
        tree: tree,
        root_items: tree.root_items,
        row_partial: "projects/tree_columns",
        ui_config: tree_ui
      )
      view = build_view(tree_ui: nil)

      rendered = view.tree_view_rows(render_state)

      expect(rendered).to include('id="project_1"')
      expect(rendered).to include('id="project_2"')
      expect(rendered).to include("project_1:root")
      expect(rendered).to include("project_2:child")
    end

    it "passes NodePresenter and row context locals to host row partials" do
      File.write(
        File.join(host_view_dir, "projects", "_presented_columns.html.erb"),
        "<td>row:<%= tree.node_key_for(item) %>:<%= render_state.node_presenter.equal?(node_presenter) %>:<%= node_presenter.label_for(item) %>:<%= row_context.depth %></td>"
      )
      File.write(
        File.join(host_view_dir, "projects", "_presented_actions.html.erb"),
        "<td>actions:<%= tree.node_key_for(item) %>:<%= render_state.node_presenter.equal?(node_presenter) %>:<%= node_presenter.actions_for(item).join(\",\") %>:<%= row_context.depth %></td>"
      )
      node_presenter = TreeView::NodePresenter.define do
        label { |item| "label-#{item.name}" }
        actions { |item| ["open-#{item.name}"] }
      end
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
      render_state = TreeView::RenderState.new(
        tree: tree,
        root_items: tree.root_items,
        row_partial: "projects/presented_columns",
        row_actions_partial: "projects/presented_actions",
        ui_config: tree_ui,
        node_presenter: node_presenter,
        initial_state: :expanded,
        max_render_depth: 1
      )

      rendered = build_view(tree_ui: nil).tree_view_rows(render_state)

      expect(rendered).to include("row:1:true:label-root:0")
      expect(rendered).to include("row:2:true:label-child:1")
      expect(rendered).to include("actions:1:true:open-root:0")
      expect(rendered).to include("actions:2:true:open-child:1")
    end

    it "renders row transfer data when row event payload builder is configured" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
      render_state = TreeView::RenderState.new(
        tree: tree,
        root_items: tree.root_items,
        row_partial: "projects/tree_columns",
        ui_config: tree_ui,
        row_event_payload_builder: ->(item) { {id: item.id, name: item.name} }
      )
      view = build_view(tree_ui: nil)

      rendered = view.tree_view_rows(render_state)

      expect(view.tree_view_state_data(render_state)).to eq(controller: "tree-view-state tree-view-transfer")
      expect(rendered).to include('draggable="true"')
      expect(rendered).to include('data-tree-transfer-node-key="1"')
      expect(rendered).to include('data-tree-transfer-payload="{&quot;id&quot;:1,&quot;name&quot;:&quot;root&quot;}"')
      expect(rendered).to include("dragstart-&gt;tree-view-transfer#start")
      expect(rendered).to include("dragover-&gt;tree-view-transfer#over")
      expect(rendered).to include("drop-&gt;tree-view-transfer#drop")
    end

    it "renders an empty state row when root items are empty and empty_message is given" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
      empty_tree = TreeView::Tree.new(records: [], parent_id_method: :parent_item_id)
      render_state = TreeView::RenderState.new(
        tree: empty_tree,
        root_items: [],
        row_partial: "projects/tree_columns",
        ui_config: tree_ui,
        empty_message: "表示できるノードがありません"
      )
      view = build_view(tree_ui: nil)

      rendered = view.tree_view_rows(render_state)

      expect(rendered).to include('class="tree-view-empty-row"')
      expect(rendered).to include("表示できるノードがありません")
    end

    it "renders current and highlighted row classes with host row classes" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
      render_state = TreeView::RenderState.new(
        tree: tree,
        root_items: tree.root_items,
        row_partial: "projects/tree_columns",
        ui_config: tree_ui,
        current_key: tree.node_key_for(child),
        highlighted_keys: [tree.node_key_for(grandchild)],
        row_class_builder: ->(item) { "host-#{item.name}" }
      )
      view = build_view(tree_ui: nil)

      rendered = view.tree_view_rows(render_state)

      expect(rendered).to include('class="host-child is-current tree-view-row--current"')
      expect(rendered).to include('aria-current="page"')
      expect(rendered).to include('class="host-grandchild is-highlighted tree-view-row--highlighted"')
      expect(rendered).to include('class="host-root"')
    end

    it "renders aria selection state when checkboxes are selected" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
      render_state = TreeView::RenderState.new(
        tree: tree,
        root_items: tree.root_items,
        row_partial: "projects/tree_columns",
        ui_config: tree_ui,
        selectable: true,
        selection_selected_keys: [tree.node_key_for(child)]
      )
      view = build_view(tree_ui: nil)

      rendered = view.tree_view_rows(render_state)

      expect(rendered).to include('id="project_2"')
      expect(rendered).to include('aria-selected="true"')
    end

    it "renders a PathTree through tree_view_rows helper" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
      path_tree = tree.path_tree_for([grandchild])
      render_state = TreeView::RenderState.new(
        tree: path_tree,
        root_items: path_tree.root_items,
        row_partial: "projects/tree_columns",
        ui_config: tree_ui
      )
      view = build_view(tree_ui: nil)

      rendered = view.tree_view_rows(render_state)

      expect(rendered).to include('id="project_1"')
      expect(rendered).to include('id="project_2"')
      expect(rendered).to include('id="project_3"')
      expect(rendered).not_to include('id="project_4"')
      expect(rendered).to include("project_1:root")
      expect(rendered).to include("project_2:child")
      expect(rendered).to include("project_3:grandchild")
    end

    it "renders a ReverseTree through tree_view_rows helper" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
      reverse_tree = tree.reverse_tree_for([grandchild])
      render_state = TreeView::RenderState.new(
        tree: reverse_tree,
        root_items: reverse_tree.root_items,
        row_partial: "projects/tree_columns",
        ui_config: tree_ui
      )
      view = build_view(tree_ui: nil)

      rendered = view.tree_view_rows(render_state)

      expect(rendered).to include('id="project_3"')
      expect(rendered).to include('id="project_2"')
      expect(rendered).to include('id="project_1"')
      expect(rendered).not_to include('id="project_4"')
      expect(rendered).to include("project_3:grandchild")
      expect(rendered).to include("project_2:child")
      expect(rendered).to include("project_1:root")
    end

    it "renders row class and data attributes from RenderState builders" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
      render_state = TreeView::RenderState.new(
        tree: tree,
        root_items: tree.root_items,
        row_partial: "projects/tree_columns",
        ui_config: tree_ui,
        row_class_builder: ->(item) { ["tree-row", "is-#{item.name}"] },
        row_data_builder: ->(item) { {node_name: item.name, node_id: item.id} }
      )
      view = build_view(tree_ui: nil)

      rendered = view.tree_view_rows(render_state)

      expect(rendered).to include('class="tree-row is-root"')
      expect(rendered).to include('class="tree-row is-child"')
      expect(rendered).to include('data-node-name="root"')
      expect(rendered).to include('data-node-name="child"')
      expect(rendered).to include('data-node-id="1"')
      expect(rendered).to include('data-tree-depth="0"')
      expect(rendered).to include('data-tree-depth="1"')
    end

    it "renders lazy-loading row data and remote-state controller hooks" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build(
        hide_descendants_path_builder: ->(_item, depth, scope) { "/hide?depth=#{depth}&scope=#{scope}" },
        show_descendants_path_builder: ->(_item, depth, scope) { "/show?depth=#{depth}&scope=#{scope}" },
        load_children_path_builder: ->(item, depth, scope) { "/children/#{item.id}?depth=#{depth}&scope=#{scope}" },
        toggle_all_path_builder: ->(state) { "/toggle?state=#{state}" }
      )
      render_state = TreeView::RenderState.new(
        tree: tree,
        root_items: tree.root_items,
        row_partial: "projects/tree_columns",
        ui_config: tree_ui,
        lazy_loading: {
          enabled: true,
          loaded_keys: [tree.node_key_for(child)],
          scope: "children"
        }
      )
      view = build_view(tree_ui: nil)

      rendered = view.tree_view_rows(render_state)

      expect(view.tree_view_state_data(render_state)).to eq(
        controller: "tree-view-state tree-view-remote-state",
        action: [
          "tree-view:loading->tree-view-remote-state#loading",
          "tree-view:loaded->tree-view-remote-state#loaded",
          "tree-view:error->tree-view-remote-state#error",
          "tree-view:retry->tree-view-remote-state#retry"
        ].join(" ")
      )
      expect(rendered).to include('data-tree-lazy="true"')
      expect(rendered).to include('data-tree-children-url="/children/1?depth=0&amp;scope=children"')
      expect(rendered).to include('data-tree-children-url="/children/2?depth=1&amp;scope=children"')
      expect(rendered).to include('data-tree-loaded="true"')
      expect(rendered).to include('data-remote-state="loaded"')
    end

    it "limits initial child rendering with max_initial_depth" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
      render_state = TreeView::RenderState.new(
        tree: tree,
        root_items: tree.root_items,
        row_partial: "projects/tree_columns",
        ui_config: tree_ui,
        max_initial_depth: 1
      )
      view = build_view(tree_ui: nil)

      rendered = view.tree_view_rows(render_state)

      expect(rendered).to include('id="project_1"')
      expect(rendered).to include('id="project_2"')
      expect(rendered).not_to include('id="project_3"')
      expect(rendered).to include('aria-expanded="false"')
      expect(rendered).to include("tree-toggle__hidden-count")
      expect(rendered).to include("visually-hidden")
      expect(rendered).to include(" descendants")
    end

    it "customizes hidden count messages" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
      render_state = TreeView::RenderState.new(
        tree: tree,
        root_items: tree.root_items,
        row_partial: "projects/tree_columns",
        ui_config: tree_ui,
        max_initial_depth: 1,
        hidden_message_builder: ->(count) { "#{count}件省略" }
      )
      view = build_view(tree_ui: nil)

      rendered = view.tree_view_rows(render_state)

      expect(rendered).to include("2件省略")
      expect(rendered).not_to include('>2<span class="visually-hidden">')
    end

    it "limits rendered rows with max_render_depth without hidden count" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
      render_state = TreeView::RenderState.new(
        tree: tree,
        root_items: tree.root_items,
        row_partial: "projects/tree_columns",
        ui_config: tree_ui,
        max_render_depth: 1
      )
      view = build_view(tree_ui: nil)

      rendered = view.tree_view_rows(render_state)

      expect(rendered).to include('id="project_1"')
      expect(rendered).to include('id="project_2"')
      expect(rendered).not_to include('id="project_3"')
      expect(rendered).not_to include("tree-toggle__hidden-count")
    end

    it "limits rendered rows with max_leaf_distance from leaves without hidden count" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
      render_state = TreeView::RenderState.new(
        tree: tree,
        root_items: tree.root_items,
        row_partial: "projects/tree_columns",
        ui_config: tree_ui,
        max_leaf_distance: 1
      )
      view = build_view(tree_ui: nil)

      rendered = view.tree_view_rows(render_state)

      expect(rendered).not_to include('id="project_1"')
      expect(rendered).to include('id="project_2"')
      expect(rendered).to include('id="project_3"')
      expect(rendered).to include('id="project_4"')
      expect(rendered).not_to include("tree-toggle__hidden-count")
    end

    it "uses the shortest distance when a node has multiple leaves" do
      short_leaf = IntegrationNode.new(id: 5, parent_item_id: 1, name: "short_leaf")
      long_parent = IntegrationNode.new(id: 6, parent_item_id: 1, name: "long_parent")
      long_child = IntegrationNode.new(id: 7, parent_item_id: 6, name: "long_child")
      long_leaf = IntegrationNode.new(id: 8, parent_item_id: 7, name: "long_leaf")
      mixed_tree = TreeView::Tree.new(records: [root, short_leaf, long_parent, long_child, long_leaf], parent_id_method: :parent_item_id)
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
      render_state = TreeView::RenderState.new(
        tree: mixed_tree,
        root_items: mixed_tree.root_items,
        row_partial: "projects/tree_columns",
        ui_config: tree_ui,
        max_leaf_distance: 1
      )
      view = build_view(tree_ui: nil)

      rendered = view.tree_view_rows(render_state)

      expect(rendered).to include('id="project_1"')
      expect(rendered).to include('id="project_5"')
      expect(rendered).not_to include('id="project_6"')
      expect(rendered).to include('id="project_7"')
      expect(rendered).to include('id="project_8"')
    end

    it "expands nodes listed in expanded_keys" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
      render_state = TreeView::RenderState.new(
        tree: tree,
        root_items: tree.root_items,
        row_partial: "projects/tree_columns",
        ui_config: tree_ui,
        initial_state: :collapsed,
        expanded_keys: [tree.node_key_for(root), tree.node_key_for(child)]
      )
      view = build_view(tree_ui: nil)

      rendered = view.tree_view_rows(render_state)

      expect(rendered).to include('id="project_1"')
      expect(rendered).to include('id="project_2"')
      expect(rendered).to include('id="project_3"')
    end

    it "collapses nodes listed in collapsed_keys" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
      render_state = TreeView::RenderState.new(
        tree: tree,
        root_items: tree.root_items,
        row_partial: "projects/tree_columns",
        ui_config: tree_ui,
        initial_state: :expanded,
        collapsed_keys: [tree.node_key_for(child)]
      )
      view = build_view(tree_ui: nil)

      rendered = view.tree_view_rows(render_state)

      expect(rendered).to include('id="project_1"')
      expect(rendered).to include('id="project_2"')
      expect(rendered).not_to include('id="project_3"')
      expect(rendered).to include("tree-toggle__hidden-count")
    end

    it "does not render descendants when only a hidden descendant is listed in expanded_keys" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
      render_state = TreeView::RenderState.new(
        tree: tree,
        root_items: tree.root_items,
        row_partial: "projects/tree_columns",
        ui_config: tree_ui,
        initial_state: :collapsed,
        expanded_keys: [tree.node_key_for(child)]
      )
      view = build_view(tree_ui: nil)

      rendered = view.tree_view_rows(render_state)

      expect(rendered).to include('id="project_1"')
      expect(rendered).not_to include('id="project_2"')
      expect(rendered).not_to include('id="project_3"')
    end

    it "does not render descendants when parent is listed in collapsed_keys even if descendant is expanded" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
      render_state = TreeView::RenderState.new(
        tree: tree,
        root_items: tree.root_items,
        row_partial: "projects/tree_columns",
        ui_config: tree_ui,
        initial_state: :expanded,
        collapsed_keys: [tree.node_key_for(child)],
        expanded_keys: [tree.node_key_for(grandchild)]
      )
      view = build_view(tree_ui: nil)

      rendered = view.tree_view_rows(render_state)

      expect(rendered).to include('id="project_1"')
      expect(rendered).to include('id="project_2"')
      expect(rendered).not_to include('id="project_3"')
    end

    it "respects RenderState initial_state when rendering through tree_view_rows" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
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
      expect(rendered).not_to include('id="project_2"')
      expect(rendered).to include("tree-toggle__hidden-count")
    end
  end

  describe "turbo host app usage" do
    it "renders turbo toggle links with the configured path builders" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build(
        hide_descendants_path_builder: ->(item, depth, scope) { "/projects/#{item.id}/hide?depth=#{depth}&scope=#{scope}" },
        show_descendants_path_builder: ->(item, depth, scope) { "/projects/#{item.id}/show?depth=#{depth}&scope=#{scope}" },
        toggle_all_path_builder: ->(state) { "/projects/toggle_all?state=#{state}" }
      )
      view = build_view(tree_ui: tree_ui)

      rendered = view.render(
        partial: "tree_view/tree_row",
        locals: {item: root, tree: tree, row_partial: "projects/tree_columns", mode: :turbo}
      )

      expect(rendered).to include("/projects/1/hide?depth=0&amp;scope=all")
      expect(rendered).to include('aria-expanded="true"')
      expect(rendered).not_to include('aria-controls="project_1"')
    end

    it "passes object toggle scope when scope_format is object" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build(
        hide_descendants_path_builder: ->(item, depth, scope) {
          "/projects/#{item.id}/hide?depth=#{depth}&toggle_depth=#{scope.toggle_depth}&within_scope=#{scope.within_scope?}"
        },
        show_descendants_path_builder: ->(item, depth, scope) {
          "/projects/#{item.id}/show?depth=#{depth}&toggle_depth=#{scope.toggle_depth}&within_scope=#{scope.within_scope?}"
        },
        toggle_all_path_builder: ->(state) { "/projects/toggle_all?state=#{state}" },
        scope_format: :object
      )
      render_state = TreeView::RenderState.new(
        tree: tree,
        root_items: tree.root_items,
        row_partial: "projects/tree_columns",
        ui_config: tree_ui,
        max_toggle_depth_from_root: 2
      )
      view = build_view(tree_ui: nil)

      rendered = view.tree_view_rows(render_state)

      expect(rendered).to include("/projects/1/hide?depth=0&amp;toggle_depth=2&amp;within_scope=true")
      expect(rendered).to include("/projects/2/hide?depth=1&amp;toggle_depth=2&amp;within_scope=true")
    end

    it "raises a clear error for invalid toggle modes" do
      tree_ui = TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "project").build_static
      view = build_view(tree_ui: tree_ui)

      expect do
        view.render(
          partial: "tree_view/tree_row",
          locals: {item: root, tree: tree, row_partial: "projects/tree_columns", mode: :statc}
        )
      end.to raise_error(ActionView::Template::Error) { |error|
        expect(error.cause).to be_a(ArgumentError)
        expect(error.cause.message).to match(/must be one of: turbo, static, client/)
      }
    end
  end
end
