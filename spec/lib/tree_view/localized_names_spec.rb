# frozen_string_literal: true

require "spec_helper"

class LocalizedNamesTestModelName
  def human(count: 1, default: nil)
    I18n.t(
      :localized_names_test_document,
      scope: "activemodel.models",
      count: count,
      default: default
    )
  end
end

class LocalizedNamesTestDocument
  def self.model_name
    LocalizedNamesTestModelName.new
  end

  def self.human_attribute_name(attribute_name, default: nil)
    I18n.t(
      attribute_name,
      scope: "activemodel.attributes.localized_names_test_document",
      default: default
    )
  end
end

class LocalizedNamesPlainDocument
end

LocalizedNamesTypedNode = Struct.new(:node_type)

RSpec.describe TreeView::LocalizedNames do
  around do |example|
    I18n.backend.store_translations(
      :en,
      activemodel: {
        models: {
          localized_names_test_document: {
            one: "Document",
            other: "Documents"
          }
        },
        attributes: {
          localized_names_test_document: {
            title: "Title"
          }
        }
      },
      tree_view: {
        node_types: {
          folder: "Folder"
        }
      }
    )

    example.run
  ensure
    I18n.reload!
  end

  it "resolves model names through ActiveModel-compatible naming and I18n" do
    expect(described_class.model_name_for(LocalizedNamesTestDocument)).to eq("Document")
    expect(described_class.model_name_for(LocalizedNamesTestDocument, count: 2)).to eq("Documents")
    expect(TreeView.model_name_for(LocalizedNamesTestDocument.new)).to eq("Document")
  end

  it "uses default model names when plain class fallback would otherwise be humanized" do
    expect(described_class.model_name_for(LocalizedNamesPlainDocument, default: "Plain fallback")).to eq("Plain fallback")
  end

  it "resolves attribute names through ActiveModel-compatible naming and I18n" do
    expect(described_class.attribute_name_for(LocalizedNamesTestDocument, :title)).to eq("Title")
    expect(TreeView.attribute_name_for(LocalizedNamesTestDocument.new, :title)).to eq("Title")
  end

  it "uses default attribute names when translations are missing" do
    expect(described_class.attribute_name_for(LocalizedNamesTestDocument, :status, default: "Lifecycle status")).to eq("Lifecycle status")
    expect(described_class.attribute_name_for(LocalizedNamesPlainDocument, :published_at, default: "Publication date")).to eq("Publication date")
  end

  it "resolves node type names through tree_view.node_types translations" do
    node = LocalizedNamesTypedNode.new(node_type: :folder)

    expect(described_class.type_name_for(node)).to eq("Folder")
    expect(TreeView.type_name_for(node)).to eq("Folder")
  end

  it "uses default node type names when node type translations are missing" do
    generated_node = LocalizedNamesTypedNode.new(node_type: :generated_folder)
    blank_node = LocalizedNamesTypedNode.new(node_type: "")

    expect(described_class.type_name_for(generated_node, default: "Generated folder fallback")).to eq("Generated folder fallback")
    expect(described_class.type_name_for(blank_node, default: "Untyped node")).to eq("Untyped node")
  end

  it "falls back to humanized class and attribute names" do
    expect(described_class.model_name_for(LocalizedNamesPlainDocument)).to eq("Localized Names Plain Document")
    expect(described_class.attribute_name_for(LocalizedNamesPlainDocument, :published_at)).to eq("Published at")
  end

  it "falls back to humanized node type names" do
    node = LocalizedNamesTypedNode.new(node_type: :generated_folder)

    expect(described_class.type_name_for(node)).to eq("Generated folder")
  end
end
