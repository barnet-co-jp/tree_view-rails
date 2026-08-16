# frozen_string_literal: true

require "spec_helper"
require "psych"
require "tree_view"
require "tree_view/diagnostics"
require "tree_view/resource_table_render_state"
require_relative "../app/helpers/tree_view_helper"
require "yaml"

PUBLIC_API_MANIFEST_STRUCTURE_PATH = File.expand_path("../config/public_api_manifest.yml", __dir__)
PUBLIC_API_MANIFEST_TOP_LEVEL_KEYS = %w[
  module_methods
  configuration_options
  public_constants
  localized_name_i18n_keys
  filtered_tree_modes
  visible_rows_row_metadata
  node_presenter_builder_names
  graph_adapter_initializer
  path_tree_builder_initializer
  ui_config_builder_option_keys
  path_tree_builder_node_shapes
  helper_methods
  helper_option_keys
  render_window_metadata
  toolbar_actions
  toolbar_action_metadata
  setup_generators
  grouped_option_keys
  diagnostics
  resource_table_render_state_call
  render_state_callback_builder_keys
  css_custom_property_tokens
  javascript_package_root
].freeze
PUBLIC_API_DOC_PATHS = [
  File.expand_path("../docs/en/public-api.md", __dir__),
  File.expand_path("../docs/ja/public-api.md", __dir__)
].freeze
DOCUMENTED_TREE_VIEW_MODULE_METHODS = %w[
  configure
  configuration
  reset_configuration!
  parse_selection_params
  node_key
  model_name_for
  attribute_name_for
  type_name_for
].freeze
DOCUMENTED_TREE_VIEW_PUBLIC_CONSTANTS = %w[
  Error
  ConfigurationError
  InvalidTreeError
  DuplicateNodeKeyError
  CycleDetectedError
  InvalidRenderWindowError
  Configuration
  LocalizedNames
  Tree
  RenderState
  ResourceTableRenderState
  VisibleRows
  RenderWindow
  FilteredTree
  UiConfig
  UiConfigBuilder
  GraphAdapter
  NodePresenter
  PathTree
  PathTreeBuilder
  ReverseTree
  PersistedState
  StateStore
  Diagnostics
].freeze
DOCUMENTED_TREE_VIEW_HELPER_METHODS = %w[
  tree_view_rows
  tree_view_window
  tree_node_dom_id
  tree_children_container_dom_id
  tree_remote_state_placeholder_dom_id
  tree_remote_state_placeholder_attributes
  tree_selection_value
  tree_view_breadcrumb
  tree_view_toolbar
  tree_view_toolbar_supported_actions
  tree_view_toolbar_actions
  tree_view_toolbar_action_metadata
].freeze
INTENTIONALLY_INTERNAL_TREE_VIEW_HELPER_METHODS = %w[
  tree_button_dom_id
  tree_show_button_dom_id
  tree_selection_checkbox_dom_id
  tree_hide_descendants_path
  tree_show_descendants_path
  tree_load_children_path
  tree_toggle_all_path
  tree_turbo_frame
  tree_expand_all_path
  tree_collapse_all_path
].freeze

