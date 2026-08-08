require "spec_helper"

RSpec.describe TreeView::RenderState do
  RenderStateTestNode = Struct.new(:id, :parent_id, :name)

  let(:tree) { instance_double(TreeView::Tree) }
  let(:ui_config) { instance_double(TreeView::UiConfig) }

  it "stores tree, root_items, row_partial, and ui_config" do
    root_items = [double(:node)]
    row_partial = "items/tree_columns"

    state = described_class.new(tree: tree, root_items: root_items, row_partial: row_partial, ui_config: ui_config)

    expect(state.tree).to eq(tree)
    expect(state.root_items).to eq(root_items)
    expect(state.row_partial).to eq(row_partial)
    expect(state.ui_config).to eq(ui_config)
  end

  it "stores max_initial_depth when given" do
    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      max_initial_depth: 2
    )

    expect(state.max_initial_depth).to eq(2)
  end

  it "rejects invalid max_initial_depth values" do
    expect do
      described_class.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        max_initial_depth: "2"
      )
    end.to raise_error(ArgumentError, /max_initial_depth/)
  end

  it "stores max_render_depth when given" do
    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      max_render_depth: 2
    )

    expect(state.max_render_depth).to eq(2)
  end

  it "rejects invalid max_render_depth values" do
    expect do
      described_class.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        max_render_depth: -1
      )
    end.to raise_error(ArgumentError, /max_render_depth/)
  end

  it "stores max_leaf_distance when given" do
    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      max_leaf_distance: 2
    )

    expect(state.max_leaf_distance).to eq(2)
  end

  it "rejects invalid max_leaf_distance values" do
    expect do
      described_class.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        max_leaf_distance: -1
      )
    end.to raise_error(ArgumentError, /max_leaf_distance/)
  end

  it "stores max_toggle_depth_from_root when given" do
    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      max_toggle_depth_from_root: 2
    )

    expect(state.max_toggle_depth_from_root).to eq(2)
  end

  it "rejects invalid max_toggle_depth_from_root values" do
    expect do
      described_class.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        max_toggle_depth_from_root: "2"
      )
    end.to raise_error(ArgumentError, /max_toggle_depth_from_root/)
  end

  it "stores max_toggle_leaf_distance when given" do
    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      max_toggle_leaf_distance: 2
    )

    expect(state.max_toggle_leaf_distance).to eq(2)
  end

  it "rejects invalid max_toggle_leaf_distance values" do
    expect do
      described_class.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        max_toggle_leaf_distance: -1
      )
    end.to raise_error(ArgumentError, /max_toggle_leaf_distance/)
  end

  it "stores expanded_keys when given" do
    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      expanded_keys: [1, 2]
    )

    expect(state.expanded_keys).to eq([1, 2])
  end

  it "stores collapsed_keys when given" do
    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      collapsed_keys: [1, 2]
    )

    expect(state.collapsed_keys).to eq([1, 2])
  end

  it "stores grouped initial_expansion options" do
    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      initial_expansion: {
        default: :collapsed,
        max_depth: 2,
        expanded_keys: [1, 2],
        collapsed_keys: [3]
      }
    )

    expect(state.initial_state).to eq(:collapsed)
    expect(state.max_initial_depth).to eq(2)
    expect(state.expanded_keys).to eq([1, 2])
    expect(state.collapsed_keys).to eq([3])
  end

  it "auto-expands ancestors for current_item" do
    root = RenderStateTestNode.new(id: 1, parent_id: nil, name: "Root")
    folder = RenderStateTestNode.new(id: 2, parent_id: 1, name: "Folder")
    document = RenderStateTestNode.new(id: 3, parent_id: 2, name: "Document")
    real_tree = TreeView::Tree.new(records: [root, folder, document], parent_id_method: :parent_id)

    state = described_class.new(
      tree: real_tree,
      root_items: real_tree.root_items,
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      current_item: document,
      auto_expand_ancestors: true,
      expanded_keys: [99],
      initial_expansion: {default: :collapsed}
    )

    expect(state.current_item).to eq(document)
    expect(state.current_key).to be_nil
    expect(state.auto_expand_ancestors?).to eq(true)
    expect(state.expanded_keys).to eq([99, 1, 2])
  end

  it "auto-expands ancestors for current_key under root_items" do
    root = RenderStateTestNode.new(id: 1, parent_id: nil, name: "Root")
    folder = RenderStateTestNode.new(id: 2, parent_id: 1, name: "Folder")
    document = RenderStateTestNode.new(id: 3, parent_id: 2, name: "Document")
    real_tree = TreeView::Tree.new(records: [root, folder, document], parent_id_method: :parent_id)

    state = described_class.new(
      tree: real_tree,
      root_items: real_tree.root_items,
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      initial_expansion: {
        default: :collapsed,
        current_key: 3,
        auto_expand_ancestors: true
      }
    )

    expect(state.current_key).to eq(3)
    expect(state.auto_expand_ancestors?).to eq(true)
    expect(state.expanded_keys).to eq([1, 2])
  end

  it "rejects auto_expand_ancestors without a matching current node" do
    real_tree = TreeView::Tree.new(records: [], parent_id_method: :parent_id)

    expect do
      described_class.new(
        tree: real_tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        current_key: 999,
        auto_expand_ancestors: true
      )
    end.to raise_error(TreeView::ConfigurationError, /auto_expand_ancestors requires current_item/)
  end

  it "rejects invalid auto_expand_ancestors values" do
    expect do
      described_class.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        auto_expand_ancestors: "true"
      )
    end.to raise_error(TreeView::ConfigurationError, /auto_expand_ancestors must be true or false/)
  end

  it "rejects conflicting expanded and collapsed keys after ancestor expansion" do
    root = RenderStateTestNode.new(id: 1, parent_id: nil, name: "Root")
    folder = RenderStateTestNode.new(id: 2, parent_id: 1, name: "Folder")
    document = RenderStateTestNode.new(id: 3, parent_id: 2, name: "Document")
    real_tree = TreeView::Tree.new(records: [root, folder, document], parent_id_method: :parent_id)

    expect do
      described_class.new(
        tree: real_tree,
        root_items: real_tree.root_items,
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        current_item: document,
        auto_expand_ancestors: true,
        collapsed_keys: [2]
      )
    end.to raise_error(ArgumentError, /expanded_keys and collapsed_keys/)
  end

  it "rejects conflicting expanded and collapsed keys" do
    expect do
      described_class.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        expanded_keys: [1, 2],
        collapsed_keys: [2, 3]
      )
    end.to raise_error(ArgumentError, /expanded_keys and collapsed_keys/)
  end

  it "stores grouped render_scope options" do
    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      render_scope: {
        max_depth: 3,
        max_leaf_distance: 2
      }
    )

    expect(state.max_render_depth).to eq(3)
    expect(state.max_leaf_distance).to eq(2)
  end

  it "stores grouped toggle_scope options" do
    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      toggle_scope: {
        max_depth_from_root: 3,
        max_leaf_distance: 2
      }
    )

    expect(state.max_toggle_depth_from_root).to eq(3)
    expect(state.max_toggle_leaf_distance).to eq(2)
  end

  it "stores grouped lazy_loading options" do
    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      lazy_loading: {
        enabled: true,
        loaded_keys: [1, 2],
        scope: "children"
      }
    )

    expect(state.lazy_loading_enabled?).to eq(true)
    expect(state.lazy_loading_loaded_keys).to eq([1, 2])
    expect(state.lazy_loading_scope).to eq("children")
  end

  it "rejects lazy loading with client-side toggle mode" do
    client_ui = instance_double(TreeView::UiConfig, client?: true)

    expect do
      described_class.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: client_ui,
        lazy_loading: {enabled: true}
      )
    end.to raise_error(TreeView::ConfigurationError, /lazy_loading cannot be enabled with client-side toggle mode/)
  end

  it "rejects unknown lazy_loading keys" do
    expect do
      described_class.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        lazy_loading: {
          future_key: true
        }
      )
    end.to raise_error(ArgumentError, /lazy_loading contains unknown keys/)
  end

  it "stores selection options" do
    payload_builder = ->(item) { {id: item.id} }

    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      selectable: true,
      selection_payload_builder: payload_builder,
      selection_checkbox_name: "documents[]"
    )

    expect(state.selection_enabled?).to eq(true)
    expect(state.selection_payload_builder).to eq(payload_builder)
    expect(state.selection_checkbox_name).to eq("documents[]")
  end

  it "stores selection disabled builders" do
    disabled_builder = ->(item) { item.disabled? }
    disabled_reason_builder = ->(item) { item.disabled? ? "disabled" : nil }

    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      selection: {
        enabled: true,
        disabled_builder: disabled_builder,
        disabled_reason_builder: disabled_reason_builder
      }
    )

    expect(state.selection_disabled_builder).to eq(disabled_builder)
    expect(state.selection_disabled_reason_builder).to eq(disabled_reason_builder)
  end

  it "stores selection selected keys" do
    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      selection: {
        enabled: true,
        selected_keys: [1, 2]
      }
    )

    expect(state.selection_selected_keys).to eq([1, 2])
  end

  it "stores grouped selection options" do
    payload_builder = ->(item) { {id: item.id} }

    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      selection: {
        enabled: true,
        payload_builder: payload_builder,
        checkbox_name: "documents[]",
        cascade: true,
        indeterminate: true,
        max_count: 10
      }
    )

    expect(state.selection_enabled?).to eq(true)
    expect(state.selection_payload_builder).to eq(payload_builder)
    expect(state.selection_checkbox_name).to eq("documents[]")
    expect(state.selection_cascade?).to eq(true)
    expect(state.selection_indeterminate?).to eq(true)
    expect(state.selection_max_count).to eq(10)
  end

  it "rejects invalid selection cascade options" do
    expect do
      described_class.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        selection: {enabled: true, cascade: "true"}
      )
    end.to raise_error(ArgumentError, /selection_cascade must be true or false/)
  end

  it "rejects invalid selection max count" do
    expect do
      described_class.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        selection: {enabled: true, max_count: 0}
      )
    end.to raise_error(ArgumentError, /selection_max_count must be a positive Integer/)
  end

  it "uses the default selection checkbox name" do
    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      selectable: true
    )

    expect(state.selection_checkbox_name).to eq("selected_nodes[]")
  end

  it "rejects invalid selection options" do
    expect do
      described_class.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        selection: {enabled: true, unknown: true}
      )
    end.to raise_error(ArgumentError, /selection contains unknown keys: unknown/)
  end

  it "rejects invalid selectable values" do
    expect do
      described_class.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        selectable: "true"
      )
    end.to raise_error(ArgumentError, /selectable must be true or false/)
  end

  it "rejects invalid selection payload builders" do
    expect do
      described_class.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        selection: {enabled: true, payload_builder: :invalid}
      )
    end.to raise_error(ArgumentError, /selection_payload_builder/)
  end

  it "rejects invalid selection disabled builders" do
    expect do
      described_class.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        selection: {enabled: true, disabled_builder: :invalid}
      )
    end.to raise_error(ArgumentError, /selection_disabled_builder/)
  end

  it "prefers individual options over grouped options" do
    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      initial_state: :expanded,
      max_initial_depth: 1,
      max_render_depth: 1,
      max_leaf_distance: 1,
      max_toggle_depth_from_root: 1,
      max_toggle_leaf_distance: 1,
      expanded_keys: [9],
      collapsed_keys: [8],
      initial_expansion: {
        default: :collapsed,
        max_depth: 2,
        expanded_keys: [1, 2],
        collapsed_keys: [3],
        current_key: 10,
        auto_expand_ancestors: true
      },
      render_scope: {
        max_depth: 3,
        max_leaf_distance: 2
      },
      toggle_scope: {
        max_depth_from_root: 3,
        max_leaf_distance: 2
      }
    )

    expect(state.initial_state).to eq(:expanded)
    expect(state.max_initial_depth).to eq(1)
    expect(state.max_render_depth).to eq(1)
    expect(state.max_leaf_distance).to eq(1)
    expect(state.max_toggle_depth_from_root).to eq(1)
    expect(state.max_toggle_leaf_distance).to eq(1)
    expect(state.expanded_keys).to eq([9])
    expect(state.collapsed_keys).to eq([8])
    expect(state.current_key).to eq(10)
    expect(state.auto_expand_ancestors?).to eq(true)
  end

  it "rejects unknown grouped option keys" do
    expect do
      described_class.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        render_scope: {max_depth: 2, unknown: true}
      )
    end.to raise_error(ArgumentError, /render_scope contains unknown keys: unknown/)
  end

  it "rejects non hash-like grouped options" do
    expect do
      described_class.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        toggle_scope: :invalid
      )
    end.to raise_error(ArgumentError, /toggle_scope must respond to to_h/)
  end

  it "stores row attribute builders when given" do
    row_class_builder = ->(item) { item.name }
    row_data_builder = ->(item) { {name: item.name} }

    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      row_class_builder: row_class_builder,
      row_data_builder: row_data_builder
    )

    expect(state.row_class_builder).to eq(row_class_builder)
    expect(state.row_data_builder).to eq(row_data_builder)
  end

  it "rejects invalid row attribute builders" do
    expect do
      described_class.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        row_class_builder: :invalid
      )
    end.to raise_error(ArgumentError, /row_class_builder/)
  end

  it "stores initial_state when given" do
    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      initial_state: :collapsed
    )

    expect(state.initial_state).to eq(:collapsed)
    expect(state.effective_initial_state).to eq(:collapsed)
  end

  it "falls back to global config when initial_state is omitted" do
    TreeView.configure do |config|
      config.initial_state = :collapsed
    end

    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config
    )

    expect(state.initial_state).to be_nil
    expect(state.effective_initial_state).to eq(:collapsed)
  end

  it "prefers render state over global config" do
    TreeView.configure do |config|
      config.initial_state = :expanded
    end

    state = described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      initial_state: :collapsed
    )

    expect(state.effective_initial_state).to eq(:collapsed)
  end

  it "rejects invalid initial_state" do
    expect do
      described_class.new(
        tree: tree,
        root_items: [],
        row_partial: "items/tree_columns",
        ui_config: ui_config,
        initial_state: :invalid
      )
    end.to raise_error(ArgumentError, /initial_state/)
  end
end
