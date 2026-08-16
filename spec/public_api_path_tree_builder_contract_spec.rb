# frozen_string_literal: true

require "spec_helper"
require "yaml"

PATH_TREE_BUILDER_PUBLIC_API_MANIFEST_PATH = File.expand_path("../config/public_api_manifest.yml", __dir__)

RSpec.describe "PathTreeBuilder public contract" do
  def manifest
    @manifest ||= YAML.safe_load_file(PATH_TREE_BUILDER_PUBLIC_API_MANIFEST_PATH)
  end

  def manifest_node_shapes
    manifest.fetch("path_tree_builder_node_shapes")
  end

  def manifest_initializer
    manifest.fetch("path_tree_builder_initializer")
  end

  def node_shape_constant(shape)
    case shape.fetch("constant")
    when "PathTreeBuilder::FolderNode"
      TreeView::PathTreeBuilder::FolderNode
    when "PathTreeBuilder::RecordNode"
      TreeView::PathTreeBuilder::RecordNode
    else
      raise "Unknown PathTreeBuilder node shape constant: #{shape.fetch("constant")}"
    end
  end

  it "keeps manifest initializer keywords aligned with the runtime signature" do
    parameters = TreeView::PathTreeBuilder.instance_method(:initialize).parameters
    required_keywords = parameters.filter_map { |kind, name| name.to_s if kind == :keyreq }
    optional_keywords = parameters.filter_map { |kind, name| name.to_s if kind == :key }

    expect(manifest_initializer.fetch("required_keywords")).to eq(required_keywords)
    expect(manifest_initializer.fetch("optional_keywords")).to eq(optional_keywords)
  end

  it "keeps manifest node fields aligned with FolderNode and RecordNode members" do
    manifest_node_shapes.each do |shape_name, shape|
      expect(shape.fetch("fields")).to eq(node_shape_constant(shape).members.map(&:to_s)),
        "expected #{shape_name} fields to match the generated Struct members"
    end
  end

  it "keeps manifest predicates available on both public node shapes" do
    manifest_node_shapes.each do |shape_name, shape|
      node_class = node_shape_constant(shape)

      shape.fetch("predicates").each do |predicate_name|
        expect(node_class.public_instance_methods).to include(predicate_name.to_sym),
          "expected #{shape_name} to keep ##{predicate_name} public"
      end
    end
  end

  it "keeps FolderNode and RecordNode predicate behavior aligned with their public shapes" do
    folder = TreeView::PathTreeBuilder::FolderNode.new(
      key: "folder:guides",
      parent_key: nil,
      label: "guides",
      path: "guides",
      node_type: :folder
    )
    record = TreeView::PathTreeBuilder::RecordNode.new(
      key: "record:1",
      parent_key: "folder:guides",
      label: "Install",
      path: "guides/install.md",
      record: Object.new,
      node_type: :record
    )

    expect(folder.folder_node?).to be(true)
    expect(folder.record_node?).to be(false)
    expect(record.folder_node?).to be(false)
    expect(record.record_node?).to be(true)
  end
end
