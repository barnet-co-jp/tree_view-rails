# frozen_string_literal: true

require "spec_helper"
require "yaml"

PublicApiCompatibilityTestNode = Struct.new(:id, :parent_id, :name)
PUBLIC_API_MANIFEST_PATH = File.expand_path("../config/public_api_manifest.yml", __dir__)
JAVASCRIPT_ENTRYPOINT_PATH = File.expand_path("../app/javascript/tree_view/index.js", __dir__)
JAVASCRIPT_CONTROLLER_PATHS = {
  "state" => File.expand_path("../app/javascript/tree_view/state_controller.js", __dir__),
  "selection" => File.expand_path("../app/javascript/tree_view/selection_controller.js", __dir__),
  "remote_state" => File.expand_path("../app/javascript/tree_view/remote_state_controller.js", __dir__),
  "transfer" => File.expand_path("../app/javascript/tree_view/transfer_controller.js", __dir__)
}.freeze
RENDER_STATE_GROUPED_OPTION_KEY_RESOLVERS = {
  "initial_expansion" => -> { TreeView::RenderState::VALID_INITIAL_EXPANSION_KEYS.map(&:to_s) },
  "render_scope" => -> { TreeView::RenderState::VALID_RENDER_SCOPE_KEYS.map(&:to_s) },
  "toggle_scope" => -> { TreeView::RenderState::VALID_TOGGLE_SCOPE_KEYS.map(&:to_s) },
  "toggle_icons" => -> { TreeView::RenderState::VALID_TOGGLE_ICONS_KEYS.map(&:to_s) },
  "selection" => -> { TreeView::RenderState::SelectionConfig::VALID_KEYS.map(&:to_s) },
  "lazy_loading" => -> { %w[enabled loaded_keys scope] },
  "row_status" => -> { %w[row_disabled_builder row_readonly_builder row_disabled_reason_builder] },
  "state_messages" => -> { TreeView::RenderStateStateMessages::VALID_STATE_MESSAGE_KEYS.map(&:to_s) }
}.freeze

