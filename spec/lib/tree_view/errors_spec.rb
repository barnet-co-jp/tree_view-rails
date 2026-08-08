# frozen_string_literal: true

require "spec_helper"

RSpec.describe "TreeView errors" do
  let(:node_class) { Struct.new(:id, :parent_item_id, :name) }

  it "exposes a TreeView-specific base error that preserves ArgumentError compatibility" do
    expect(TreeView::Error).to be < ArgumentError
  end

  it "lets host apps rescue duplicate node key failures via TreeView::Error" do
    root = node_class.new(id: 1, parent_item_id: nil, name: "root")
    duplicate_root = node_class.new(id: 1, parent_item_id: nil, name: "duplicate-root")

    error = capture_error do
      TreeView::Tree.new(records: [root, duplicate_root], parent_id_method: :parent_item_id, validate_node_keys: true)
    end

    expect(error).to be_a(TreeView::DuplicateNodeKeyError)
    expect(error).to be_a(TreeView::Error)
    expect(error).to be_a(ArgumentError)
    expect(error.message).to match(/duplicate node_key detected/)
  end

  it "lets host apps rescue configuration failures via TreeView::Error" do
    error = capture_error do
      TreeView::Tree.new(records: [], parent_id_method: :parent_item_id, sorter: :name)
    end

    expect(error).to be_a(TreeView::ConfigurationError)
    expect(error).to be_a(TreeView::Error)
    expect(error.message).to match(/sorter must respond to call/)
  end

  it "lets host apps rescue render window failures via TreeView::Error" do
    error = capture_error do
      TreeView::RenderWindow.new([], offset: -1, limit: 10)
    end

    expect(error).to be_a(TreeView::InvalidRenderWindowError)
    expect(error).to be_a(TreeView::Error)
    expect(error.message).to match(/offset/)
  end

  def capture_error
    yield
    nil
  rescue => error
    error
  end
end
