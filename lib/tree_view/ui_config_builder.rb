# frozen_string_literal: true

module TreeView
  class UiConfigBuilder
    def initialize(context:, node_prefix: "item", key_resolver: nil)
      @context = context
      @node_prefix = node_prefix
      @key_resolver = key_resolver || method(:default_key_for)
    end

    def build(show_descendants_path_builder:,
      hide_descendants_path_builder:,
      toggle_all_path_builder:,
      load_children_path_builder: nil,
      turbo_frame: nil,
      indent_unit: "&ensp; &ensp; &ensp;",
      scope_format: :string)
      build_turbo(
        show_descendants_path_builder: show_descendants_path_builder,
        hide_descendants_path_builder: hide_descendants_path_builder,
        toggle_all_path_builder: toggle_all_path_builder,
        load_children_path_builder: load_children_path_builder,
        turbo_frame: turbo_frame,
        indent_unit: indent_unit,
        scope_format: scope_format
      )
    end

    def build_turbo(show_descendants_path_builder:,
      hide_descendants_path_builder:,
      toggle_all_path_builder:,
      load_children_path_builder: nil,
      turbo_frame: nil,
      indent_unit: "&ensp; &ensp; &ensp;",
      scope_format: :string)
      UiConfig.new(
        **dom_builders,
        hide_descendants_path_builder: hide_descendants_path_builder,
        show_descendants_path_builder: show_descendants_path_builder,
        load_children_path_builder: load_children_path_builder,
        toggle_all_path_builder: toggle_all_path_builder,
        turbo_frame: turbo_frame,
        indent_unit: indent_unit,
        scope_format: scope_format,
        mode: :turbo
      )
    end

    def build_static(indent_unit: "&ensp; &ensp; &ensp;")
      UiConfig.new(
        **dom_builders,
        indent_unit: indent_unit,
        mode: :static
      )
    end

    def build_client_side(indent_unit: "&ensp; &ensp; &ensp;")
      UiConfig.new(
        **dom_builders,
        indent_unit: indent_unit,
        mode: :client
      )
    end

    private

    def default_key_for(item_or_id)
      return item_or_id.id if item_or_id.respond_to?(:id)
      return item_or_id.key if item_or_id.respond_to?(:key)

      item_or_id
    end

    def dom_builders
      {
        node_dom_id_builder: ->(item_or_id) { "#{@node_prefix}_#{@key_resolver.call(item_or_id)}" },
        button_dom_id_builder: ->(item_or_id) { "#{@node_prefix}_button_box_#{@key_resolver.call(item_or_id)}" },
        show_button_dom_id_builder: ->(item_or_id) { "#{@node_prefix}_show_button_#{@key_resolver.call(item_or_id)}" }
      }
    end
  end
end
