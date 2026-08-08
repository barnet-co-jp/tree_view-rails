# frozen_string_literal: true

require "spec_helper"

PathTreeBuilderDocument = Struct.new(:id, :source_relative_path, :title)

RSpec.describe TreeView::PathTreeBuilder do
  it "builds folder nodes and record nodes from slash-separated paths" do
    documents = [
      PathTreeBuilderDocument.new(id: 1, source_relative_path: "guides/setup/install.md", title: "Install"),
      PathTreeBuilderDocument.new(id: 2, source_relative_path: "guides/setup/configure.md", title: "Configure")
    ]

    builder = described_class.new(
      records: documents,
      path_resolver: ->(document) { document.source_relative_path },
      label_resolver: ->(document) { document.title },
      id_resolver: ->(document) { "document:#{document.id}" },
      sort: {folders_first: true}
    )

    guides = builder.nodes.find { |node| node.key == "folder:guides" }
    setup = builder.nodes.find { |node| node.key == "folder:guides/setup" }
    install = builder.nodes.find { |node| node.key == "document:1" }

    expect(guides.label).to eq("guides")
    expect(guides.parent_key).to be_nil
    expect(setup.label).to eq("setup")
    expect(setup.parent_key).to eq("folder:guides")
    expect(install.label).to eq("Install")
    expect(install.parent_key).to eq("folder:guides/setup")
    expect(install.record).to eq(documents.first)
  end

  it "exposes public predicates for generated folder and record nodes" do
    documents = [
      PathTreeBuilderDocument.new(id: 1, source_relative_path: "guides/setup/install.md", title: "Install")
    ]

    builder = described_class.new(
      records: documents,
      path_resolver: ->(document) { document.source_relative_path },
      folder_node_type: "directory",
      record_node_type: "document"
    )

    folder = builder.nodes.find { |node| node.key == "folder:guides" }
    record = builder.nodes.find { |node| node.key == "record:1" }

    expect(folder.node_type).to eq("directory")
    expect(folder.folder_node?).to be(true)
    expect(folder.record_node?).to be(false)
    expect(record.node_type).to eq("document")
    expect(record.folder_node?).to be(false)
    expect(record.record_node?).to be(true)
  end

  it "deduplicates shared folder nodes" do
    documents = [
      PathTreeBuilderDocument.new(id: 1, source_relative_path: "guides/setup/install.md", title: "Install"),
      PathTreeBuilderDocument.new(id: 2, source_relative_path: "guides/setup/configure.md", title: "Configure")
    ]

    builder = described_class.new(
      records: documents,
      path_resolver: ->(document) { document.source_relative_path }
    )

    expect(builder.nodes.count { |node| node.key == "folder:guides" }).to eq(1)
    expect(builder.nodes.count { |node| node.key == "folder:guides/setup" }).to eq(1)
  end

  it "exposes a renderable tree with folders before records when requested" do
    documents = [
      PathTreeBuilderDocument.new(id: 1, source_relative_path: "zeta.md", title: "Zeta"),
      PathTreeBuilderDocument.new(id: 2, source_relative_path: "guides/setup.md", title: "Setup")
    ]

    builder = described_class.new(
      records: documents,
      path_resolver: ->(document) { document.source_relative_path },
      label_resolver: ->(document) { document.title },
      sort: {folders_first: true}
    )

    expect(builder.root_items.map(&:label)).to eq(["guides", "Zeta"])
    expect(builder.children_for(builder.root_items.first).map(&:label)).to eq(["Setup"])
  end

  it "accepts array paths and places single-segment records at the root" do
    documents = [
      PathTreeBuilderDocument.new(id: 1, source_relative_path: nil, title: "Root document"),
      PathTreeBuilderDocument.new(id: 2, source_relative_path: nil, title: "Nested document")
    ]

    builder = described_class.new(
      records: documents,
      path_resolver: lambda do |document|
        (document.id == 1) ? ["root.md"] : ["docs", "nested.md"]
      end,
      label_resolver: ->(document) { document.title },
      sort: {folders_first: true}
    )

    expect(builder.root_items.map(&:label)).to eq(["docs", "Root document"])
    expect(builder.children_for(builder.root_items.first).map(&:label)).to eq(["Nested document"])
  end

  it "uses custom separators and ignores blank path segments" do
    document = PathTreeBuilderDocument.new(
      id: 1,
      source_relative_path: "docs :: guides ::  :: intro.md",
      title: "Intro"
    )

    builder = described_class.new(
      records: [document],
      path_resolver: ->(record) { record.source_relative_path },
      separator: "::"
    )

    docs = builder.nodes.find { |node| node.key == "folder:docs" }
    guides = builder.nodes.find { |node| node.key == "folder:docs::guides" }
    intro = builder.nodes.find { |node| node.key == "record:1" }

    expect(docs.label).to eq("docs")
    expect(docs.parent_key).to be_nil
    expect(guides.label).to eq("guides")
    expect(guides.parent_key).to eq("folder:docs")
    expect(intro.label).to eq("intro.md")
    expect(intro.path).to eq("docs::guides::intro.md")
    expect(intro.parent_key).to eq("folder:docs::guides")
  end

  it "raises a configuration error for invalid resolvers" do
    expect do
      described_class.new(records: [], path_resolver: :source_relative_path)
    end.to raise_error(TreeView::ConfigurationError, /path_resolver must respond to call/)
  end

  it "raises a configuration error for unsupported sort keys" do
    expect do
      described_class.new(
        records: [],
        path_resolver: ->(record) { record.source_relative_path },
        sort: {folders_last: true}
      )
    end.to raise_error(TreeView::ConfigurationError, /sort contains unknown keys: folders_last/)
  end
end
