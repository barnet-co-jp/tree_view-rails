# frozen_string_literal: true

require "spec_helper"
require "yaml"

PublicErrorCompatibilityTestNode = Struct.new(:id, :parent_id, :name)
PUBLIC_ERROR_COMPATIBILITY_MANIFEST_PATH = File.expand_path("../config/public_api_manifest.yml", __dir__)

RSpec.describe "TreeView public error compatibility" do
  def public_api_manifest
    @public_api_manifest ||= YAML.safe_load_file(PUBLIC_ERROR_COMPATIBILITY_MANIFEST_PATH)
  end

  def expected_error_hierarchy
    {
      "Error" => ArgumentError,
      "ConfigurationError" => TreeView::Error,
      "InvalidTreeError" => TreeView::Error,
      "DuplicateNodeKeyError" => TreeView::InvalidTreeError,
      "CycleDetectedError" => TreeView::InvalidTreeError,
      "InvalidRenderWindowError" => TreeView::Error
    }
  end

  it "keeps documented public error constants in the public manifest" do
    public_constants = public_api_manifest.fetch("public_constants")

    expected_error_hierarchy.each_key do |constant_name|
      expect(public_constants).to include(constant_name),
        "expected TreeView::#{constant_name} to stay listed in the public API manifest"
    end
  end

  it "keeps the documented public error hierarchy stable" do
    expected_error_hierarchy.each do |constant_name, parent_class|
      error_class = TreeView.const_get(constant_name)

      expect(error_class.superclass).to eq(parent_class),
        "expected TreeView::#{constant_name} to keep #{parent_class} as its direct parent"
    end
  end

  it "raises documented public error subclasses for representative validation failures" do
    duplicate_records = [
      PublicErrorCompatibilityTestNode.new(id: 1, parent_id: nil, name: "Root"),
      PublicErrorCompatibilityTestNode.new(id: 1, parent_id: nil, name: "Duplicate root")
    ]
    duplicate_tree = TreeView::Tree.new(records: duplicate_records, parent_id_method: :parent_id)

    expect { duplicate_tree.validate_unique_node_keys! }.to raise_error(TreeView::DuplicateNodeKeyError)

    cyclic_records = [
      PublicErrorCompatibilityTestNode.new(id: 1, parent_id: 2, name: "First"),
      PublicErrorCompatibilityTestNode.new(id: 2, parent_id: 1, name: "Second")
    ]
    cyclic_tree = TreeView::Tree.new(records: cyclic_records, parent_id_method: :parent_id)

    expect { cyclic_tree.descendant_counts }.to raise_error(TreeView::CycleDetectedError)
    expect { TreeView::RenderWindow.new([], offset: -1, limit: 1) }.to raise_error(TreeView::InvalidRenderWindowError)
  end
end
