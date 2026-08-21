# frozen_string_literal: true

module TreeView
  class Tree
    DEFAULT_SORTER = lambda do |items, tree|
      items.sort_by { |item| tree.descendant_counts[tree.node_key_for(item)].to_i }
    end

    VALID_ORPHAN_STRATEGIES = %i[ignore as_root raise orphans_only].freeze

    attr_reader :records,
      :id_method,
      :parent_id_method,
      :roots,
      :children_resolver,
      :adapter,
      :sorter,
      :orphan_strategy

    def initialize(records: nil,
      parent_id_method: nil,
      id_method: :id,
      roots: nil,
      children_resolver: nil,
      node_key_resolver: nil,
      adapter: nil,
      sorter: nil,
      orphan_strategy: :ignore)
      @records = records
      @id_method = id_method
      @parent_id_method = parent_id_method
      @roots = Array(roots)
      @children_resolver = children_resolver
      @node_key_resolver = node_key_resolver
      @adapter = adapter
      @sorter = sorter || DEFAULT_SORTER
      @orphan_strategy = normalize_orphan_strategy(orphan_strategy)

      validate_mode!
    end

    def items_by_parent_id
      return {} if adapter_mode? || resolver_mode?

      @items_by_parent_id ||= records.group_by { |record| record.public_send(parent_id_method) }
    end

    def descendant_counts
      @descendant_counts ||= begin
        memo = {}

        each_root_candidate do |root_candidate|
          count_descendants_iteratively(root_candidate, memo)
        end

        memo
      end
    end

    def all_expandable_keys
      each_reachable_node(root_items).filter_map do |item, _depth|
        node_key_for(item) unless children_for(item).empty?
      end
    end

    def root_items(root_parent_id = nil)
      candidates = if adapter_mode?
        adapter.roots
      elsif resolver_mode?
        roots
      elsif root_parent_id.nil?
        root_items_for_nil_parent
      else
        Array(items_by_parent_id[root_parent_id])
      end

      sort_items(candidates)
    end

    def children_for(record)
      return adapter.children_for(record) if adapter_mode?
      return Array(children_resolver.call(record)) if resolver_mode?

      Array(items_by_parent_id[record.public_send(id_method)])
    end

    def parent_for(record)
      if adapter_mode?
        ensure_parent_path_helpers!
        return adapter.parent_for(record)
      end

      ensure_parent_path_helpers!
      parent_id = record.public_send(parent_id_method)
      return nil if parent_id.nil?

      items_by_id[parent_id]
    end

    def ancestors_for(record)
      ensure_parent_path_helpers!

      ancestors = []
      visiting = {}
      current = record

      loop do
        current_key = node_key_for(current)
        raise TreeView::CycleDetectedError, "cycle detected in parent path for node #{current_key.inspect}; check parent relationships and remove the self-referential loop" if visiting[current_key]

        visiting[current_key] = true
        parent = parent_for(current)
        break unless parent

        ancestors.unshift(parent)
        current = parent
      end

      ancestors
    end

    def path_for(record)
      ancestors_for(record) + [record]
    end

    def paths_for(items)
      Array(items).map { |item| path_for(item) }
    end

    def expanded_keys_for(item_or_items)
      ensure_parent_path_helpers!

      items = item_or_items.is_a?(Array) ? item_or_items : [item_or_items]
      items.flat_map do |item|
        path_for(item).map { |path_item| node_key_for(path_item) }
      end.uniq
    end

    def path_tree_for(items)
      TreeView::PathTree.new(base_tree: self, paths: paths_for(items))
    end

    def reverse_tree_for(items)
      TreeView::ReverseTree.new(base_tree: self, paths: paths_for(items))
    end

    def filtered_tree_for(matched_items, mode: :with_ancestors)
      TreeView::FilteredTree.new(base_tree: self, matched_items: matched_items, mode: mode)
    end

    def node_key_for(record)
      if adapter_mode?
        adapter.node_key_for(record, id_method: id_method)
      elsif @node_key_resolver
        @node_key_resolver.call(record)
      elsif resolver_mode?
        [record.class.name, record.public_send(id_method)]
      else
        record.public_send(id_method)
      end
    end

    def sort_items(items)
      sorted = sorter.call(Array(items), self)
      if sorted.nil? || !sorted.respond_to?(:to_a)
        raise TreeView::ConfigurationError, "sorter must return an Array-like object, got: #{sorted.class}; return the sorted items or configure a sorter that responds to to_a"
      end

      sorted.to_a
    end

    def orphan_items
      return [] unless records_mode?

      @orphan_items ||= records.select do |record|
        parent_id = record.public_send(parent_id_method)
        parent_id && !items_by_id.key?(parent_id)
      end
    end

    def orphan_report
      ensure_records_path_helpers!

      orphan_items.map do |item|
        {
          item: item,
          key: node_key_for(item),
          missing_parent_id: item.public_send(parent_id_method)
        }
      end
    end

    def stats
      root_nodes = root_items
      node_count = 0
      leaf_count = 0
      max_depth = 0
      max_descendant_count = 0

      each_reachable_node(root_nodes) do |item, depth|
        node_count += 1
        leaf_count += 1 if children_for(item).empty?
        max_depth = depth if depth > max_depth
        descendant_count = descendant_counts[node_key_for(item)].to_i
        max_descendant_count = descendant_count if descendant_count > max_descendant_count
      end

      {
        nodes: node_count,
        roots: root_nodes.count,
        leaves: leaf_count,
        max_depth: max_depth,
        orphans: orphan_items.count,
        max_descendant_count: max_descendant_count
      }
    end

    def validate_unique_node_keys!
      seen = {}
      duplicated_keys = []

      each_root_candidate do |item|
        node_key = node_key_for(item)
        if seen.key?(node_key)
          duplicated_keys << node_key unless duplicated_keys.include?(node_key)
        else
          seen[node_key] = true
        end
      end

      if duplicated_keys.any?
        raise TreeView::DuplicateNodeKeyError, "duplicate node_key detected: #{duplicated_keys.map(&:inspect).join(", ")}; configure node_key_resolver or ensure records expose unique IDs before rendering"
      end

      true
    end

    private

    def adapter_mode?
      adapter.is_a?(TreeView::GraphAdapter)
    end

    def resolver_mode?
      children_resolver.respond_to?(:call)
    end

    def records_mode?
      !adapter_mode? && !resolver_mode?
    end

    def ensure_records_path_helpers!
      return if records_mode?

      raise TreeView::ConfigurationError, "records path helpers are only supported in records mode; use records with parent_id_method"
    end

    def ensure_parent_path_helpers!
      return if records_mode?
      return if adapter_mode? && adapter.parent_resolver?

      raise TreeView::ConfigurationError, "parent path helpers require records mode or an adapter with parent_resolver"
    end

    def each_root_candidate
      return enum_for(:each_root_candidate) unless block_given?

      if adapter_mode?
        adapter.roots.each { |root| yield root }
      elsif resolver_mode?
        roots.each { |root| yield root }
      else
        items_by_parent_id.each_value do |items|
          items.each { |item| yield item }
        end
      end
    end

    def count_descendants_iteratively(root, memo)
      root_key = node_key_for(root)
      return memo[root_key] if memo.key?(root_key)

      visiting = {}
      stack = [[root, false]]

      until stack.empty?
        item, expanded = stack.pop
        key = node_key_for(item)

        if expanded
          visiting.delete(key)
          children = children_for(item)
          memo[key] = children.sum { |child| 1 + memo[node_key_for(child)].to_i }
          next
        end

        next if memo.key?(key)
        raise TreeView::CycleDetectedError, "cycle detected in tree for node #{key.inspect}; check children_resolver or parent_id values and remove the loop" if visiting[key]

        visiting[key] = true
        stack << [item, true]

        children_for(item).reverse_each do |child|
          child_key = node_key_for(child)
          raise TreeView::CycleDetectedError, "cycle detected in tree for node #{child_key.inspect}; check children_resolver or parent_id values and remove the loop" if visiting[child_key]

          stack << [child, false] unless memo.key?(child_key)
        end
      end

      memo[root_key]
    end

    def each_reachable_node(root_nodes)
      return enum_for(:each_reachable_node, root_nodes) unless block_given?

      seen = {}
      stack = Array(root_nodes).reverse.map { |item| [item, 0] }

      until stack.empty?
        item, depth = stack.pop
        key = node_key_for(item)
        next if seen[key]

        seen[key] = true
        yield item, depth

        children_for(item).reverse_each do |child|
          stack << [child, depth + 1]
        end
      end
    end

    def root_items_for_nil_parent
      regular_roots = Array(items_by_parent_id[nil])

      case orphan_strategy
      when :ignore
        regular_roots
      when :as_root
        regular_roots + orphan_items
      when :raise
        raise_if_orphans!
        regular_roots
      when :orphans_only
        orphan_items
      end
    end

    def raise_if_orphans!
      return if orphan_items.empty?

      orphan_keys = orphan_items.map { |item| node_key_for(item).inspect }.join(", ")
      raise TreeView::InvalidTreeError, "orphan nodes detected: #{orphan_keys}; include missing parents, filter out orphans, or use orphan_strategy: :as_root/:ignore"
    end

    def items_by_id
      @items_by_id ||= records.to_h { |record| [record.public_send(id_method), record] }
    end

    def normalize_orphan_strategy(value)
      raise_invalid_orphan_strategy! unless value.respond_to?(:to_sym)

      normalized_value = value.to_sym
      return normalized_value if VALID_ORPHAN_STRATEGIES.include?(normalized_value)

      raise_invalid_orphan_strategy!
    end

    def raise_invalid_orphan_strategy!
      raise TreeView::ConfigurationError, "orphan_strategy must be one of: #{VALID_ORPHAN_STRATEGIES.join(", ")}; choose how records with missing parents should be handled"
    end

    def validate_mode!
      raise TreeView::ConfigurationError, "sorter must respond to call; pass a callable such as ->(items, tree) { items }" unless sorter.respond_to?(:call)

      if adapter_mode?
        raise TreeView::ConfigurationError, "adapter mode cannot be combined with records mode; remove records and parent_id_method when using adapter" if records || parent_id_method
        raise TreeView::ConfigurationError, "adapter mode cannot be combined with roots/children_resolver mode; pass those options to GraphAdapter instead" if roots.any? || children_resolver
        raise TreeView::ConfigurationError, "orphan_strategy is only supported in records mode; omit it when using adapter mode" unless orphan_strategy == :ignore
      elsif resolver_mode?
        raise TreeView::ConfigurationError, "roots must be provided when children_resolver is used; pass roots: [...] for resolver mode" if roots.empty?
        raise TreeView::ConfigurationError, "orphan_strategy is only supported in records mode; omit it when using resolver mode" unless orphan_strategy == :ignore
      elsif records.nil? || parent_id_method.nil?
        raise TreeView::ConfigurationError, "records and parent_id_method are required in records mode; provide both or use roots with children_resolver"
      end
    end
  end
end
