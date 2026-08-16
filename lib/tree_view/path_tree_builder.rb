# frozen_string_literal: true

module TreeView
  class PathTreeBuilder
    FolderNode = Struct.new(:key, :parent_key, :label, :path, :node_type) do
      def folder_node?
        true
      end

      def record_node?
        false
      end
    end

    RecordNode = Struct.new(:key, :parent_key, :label, :path, :record, :node_type) do
      def folder_node?
        false
      end

      def record_node?
        true
      end
    end

    DEFAULT_FOLDER_KEY_PREFIX = "folder"
    DEFAULT_RECORD_KEY_PREFIX = "record"

    attr_reader :records,
      :path_resolver,
      :label_resolver,
      :id_resolver,
      :folder_key_resolver,
      :sorter,
      :sort,
      :separator,
      :folder_key_prefix,
      :record_key_prefix,
      :folder_node_type,
      :record_node_type

    def initialize(records:,
      path_resolver:,
      label_resolver: nil,
      id_resolver: nil,
      folder_key_resolver: nil,
      sorter: nil,
      sort: nil,
      separator: "/",
      folder_key_prefix: DEFAULT_FOLDER_KEY_PREFIX,
      record_key_prefix: DEFAULT_RECORD_KEY_PREFIX,
      folder_node_type: :folder,
      record_node_type: :record)
      @records = Array(records)
      @path_resolver = path_resolver
      @label_resolver = label_resolver
      @id_resolver = id_resolver
      @folder_key_resolver = folder_key_resolver
      @sorter = sorter
      @sort = normalize_sort(sort)
      @separator = separator.to_s
      @folder_key_prefix = folder_key_prefix.to_s
      @record_key_prefix = record_key_prefix.to_s
      @folder_node_type = folder_node_type
      @record_node_type = record_node_type

      validate_callable!(path_resolver, :path_resolver)
      validate_optional_callable!(label_resolver, :label_resolver)
      validate_optional_callable!(id_resolver, :id_resolver)
      validate_optional_callable!(folder_key_resolver, :folder_key_resolver)
      validate_optional_callable!(sorter, :sorter)
    end

    def nodes
      @nodes ||= paths.flatten.each_with_object([]) do |node, result|
        next if folder_node?(node) && result.any? { |existing| existing.key == node.key }

        result << node
      end
    end

    def paths
      @paths ||= build_paths
    end

    def tree
      @tree ||= TreeView::Tree.new(
        records: nodes,
        parent_id_method: :parent_key,
        id_method: :key,
        sorter: effective_sorter,
        orphan_strategy: :as_root,
        validate_node_keys: true
      )
    end

    def root_items(root_parent_id = nil)
      tree.root_items(root_parent_id)
    end

    def children_for(node)
      tree.children_for(node)
    end

    def node_key_for(node)
      tree.node_key_for(node)
    end

    private

    def build_paths
      folder_nodes_by_key = {}

      records.map do |record|
        segments = path_segments_for(record)
        folder_segments = segments[0...-1] || []
        path_nodes = []
        parent_key = nil

        folder_segments.each_with_index do |segment, index|
          folder_path = folder_segments[0..index]
          folder_path_value = folder_path.join(separator)
          key = folder_key_for(folder_path)
          existing_folder = folder_nodes_by_key[key]

          if existing_folder && existing_folder.path != folder_path_value
            raise TreeView::DuplicateNodeKeyError,
              "folder_key_resolver returned duplicate key #{key.inspect} for different folder paths: #{existing_folder.path.inspect} and #{folder_path_value.inspect}; return a unique stable key for each folder path"
          end

          folder_nodes_by_key[key] ||= FolderNode.new(
            key: key,
            parent_key: parent_key,
            label: segment,
            path: folder_path_value,
            node_type: folder_node_type
          )
          path_nodes << folder_nodes_by_key[key]
          parent_key = key
        end

        path_nodes << RecordNode.new(
          key: record_key_for(record),
          parent_key: parent_key,
          label: label_for(record, segments),
          path: segments.join(separator),
          record: record,
          node_type: record_node_type
        )
      end
    end

    def path_segments_for(record)
      raw_path = path_resolver.call(record)
      segments = if raw_path.is_a?(Array)
        raw_path
      else
        raw_path.to_s.split(separator)
      end

      segments.map(&:to_s).map(&:strip).reject(&:empty?)
    end

    def label_for(record, segments)
      return label_resolver.call(record) if label_resolver
      return record.name if record.respond_to?(:name)
      return segments.last unless segments.empty?

      record.to_s
    end

    def record_key_for(record)
      return id_resolver.call(record).to_s if id_resolver
      return TreeView.node_key(record_key_prefix, record.id) if record.respond_to?(:id)

      TreeView.node_key(record_key_prefix, record.object_id)
    end

    def folder_key_for(folder_path)
      return TreeView.node_key(folder_key_prefix, folder_path.join(separator)) unless folder_key_resolver

      key = folder_key_resolver.call(folder_path.dup).to_s
      if key.empty?
        raise TreeView::ConfigurationError,
          "folder_key_resolver must return a non-empty key for every generated folder path"
      end

      key
    end

    def effective_sorter
      sorter || lambda do |items, _tree|
        Array(items).sort_by do |item|
          sort_group = (sort[:folders_first] && !folder_node?(item)) ? 1 : 0

          [sort_group, item.label.to_s, item.key.to_s]
        end
      end
    end

    def folder_node?(item)
      item.respond_to?(:node_type) && item.node_type == folder_node_type
    end

    def normalize_sort(value)
      return {} if value.nil?
      raise TreeView::ConfigurationError, "sort must respond to to_h; pass a Hash-like object or nil" unless value.respond_to?(:to_h)

      options = value.to_h.transform_keys(&:to_sym)
      invalid_keys = options.keys - %i[folders_first]
      if invalid_keys.any?
        raise TreeView::ConfigurationError, "sort contains unknown keys: #{invalid_keys.join(", ")}; supported keys are: folders_first"
      end

      options
    end

    def validate_callable!(callable, name)
      return if callable.respond_to?(:call)

      raise TreeView::ConfigurationError, "#{name} must respond to call"
    end

    def validate_optional_callable!(callable, name)
      return if callable.nil?

      validate_callable!(callable, name)
    end
  end
end
