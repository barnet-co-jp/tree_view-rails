require "spec_helper"
StateHelperTestNode = Struct.new(:id)

RSpec.describe TreeViewStateHelper do
  let(:helper_host_class) do
    Class.new do
      include TreeViewStateHelper
    end
  end

  it "builds root data without a tree instance key" do
    state = instance_double(TreeView::RenderState, tree_instance_key: nil, row_event_payload_builder: nil, selection_enabled?: false, lazy_loading_enabled?: false)
    helper = helper_host_class.new

    expect(helper.tree_view_state_data(state)).to eq(controller: "tree-view-state")
  end

  it "builds root data with a tree instance key" do
    state = instance_double(TreeView::RenderState, tree_instance_key: "documents", row_event_payload_builder: nil, selection_enabled?: false, lazy_loading_enabled?: false)
    helper = helper_host_class.new

    expect(helper.tree_view_state_data(state)).to eq(
      controller: "tree-view-state",
      tree_view_state_tree_instance_key_value: "documents"
    )
  end

  it "adds the transfer controller when row event payloads are configured" do
    state = instance_double(TreeView::RenderState, tree_instance_key: nil, row_event_payload_builder: ->(_item) { {} }, selection_enabled?: false, lazy_loading_enabled?: false)
    helper = helper_host_class.new

    expect(helper.tree_view_state_data(state)).to eq(controller: "tree-view-state tree-view-transfer")
  end

  it "adds the remote-state controller and actions when lazy loading is configured" do
    state = instance_double(
      TreeView::RenderState,
      tree_instance_key: nil,
      row_event_payload_builder: nil,
      selection_enabled?: false,
      lazy_loading_enabled?: true
    )
    helper = helper_host_class.new

    expect(helper.tree_view_state_data(state)).to eq(
      controller: "tree-view-state tree-view-remote-state",
      action: [
        "tree-view:loading->tree-view-remote-state#loading",
        "tree-view:loaded->tree-view-remote-state#loaded",
        "tree-view:error->tree-view-remote-state#error",
        "tree-view:retry->tree-view-remote-state#retry"
      ].join(" ")
    )
  end

  it "adds the selection controller and cascade values when selection is configured" do
    state = instance_double(
      TreeView::RenderState,
      tree_instance_key: nil,
      row_event_payload_builder: nil,
      selection_enabled?: true,
      lazy_loading_enabled?: false,
      selection_cascade?: true,
      selection_indeterminate?: true,
      selection_max_count: 10
    )
    helper = helper_host_class.new

    expect(helper.tree_view_state_data(state)).to eq(
      controller: "tree-view-state tree-view-selection",
      action: "change->tree-view-selection#toggle",
      tree_view_selection_cascade_value: true,
      tree_view_selection_indeterminate_value: true,
      tree_view_selection_max_count_value: 10
    )
  end

  it "builds row state data" do
    item = StateHelperTestNode.new(id: 1)
    tree = instance_double(TreeView::Tree)
    allow(tree).to receive(:node_key_for).with(item).and_return("node-1")
    helper = helper_host_class.new

    expect(helper.tree_state_row_data(item, tree, expanded: true)).to eq(
      tree_view_state_target: "node",
      tree_view_state_node_key: "node-1",
      tree_view_state_expanded: true
    )
  end
end
