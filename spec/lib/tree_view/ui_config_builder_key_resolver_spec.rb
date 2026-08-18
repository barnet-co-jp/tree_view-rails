# frozen_string_literal: true

require "spec_helper"

RSpec.describe TreeView::UiConfigBuilder do
  it "keeps id as the default DOM key when id is available" do
    item = Struct.new(:id, :key).new(8, "node-8")
    config = described_class.new(context: double(:context), node_prefix: "entry").build_client_side

    expect(config.node_dom_id(item)).to eq("entry_8")
  end

  it "uses key when the item has no id method" do
    node_type = Data.define(:key, :label)
    item = node_type.new(key: "step:42", label: "Step")
    config = described_class.new(context: double(:context), node_prefix: "entry").build_client_side

    expect(config.node_dom_id(item)).to eq("entry_step:42")
    expect(config.button_dom_id(item)).to eq("entry_button_box_step:42")
    expect(config.show_button_dom_id(item)).to eq("entry_show_button_step:42")
  end

  it "preserves the legacy fallback when neither id nor key is available" do
    item = Object.new
    allow(item).to receive(:to_s).and_return("opaque-node")
    config = described_class.new(context: double(:context), node_prefix: "entry").build_client_side

    expect(config.node_dom_id(item)).to eq("entry_opaque-node")
  end
end
