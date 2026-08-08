require "spec_helper"

RSpec.describe TreeView::RenderState, "toggle icon lookup" do
  let(:node_class) { Struct.new(:id, :node_type) }
  let(:tree) { instance_double(TreeView::Tree) }
  let(:ui_config) { instance_double(TreeView::UiConfig) }

  def build_state(toggle_icons)
    described_class.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      toggle_icons: toggle_icons
    )
  end

  it "prefers node type icons before depth and state icons" do
    state = build_state(
      by_type: {
        "folder" => {
          "expanded" => {text: "folder-open"},
          "collapsed" => {text: "folder-closed"}
        }
      },
      by_depth: {
        1 => {
          expanded: {text: "depth-open"},
          collapsed: {text: "depth-closed"}
        }
      },
      by_state: {
        expanded: {text: "state-open"},
        collapsed: {text: "state-closed"}
      }
    )

    folder = node_class.new(id: 1, node_type: :folder)

    expect(state.toggle_icon_builder.call(folder, :expanded, {depth: 1})).to eq({text: "folder-open"})
    expect(state.toggle_icon_builder.call(folder, "collapsed", {"depth" => 1})).to eq({text: "folder-closed"})
  end

  it "falls back from depth icons to state icons" do
    state = build_state(
      by_depth: {
        "2" => {
          expanded: {text: "depth-open"},
          collapsed: {text: "depth-closed"}
        }
      },
      by_state: {
        "leaf" => {text: "state-leaf"},
        "loading" => {text: "state-loading"}
      }
    )

    node = node_class.new(id: 1)

    expect(state.toggle_icon_builder.call(node, :expanded, {depth: 2})).to eq({text: "depth-open"})
    expect(state.toggle_icon_builder.call(node, :leaf, {depth: 3})).to eq({text: "state-leaf"})
    expect(state.toggle_icon_builder.call(node, "loading", {depth: nil})).to eq({text: "state-loading"})
  end
end
