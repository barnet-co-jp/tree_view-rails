require "spec_helper"
NodeKeyHelperSpecItem = Struct.new(:id, :parent_id)

RSpec.describe "TreeView node key helper" do
  it "builds a namespaced node key" do
    expect(TreeView.node_key("Document", 123)).to eq("Document:123")
  end

  it "normalizes whitespace" do
    expect(TreeView.node_key(" Document ", " 123 ")).to eq("Document:123")
  end

  it "can be used as a node key resolver" do
    item = NodeKeyHelperSpecItem.new(id: 1, parent_id: nil)
    tree = TreeView::Tree.new(
      records: [item],
      parent_id_method: :parent_id,
      node_key_resolver: ->(node) { TreeView.node_key("document", node.id) }
    )

    expect(tree.node_key_for(item)).to eq("document:1")
  end
end
