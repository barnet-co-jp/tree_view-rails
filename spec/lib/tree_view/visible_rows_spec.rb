require "spec_helper"
VisibleRowsNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe TreeView::VisibleRows do
  let(:root) { VisibleRowsNode.new(id: 1, parent_item_id: nil, name: "root") }
  let(:child) { VisibleRowsNode.new(id: 2, parent_item_id: 1, name: "child") }
  let(:grandchild) { VisibleRowsNode.new(id: 3, parent_item_id: 2, name: "grandchild") }
  let(:sibling) { VisibleRowsNode.new(id: 4, parent_item_id: 1, name: "sibling") }
  let(:nodes) { [root, child, grandchild, sibling] }
  let(:tree) { TreeView::Tree.new(records: nodes, parent_id_method: :parent_item_id, sorter: ->(items, _tree) { items.sort_by(&:id) }) }
  let(:ui_config) { TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "node").build_static }

  def build_render_state(tree: self.tree, root_items: nil, **options)
    TreeView::RenderState.new(
      tree: tree,
      root_items: root_items || tree.root_items,
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      **options
    )
  end

  def build_chain(length)
    (1..length).map do |id|
      VisibleRowsNode.new(
        id: id,
        parent_item_id: (id == 1) ? nil : id - 1,
        name: "node #{id}"
      )
    end
  end

  def build_wide_tree(child_count:, grandchildren_per_child: 0)
    records = [VisibleRowsNode.new(id: 1, parent_item_id: nil, name: "root")]
    next_id = 2

    child_count.times do |child_index|
      child_id = next_id
      records << VisibleRowsNode.new(id: child_id, parent_item_id: 1, name: "child #{child_index}")
      next_id += 1

      grandchildren_per_child.times do |grandchild_index|
        records << VisibleRowsNode.new(
          id: next_id,
          parent_item_id: child_id,
          name: "grandchild #{child_index}-#{grandchild_index}"
        )
        next_id += 1
      end
    end

    records
  end

  def direct_child_ids(records)
    records.select { |record| record.parent_item_id == 1 }.map(&:id)
  end

  def descendant_ids_below_children(records)
    records.reject { |record| record.parent_item_id.nil? || record.parent_item_id == 1 }.map(&:id)
  end

  it "flattens visible rows with depth and parent information" do
    rows = described_class.new(tree: tree, root_items: tree.root_items, render_state: build_render_state).to_a

    expect(rows.map(&:node_key)).to eq([1, 2, 3, 4])
    expect(rows.map(&:depth)).to eq([0, 1, 2, 1])
    expect(rows.map(&:parent_key)).to eq([nil, 1, 2, 1])
    expect(rows.map(&:has_children?)).to eq([true, true, false, false])
    expect(rows.map(&:expanded?)).to eq([true, true, false, false])
  end

  it "respects collapsed initial state" do
    rows = described_class.new(
      tree: tree,
      root_items: tree.root_items,
      render_state: build_render_state(initial_state: :collapsed)
    ).to_a

    expect(rows.map(&:node_key)).to eq([1])
    expect(rows.first.expanded?).to eq(false)
  end

  it "respects explicit expanded keys inside a collapsed tree" do
    rows = described_class.new(
      tree: tree,
      root_items: tree.root_items,
      render_state: build_render_state(initial_state: :collapsed, expanded_keys: [1, 2])
    ).to_a

    expect(rows.map(&:node_key)).to eq([1, 2, 3, 4])
    expect(rows.find { |row| row.node_key == 1 }.expanded?).to eq(true)
    expect(rows.find { |row| row.node_key == 2 }.expanded?).to eq(true)
  end

  it "respects collapsed keys inside an expanded tree" do
    rows = described_class.new(
      tree: tree,
      root_items: tree.root_items,
      render_state: build_render_state(initial_state: :expanded, collapsed_keys: [2])
    ).to_a

    expect(rows.map(&:node_key)).to eq([1, 2, 4])
    expect(rows.find { |row| row.node_key == 1 }.expanded?).to eq(true)
    expect(rows.find { |row| row.node_key == 2 }.expanded?).to eq(false)
    expect(rows.find { |row| row.node_key == 4 }.parent_key).to eq(1)
  end

  it "preserves sorted sibling order for wide trees" do
    extra_sibling = VisibleRowsNode.new(id: 5, parent_item_id: 1, name: "extra sibling")
    wide_tree = TreeView::Tree.new(
      records: nodes + [extra_sibling],
      parent_id_method: :parent_item_id,
      sorter: ->(items, _tree) { items.sort_by { |item| -item.id } }
    )
    wide_render_state = TreeView::RenderState.new(
      tree: wide_tree,
      root_items: wide_tree.root_items,
      row_partial: "items/tree_columns",
      ui_config: ui_config
    )

    rows = described_class.new(tree: wide_tree, root_items: wide_tree.root_items, render_state: wide_render_state).to_a

    expect(rows.map(&:node_key)).to eq([1, 5, 4, 2, 3])
    expect(rows.select { |row| row.parent_key == 1 }.map(&:node_key)).to eq([5, 4, 2])
  end

  it "respects max_render_depth" do
    rows = described_class.new(
      tree: tree,
      root_items: tree.root_items,
      render_state: build_render_state(max_render_depth: 1)
    ).to_a

    expect(rows.map(&:node_key)).to eq([1, 2, 4])
  end

  it "respects max_leaf_distance" do
    rows = described_class.new(
      tree: tree,
      root_items: tree.root_items,
      render_state: build_render_state(max_leaf_distance: 1)
    ).to_a

    expect(rows.map(&:node_key)).to eq([1, 2, 3, 4])
    expect(rows.map(&:depth)).to eq([0, 1, 2, 1])
  end

  it "respects max_initial_depth when deciding expanded rows" do
    rows = described_class.new(
      tree: tree,
      root_items: tree.root_items,
      render_state: build_render_state(max_initial_depth: 1)
    ).to_a

    expect(rows.map(&:node_key)).to eq([1, 2, 4])
    expect(rows.find { |row| row.node_key == 1 }.expanded?).to eq(true)
    expect(rows.find { |row| row.node_key == 2 }.expanded?).to eq(false)
  end

  it "traverses deep trees iteratively without overflowing the stack" do
    deep_nodes = build_chain(1_200)
    deep_tree = TreeView::Tree.new(
      records: deep_nodes,
      parent_id_method: :parent_item_id,
      sorter: ->(items, _tree) { items.sort_by(&:id) }
    )

    rows = nil
    expect do
      rows = described_class.new(
        tree: deep_tree,
        root_items: deep_tree.root_items,
        render_state: build_render_state(tree: deep_tree)
      ).to_a
    end.not_to raise_error

    expect(rows.length).to eq(1_200)
    expect(rows.first.node_key).to eq(1)
    expect(rows.last.node_key).to eq(1_200)
    expect(rows.last.depth).to eq(1_199)
  end

  it "limits output to max_render_depth for a representative wide tree" do
    wide_nodes = build_wide_tree(child_count: 50, grandchildren_per_child: 10)
    wide_tree = TreeView::Tree.new(
      records: wide_nodes,
      parent_id_method: :parent_item_id,
      sorter: ->(items, _tree) { items.sort_by(&:id) }
    )

    rows = described_class.new(
      tree: wide_tree,
      root_items: wide_tree.root_items,
      render_state: build_render_state(tree: wide_tree, max_render_depth: 1)
    ).to_a

    expect(rows.length).to eq(51)
    expect(rows.map(&:depth).uniq).to contain_exactly(0, 1)
    expect(rows.map(&:node_key)).to eq([1] + direct_child_ids(wide_nodes))
  end

  it "feeds a representative wide tree into a render window with stable boundary counts" do
    wide_nodes = build_wide_tree(child_count: 5)
    wide_tree = TreeView::Tree.new(
      records: wide_nodes,
      parent_id_method: :parent_item_id,
      sorter: ->(items, _tree) { items.sort_by(&:id) }
    )

    rows = described_class.new(
      tree: wide_tree,
      root_items: wide_tree.root_items,
      render_state: build_render_state(tree: wide_tree)
    ).to_a
    window = TreeView::RenderWindow.new(rows, offset: 2, limit: 3)

    expect(rows.map(&:node_key)).to eq([1] + direct_child_ids(wide_nodes))
    expect(window.rows.map(&:node_key)).to eq([3, 4, 5])
    expect(window.total_count).to eq(6)
    expect(window.before_count).to eq(2)
    expect(window.after_count).to eq(1)
    expect(window.previous_offset).to eq(0)
    expect(window.next_offset).to eq(5)
  end

  it "keeps out-of-range render windows explainable for visible row output" do
    rows = described_class.new(tree: tree, root_items: tree.root_items, render_state: build_render_state).to_a
    window = TreeView::RenderWindow.new(rows, offset: 10, limit: 3)

    expect(window.rows).to eq([])
    expect(window.total_count).to eq(4)
    expect(window.before_count).to eq(4)
    expect(window.after_count).to eq(0)
    expect(window.next_offset).to be_nil
    expect(window.previous_offset).to eq(7)
  end

  it "does not traverse hidden grandchildren for collapsed wide branches" do
    mixed_nodes = build_wide_tree(child_count: 40, grandchildren_per_child: 5)
    mixed_tree = TreeView::Tree.new(
      records: mixed_nodes,
      parent_id_method: :parent_item_id,
      sorter: ->(items, _tree) { items.sort_by(&:id) }
    )
    visited_parent_ids = []

    allow(mixed_tree).to receive(:children_for).and_wrap_original do |original, item|
      visited_parent_ids << item.id
      original.call(item)
    end

    rows = described_class.new(
      tree: mixed_tree,
      root_items: mixed_tree.root_items,
      render_state: build_render_state(tree: mixed_tree, initial_state: :collapsed, expanded_keys: [1])
    ).to_a

    expect(rows.length).to eq(41)
    expect(visited_parent_ids).to contain_exactly(*rows.map(&:node_key))
    expect(visited_parent_ids).not_to include(*descendant_ids_below_children(mixed_nodes))
  end

  it "keeps sorter calls proportional to visible rows for collapsed branches" do
    sorter_calls = 0
    mixed_nodes = build_wide_tree(child_count: 30, grandchildren_per_child: 5)
    mixed_tree = TreeView::Tree.new(
      records: mixed_nodes,
      parent_id_method: :parent_item_id,
      sorter: lambda do |items, _tree|
        sorter_calls += 1
        items.sort_by(&:id)
      end
    )

    rows = described_class.new(
      tree: mixed_tree,
      root_items: mixed_tree.root_items,
      render_state: build_render_state(tree: mixed_tree, initial_state: :collapsed, expanded_keys: [1])
    ).to_a

    expect(rows.length).to eq(31)
    expect(sorter_calls).to be <= rows.length + 3
  end

  it "preserves filtered path traversal while honoring leaf distance limits" do
    filtered_nodes = build_chain(8)
    filtered_tree = TreeView::Tree.new(
      records: filtered_nodes,
      parent_id_method: :parent_item_id,
      sorter: ->(items, _tree) { items.sort_by(&:id) }
    )
    path_tree = filtered_tree.path_tree_for([filtered_nodes.last])

    rows = described_class.new(
      tree: path_tree,
      root_items: path_tree.root_items,
      render_state: build_render_state(tree: path_tree, max_leaf_distance: 2)
    ).to_a

    expect(rows.map(&:node_key)).to eq([6, 7, 8])
    expect(rows.map(&:depth)).to eq([5, 6, 7])
  end
end
