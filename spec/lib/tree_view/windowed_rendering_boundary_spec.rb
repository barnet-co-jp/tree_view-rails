# frozen_string_literal: true

require "spec_helper"

WindowedRenderingBoundarySpecNode = Struct.new(:id, :parent_item_id, :name)

RSpec.describe "Windowed rendering boundary guards" do
  let(:ui_config) { TreeView::UiConfigBuilder.new(context: Object.new, node_prefix: "node").build_static }

  def build_chain(length)
    (1..length).map do |id|
      WindowedRenderingBoundarySpecNode.new(
        id: id,
        parent_item_id: (id == 1) ? nil : id - 1,
        name: "node #{id}"
      )
    end
  end

  def build_wide_tree(child_count:, grandchildren_per_child:)
    records = [WindowedRenderingBoundarySpecNode.new(id: 1, parent_item_id: nil, name: "root")]
    next_id = 2

    child_count.times do |child_index|
      child_id = next_id
      records << WindowedRenderingBoundarySpecNode.new(id: child_id, parent_item_id: 1, name: "child #{child_index}")
      next_id += 1

      grandchildren_per_child.times do |grandchild_index|
        records << WindowedRenderingBoundarySpecNode.new(
          id: next_id,
          parent_item_id: child_id,
          name: "grandchild #{child_index}-#{grandchild_index}"
        )
        next_id += 1
      end
    end

    records
  end

  def build_tree(records)
    TreeView::Tree.new(
      records: records,
      parent_id_method: :parent_item_id,
      sorter: ->(items, _tree) { items.sort_by(&:id) }
    )
  end

  def build_render_state(tree, **options)
    TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      **options
    )
  end

  it "keeps representative VisibleRows structures reproducible" do
    cases = [
      {
        name: "collapsed root",
        records: build_chain(4),
        options: {initial_state: :collapsed},
        expected_rows: [
          [1, 0, nil, false]
        ]
      },
      {
        name: "expanded deep chain",
        records: build_chain(4),
        options: {},
        expected_rows: [
          [1, 0, nil, true],
          [2, 1, 1, true],
          [3, 2, 2, true],
          [4, 3, 3, false]
        ]
      },
      {
        name: "wide tree with expanded root only",
        records: build_wide_tree(child_count: 3, grandchildren_per_child: 2),
        options: {initial_state: :collapsed, expanded_keys: [1]},
        expected_rows: [
          [1, 0, nil, true],
          [2, 1, 1, false],
          [5, 1, 1, false],
          [8, 1, 1, false]
        ]
      }
    ]

    cases.each do |test_case|
      tree = build_tree(test_case.fetch(:records))
      rows = TreeView::VisibleRows.new(
        tree: tree,
        root_items: tree.root_items,
        render_state: build_render_state(tree, **test_case.fetch(:options))
      ).to_a

      aggregate_failures(visible_rows_case_description(test_case)) do
        row_summaries = rows.map do |row|
          [row.node_key, row.depth, row.parent_key, row.expanded?]
        end

        expect(row_summaries).to eq(test_case.fetch(:expected_rows))
      end
    end
  end

  it "keeps RenderWindow boundary metadata stable across representative offsets" do
    rows = (1..8).to_a
    cases = [
      render_window_case(
        name: "first page",
        offset: 0,
        limit: 3,
        window_rows: [1, 2, 3],
        before_count: 0,
        after_count: 5,
        start_index: 0,
        end_index: 3,
        previous_offset: nil,
        next_offset: 3,
        previous: false,
        next: true
      ),
      render_window_case(
        name: "middle page",
        offset: 3,
        limit: 3,
        window_rows: [4, 5, 6],
        before_count: 3,
        after_count: 2,
        start_index: 3,
        end_index: 6,
        previous_offset: 0,
        next_offset: 6,
        previous: true,
        next: true
      ),
      render_window_case(
        name: "tail page",
        offset: 6,
        limit: 3,
        window_rows: [7, 8],
        before_count: 6,
        after_count: 0,
        start_index: 6,
        end_index: 8,
        previous_offset: 3,
        next_offset: nil,
        previous: true,
        next: false
      ),
      render_window_case(
        name: "beyond total count",
        offset: 11,
        limit: 3,
        window_rows: [],
        before_count: 8,
        after_count: 0,
        start_index: 8,
        end_index: 0,
        previous_offset: 8,
        next_offset: nil,
        previous: true,
        next: false
      ),
      render_window_case(
        name: "empty source",
        source_rows: [],
        offset: 0,
        limit: 3,
        window_rows: [],
        before_count: 0,
        after_count: 0,
        start_index: 0,
        end_index: 0,
        previous_offset: nil,
        next_offset: nil,
        previous: false,
        next: false
      )
    ]

    cases.each do |test_case|
      source_rows = test_case.fetch(:source_rows, rows)
      window = TreeView::RenderWindow.new(source_rows, offset: test_case.fetch(:offset), limit: test_case.fetch(:limit))

      aggregate_failures(render_window_case_description(test_case, total: source_rows.length)) do
        expect(window.to_a).to eq(test_case.fetch(:window_rows))
        expect(window.before_count).to eq(test_case.fetch(:before_count))
        expect(window.after_count).to eq(test_case.fetch(:after_count))
        expect(window.start_index).to eq(test_case.fetch(:start_index))
        expect(window.end_index).to eq(test_case.fetch(:end_index))
        expect(window.previous_offset).to eq(test_case.fetch(:previous_offset))
        expect(window.next_offset).to eq(test_case.fetch(:next_offset))
        expect(window.previous?).to eq(test_case.fetch(:previous))
        expect(window.next?).to eq(test_case.fetch(:next))
      end
    end
  end

  def visible_rows_case_description(test_case)
    "#{test_case.fetch(:name)} records=#{test_case.fetch(:records).map(&:id).join(",")}"
  end

  def render_window_case(**options)
    options
  end

  def render_window_case_description(test_case, total:)
    "#{test_case.fetch(:name)} offset=#{test_case.fetch(:offset)} limit=#{test_case.fetch(:limit)} total=#{total}"
  end
end
