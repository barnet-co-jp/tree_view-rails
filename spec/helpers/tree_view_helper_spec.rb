require "spec_helper"
HelperTestNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe TreeViewHelper do
  let(:ui_config) do
    TreeView::UiConfig.new(
      node_dom_id_builder: ->(item_or_id) { "item_#{item_or_id.respond_to?(:id) ? item_or_id.id : item_or_id}" },
      button_dom_id_builder: ->(item_or_id) { "item_button_box_#{item_or_id.respond_to?(:id) ? item_or_id.id : item_or_id}" },
      show_button_dom_id_builder: ->(item_or_id) { "item_show_button_#{item_or_id.respond_to?(:id) ? item_or_id.id : item_or_id}" },
      hide_descendants_path_builder: ->(_item, _depth, scope) { "/hide?scope=#{scope}" },
      show_descendants_path_builder: ->(_item, _depth, scope) { "/show?scope=#{scope}" },
      load_children_path_builder: ->(_item, depth, scope) { "/children?depth=#{depth}&scope=#{scope}" },
      toggle_all_path_builder: ->(state) { "/toggle?state=#{state}" }
    )
  end

  let(:helper_host_class) do
    Class.new do
      include TreeViewHelper

      def initialize(tree_ui: nil)
        @tree_ui = tree_ui
      end
    end
  end

  describe "tree dom id helpers" do
    it "builds DOM ids and toggle paths through UiConfig" do
      helper = helper_host_class.new(tree_ui: ui_config)
      item = HelperTestNode.new(id: 42, parent_item_id: nil, name: "sample")

      expect(helper.tree_node_dom_id(item)).to eq("item_42")
      expect(helper.tree_button_dom_id(item)).to eq("item_button_box_42")
      expect(helper.tree_show_button_dom_id(item)).to eq("item_show_button_42")
      expect(helper.tree_node_dom_id(42)).to eq("item_42")
      expect(helper.tree_hide_descendants_path(item, 1)).to eq("/hide?scope=all")
      expect(helper.tree_hide_descendants_path(item, 1, scope: "grandchildren")).to eq("/hide?scope=grandchildren")
      expect(helper.tree_show_descendants_path(item, 1)).to eq("/show?scope=all")
      expect(helper.tree_show_descendants_path(item, 1, scope: "children")).to eq("/show?scope=children")
      expect(helper.tree_load_children_path(item, 1)).to eq("/children?depth=1&scope=all")
      expect(helper.tree_load_children_path(item, 1, scope: "children")).to eq("/children?depth=1&scope=children")
      expect(helper.tree_toggle_all_path(state: :collapsed)).to eq("/toggle?state=collapsed")
      expect(helper.tree_expand_all_path).to eq("/toggle?state=expanded")
      expect(helper.tree_collapse_all_path).to eq("/toggle?state=collapsed")
    end
  end

  describe "static ui" do
    it "returns nil for optional toggle paths" do
      static_ui = TreeView::UiConfig.new(
        node_dom_id_builder: ->(item_or_id) { "item_#{item_or_id.respond_to?(:id) ? item_or_id.id : item_or_id}" },
        button_dom_id_builder: ->(item_or_id) { "item_button_box_#{item_or_id.respond_to?(:id) ? item_or_id.id : item_or_id}" },
        show_button_dom_id_builder: ->(item_or_id) { "item_show_button_#{item_or_id.respond_to?(:id) ? item_or_id.id : item_or_id}" }
      )
      helper = helper_host_class.new(tree_ui: static_ui)
      item = HelperTestNode.new(id: 42, parent_item_id: nil, name: "sample")

      expect(helper.tree_hide_descendants_path(item, 1)).to be_nil
      expect(helper.tree_show_descendants_path(item, 1)).to be_nil
      expect(helper.tree_toggle_all_path(state: :collapsed)).to be_nil
    end
  end

  describe "ui_config resolution" do
    it "raises a clear error when ui_config is missing" do
      helper = helper_host_class.new
      item = HelperTestNode.new(id: 42, parent_item_id: nil, name: "sample")

      expect do
        helper.tree_node_dom_id(item)
      end.to raise_error(ArgumentError, /ui_config is required/)
    end
  end

  describe "tree_toggle_mode" do
    it "returns static, turbo, and client as-is" do
      helper = helper_host_class.new(tree_ui: ui_config)

      expect(helper.tree_toggle_mode(:static)).to eq(:static)
      expect(helper.tree_toggle_mode(:turbo)).to eq(:turbo)
      expect(helper.tree_toggle_mode(:client)).to eq(:client)
    end

    it "uses the UiConfig mode when no explicit mode is given" do
      client_ui = TreeView::UiConfigBuilder.new(context: Object.new).build_client_side
      helper = helper_host_class.new(tree_ui: client_ui)

      expect(helper.tree_toggle_mode).to eq(:client)
    end

    it "raises a clear error for invalid modes" do
      helper = helper_host_class.new(tree_ui: ui_config)

      expect do
        helper.tree_toggle_mode(:statc)
      end.to raise_error(ArgumentError, /must be one of: turbo, static, client/)
    end
  end

  describe "tree render caches" do
    it "clears cached render traversal objects" do
      helper = helper_host_class.new(tree_ui: ui_config)

      helper.instance_variable_set(:@tree_render_traversals, {1 => double("stale traversal")})

      helper.send(:clear_tree_view_render_caches!)

      expect(helper.instance_variable_get(:@tree_render_traversals)).to eq({})
    end
  end

  describe "tree_branch_info" do
    it "returns branch information for each node" do
      root_a = HelperTestNode.new(id: 1, parent_item_id: nil, name: "root-a")
      root_b = HelperTestNode.new(id: 2, parent_item_id: nil, name: "root-b")
      child_a1 = HelperTestNode.new(id: 3, parent_item_id: 1, name: "child-a1")
      child_a2 = HelperTestNode.new(id: 4, parent_item_id: 1, name: "child-a2")
      grandchild_a1 = HelperTestNode.new(id: 5, parent_item_id: 3, name: "grandchild-a1")
      tree = TreeView::Tree.new(records: [root_a, root_b, child_a1, child_a2, grandchild_a1], parent_id_method: :parent_item_id)

      helper = helper_host_class.new(tree_ui: ui_config)

      expect(helper.tree_branch_info(root_a, tree)).to eq(depth: 0, ancestor_last_states: [], is_last: true)
      expect(helper.tree_branch_info(child_a1, tree)).to eq(depth: 1, ancestor_last_states: [], is_last: true)
      expect(helper.tree_branch_info(grandchild_a1, tree)).to eq(depth: 2, ancestor_last_states: [true], is_last: true)
      expect(helper.tree_branch_info(root_b, tree)).to eq(depth: 0, ancestor_last_states: [], is_last: false)
    end

    it "uses the tree sorter for branch ordering" do
      root_a = HelperTestNode.new(id: 1, parent_item_id: nil, name: "alpha")
      root_b = HelperTestNode.new(id: 2, parent_item_id: nil, name: "beta")
      tree = TreeView::Tree.new(
        records: [root_a, root_b],
        parent_id_method: :parent_item_id,
        sorter: ->(items, _tree) { items.sort_by(&:name).reverse }
      )

      helper = helper_host_class.new(tree_ui: ui_config)

      expect(helper.tree_branch_info(root_b, tree)).to eq(depth: 0, ancestor_last_states: [], is_last: false)
      expect(helper.tree_branch_info(root_a, tree)).to eq(depth: 0, ancestor_last_states: [], is_last: true)
    end
  end
end