RSpec.describe "Public API compatibility" do
  def public_api_manifest
    # The machine-readable manifest covers Ruby/module/helper entrypoints,
    # helper option keys, grouped option keys, package-root exports, and
    # required JavaScript event detail keys. Broader behavior and docs sync stay
    # explicit here.
    @public_api_manifest ||= YAML.safe_load_file(PUBLIC_API_MANIFEST_PATH)
  end

  def public_helper_option_keys
    public_api_manifest.fetch("helper_option_keys")
  end

  def public_javascript_manifest
    public_api_manifest.fetch("javascript_package_root")
  end

  def public_javascript_event_names
    public_javascript_manifest.fetch("event_names")
  end

  def public_javascript_event_detail_keys
    public_javascript_manifest.fetch("event_detail_keys")
  end

  def javascript_entrypoint_source
    @javascript_entrypoint_source ||= File.read(JAVASCRIPT_ENTRYPOINT_PATH)
  end

  def javascript_controller_source(group_name)
    @javascript_controller_sources ||= {}
    @javascript_controller_sources[group_name] ||= File.read(JAVASCRIPT_CONTROLLER_PATHS.fetch(group_name))
  end

  def tree_view_rows_helper_keyword_option_keys
    TreeViewHelper::Rendering.instance_method(:tree_view_rows).parameters.filter_map do |parameter_type, parameter_name|
      parameter_name.to_s if %i[key keyreq].include?(parameter_type)
    end
  end

  def breadcrumb_helper_keyword_option_keys
    TreeViewBreadcrumbHelper.instance_method(:tree_view_breadcrumb).parameters.filter_map do |parameter_type, parameter_name|
      parameter_name.to_s if %i[key keyreq].include?(parameter_type)
    end
  end

  def camelize_manifest_key(value)
    value.to_s.gsub(/_([a-z])/) { Regexp.last_match(1).upcase }
  end

  def event_names_by_export_group
    public_javascript_event_names.transform_keys { |group_name| camelize_manifest_key(group_name) }
  end

  def event_dispatch_name(event_key)
    event_key.tr("_", "-")
  end

  def source_dispatches_event?(source, dispatch_name)
    source.match?(/\b(?:dispatch|dispatch[A-Za-z]*)\("#{Regexp.escape(dispatch_name)}"/)
  end

  def source_dispatch_windows(source, dispatch_name)
    matcher = /\b(?:dispatch|dispatch[A-Za-z]*)\("#{Regexp.escape(dispatch_name)}"/

    source.to_enum(:scan, matcher).map do
      start_index = Regexp.last_match.begin(0)
      end_index = source.index(/\n  }\n/, start_index) || source.length

      source[start_index...end_index]
    end
  end

  def source_mentions_detail_key?(source, detail_key)
    source.match?(/#{Regexp.escape(detail_key)}\s*:/) || source.match?(/(?:^|[\s,{])#{Regexp.escape(detail_key)}(?:$|[\s,}])/)
  end

  def source_mentions_shorthand_detail?(source)
    source.match?(/detail\s*[},]/)
  end

  def source_mentions_detail_key_for_dispatch?(source, dispatch_name, detail_key)
    source_dispatch_windows(source, dispatch_name).any? do |dispatch_source|
      source_mentions_detail_key?(dispatch_source, detail_key) ||
        (source_mentions_shorthand_detail?(dispatch_source) && source_mentions_detail_key?(source, detail_key))
    end
  end

  def dom_id_suffix(item_or_id)
    return item_or_id.id if item_or_id.respond_to?(:id)

    item_or_id
  end

  def public_ui_config
    TreeView::UiConfig.new(
      node_dom_id_builder: ->(item_or_id) { "node_#{dom_id_suffix(item_or_id)}" },
      button_dom_id_builder: ->(item_or_id) { "node_button_#{dom_id_suffix(item_or_id)}" },
      show_button_dom_id_builder: ->(item_or_id) { "node_show_button_#{dom_id_suffix(item_or_id)}" }
    )
  end

  def public_tree
    root = PublicApiCompatibilityTestNode.new(id: 1, parent_id: nil, name: "Root")
    child = PublicApiCompatibilityTestNode.new(id: 2, parent_id: 1, name: "Child")

    TreeView::Tree.new(records: [root, child], parent_id_method: :parent_id)
  end

  it "keeps documented TreeView module methods available" do
    public_api_manifest.fetch("module_methods").each do |method_name|
      expect(TreeView).to respond_to(method_name.to_sym), "expected TreeView.#{method_name} to remain public"
    end

    expect(TreeView.node_key(:document, 1)).to eq("document:1")
  end

  it "keeps documented configuration options available" do
    expect(TreeView.configuration.initial_state).to eq(:expanded)
    expect(TreeView.configuration.render_log_level).to eq(:warn)

    TreeView.configure do |config|
      config.initial_state = :collapsed
      config.render_log_level = :info
    end

    expect(TreeView.configuration.initial_state).to eq(:collapsed)
    expect(TreeView.configuration.render_log_level).to eq(:info)
  end

  it "keeps documented public Ruby constants available" do
    public_api_manifest.fetch("public_constants").each do |constant_name|
      expect(TreeView.const_defined?(constant_name)).to be(true), "expected TreeView::#{constant_name} to remain public"
    end
  end

  it "keeps documented UiConfigBuilder mode methods available" do
    builder = TreeView::UiConfigBuilder.new(context: Object.new)

    expect(builder).to respond_to(:build)
    expect(builder).to respond_to(:build_turbo)
    expect(builder).to respond_to(:build_static)
    expect(builder).to respond_to(:build_client_side)
  end

  it "keeps documented RenderState grouped option keys available" do
    public_api_manifest.fetch("grouped_option_keys").each do |group_name, manifest_keys|
      expected_keys = RENDER_STATE_GROUPED_OPTION_KEY_RESOLVERS.fetch(group_name).call

      expect(manifest_keys).to eq(expected_keys), "expected #{group_name} keys to match the documented public grouped option contract"
    end
  end

  it "keeps representative grouped option behavior available" do
    tree = instance_double(TreeView::Tree)
    ui_config = instance_double(TreeView::UiConfig)
    row_disabled_builder = ->(item) { item == :disabled }
    row_readonly_builder = ->(item) { item == :readonly }
    row_disabled_reason_builder = ->(item) { (item == :disabled) ? "archived" : nil }

    state = TreeView::RenderState.new(
      tree: tree,
      root_items: [],
      row_partial: "items/tree_columns",
      ui_config: ui_config,
      initial_expansion: {
        default: :collapsed,
        max_depth: 2,
        expanded_keys: ["node:1"],
        collapsed_keys: ["node:2"],
        current_key: "node:3",
        auto_expand_ancestors: false
      },
      render_scope: {
        max_depth: 3,
        max_leaf_distance: 1
      },
      toggle_scope: {
        max_depth_from_root: 4,
        max_leaf_distance: 2
      },
      toggle_icons: {
        by_state: {
          expanded: {text: "-", label: "Collapse"}
        }
      },
      selection: {
        enabled: true,
        visibility: :leaves,
        checkbox_name: "selected_documents[]",
        selected_keys: ["node:3"],
        cascade: true,
        indeterminate: true,
        max_count: 5
      },
      lazy_loading: {
        enabled: true,
        loaded_keys: ["node:1"],
        scope: "children"
      },
      row_disabled_builder: row_disabled_builder,
      row_readonly_builder: row_readonly_builder,
      row_disabled_reason_builder: row_disabled_reason_builder
    )

    expect(state.initial_state).to eq(:collapsed)
    expect(state.max_initial_depth).to eq(2)
    expect(state.expanded_keys).to eq(["node:1"])
    expect(state.collapsed_keys).to eq(["node:2"])
    expect(state.current_key).to eq("node:3")
    expect(state.auto_expand_ancestors?).to eq(false)
    expect(state.max_render_depth).to eq(3)
    expect(state.max_leaf_distance).to eq(1)
    expect(state.max_toggle_depth_from_root).to eq(4)
    expect(state.max_toggle_leaf_distance).to eq(2)
    expect(state.toggle_icons).to eq(by_state: {expanded: {text: "-", label: "Collapse"}})
    expect(state.toggle_icon_builder.call(nil, :expanded, {depth: 0})).to eq(text: "-", label: "Collapse")
    expect(state.selection_enabled?).to eq(true)
    expect(state.selection_visibility).to eq(:leaves)
    expect(state.selection_checkbox_name).to eq("selected_documents[]")
    expect(state.selection_selected_keys).to eq(["node:3"])
    expect(state.selection_cascade?).to eq(true)
    expect(state.selection_indeterminate?).to eq(true)
    expect(state.selection_max_count).to eq(5)
    expect(state.lazy_loading_enabled?).to eq(true)
    expect(state.lazy_loading_loaded_keys).to eq(["node:1"])
    expect(state.lazy_loading_scope).to eq("children")
    expect(state.row_disabled_builder).to eq(row_disabled_builder)
    expect(state.row_readonly_builder).to eq(row_readonly_builder)
    expect(state.row_disabled_reason_builder).to eq(row_disabled_reason_builder)
  end

  it "keeps documented helper method names available through TreeViewHelper" do
    public_api_manifest.fetch("helper_methods").each do |method_name|
      expect(TreeViewHelper.public_instance_methods).to include(method_name.to_sym), "expected TreeViewHelper##{method_name} to remain public"
    end
  end

  it "keeps tree_view_rows helper option keys aligned with the public helper signature" do
    manifest_keys = public_helper_option_keys.fetch("tree_view_rows")

    expect(manifest_keys).to eq(tree_view_rows_helper_keyword_option_keys),
      "expected tree_view_rows option keys to stay aligned with the public keyword signature"
  end

  it "keeps breadcrumb helper option keys aligned with the public helper signature" do
    manifest_keys = public_helper_option_keys.fetch("tree_view_breadcrumb")

    expect(manifest_keys).to eq(breadcrumb_helper_keyword_option_keys),
      "expected tree_view_breadcrumb option keys to stay aligned with the public keyword signature"
  end

  it "keeps documented lazy-loading helper behavior available through TreeViewHelper" do
    helper_class = Class.new do
      include TreeViewHelper

      attr_accessor :tree_ui
    end

    item = PublicApiCompatibilityTestNode.new(id: 1, parent_id: nil, name: "Root")
    helper = helper_class.new
    helper.tree_ui = public_ui_config

    expect(helper.tree_children_container_dom_id(item)).to eq("node_1_children")
    expect(helper.tree_remote_state_placeholder_dom_id(item)).to eq("node_1_remote_state")
    expect(helper.tree_remote_state_placeholder_attributes(item)).to eq({id: "node_1_remote_state"})
    expect(helper.tree_remote_state_placeholder_attributes(item, state: :loading)).to eq({
      id: "node_1_remote_state",
      data: {tree_remote_state: "loading"}
    })
  end

  it "keeps lazy-loading state actions aligned with host lifecycle manifest events" do
    helper_class = Class.new do
      include TreeViewHelper
    end
    helper = helper_class.new
    tree = public_tree
    lazy_render_state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "items/tree_columns",
      ui_config: public_ui_config,
      lazy_loading: {enabled: true}
    )
    eager_render_state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "items/tree_columns",
      ui_config: public_ui_config
    )

    lazy_data = helper.tree_view_state_data(lazy_render_state)
    lazy_actions = lazy_data.fetch(:action).split

    expect(lazy_data.fetch(:controller).split).to include("tree-view-remote-state")
    public_javascript_event_names.fetch("host_lifecycle").each do |state, event_name|
      expected_action = "#{event_name}->tree-view-remote-state##{state}"

      expect(lazy_actions).to include(expected_action),
        "expected lazy-loading data-action to include #{expected_action} from the host_lifecycle manifest"
    end

    eager_data = helper.tree_view_state_data(eager_render_state)

    expect(eager_data.fetch(:controller).split).not_to include("tree-view-remote-state")
    expect(eager_data.fetch(:action, "").split.grep(/\Atree-view:/)).to be_empty
  end

  it "keeps documented JavaScript package-root exports available" do
    source = javascript_entrypoint_source

    public_javascript_manifest.fetch("named_exports").each do |export_name|
      case export_name
      when "registerTreeViewControllers"
        expect(source).to include("export function registerTreeViewControllers(application)")
      else
        has_reexport = source.include?("export { #{export_name} } from")
        has_const_export = source.include?("export const #{export_name} =")

        expect(has_reexport || has_const_export).to be(true),
          "expected tree_view package root to keep exporting #{export_name}"
      end
    end
  end

  it "keeps documented JavaScript controller identifiers available for host apps" do
    source = javascript_entrypoint_source

    expect(source).to include("export const TreeViewControllerIdentifiers = Object.freeze(")

    public_javascript_manifest.fetch("controller_registrations").each do |registration|
      key = registration.fetch("key")
      identifier = registration.fetch("identifier")

      expect(source).to include("#{key}: \"#{identifier}\""),
        "expected TreeViewControllerIdentifiers.#{key} to remain mapped to #{identifier}"
    end
  end

  it "keeps documented JavaScript controller identifiers wired through registerTreeViewControllers" do
    source = javascript_entrypoint_source

    public_javascript_manifest.fetch("controller_registrations").each do |registration|
      export_name = registration.fetch("export")
      identifier = registration.fetch("identifier")

      expect(source).to include("application.register(\"#{identifier}\", #{export_name})"),
        "expected registerTreeViewControllers to register #{export_name} as #{identifier}"
    end
  end

  it "keeps documented JavaScript event names available through TreeViewEventNames" do
    source = javascript_entrypoint_source

    expect(source).to include("export const TreeViewEventNames = Object.freeze({")

    event_names_by_export_group.each do |group_name, events|
      expect(source).to include("#{group_name}: Object.freeze({"),
        "expected TreeViewEventNames to keep the #{group_name} group"

      events.each_value do |event_name|
        expect(source).to include(%("#{event_name}")),
          "expected TreeViewEventNames to include #{event_name}"
      end
    end
  end

  it "checks JavaScript event detail keys inside the matching dispatch source" do
    source = <<~JAVASCRIPT
      export class ExampleController {
        first() {
          this.dispatch("one", {
            detail: {
              sharedKey: true,
              oneOnly: true
            }
          })
        }

        second() {
          this.dispatch("two", {
            detail: {
              sharedKey: true,
              twoOnly: true
            }
          })
        }

        wrapped() {
          this.dispatchTransferEvent("wrapped", {
            wrappedOnly: true
          })
        }
      }
    JAVASCRIPT

    expect(source_mentions_detail_key_for_dispatch?(source, "one", "oneOnly")).to be(true)
    expect(source_mentions_detail_key_for_dispatch?(source, "one", "twoOnly")).to be(false)
    expect(source_mentions_detail_key_for_dispatch?(source, "wrapped", "wrappedOnly")).to be(true)
  end

  it "keeps documented JavaScript event detail keys aligned with controller dispatch sources" do
    public_javascript_event_detail_keys.each do |group_name, events|
      source = javascript_controller_source(group_name)

      events.each do |event_key, detail_keys|
        dispatch_name = event_dispatch_name(event_key)

        expect(source_dispatches_event?(source, dispatch_name)).to be(true),
          "expected #{group_name} controller to dispatch #{dispatch_name}"

        detail_keys.each do |detail_key|
          expect(source_mentions_detail_key_for_dispatch?(source, dispatch_name, detail_key)).to be(true),
            "expected #{group_name} controller source to keep #{detail_key} in the documented #{event_key} detail"
        end
      end
    end
  end

  it "keeps tree_view_rows and tree_view_window helper entrypoints callable" do
    helper_class = Class.new do
      include TreeViewHelper

      def render(partial:, collection: nil, as: nil, locals: {})
        {partial: partial, collection: collection, as: as, locals: locals}
      end
    end

    tree = public_tree
    render_state = TreeView::RenderState.new(
      tree: tree,
      root_items: tree.root_items,
      row_partial: "items/tree_columns",
      ui_config: public_ui_config
    )
    helper = helper_class.new

    rows_result = helper.tree_view_rows(render_state)
    window = helper.tree_view_window(render_state, offset: 0, limit: 1)
    window_result = helper.tree_view_rows(render_state, window: window)

    expect(rows_result).to include(partial: "tree_view/tree_row", collection: tree.root_items, as: :item)
    expect(window).to be_a(TreeView::RenderWindow)
    expect(window.rows.length).to eq(1)
    expect(window_result).to include(partial: "tree_view/tree_window_row", as: :visible_row)
  end

  it "keeps representative public object behavior available" do
    tree = public_tree
    visible_rows = TreeView::VisibleRows.new(
      tree: tree,
      root_items: tree.root_items,
      render_state: TreeView::RenderState.new(
        tree: tree,
        root_items: tree.root_items,
        row_partial: "items/tree_columns",
        ui_config: public_ui_config
      )
    )
    render_window = TreeView::RenderWindow.new(visible_rows, offset: 0, limit: 1)
    persisted_state = TreeView::PersistedState.new(tree_instance_key: "documents#index", expanded_keys: ["node:1"])

    expect(tree.root_items.map(&:id)).to eq([1])
    expect(visible_rows.to_a.first).to be_a(TreeView::VisibleRows::Row)
    expect(render_window.rows.length).to eq(1)
    expect(render_window.total_count).to eq(2)
    expect(persisted_state.tree_instance_key).to eq("documents#index")
    expect(persisted_state.expanded_keys).to eq(["node:1"])
  end
end
