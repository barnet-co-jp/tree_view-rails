# frozen_string_literal: true

require "spec_helper"

RSpec.describe TreeView::StateStore do
  let(:model) { double("persisted state model") }
  let(:store) { described_class.new(model: model) }

  it "propagates backing model save failures" do
    error_class = Class.new(StandardError)
    error = error_class.new("database unavailable")
    record = double("persisted state record")

    allow(record).to receive(:expanded_keys=).with(["node-1"])
    allow(record).to receive(:save!).and_raise(error)
    allow(model).to receive(:find_or_initialize_by)
      .with(owner: :user, tree_instance_key: "documents")
      .and_return(record)

    expect do
      store.save!(owner: :user, tree_instance_key: "documents", expanded_keys: ["node-1"])
    end.to raise_error(error_class, "database unavailable")
  end

  it "propagates a concurrent uniqueness violation without retrying" do
    error_class = Class.new(StandardError)
    error = error_class.new("duplicate owner/tree_instance_key")
    record = double("persisted state record")

    expect(model).to receive(:find_or_initialize_by)
      .with(owner: :user, tree_instance_key: "documents")
      .once
      .and_return(record)
    expect(record).to receive(:expanded_keys=).with(["node-1"]).once
    expect(record).to receive(:save!).once.and_raise(error)

    expect do
      store.save!(owner: :user, tree_instance_key: "documents", expanded_keys: ["node-1"])
    end.to raise_error { |raised| expect(raised).to equal(error) }
  end

  it "coerces expanded keys before attempting to save" do
    record = double("persisted state record", expanded_keys: ["node-1"])

    allow(record).to receive(:expanded_keys=).with(["node-1"])
    allow(record).to receive(:save!).and_return(true)
    allow(model).to receive(:find_or_initialize_by)
      .with(owner: :user, tree_instance_key: "documents")
      .and_return(record)

    state = store.save!(owner: :user, tree_instance_key: "documents", expanded_keys: "node-1")

    expect(state).to be_a(TreeView::PersistedState)
    expect(state.tree_instance_key).to eq("documents")
    expect(state.expanded_keys).to eq(["node-1"])
  end

  it "propagates backing model destroy failures" do
    error_class = Class.new(StandardError)
    error = error_class.new("destroy failed")
    record = double("persisted state record")

    allow(record).to receive(:destroy!).and_raise(error)
    allow(model).to receive(:find_by)
      .with(owner: :user, tree_instance_key: "documents")
      .and_return(record)

    expect do
      store.clear!(owner: :user, tree_instance_key: "documents")
    end.to raise_error(error_class, "destroy failed")
  end

  it "treats clearing a missing record as an empty persisted state" do
    allow(model).to receive(:find_by)
      .with(owner: :user, tree_instance_key: "documents")
      .and_return(nil)

    state = store.clear!(owner: :user, tree_instance_key: "documents")

    expect(state).to be_a(TreeView::PersistedState)
    expect(state.tree_instance_key).to eq("documents")
    expect(state.expanded_keys).to eq([])
  end
end
