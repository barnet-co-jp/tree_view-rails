require "spec_helper"
Node = Struct.new(:id, :parent_item_id, :name)

RSpec.describe TreeView::RowContext do
  let(:root) { Node.new(id: 1, parent_item_id: nil, name: "root") }
  let(:child) { Node.new(id: 2, parent_item_id: 1, name: "child") }
  let(:tree) { TreeView::Tree.new(records: [root, child], parent_id_method: :parent_item_id) }
  let(:render_state) do
    TreeView::RenderState.new(
      tree: tree,
      root_items: [root],
      row_partial: "items/tree_columns",
      ui_config: instance_double(TreeView::UiConfig),
      initial_state: :expanded,
      max_initial_depth: 1,
      max_render_depth: 2,
      current_key: root.id,
      expanded_keys: [root.id],
      collapsed_keys: [child.id]
    )
  end
  let(:render_context) { TreeView::RenderContext.new(render_state: render_state) }

  it "exposes row-specific tree values" do
    context = described_class.new(render_context: render_context, item: root, depth: 0)

    expect(context.tree).to eq(tree)
    expect(context.children).to eq([child])
    expect(context.node_key).to eq(root.id)
    expect(context.descendant_count).to eq(1)
    expect(context).to be_current
    expect(context.expanded_keys).to eq([root.id])
    expect(context.collapsed_keys).to eq([child.id])
  end

  it "evaluates depth boundaries from render context" do
    root_context = described_class.new(render_context: render_context, item: root, depth: 0)
    child_context = described_class.new(render_context: render_context, item: child, depth: 1)

    expect(root_context).not_to be_initial_depth_boundary
    expect(child_context).to be_initial_depth_boundary
    expect(root_context).to be_render_children
    expect(child_context).to be_render_children
  end
end
