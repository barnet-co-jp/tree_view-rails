# frozen_string_literal: true

module TreeViewFixtures
  FixtureNode = Struct.new(:id, :parent_id, :name)

  module_function

  def simple_nodes
    [
      FixtureNode.new(id: 1, parent_id: nil, name: "root"),
      FixtureNode.new(id: 2, parent_id: 1, name: "child"),
      FixtureNode.new(id: 3, parent_id: 2, name: "grandchild")
    ]
  end

  def tree_for(nodes)
    TreeView::Tree.new(records: nodes, parent_id_method: :parent_id)
  end
end
