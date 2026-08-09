# frozen_string_literal: true

module TreeViewHelper
  module Toolbar
    DEFAULT_TREE_VIEW_TOOLBAR_ACTIONS = %i[expand_all collapse_all].freeze
    TREE_VIEW_TOOLBAR_ACTIONS = %i[expand_all collapse_all collapse_all_except_current_path].freeze
    TREE_VIEW_TOOLBAR_LABELS = {
      expand_all: "Expand all",
      collapse_all: "Collapse all",
      collapse_all_except_current_path: "Collapse all except current path"
    }.freeze
    TREE_VIEW_TOOLBAR_STATES = {
      expand_all: :expanded,
      collapse_all: :collapsed,
      collapse_all_except_current_path: :current_path
    }.freeze

    def tree_view_toolbar(render_state, actions: DEFAULT_TREE_VIEW_TOOLBAR_ACTIONS, labels: {}, class_name: "tree-view-toolbar", button_class_name: "tree-view-toolbar__button", html: {}, action_html: nil)
      content_tag(:div, tree_view_toolbar_html_options(class_name, html)) do
        safe_join(
          tree_view_toolbar_actions(render_state, actions: actions, labels: labels).map do |action|
            tree_view_toolbar_action_tag(action, button_class_name, action_html)
          end
        )
      end
    end

    def tree_view_toolbar_supported_actions
      TREE_VIEW_TOOLBAR_ACTIONS.dup
    end

    def tree_view_toolbar_actions(render_state, actions: DEFAULT_TREE_VIEW_TOOLBAR_ACTIONS, labels: {})
      normalized_labels = labels.to_h.transform_keys(&:to_sym)

      normalize_tree_view_toolbar_actions(actions).map do |action|
        tree_view_toolbar_action_metadata(render_state, action, label: normalized_labels[action])
      end
    end

    def tree_view_toolbar_action_metadata(render_state, action, label: nil)
      normalized_action = normalize_tree_view_toolbar_action(action)
      path = tree_view_toolbar_path(render_state, normalized_action)
      disabled = path.nil?

      {
        action: normalized_action,
        state: TREE_VIEW_TOOLBAR_STATES.fetch(normalized_action),
        label: label || tree_view_toolbar_default_label(normalized_action),
        path: path,
        disabled: disabled,
        data: tree_view_toolbar_action_data(normalized_action, disabled: disabled)
      }
    end

    private

    def normalize_tree_view_toolbar_actions(actions)
      Array(actions).map { |action| normalize_tree_view_toolbar_action(action) }
    end

    def normalize_tree_view_toolbar_action(action)
      normalized_action = action.to_sym
      return normalized_action if TREE_VIEW_TOOLBAR_ACTIONS.include?(normalized_action)

      raise TreeView::ConfigurationError, "unknown tree_view_toolbar action: #{action}; supported actions are: #{TREE_VIEW_TOOLBAR_ACTIONS.join(", ")}"
    end

    def tree_view_toolbar_default_label(action)
      default_label = TREE_VIEW_TOOLBAR_LABELS.fetch(action)
      return default_label unless defined?(I18n)

      I18n.t("tree_view.toolbar.labels.#{action}", default: default_label)
    end

    def tree_view_toolbar_action_tag(action, button_class_name, action_html)
      options = tree_view_toolbar_action_html_options(action, button_class_name, action_html)

      if action[:path]
        link_to(action[:label], action[:path], options)
      else
        button_tag(action[:label], options.merge(type: "button", disabled: true))
      end
    end

    def tree_view_toolbar_path(render_state, action)
      return nil unless render_state.ui_config.respond_to?(:toggle_all_path)

      render_state.ui_config.toggle_all_path(state: TREE_VIEW_TOOLBAR_STATES.fetch(action))
    end

    def tree_view_toolbar_action_data(action, disabled:)
      {
        tree_view_toolbar_action: action,
        tree_view_toolbar_disabled: disabled || nil
      }.compact
    end

    def tree_view_toolbar_html_options(class_name, html)
      options = normalize_tree_view_toolbar_html_options(html, option_name: :html)
      options[:class] = class_names(class_name, options[:class])
      options[:data] = options.fetch(:data, {}).to_h.merge(tree_view_toolbar: true)
      options
    end

    def tree_view_toolbar_action_html_options(action, button_class_name, action_html)
      action_name = action.fetch(:action)
      options = normalize_tree_view_toolbar_html_options(
        resolve_tree_view_toolbar_action_html(action, action_html),
        option_name: :action_html,
        action: action_name
      )
      options[:class] = class_names(button_class_name, options[:class])
      options[:data] = options.fetch(:data, {}).to_h.merge(action.fetch(:data))
      options
    end

    def resolve_tree_view_toolbar_action_html(action, action_html)
      case action_html
      when nil
        {}
      when Proc
        action_html.call(action)
      else
        options = normalize_tree_view_toolbar_html_options(
          action_html,
          option_name: :action_html,
          action: action.fetch(:action)
        )
        options.fetch(action.fetch(:action), options.fetch(action.fetch(:action).to_s, options))
      end
    end

    def normalize_tree_view_toolbar_html_options(value, option_name:, action: nil)
      return {} if value.nil?
      return value.to_h.dup if value.respond_to?(:to_h)

      action_context = action ? " for action #{action}" : ""
      raise ArgumentError, "#{option_name} must resolve to a Hash-like object#{action_context}"
    end
  end
end
