# frozen_string_literal: true

module TreePatternHelper
  GeneratedTreeNode = Struct.new(:id, :parent_id, :label)

  def generated_tree_node(id:, parent_id:, label: nil)
    GeneratedTreeNode.new(id: id, parent_id: parent_id, label: label || "node-#{id}")
  end

  def generated_tree_pattern(pattern, seed: 414)
    random = Random.new(seed)

    case pattern
    when :deep_chain
      length = 5 + random.rand(4)
      Array.new(length) do |index|
        generated_tree_node(
          id: index + 1,
          parent_id: index.zero? ? nil : index,
          label: "chain-#{index + 1}"
        )
      end
    when :orphan_cluster
      root_count = 2 + random.rand(2)
      roots = Array.new(root_count) do |index|
        generated_tree_node(id: index + 1, parent_id: nil, label: "root-#{index + 1}")
      end
      orphans = Array.new(2) do |index|
        generated_tree_node(
          id: root_count + index + 1,
          parent_id: 90 + random.rand(10),
          label: "orphan-#{index + 1}"
        )
      end

      roots + orphans
    when :duplicate_id
      shared_id = 10 + random.rand(5)
      [
        generated_tree_node(id: shared_id, parent_id: nil, label: "duplicate-a"),
        generated_tree_node(id: shared_id, parent_id: nil, label: "duplicate-b")
      ]
    when :parent_id_type_mismatch
      [
        generated_tree_node(id: 1, parent_id: nil, label: "root"),
        generated_tree_node(id: 2, parent_id: "1", label: "string-parent")
      ]
    when :cycle_pair
      first_id = 1 + random.rand(10)
      second_id = first_id + 1
      [
        generated_tree_node(id: first_id, parent_id: second_id, label: "cycle-a"),
        generated_tree_node(id: second_id, parent_id: first_id, label: "cycle-b")
      ]
    else
      raise ArgumentError, "unknown tree pattern: #{pattern.inspect}"
    end
  end
end

RSpec.configure do |config|
  config.include TreePatternHelper
end
