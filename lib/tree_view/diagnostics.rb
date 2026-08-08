# frozen_string_literal: true

module TreeView
  class Diagnostics
    DEFAULT_CHECKS = %i[node_keys dom_ids orphans cycles].freeze

    Result = Struct.new(:checks, :errors, :warnings) do
      def success?
        errors.empty?
      end

      def summary_messages
        errors.map { |entry| entry[:message] } + warnings.map { |entry| entry[:message] }
      end
    end

    def self.run(tree: nil, render_state: nil, checks: DEFAULT_CHECKS, raise_errors: false)
      new(tree: tree, render_state: render_state, checks: checks, raise_errors: raise_errors).run
    end

    def initialize(tree: nil, render_state: nil, checks: DEFAULT_CHECKS, raise_errors: false)
      @tree = tree || render_state&.tree
      @render_state = render_state
      @checks = Array(checks).map(&:to_sym)
      @raise_errors = raise_errors
      @errors = []
      @warnings = []
    end

    def run
      checks.each { |check| run_check(check) }
      Result.new(checks: checks, errors: errors.freeze, warnings: warnings.freeze)
    end

    private

    attr_reader :tree, :render_state, :checks, :errors, :warnings

    def run_check(check)
      case check
      when :node_keys
        validate_node_keys
      when :dom_ids
        validate_dom_ids
      when :orphans
        collect_orphans
      when :cycles
        validate_cycles
      else
        record_error(check, TreeView::ConfigurationError.new("unknown diagnostics check: #{check.inspect}; supported checks are: #{DEFAULT_CHECKS.join(", ")}"))
      end
    rescue TreeView::Error, ArgumentError => error
      record_error(check, error)
    end

    def validate_node_keys
      require_tree!(:node_keys)
      tree.validate_unique_node_keys!
    end

    def validate_dom_ids
      require_render_state!(:dom_ids)
      render_state.validate_unique_dom_ids!
    end

    def collect_orphans
      require_tree!(:orphans)
      return unless tree.respond_to?(:orphan_report)

      report = tree.orphan_report
      return if report.empty?

      warnings << {
        check: :orphans,
        message: "orphan nodes detected: #{report.map { |entry| entry[:key].inspect }.join(", ")}",
        details: report
      }
    end

    def validate_cycles
      require_tree!(:cycles)
      if tree.respond_to?(:validate_no_cycles!)
        tree.validate_no_cycles!
      else
        tree.descendant_counts
      end
    end

    def require_tree!(check)
      return if tree

      raise TreeView::ConfigurationError, "#{check} diagnostics require tree: or render_state:"
    end

    def require_render_state!(check)
      return if render_state

      raise TreeView::ConfigurationError, "#{check} diagnostics require render_state:"
    end

    def record_error(check, error)
      raise error if @raise_errors

      errors << {
        check: check,
        error: error,
        message: error.message
      }
    end
  end
end