RSpec.describe "Public API manifest structure" do
  def manifest_source
    @manifest_source ||= File.read(PUBLIC_API_MANIFEST_STRUCTURE_PATH)
  end

  def manifest
    @manifest ||= YAML.safe_load(manifest_source)
  end

  def public_api_docs
    @public_api_docs ||= PUBLIC_API_DOC_PATHS.to_h do |path|
      [path, File.read(path)]
    end
  end

  def expect_manifest_list(section_name, expected_values)
    actual_values = manifest.fetch(section_name)

    expect(actual_values).to eq(expected_values), <<~MESSAGE
      expected config/public_api_manifest.yml##{section_name} to match the documented public API surface.
      missing: #{(expected_values - actual_values).inspect}
      extra: #{(actual_values - expected_values).inspect}
    MESSAGE
  end

  def duplicate_mapping_keys(yaml_source)
    document = Psych.parse(yaml_source)
    duplicates = []

    walk_yaml_node(document.root, [], duplicates)

    duplicates
  end

  def walk_yaml_node(node, path, duplicates)
    case node
    when Psych::Nodes::Mapping
      seen_keys = {}

      node.children.each_slice(2) do |key_node, value_node|
        key = key_node.value.to_s
        key_path = (path + [key]).join(".")

        duplicates << key_path if seen_keys[key]
        seen_keys[key] = true

        walk_yaml_node(value_node, path + [key], duplicates)
      end
    when Psych::Nodes::Sequence
      node.children.each_with_index do |child, index|
        walk_yaml_node(child, path + [index.to_s], duplicates)
      end
    end
  end

  it "keeps expected top-level sections explicit" do
    expect(manifest.keys).to eq(PUBLIC_API_MANIFEST_TOP_LEVEL_KEYS)
  end

  it "does not contain duplicate keys in any mapping" do
    expect(duplicate_mapping_keys(manifest_source)).to eq([])
  end

  it "detects duplicate keys inside nested mappings" do
    yaml = <<~YAML
      javascript_package_root:
        event_names:
          state: {}
          state: {}
    YAML

    expect(duplicate_mapping_keys(yaml)).to eq(["javascript_package_root.event_names.state"])
  end

  it "keeps TreeView module methods synchronized with the public manifest and docs" do
    expect_manifest_list("module_methods", DOCUMENTED_TREE_VIEW_MODULE_METHODS)

    missing_runtime_methods = DOCUMENTED_TREE_VIEW_MODULE_METHODS.reject { |method_name| TreeView.respond_to?(method_name) }
    expect(missing_runtime_methods).to eq([]), "missing TreeView public module methods from runtime: #{missing_runtime_methods.inspect}"

    public_api_docs.each do |path, document|
      missing_doc_methods = DOCUMENTED_TREE_VIEW_MODULE_METHODS.reject do |method_name|
        document.include?("`TreeView.#{method_name}`")
      end

      expect(missing_doc_methods).to eq([]), "missing documented TreeView module methods in #{path}: #{missing_doc_methods.inspect}"
    end
  end

  it "keeps TreeView public constants synchronized with the public manifest and docs" do
    expect_manifest_list("public_constants", DOCUMENTED_TREE_VIEW_PUBLIC_CONSTANTS)

    missing_runtime_constants = DOCUMENTED_TREE_VIEW_PUBLIC_CONSTANTS.reject { |constant_name| TreeView.const_defined?(constant_name, false) }
    expect(missing_runtime_constants).to eq([]), "missing TreeView public constants from runtime: #{missing_runtime_constants.inspect}"

    public_api_docs.each do |path, document|
      missing_doc_constants = DOCUMENTED_TREE_VIEW_PUBLIC_CONSTANTS.reject do |constant_name|
        document.include?("`TreeView::#{constant_name}`") || document.include?("`TreeView::#{constant_name}.call`")
      end

      expect(missing_doc_constants).to eq([]), "missing documented TreeView public constants in #{path}: #{missing_doc_constants.inspect}"
    end
  end

  it "keeps TreeViewHelper public helper methods synchronized with the public manifest and docs" do
    expect_manifest_list("helper_methods", DOCUMENTED_TREE_VIEW_HELPER_METHODS)

    runtime_helper_methods = TreeViewHelper.public_instance_methods.map(&:to_s)
    missing_runtime_helpers = DOCUMENTED_TREE_VIEW_HELPER_METHODS - runtime_helper_methods
    expect(missing_runtime_helpers).to eq([]), "missing TreeViewHelper public helper methods from runtime: #{missing_runtime_helpers.inspect}"

    leaked_internal_helpers = INTENTIONALLY_INTERNAL_TREE_VIEW_HELPER_METHODS & manifest.fetch("helper_methods")
    expect(leaked_internal_helpers).to eq([]), <<~MESSAGE
      config/public_api_manifest.yml#helper_methods should not list internal composition helpers.
      leaked internal helpers: #{leaked_internal_helpers.inspect}
    MESSAGE

    public_api_docs.each do |path, document|
      missing_doc_helpers = DOCUMENTED_TREE_VIEW_HELPER_METHODS.reject do |helper_name|
        document.include?("`#{helper_name}")
      end

      expect(missing_doc_helpers).to eq([]), "missing documented TreeViewHelper methods in #{path}: #{missing_doc_helpers.inspect}"
    end
  end

  it "keeps localized name i18n key sections shaped as explicit hash contracts" do
    section = manifest.fetch("localized_name_i18n_keys")

    expect(section.keys).to eq(%w[model_names attribute_names node_type_names])

    %w[model_names attribute_names].each do |section_name|
      contract = section.fetch(section_name)

      expect(contract.fetch("helper")).to be_a(String)
      expect(contract.fetch("delegated_lookup_prefixes")).to be_an(Array)
      expect(contract.fetch("delegated_lookup_prefixes")).not_to be_empty
      expect(contract.fetch("delegated_lookup_prefixes")).to all(be_a(String))
      expect(contract.fetch("fallback")).to be_a(String)
    end

    node_type_contract = section.fetch("node_type_names")

    expect(node_type_contract.fetch("helper")).to be_a(String)
    expect(node_type_contract.fetch("lookup_prefix")).to be_a(String)
    expect(node_type_contract.fetch("fallback")).to be_a(String)
  end

  it "keeps filtered tree modes shaped as a non-empty string list" do
    modes = manifest.fetch("filtered_tree_modes")

    expect(modes).to be_an(Array)
    expect(modes).not_to be_empty
    expect(modes).to all(be_a(String))
  end

  it "keeps CSS custom property tokens shaped as a non-empty string list" do
    tokens = manifest.fetch("css_custom_property_tokens")

    expect(tokens).to be_an(Array)
    expect(tokens).not_to be_empty
    expect(tokens).to all(be_a(String))
    expect(tokens).to all(start_with("--tree-view-"))
  end

  it "keeps VisibleRows row metadata shaped as non-empty string lists" do
    section = manifest.fetch("visible_rows_row_metadata")

    %w[fields predicates].each do |section_name|
      methods = section.fetch(section_name)

      expect(methods).to be_an(Array), "expected #{section_name} to be an array"
      expect(methods).not_to be_empty, "expected #{section_name} to list public row methods"
      expect(methods).to all(be_a(String))
    end
  end

  it "keeps NodePresenter builder names shaped as a non-empty string list" do
    builder_names = manifest.fetch("node_presenter_builder_names")

    expect(builder_names).to be_an(Array)
    expect(builder_names).not_to be_empty
    expect(builder_names).to all(be_a(String))
  end

  it "keeps grouped option key sections shaped as non-empty string lists" do
    manifest.fetch("grouped_option_keys").each do |group_name, keys|
      expect(group_name).to be_a(String)
      expect(keys).to be_an(Array), "expected grouped_option_keys.#{group_name} to be an array"
      expect(keys).not_to be_empty, "expected grouped_option_keys.#{group_name} to list public keys"
      expect(keys).to all(be_a(String))
    end
  end

  it "keeps render window metadata shaped as a non-empty string list" do
    metadata = manifest.fetch("render_window_metadata")

    expect(metadata).to be_an(Array)
    expect(metadata).not_to be_empty
    expect(metadata).to all(be_a(String))
  end

  it "keeps diagnostics sections shaped as explicit public contract lists" do
    diagnostics = manifest.fetch("diagnostics")

    expect(diagnostics.fetch("accepted_checks")).to all(be_a(String))
    expect(diagnostics.fetch("accepted_checks")).not_to be_empty
    expect(diagnostics.fetch("run_options")).to all(be_a(String))
    expect(diagnostics.fetch("run_options")).not_to be_empty
    expect(diagnostics.fetch("result_surface").fetch("attributes")).to all(be_a(String))
    expect(diagnostics.fetch("result_surface").fetch("methods")).to all(be_a(String))
  end

  it "keeps diagnostics run option keys synchronized with the public runtime entrypoint" do
    diagnostics = manifest.fetch("diagnostics")
    parameters = TreeView::Diagnostics.method(:run).parameters
    parameters_by_kind = parameters.group_by(&:first)
    keyword_names = parameters_by_kind.fetch(:key, []).map(&:last).map(&:to_s)

    expect(keyword_names).to include("tree", "render_state")
    expect(diagnostics.fetch("run_options")).to eq(%w[checks raise_errors])
    expect(keyword_names & diagnostics.fetch("run_options")).to eq(diagnostics.fetch("run_options"))
  end

  it "keeps resource table render state keyword sections shaped as non-empty string lists" do
    section = manifest.fetch("resource_table_render_state_call")

    %w[required_keywords optional_keywords].each do |section_name|
      keywords = section.fetch(section_name)

      expect(keywords).to be_an(Array), "expected #{section_name} to be an array"
      expect(keywords).not_to be_empty, "expected #{section_name} to list public keywords"
      expect(keywords).to all(be_a(String))
    end
  end

  it "keeps resource table render state keyword sections synchronized with the runtime call signature" do
    section = manifest.fetch("resource_table_render_state_call")
    parameters = TreeView::ResourceTableRenderState.method(:call).parameters
    parameters_by_kind = parameters.group_by(&:first)
    required_keywords = parameters_by_kind.fetch(:keyreq, []).map(&:last).map(&:to_s)
    optional_keywords = parameters_by_kind.fetch(:key, []).map(&:last).map(&:to_s)

    expect(section.fetch("required_keywords")).to eq(required_keywords)
    expect(section.fetch("optional_keywords")).to eq(optional_keywords)
    expect(parameters).to include([:keyrest, :render_options])
    expect(section.fetch("render_options_contract")).to eq("render_state_pass_through")
  end

  it "keeps JavaScript event names and detail keys in nested hash sections" do
    javascript_manifest = manifest.fetch("javascript_package_root")

    %w[event_names event_detail_keys].each do |section_name|
      section = javascript_manifest.fetch(section_name)

      expect(section).to be_a(Hash)
      expect(section).not_to be_empty

      section.each do |group_name, events|
        expect(group_name).to be_a(String)
        expect(events).to be_a(Hash), "expected #{section_name}.#{group_name} to map event names"
        expect(events).not_to be_empty
      end
    end
  end
end
