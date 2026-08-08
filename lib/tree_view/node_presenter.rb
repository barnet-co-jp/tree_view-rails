# frozen_string_literal: true

module TreeView
  class NodePresenter
    BUILDER_NAMES = %i[
      key
      label
      href
      tooltip
      row_class
      row_data
      icon
      badge
      actions
    ].freeze

    Definition = Struct.new(:builders) do
      def initialize(builders: {})
        super
      end

      BUILDER_NAMES.each do |name|
        define_method(name) do |&block|
          builders[name] = block
        end
      end
    end

    attr_reader :builders

    def self.define(&block)
      definition = Definition.new
      definition.instance_eval(&block) if block
      new(definition.builders)
    end

    def initialize(builders = {})
      @builders = builders.transform_keys(&:to_sym).freeze
      validate_builder_names!
      validate_builders!
    end

    BUILDER_NAMES.each do |name|
      define_method(name) do |&block|
        return value_for(name) unless block

        with_builder(name, block)
      end
    end

    def key_for(item, state = nil)
      call_builder(:key, item, state)
    end

    def label_for(item, state = nil)
      call_builder(:label, item, state)
    end

    def href_for(item, state = nil)
      call_builder(:href, item, state)
    end

    def tooltip_for(item, state = nil)
      call_builder(:tooltip, item, state)
    end

    def row_class_for(item, state = nil)
      call_builder(:row_class, item, state)
    end

    def row_data_for(item, state = nil)
      call_builder(:row_data, item, state)
    end

    def icon_for(item, state = nil)
      call_builder(:icon, item, state)
    end

    def badge_for(item, state = nil)
      call_builder(:badge, item, state)
    end

    def actions_for(item, state = nil)
      call_builder(:actions, item, state)
    end

    def row_class_builder
      builder_for(:row_class)
    end

    def row_data_builder
      builder_for(:row_data)
    end

    def badge_builder
      builder_for(:badge)
    end

    def icon_builder
      builder_for(:icon)
    end

    private

    def value_for(name)
      builders[name]
    end

    def with_builder(name, builder)
      self.class.new(builders.merge(name => builder))
    end

    def builder_for(name)
      builder = builders[name]
      return nil if builder.nil?

      ->(item) { builder.call(item) }
    end

    def call_builder(name, item, state)
      builder = builders[name]
      return nil if builder.nil?

      if state.nil?
        builder.call(item)
      else
        builder.call(item, state)
      end
    rescue ArgumentError
      builder.call(item)
    end

    def validate_builder_names!
      invalid_names = builders.keys - BUILDER_NAMES
      return if invalid_names.empty?

      raise TreeView::ConfigurationError, "node presenter contains unknown builders: #{invalid_names.join(", ")}; supported builders are: #{BUILDER_NAMES.join(", ")}"
    end

    def validate_builders!
      builders.each do |name, builder|
        next if builder.respond_to?(:call)

        raise TreeView::ConfigurationError, "node presenter #{name} builder must respond to call"
      end
    end
  end
end
