# frozen_string_literal: true

require "spec_helper"
require "yaml"

GRAPH_ADAPTER_MANIFEST_PATH = File.expand_path("../config/public_api_manifest.yml", __dir__)
GRAPH_ADAPTER_EN_DOC_PATH = File.expand_path("../docs/en/graph-adapter.md", __dir__)
GRAPH_ADAPTER_JA_DOC_PATH = File.expand_path("../docs/ja/graph-adapter.md", __dir__)

RSpec.describe "GraphAdapter public manifest contract" do
  def manifest
    @manifest ||= YAML.safe_load_file(GRAPH_ADAPTER_MANIFEST_PATH)
  end

  def initializer_keyword_names(kind)
    TreeView::GraphAdapter.instance_method(:initialize).parameters.filter_map do |parameter_type, parameter_name|
      parameter_name.to_s if parameter_type == kind
    end
  end

  it "keeps initializer keywords aligned with the manifest" do
    initializer_manifest = manifest.fetch("graph_adapter_initializer")

    expect(initializer_manifest.fetch("required_keywords")).to eq(%w[roots children_resolver])
    expect(initializer_manifest.fetch("optional_keywords")).to eq(%w[node_key_resolver parent_resolver])
    expect(initializer_keyword_names(:keyreq)).to eq(initializer_manifest.fetch("required_keywords"))
    expect(initializer_keyword_names(:key)).to eq(initializer_manifest.fetch("optional_keywords"))
  end

  it "keeps representative GraphAdapter behavior inside the documented boundary" do
    node = Object.new
    child = Object.new
    node.define_singleton_method(:id) { 42 }
    child.define_singleton_method(:id) { 43 }
    children_resolver = ->(current_node) { child if current_node == node }
    parent_resolver = ->(current_node) { node if current_node == child }
    adapter = TreeView::GraphAdapter.new(
      roots: [node],
      children_resolver:,
      parent_resolver:
    )

    expect(adapter.roots).to eq([node])
    expect(adapter.children_for(node)).to eq([child])
    expect(adapter.children_for(child)).to eq([])
    expect(adapter.parent_for(child)).to eq(node)
    expect(adapter.node_key_for(node)).to eq([node.class.name, 42])
  end

  it "keeps GraphAdapter docs synced with the manifest boundary" do
    [GRAPH_ADAPTER_EN_DOC_PATH, GRAPH_ADAPTER_JA_DOC_PATH].each do |path|
      doc = File.read(path)

      expect(doc).to include("graph_adapter_initializer")
      expect(doc).to include("roots")
      expect(doc).to include("children_resolver")
      expect(doc).to include("node_key_resolver")
      expect(doc).to include("parent_resolver")
    end
  end
end
