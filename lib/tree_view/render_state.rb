# frozen_string_literal: true

require "tree_view/render_state/selection_config"
require "tree_view/render_state_builder_validation"

module TreeView
  class RenderState
    include TreeView::RenderStateBuilderValidation

    VALID_INITIAL_STATES = Configuration::VALID_INITIAL_STATES
    VALID_INITIAL_EXPANSION_KEYS = %i[default max_depth expanded_keys collapsed_keys current_item current_key auto_expand_ancestors].freeze
    VALID_RENDER_SCOPE_KEYS = %i[max_depth max_leaf_distance].freeze
    VALID_TOGGLE_SCOPE_KEYS = %i[max_depth_from_root max_leaf_distance].freeze
    VALID_SELECTION_KEYS = SelectionConfig::VALID_KEYS
    VALID_SELECTION_VISIBILITIES = SelectionConfig::VALID_VISIBILITIES
    VALID_TOGGLE_ICONS_KEYS = %i[by_state by_depth by_type].freeze
    VALID_TOGGLE_ICON_STATES = %i[expanded collapsed leaf loading].freeze
    TOGGLE_ICON_RENDER_KEYS = %i[text label icon html class title data aria_hidden].freeze
    DEFAULT_SELECTION_CHECKBOX_NAME = "selected_nodes[]"

    attr_reader :tree,
      :root_items,
      :row_partial,
      :row_actions_partial,
      :row_locals,
      :ui_config,
      :tree_instance_key,
      :initial_state,
      :max_initial_depth,
      :max_render_depth,
      :max_leaf_distance,
      :max_toggle_depth_from_root,
      :max_toggle_leaf_distance,
      :expanded_keys,
      :collapsed_keys,
      :current_item,
      :current_key,
      :auto_expand_ancestors,
      :selection_config,
      :selection_enabled,
      :selection_visibility,
      :selection_payload_builder,
      :selection_checkbox_name,
      :selection_disabled_builder,
      :selection_disabled_reason_builder,
      :selection_selected_keys,
      :selection_cascade,
      :selection_indeterminate,
      :selection_max_count,
      :node_presenter,
      :row_class_builder,
      :row_data_builder,
      :row_event_payload_builder,
      :loading_builder,
      :error_builder,
      :depth_label_builder,
      :badge_builder,
      :icon_builder,
      :toggle_icons,
      :toggle_icon_builder

    # RenderState は「この画面ではどう描くか」を束ねる。
    def initialize(tree:,
      root_items:,
      row_partial:,
      ui_config:,
      row_actions_partial: nil,
      row_locals: nil,
      tree_instance_key: nil,
      initial_state: nil,
      max_initial_depth: nil,
      max_render_depth: nil,
      max_leaf_distance: nil,
      max_toggle_depth_from_root: nil,
      max_toggle_leaf_distance: nil,
      expanded_keys: nil,
      collapsed_keys: nil,
      current_item: nil,
      current_key: nil,
      auto_expand_ancestors: nil,
      initial_expansion: nil,
      render_scope: nil,
      toggle_scope: nil,
      selectable: nil,
      selection_payload_builder: nil,
      selection_checkbox_name: nil,
      selection_disabled_builder: nil,
      selection_disabled_reason_builder: nil,
      selection_selected_keys: nil,
      selection_cascade: nil,
      selection_indeterminate: nil,
      selection_max_count: nil,
      selection: nil,
      node_presenter: nil,
      row_class_builder: nil,
      row_data_builder: nil,
      row_event_payload_builder: nil,
      loading_builder: nil,
      error_builder: nil,
      depth_label_builder: nil,
      badge_builder: nil,
      icon_builder: nil,
      toggle_icons: nil,
      toggle_icon_builder: nil)
      initial_expansion_options = normalize_options(initial_expansion, :initial_expansion, VALID_INITIAL_EXPANSION_KEYS)
      render_scope_options = normalize_options(render_scope, :render_scope, VALID_RENDER_SCOPE_KEYS)
      toggle_scope_options = normalize_options(toggle_scope, :toggle_scope, VALID_TOGGLE_SCOPE_KEYS)

      @tree = tree
      @root_items = root_items
      @row_partial = row_partial
      @row_actions_partial = row_actions_partial
      @row_locals = normalize_row_locals(row_locals)
      @ui_config = ui_config
      @tree_instance_key = tree_instance_key&.to_s
      @initial_state = normalize_initial_state(resolve_option(initial_state, initial_expansion_options[:default]))
      @max_initial_depth = normalize_non_negative_integer(resolve_option(max_initial_depth, initial_expansion_options[:max_depth]), :max_initial_depth)
      @max_render_depth = normalize_non_negative_integer(resolve_option(max_render_depth, render_scope_options[:max_depth]), :max_render_depth)
      @max_leaf_distance = normalize_non_negative_integer(resolve_option(max_leaf_distance, render_scope_options[:max_leaf_distance]), :max_leaf_distance)
      @max_toggle_depth_from_root = normalize_non_negative_integer(resolve_option(max_toggle_depth_from_root, toggle_scope_options[:max_depth_from_root]), :max_toggle_depth_from_root)
      @max_toggle_leaf_distance = normalize_non_negative_integer(resolve_option(max_toggle_leaf_distance, toggle_scope_options[:max_leaf_distance]), :max_toggle_leaf_distance)
      @current_item = resolve_option(current_item, initial_expansion_options[:current_item])
      @current_key = normalize_current_key(resolve_option(current_key, initial_expansion_options[:current_key]))
      @auto_expand_ancestors = normalize_boolean(resolve_option(auto_expand_ancestors, initial_expansion_options[:auto_expand_ancestors]), :auto_expand_ancestors)
      resolved_expanded_keys = Array(resolve_option(expanded_keys, initial_expansion_options[:expanded_keys]))
      @expanded_keys = expanded_keys_with_current_ancestors(resolved_expanded_keys).freeze
      @collapsed_keys = Array(resolve_option(collapsed_keys, initial_expansion_options[:collapsed_keys])).freeze
      @selection_config = SelectionConfig.new(
        default_checkbox_name: DEFAULT_SELECTION_CHECKBOX_NAME,
        selectable: selectable,
        payload_builder: selection_payload_builder,
        checkbox_name: selection_checkbox_name,
        disabled_builder: selection_disabled_builder,
        disabled_reason_builder: selection_disabled_reason_builder,
        selected_keys: selection_selected_keys,
        cascade: selection_cascade,
        indeterminate: selection_indeterminate,
        max_count: selection_max_count,
        selection: selection
      )
      @selection_enabled = selection_config.enabled
      @selection_visibility = selection_config.visibility
      @selection_payload_builder = selection_config.payload_builder
      @selection_checkbox_name = selection_config.checkbox_name
      @selection_disabled_builder = selection_config.disabled_builder
      @selection_disabled_reason_builder = selection_config.disabled_reason_builder
      @selection_selected_keys = selection_config.selected_keys
      @selection_cascade = selection_config.cascade
      @selection_indeterminate = selection_config.indeterminate
      @selection_max_count = selection_config.max_count
      @node_presenter = normalize_node_presenter(node_presenter)
      @row_class_builder = row_class_builder || @node_presenter&.row_class_builder
      @row_data_builder = row_data_builder || @node_presenter&.row_data_builder
      @row_event_payload_builder = row_event_payload_builder
      @loading_builder = loading_builder
      @error_builder = error_builder
      @depth_label_builder = depth_label_builder
      @badge_builder = badge_builder || @node_presenter&.badge_builder
      @icon_builder = icon_builder || @node_presenter&.icon_builder
      @toggle_icons = normalize_toggle_icons(toggle_icons)
      @toggle_icon_builder = toggle_icon_builder || build_toggle_icon_builder(@toggle_icons)

      validate_builders!(
        row_class_builder: @row_class_builder,
        row_data_builder: @row_data_builder,
        row_event_payload_builder: row_event_payload_builder,
        loading_builder: loading_builder,
        error_builder: error_builder,
        depth_label_builder: depth_label_builder,
        badge_builder: @badge_builder,
        icon_builder: @icon_builder,
        toggle_icon_builder: @toggle_icon_builder,
        selection_payload_builder: @selection_payload_builder,
        selection_disabled_builder: @selection_disabled_builder,
        selection_disabled_reason_builder: @selection_disabled_reason_builder
      )
      validate_expansion_key_conflicts!
    end

    def selection_enabled?
      selection_config.enabled?
    end

    def selection_cascade?
      selection_config.cascade?
    end

    def selection_indeterminate?
      selection_config.indeterminate?
    end

    def auto_expand_ancestors?
      auto_expand_ancestors == true
    end

    # 画面固有指定があればそれを優先し、なければ global config を使う。
    def effective_initial_state
      initial_state || TreeView.configuration.initial_state
    end

    private

    def resolve_option(individual_value, grouped_value)
      individual_value.nil? ? grouped_value : individual_value
    end

    def normalize_options(value, name, valid_keys)
      return {} if value.nil?
      raise TreeView::ConfigurationError, "#{name} must respond to to_h; pass a Hash-like object with documented keys" unless value.respond_to?(:to_h)

      options = value.to_h.transform_keys(&:to_sym)
      invalid_keys = options.keys - valid_keys
      if invalid_keys.any?
        raise TreeView::ConfigurationError, "#{name} contains unknown keys: #{invalid_keys.join(", ")}; supported keys are: #{valid_keys.join(", ")}"
      end

      options
    end

    def normalize_row_locals(value)
      return {} if value.nil?
      raise TreeView::ConfigurationError, "row_locals must respond to to_h; pass a Hash-like object or nil" unless value.respond_to?(:to_h)

      value.to_h.transform_keys(&:to_sym).freeze
    end

    def normalize_toggle_icons(value)
      return {} if value.nil?
      normalize_options(value, :toggle_icons, VALID_TOGGLE_ICONS_KEYS)
    end

    def build_toggle_icon_builder(icons)
      return nil if icons.empty?

      lambda do |item, state, context|
        normalized_state = state.to_sym
        icon_for_type(icons[:by_type], item, normalized_state) ||
          icon_for_key(icons[:by_depth], context[:depth], normalized_state) ||
          icon_for_state(icons[:by_state], normalized_state)
      end
    end

    def icon_for_type(icons, item, state)
      type = toggle_icon_node_type(item)
      return nil if type.nil?

      icon_for_key(icons, type, state)
    end

    def icon_for_key(icons, key, state)
      return nil if icons.nil? || key.nil? || !icons.respond_to?(:to_h)

      entry = lookup_icon_value(icons.to_h, key)
      return nil if entry.nil?

      icon_for_state_entry(entry, state)
    end

    def icon_for_state(icons, state)
      return nil if icons.nil? || !icons.respond_to?(:to_h)

      lookup_icon_value(icons.to_h, state)
    end

    def icon_for_state_entry(entry, state)
      return entry unless entry.respond_to?(:to_h)

      entry_hash = entry.to_h
      return entry unless state_icon_map?(entry_hash)

      lookup_icon_value(entry_hash, state)
    end

    def state_icon_map?(entry_hash)
      normalized_keys = entry_hash.keys.filter_map { |key| key.to_sym if key.respond_to?(:to_sym) }
      (normalized_keys & VALID_TOGGLE_ICON_STATES).any? && (normalized_keys & TOGGLE_ICON_RENDER_KEYS).empty?
    end

    def lookup_icon_value(hash, key)
      return nil unless hash.respond_to?(:key?)

      return hash[key] if hash.key?(key)

      symbol_key = key.to_sym if key.respond_to?(:to_sym)
      return hash[symbol_key] if !symbol_key.nil? && hash.key?(symbol_key)

      string_key = key.to_s
      return hash[string_key] if hash.key?(string_key)

      nil
    end

    def toggle_icon_node_type(item)
      if item.respond_to?(:[])
        hash_type = lookup_icon_value(item, :node_type)
        return hash_type unless hash_type.nil?
      end

      return item.node_type if item.respond_to?(:node_type)
      return item.type if item.respond_to?(:type)
      return item.kind if item.respond_to?(:kind)

      nil
    end

    def normalize_initial_state(value)
      return nil if value.nil?
      raise_invalid_initial_state! unless value.respond_to?(:to_sym)

      normalized_value = value.to_sym
      return normalized_value if VALID_INITIAL_STATES.include?(normalized_value)

      raise_invalid_initial_state!
    end

    def raise_invalid_initial_state!
      raise TreeView::ConfigurationError, "initial_state must be one of: #{VALID_INITIAL_STATES.join(", ")}; use :expanded or :collapsed"
    end

    def normalize_non_negative_integer(value, name)
      return nil if value.nil?
      return value if value.is_a?(Integer) && value >= 0

      raise TreeView::ConfigurationError, "#{name} must be a non-negative Integer; pass nil or 0+"
    end

    def normalize_boolean(value, name)
      return false if value.nil?
      return value if value == true || value == false

      raise TreeView::ConfigurationError, "#{name} must be true or false; pass true, false, or nil"
    end

    def normalize_current_key(value)
      return nil if value.nil?

      value
    end

    def normalize_node_presenter(value)
      return nil if value.nil?
      return value if value.respond_to?(:row_class_builder) && value.respond_to?(:row_data_builder) && value.respond_to?(:badge_builder) && value.respond_to?(:icon_builder)

      raise TreeView::ConfigurationError, "node_presenter must be a TreeView::NodePresenter-compatible object"
    end

    def expanded_keys_with_current_ancestors(keys)
      return keys unless auto_expand_ancestors?

      current = current_item || find_current_item_by_key
      return keys if current.nil? && keys.any?

      raise TreeView::ConfigurationError, "auto_expand_ancestors requires current_item or a current_key that matches a node under root_items" if current.nil?

      ancestor_keys = tree.ancestors_for(current).map { |ancestor| tree.node_key_for(ancestor) }
      (keys + ancestor_keys).uniq
    end

    def find_current_item_by_key
      return nil if current_key.nil?

      stack = Array(root_items).reverse
      seen = {}

      until stack.empty?
        item = stack.pop
        key = tree.node_key_for(item)
        next if seen[key]

        return item if key == current_key

        seen[key] = true
        tree.children_for(item).reverse_each do |child|
          stack << child
        end
      end

      nil
    end

    def validate_builder!(builder, name)
      return if builder.nil? || builder.respond_to?(:call)

      raise TreeView::ConfigurationError, "#{name} must respond to call; pass a callable object or nil"
    end

    def validate_expansion_key_conflicts!
      conflicts = expanded_keys & collapsed_keys
      return if conflicts.empty?

      raise TreeView::ConfigurationError, "expanded_keys and collapsed_keys cannot include the same keys: #{conflicts.map(&:inspect).join(", ")}; remove each key from one side"
    end
  end
end
