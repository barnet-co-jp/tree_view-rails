# frozen_string_literal: true

require "spec_helper"

NodePresenterTestNode = Struct.new(:id, :name, :kind)

class NodePresenterLocalizedModelName
  def human(count: 1, default: nil)
    I18n.t(
      :node_presenter_localized_document,
      scope: "activemodel.models",
      count: count,
      default: default
    )
  end
end

class NodePresenterLocalizedDocument
  attr_reader :node_type, :status

  def initialize(node_type:, status: nil)
    @node_type = node_type
    @status = status
  end

  def self.model_name
    NodePresenterLocalizedModelName.new
  end

  def self.human_attribute_name(attribute_name, default: nil)
    I18n.t(
      attribute_name,
      scope: "activemodel.attributes.node_presenter_localized_document",
      default: default
    )
  end
end

class NodePresenterTitledDocument < NodePresenterLocalizedDocument
  attr_reader :title

  def initialize(title:, node_type:, status: nil)
    super(node_type: node_type, status: status)
    @title = title
  end
end

RSpec.describe TreeView::NodePresenter do
  let(:node) { NodePresenterTestNode.new(id: 1, name: "Guide", kind: "document") }

  it "defines builder methods and resolves values" do
    presenter = described_class.define do
      key { |item| TreeView.node_key(:document, item.id) }
      label { |item| item.name }
      href { |item| "/documents/#{item.id}" }
      tooltip { |item| "Open #{item.name}" }
      row_class { |item| "tree-node--#{item.kind}" }
      row_data { |item| {node_kind: item.kind} }
      icon { |item| item.kind }
      badge { |_item| "new" }
      actions { |item| [:open, item.id] }
    end

    expect(presenter.key_for(node)).to eq("document:1")
    expect(presenter.label_for(node)).to eq("Guide")
    expect(presenter.href_for(node)).to eq("/documents/1")
    expect(presenter.tooltip_for(node)).to eq("Open Guide")
    expect(presenter.row_class_for(node)).to eq("tree-node--document")
    expect(presenter.row_data_for(node)).to eq({node_kind: "document"})
    expect(presenter.icon_for(node)).to eq("document")
    expect(presenter.badge_for(node)).to eq("new")
    expect(presenter.actions_for(node)).to eq([:open, 1])
  end

  it "returns render state compatible builders" do
    presenter = described_class.define do
      row_class { |item| "tree-node--#{item.kind}" }
      row_data { |item| {node_kind: item.kind} }
      badge { |item| item.name }
      icon { |item| item.kind }
    end

    expect(presenter.row_class_builder.call(node)).to eq("tree-node--document")
    expect(presenter.row_data_builder.call(node)).to eq({node_kind: "document"})
    expect(presenter.badge_builder.call(node)).to eq("Guide")
    expect(presenter.icon_builder.call(node)).to eq("document")
  end

  it "composes localized names through presenter builders" do
    I18n.backend.store_translations(
      :en,
      activemodel: {
        models: {
          node_presenter_localized_document: {
            one: "Document"
          }
        },
        attributes: {
          node_presenter_localized_document: {
            status: "Status"
          }
        }
      },
      tree_view: {
        node_types: {
          report: "Report"
        }
      }
    )

    presenter = described_class.define do
      label { |item| item.respond_to?(:title) ? item.title : TreeView.model_name_for(item) }
      tooltip { |item| TreeView.type_name_for(item) }
      badge { |item| TreeView.attribute_name_for(item, :status) if item.respond_to?(:status) }
    end
    titled_document = NodePresenterTitledDocument.new(title: "Quarterly report", node_type: :report, status: :draft)
    translated_document = NodePresenterLocalizedDocument.new(node_type: :report, status: :draft)
    fallback_document = NodePresenterLocalizedDocument.new(node_type: :generated_folder)

    expect(presenter.label_for(titled_document)).to eq("Quarterly report")
    expect(presenter.label_for(translated_document)).to eq("Document")
    expect(presenter.tooltip_for(translated_document)).to eq("Report")
    expect(presenter.badge_for(translated_document)).to eq("Status")
    expect(presenter.tooltip_for(fallback_document)).to eq("Generated folder")
  ensure
    I18n.reload!
  end

  it "allows immutable chaining through builder methods" do
    base_presenter = described_class.new
    next_presenter = base_presenter.label { |item| item.name }

    expect(base_presenter.label_for(node)).to be_nil
    expect(next_presenter.label_for(node)).to eq("Guide")
  end

  it "rejects unknown builder names" do
    expect do
      described_class.new(unknown: ->(_item) {})
    end.to raise_error(TreeView::ConfigurationError, /unknown builders/)
  end

  it "rejects non-callable builders" do
    expect do
      described_class.new(label: :name)
    end.to raise_error(TreeView::ConfigurationError, /label builder must respond to call/)
  end
end
