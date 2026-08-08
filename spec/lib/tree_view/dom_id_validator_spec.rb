require "spec_helper"
DomIdTestNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe TreeView::DomIdValidator do
  let(:root) { DomIdTestNode.new(id: 1, parent_item_id: nil, name: "root") }
  let(:child) { DomIdTestNode.new(id: 2, parent_item_id: 1, name: "child") }
  let(:nodes) { [root, child] }
  let(:tree) { TreeView::Tree.new(records: nodes, parent_id_method: :parent_item_id) }
  let(:ui_config) do
    TreeView::UiConfig.new(
      node_dom_id_builder: ->(item) { "node_#{item.id}" },
      button_dom_id_builder: ->(item) { "button_#{item.id}" },
      show_button_dom_id_builder: ->(item) { "show_#{item.id}" }
    )
  end

  def build_render_state(tree: self.tree, ui_config: self.ui_config, **options)
    TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      **options
    )
  end

  it "passes when generated DOM IDs are unique" do
    render_state = build_render_state

    expect(described_class.validate!(render_state)).to eq(true)
    expect(render_state.validate_dom_ids!).to eq(true)
  end

  it "raises a clear error when node DOM IDs collide" do
    collision_ui_config = TreeView::UiConfig.new(
      node_dom_id_builder: ->(_item) { "duplicated_node" },
      button_dom_id_builder: ->(item) { "button_#{item.id}" },
      show_button_dom_id_builder: ->(item) { "show_#{item.id}" }
    )
    render_state = build_render_state(ui_config: collision_ui_config)

    expect do
      described_class.validate!(render_state)
    end.to raise_error(ArgumentError, /TreeView DOM ID collision detected: .*duplicated_node.*node\(1\).*node\(2\)/)
  end

  it "checks button and show button DOM IDs" do
    collision_ui_config = TreeView::UiConfig.new(
      node_dom_id_builder: ->(item) { "node_#{item.id}" },
      button_dom_id_builder: ->(_item) { "duplicated_button" },
      show_button_dom_id_builder: ->(_item) { "duplicated_show" }
    )
    render_state = build_render_state(ui_config: collision_ui_config)

    expect do
      render_state.validate_dom_ids!
    end.to raise_error(ArgumentError) { |error|
      expect(error.message).to include("duplicated_button")
      expect(error.message).to include("duplicated_show")
    }
  end

  it "checks selection checkbox DOM IDs when selection is enabled" do
    collision_ui_config = TreeView::UiConfig.new(
      node_dom_id_builder: ->(_item) { "duplicated_node" },
      button_dom_id_builder: ->(item) { "button_#{item.id}" },
      show_button_dom_id_builder: ->(item) { "show_#{item.id}" }
    )
    render_state = build_render_state(ui_config: collision_ui_config, selectable: true)

    expect do
      render_state.validate_dom_ids!
    end.to raise_error(ArgumentError) { |error|
      expect(error.message).to include("duplicated_node_selection")
      expect(error.message).to include("selection_checkbox")
    }
  end

  it "respects max_render_depth when collecting renderable items" do
    collision_ui_config = TreeView::UiConfig.new(
      node_dom_id_builder: ->(_item) { "duplicated_node" },
      button_dom_id_builder: ->(item) { "button_#{item.id}" },
      show_button_dom_id_builder: ->(item) { "show_#{item.id}" }
    )
    render_state = build_render_state(ui_config: collision_ui_config, max_render_depth: 0)

    expect(render_state.validate_dom_ids!).to eq(true)
  end
end
