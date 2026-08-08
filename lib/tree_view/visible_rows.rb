# frozen_string_literal: true

module TreeView
  class VisibleRows
    include Enumerable

    Row = Struct.new(
      :item,
      :depth,
      :node_key,
      :parent_key,
      :has_children,
      :expanded
    ) do
      def has_children?
        has_children == true
      end

      def expanded?
        expanded == true
      end
    end

    def initialize(tree:, root_items:, render_state:)
      @tree = tree
      @root_items = root_items
      @render_state = render_state
      @render_traversal = TreeView::RenderTraversal.new(tree)
    end

    def each
      return enum_for(:each) unless block_given?

      stack = tree.sort_items(root_items).reverse.map do |item|
        [item, 0, nil]
      end

      until stack.empty?
        item, depth, parent_key = stack.pop
        node_key = tree.node_key_for(item)
        children = tree.sort_items(tree.children_for(item))
        has_children = children.any?
        collapsed = collapsed?(item, depth)

        if render_self?(item, depth)
          yield Row.new(
            item: item,
            depth: depth,
            node_key: node_key,
            parent_key: parent_key,
            has_children: has_children,
            expanded: has_children && !collapsed
          )
        end

        next unless render_children?(depth)
        next if collapsed

        children.reverse_each do |child|
          stack << [child, depth + 1, node_key]
        end
      end
    end

    private

    attr_reader :tree, :root_items, :render_state, :render_traversal

    def render_self?(item, depth)
      render_depth?(depth) && render_leaf_distance?(item)
    end

    def render_depth?(depth)
      render_state.max_render_depth.nil? || depth <= render_state.max_render_depth
    end

    def render_children?(depth)
      render_state.max_render_depth.nil? || depth < render_state.max_render_depth
    end

    def render_leaf_distance?(item)
      return true if render_state.max_leaf_distance.nil?

      distance = render_traversal.leaf_distance_for(item)
      !distance.nil? && distance <= render_state.max_leaf_distance
    end

    def collapsed?(item, depth)
      explicitly_collapsed = render_state.collapsed_keys.include?(tree.node_key_for(item))
      return true if explicitly_collapsed

      explicitly_expanded = render_state.expanded_keys.include?(tree.node_key_for(item))
      depth_boundary = !render_state.max_initial_depth.nil? && depth >= render_state.max_initial_depth

      !explicitly_expanded && (render_state.effective_initial_state == :collapsed || depth_boundary)
    end
  end
end
