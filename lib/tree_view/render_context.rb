# frozen_string_literal: true

module TreeView
  class RenderContext
    LegacyRenderState = Struct.new(
      :tree,
      :root_items,
      :row_partial,
      :row_actions_partial,
      :row_locals,
      :max_initial_depth,
      :max_render_depth,
      :max_leaf_distance,
      :max_toggle_depth_from_root,
      :max_toggle_leaf_distance,
      :expanded_keys,
      :collapsed_keys,
      :current_key,
      :selection_enabled,
      :selection_visibility,
      :selection_payload_builder,
      :selection_checkbox_name,
      :selection_disabled_builder,
      :selection_disabled_reason_builder,
      :selection_selected_keys,
      :hidden_message_builder,
      :row_class_builder,
      :row_data_builder,
      :node_presenter,
      :row_event_payload_builder,
      :loading_builder,
      :error_builder,
      :depth_label_builder,
      :badge_builder,
      :icon_builder,
      :toggle_icon_builder
    ) do
      def effective_initial_state
        :expanded
      end

      def selection_enabled?
        selection_enabled == true
      end

      def tree_instance_key
        nil
      end

      def ui_config
        nil
      end
    end

    attr_reader :render_state, :mode

    def self.from_legacy_locals(local_assigns)
      new(
        render_state: LegacyRenderState.new(
          tree: local_assigns.fetch(:tree),
          root_items: [],
          row_partial: local_assigns.fetch(:row_partial),
          row_actions_partial: local_assigns[:row_actions_partial],
          row_locals: {},
          max_initial_depth: local_assigns[:max_initial_depth],
          max_render_depth: local_assigns[:max_render_depth],
          max_leaf_distance: local_assigns[:max_leaf_distance],
          max_toggle_depth_from_root: local_assigns[:max_toggle_depth_from_root],
          max_toggle_leaf_distance: local_assigns[:max_toggle_leaf_distance],
          expanded_keys: Array(local_assigns[:expanded_keys]),
          collapsed_keys: Array(local_assigns[:collapsed_keys]),
          current_key: local_assigns[:current_key],
          selection_enabled: local_assigns[:selection_enabled] == true,
          selection_visibility: local_assigns.fetch(:selection_visibility, :all),
          selection_payload_builder: local_assigns[:selection_payload_builder],
          selection_checkbox_name: local_assigns[:selection_checkbox_name] || RenderState::DEFAULT_SELECTION_CHECKBOX_NAME,
          selection_disabled_builder: local_assigns[:selection_disabled_builder],
          selection_disabled_reason_builder: local_assigns[:selection_disabled_reason_builder],
          selection_selected_keys: Array(local_assigns[:selection_selected_keys]),
          hidden_message_builder: local_assigns[:hidden_message_builder],
          row_class_builder: local_assigns[:row_class_builder],
          row_data_builder: local_assigns[:row_data_builder],
          node_presenter: local_assigns[:node_presenter],
          row_event_payload_builder: local_assigns[:row_event_payload_builder],
          loading_builder: local_assigns[:loading_builder],
          error_builder: local_assigns[:error_builder],
          depth_label_builder: local_assigns[:depth_label_builder],
          badge_builder: local_assigns[:badge_builder],
          icon_builder: local_assigns[:icon_builder],
          toggle_icon_builder: local_assigns[:toggle_icon_builder]
        ),
        mode: local_assigns[:mode],
        collapsed: local_assigns.fetch(:collapsed, false)
      )
    end

    def initialize(render_state:, mode: nil, collapsed: nil)
      @render_state = render_state
      @mode = mode || render_state_ui_mode
      @collapsed_override = collapsed
    end

    def tree
      render_state.tree
    end

    def root_items
      render_state.root_items
    end

    def row_partial
      render_state.row_partial
    end

    def row_actions_partial
      render_state.row_actions_partial
    end

    def row_locals
      return {} unless render_state.respond_to?(:row_locals)

      render_state.row_locals
    end

    def node_presenter
      return nil unless render_state.respond_to?(:node_presenter)

      render_state.node_presenter
    end

    def row_partial_locals(item:, row_context:)
      row_locals.merge(
        item: item,
        tree: tree,
        render_state: render_state,
        row_context: row_context,
        node_presenter: node_presenter
      ).compact
    end

    def row_actions_partial_locals(item:, row_context:)
      {
        item: item,
        tree: tree,
        render_state: render_state,
        row_context: row_context,
        node_presenter: node_presenter
      }.compact
    end

    def collapsed?
      return @collapsed_override unless @collapsed_override.nil?

      render_state.effective_initial_state == :collapsed
    end

    def max_initial_depth
      render_state.max_initial_depth
    end

    def max_render_depth
      render_state.max_render_depth
    end

    def max_leaf_distance
      render_state.max_leaf_distance
    end

    def max_toggle_depth_from_root
      render_state.max_toggle_depth_from_root
    end

    def max_toggle_leaf_distance
      render_state.max_toggle_leaf_distance
    end

    def expanded_keys
      render_state.expanded_keys
    end

    def collapsed_keys
      render_state.collapsed_keys
    end

    def current_key
      render_state.current_key
    end

    def selection_enabled?
      render_state.selection_enabled?
    end

    def selection_visibility
      render_state.selection_visibility
    end

    def selection_payload_builder
      render_state.selection_payload_builder
    end

    def selection_checkbox_name
      render_state.selection_checkbox_name
    end

    def selection_disabled_builder
      render_state.selection_disabled_builder
    end

    def selection_disabled_reason_builder
      render_state.selection_disabled_reason_builder
    end

    def selection_selected_keys
      render_state.selection_selected_keys
    end

    def hidden_message_builder
      render_state.hidden_message_builder
    end

    def row_class_builder
      render_state.row_class_builder
    end

    def row_data_builder
      render_state.row_data_builder
    end

    def row_event_payload_builder
      render_state.row_event_payload_builder
    end

    def loading_builder
      render_state.loading_builder
    end

    def error_builder
      render_state.error_builder
    end

    def lazy_loading_enabled?
      render_state.respond_to?(:lazy_loading_enabled?) && render_state.lazy_loading_enabled?
    end

    def lazy_loading_loaded_keys
      return [] unless render_state.respond_to?(:lazy_loading_loaded_keys)

      render_state.lazy_loading_loaded_keys
    end

    def lazy_loading_scope
      return "all" unless render_state.respond_to?(:lazy_loading_scope)

      render_state.lazy_loading_scope
    end

    def tree_instance_key
      render_state.tree_instance_key
    end

    def depth_label_builder
      render_state.depth_label_builder
    end

    def badge_builder
      render_state.badge_builder || render_state.icon_builder
    end

    def icon_builder
      render_state.icon_builder
    end

    def toggle_icon_builder
      return nil unless render_state.respond_to?(:toggle_icon_builder)

      render_state.toggle_icon_builder
    end

    private

    def render_state_ui_mode
      return nil unless render_state.respond_to?(:ui_config)

      ui_config = render_state.ui_config
      return nil unless ui_config.respond_to?(:mode)

      ui_config.mode
    end
  end
end
