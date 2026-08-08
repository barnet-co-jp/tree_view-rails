# frozen_string_literal: true

require "spec_helper"

RSpec.describe "tree_remote_state_placeholder_attributes" do
  def test_node(id)
    Struct.new(:id).new(id: id)
  end

  def helper_with_ui
    helper_class = Class.new do
      include TreeViewHelper

      attr_accessor :tree_ui
    end

    helper_class.new.tap do |helper|
      helper.tree_ui = TreeView::UiConfig.new(
        node_dom_id_builder: ->(item_or_id) { "node_#{item_or_id.respond_to?(:id) ? item_or_id.id : item_or_id}" },
        button_dom_id_builder: ->(item_or_id) { "node_button_#{item_or_id.respond_to?(:id) ? item_or_id.id : item_or_id}" },
        show_button_dom_id_builder: ->(item_or_id) { "node_show_button_#{item_or_id.respond_to?(:id) ? item_or_id.id : item_or_id}" }
      )
    end
  end

  it "keeps the no-state placeholder id contract" do
    helper = helper_with_ui
    item = test_node(1)

    expect(helper.tree_remote_state_placeholder_attributes(item)).to eq({id: "node_1_remote_state"})
  end

  it "keeps documented loaded and error states as data attributes" do
    helper = helper_with_ui
    item = test_node(1)

    expect(helper.tree_remote_state_placeholder_attributes(item, state: "loaded")).to eq({
      id: "node_1_remote_state",
      data: {tree_remote_state: "loaded"}
    })
    expect(helper.tree_remote_state_placeholder_attributes(item, state: :error)).to eq({
      id: "node_1_remote_state",
      data: {tree_remote_state: "error"}
    })
  end

  it "passes host-app state values through with string coercion instead of validation" do
    helper = helper_with_ui
    item = test_node(1)

    expect(helper.tree_remote_state_placeholder_attributes(item, state: :loading)).to eq({
      id: "node_1_remote_state",
      data: {tree_remote_state: "loading"}
    })
    expect(helper.tree_remote_state_placeholder_attributes(item, state: "retry")).to eq({
      id: "node_1_remote_state",
      data: {tree_remote_state: "retry"}
    })
  end
end
