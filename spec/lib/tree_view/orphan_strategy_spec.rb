require "spec_helper"
OrphanNode = Struct.new(:id, :parent_item_id, :name)
OrphanCountry = Struct.new(:id, :name, :children)

RSpec.describe "TreeView::Tree orphan strategy" do
  def build_tree(records, **options)
    TreeView::Tree.new(records: records, parent_id_method: :parent_item_id, **options)
  end

  it "ignores orphan nodes by default" do
    root = OrphanNode.new(id: 1, parent_item_id: nil, name: "root")
    orphan = OrphanNode.new(id: 2, parent_item_id: 999, name: "orphan")
    tree = build_tree([root, orphan])

    expect(tree.root_items).to eq([root])
  end

  it "exposes orphan_items" do
    root = OrphanNode.new(id: 1, parent_item_id: nil, name: "root")
    child = OrphanNode.new(id: 2, parent_item_id: 1, name: "child")
    orphan = OrphanNode.new(id: 3, parent_item_id: 999, name: "orphan")
    tree = build_tree([root, child, orphan])

    expect(tree.orphan_items).to eq([orphan])
  end

  it "includes orphan nodes as roots when orphan_strategy is as_root" do
    root = OrphanNode.new(id: 1, parent_item_id: nil, name: "root")
    orphan = OrphanNode.new(id: 2, parent_item_id: 999, name: "orphan")
    tree = build_tree(
      [root, orphan],
      orphan_strategy: :as_root,
      sorter: ->(items, _tree) { items.sort_by(&:id) }
    )

    expect(tree.root_items).to eq([root, orphan])
  end

  it "returns only orphan nodes when orphan_strategy is orphans_only" do
    root = OrphanNode.new(id: 1, parent_item_id: nil, name: "root")
    child = OrphanNode.new(id: 2, parent_item_id: 1, name: "child")
    orphan = OrphanNode.new(id: 3, parent_item_id: 999, name: "orphan")
    orphan_child = OrphanNode.new(id: 4, parent_item_id: 3, name: "orphan-child")
    tree = build_tree([root, child, orphan, orphan_child], orphan_strategy: :orphans_only)

    expect(tree.root_items).to eq([orphan])
    expect(tree.children_for(orphan)).to eq([orphan_child])
  end

  it "does not apply orphan_strategy to explicit parent lookups" do
    root = OrphanNode.new(id: 1, parent_item_id: nil, name: "root")
    child = OrphanNode.new(id: 2, parent_item_id: 1, name: "child")
    orphan = OrphanNode.new(id: 3, parent_item_id: 999, name: "orphan")
    tree = build_tree([root, child, orphan], orphan_strategy: :as_root)

    expect(tree.root_items(1)).to eq([child])
  end

  it "raises a clear error when orphan_strategy is raise and orphan nodes exist" do
    root = OrphanNode.new(id: 1, parent_item_id: nil, name: "root")
    orphan = OrphanNode.new(id: 2, parent_item_id: 999, name: "orphan")
    tree = build_tree([root, orphan], orphan_strategy: :raise)

    expect do
      tree.root_items
    end.to raise_error(ArgumentError, /orphan nodes detected: 2/)
  end

  it "rejects invalid orphan_strategy values" do
    expect do
      build_tree([], orphan_strategy: :unknown)
    end.to raise_error(ArgumentError, /orphan_strategy must be one of/)
  end

  it "rejects non-symbolizable orphan_strategy values with a clear error" do
    expect do
      build_tree([], orphan_strategy: nil)
    end.to raise_error(ArgumentError, /orphan_strategy must be one of/)

    expect do
      build_tree([], orphan_strategy: 1)
    end.to raise_error(ArgumentError, /orphan_strategy must be one of/)
  end

  it "rejects orphan_strategy outside records mode" do
    expect do
      TreeView::Tree.new(
        roots: [OrphanCountry.new(1, "japan", [])],
        children_resolver: ->(node) { node.children },
        orphan_strategy: :as_root
      )
    end.to raise_error(ArgumentError, /orphan_strategy is only supported in records mode/)
  end
end
