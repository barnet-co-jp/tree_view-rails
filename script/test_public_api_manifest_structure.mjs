import { execFileSync } from "node:child_process"

function loadManifest() {
  try {
    return JSON.parse(
      execFileSync(
        "ruby",
        [
          "-e",
          [
            'require "json"',
            'require "psych"',
            'require "yaml"',
            'path = "config/public_api_manifest.yml"',
            'duplicates = []',
            'walk = lambda do |node, node_path|',
            '  case node',
            '  when Psych::Nodes::Stream, Psych::Nodes::Document',
            '    node.children.each { |child| walk.call(child, node_path) }',
            '  when Psych::Nodes::Sequence',
            '    node.children.each_with_index { |child, index| walk.call(child, "#{node_path}[#{index}]") }',
            '  when Psych::Nodes::Mapping',
            '    seen = {}',
            '    node.children.each_slice(2) do |key_node, value_node|',
            '      key = key_node.value.to_s',
            '      child_path = node_path.empty? ? key : "#{node_path}.#{key}"',
            '      duplicates << child_path if seen.key?(key)',
            '      seen[key] = true',
            '      walk.call(value_node, child_path)',
            '    end',
            '  end',
            'end',
            'walk.call(Psych.parse_file(path), "")',
            'unless duplicates.empty?',
            '  abort "#{path} contains duplicate YAML key(s): #{duplicates.uniq.sort.join(", ")}"',
            'end',
            'data = YAML.load_file(path)',
            "print JSON.generate(data)"
          ].join("; ")
        ],
        { encoding: "utf8" }
      )
    )
  } catch (error) {
    const detail = [error.stdout, error.stderr]
      .filter((output) => output && output.length > 0)
      .join("\n")
      .trim() || error.message

    throw new Error(
      [
        "Could not load config/public_api_manifest.yml for the manifest structure smoke.",
        "Run this command from the repository root with Ruby available, or inspect the manifest YAML syntax.",
        `Loader output: ${detail}`
      ].join("\n"),
      { cause: error }
    )
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function valueType(value) {
  if (Array.isArray(value)) return "array"
  if (value === null) return "null"

  return typeof value
}

function assertObject(value, path) {
  assert(
    value && typeof value === "object" && !Array.isArray(value),
    `${path} must be an object, got ${valueType(value)}`
  )
}

function assertString(value, path) {
  assert(typeof value === "string" && value.length > 0, `${path} must be a non-empty string`)
}

function assertUniqueStringList(value, path) {
  assert(Array.isArray(value), `${path} must be an array, got ${valueType(value)}`)
  assert(value.length > 0, `${path} must not be empty`)

  const seenValues = new Set()

  value.forEach((item, index) => {
    assertString(item, `${path}[${index}]`)
    assert(!seenValues.has(item), `${path} contains duplicate value: ${item}`)
    seenValues.add(item)
  })
}

function assertStringMap(value, path) {
  assertObject(value, path)
  Object.entries(value).forEach(([key, item]) => {
    assertString(item, `${path}.${key}`)
  })
}

function assertObjectWithLists(value, path, keys) {
  assertObject(value, path)
  keys.forEach((key) => assertUniqueStringList(value[key], `${path}.${key}`))
}

function assertRequiredObjectKeys(value, path, keys) {
  assertObject(value, path)
  keys.forEach((key) => assertObject(value[key], `${path}.${key}`))
}

function assertRequiredKeys(value, path, keys) {
  assertObject(value, path)
  keys.forEach((key) => assert(key in value, `${path} missing required key: ${key}`))
}

function assertPathTreeBuilderNodeShapes(value, path, keys) {
  assertRequiredObjectKeys(value, path, keys)
  keys.forEach((key) => {
    const shape = value[key]
    assertString(shape.constant, `${path}.${key}.constant`)
    assertUniqueStringList(shape.fields, `${path}.${key}.fields`)
    assertUniqueStringList(shape.predicates, `${path}.${key}.predicates`)
  })
}

function assertEntries(value, path, requiredKeys) {
  assert(Array.isArray(value), `${path} must be an array, got ${valueType(value)}`)
  assert(value.length > 0, `${path} must not be empty`)

  value.forEach((entry, index) => {
    assertObject(entry, `${path}[${index}]`)
    requiredKeys.forEach((key) => assertString(entry[key], `${path}[${index}].${key}`))
  })
}

function assertTopLevelKeys(manifest) {
  const expectedKeys = [
    "module_methods",
    "configuration_options",
    "public_constants",
    "localized_name_i18n_keys",
    "filtered_tree_modes",
    "visible_rows_row_metadata",
    "node_presenter_builder_names",
    "graph_adapter_initializer",
    "path_tree_builder_initializer",
    "ui_config_builder_option_keys",
    "path_tree_builder_node_shapes",
    "helper_methods",
    "helper_option_keys",
    "render_window_metadata",
    "toolbar_actions",
    "toolbar_action_metadata",
    "setup_generators",
    "grouped_option_keys",
    "diagnostics",
    "resource_table_render_state_call",
    "render_state_callback_builder_keys",
    "css_custom_property_tokens",
    "javascript_package_root"
  ]

  expectedKeys.forEach((key) => {
    assert(key in manifest, `config/public_api_manifest.yml missing top-level key: ${key}`)
  })

  const unexpectedKeys = Object.keys(manifest).filter((key) => !expectedKeys.includes(key)).sort()
  assert(
    unexpectedKeys.length === 0,
    `config/public_api_manifest.yml contains unexpected top-level key(s): ${unexpectedKeys.join(", ")}. Update script/test_public_api_manifest_structure.mjs before adding manifest sections.`
  )
}

function assertEventClassification(javascriptPackageRoot) {
  const requiredEventNameGroups = ["state", "selection", "remote_state", "host_lifecycle", "transfer"]
  const requiredEventDetailGroups = ["state", "selection", "remote_state", "transfer"]
  const requiredNoDetailGroups = ["host_lifecycle"]

  assertRequiredObjectKeys(
    javascriptPackageRoot.event_names,
    "javascript_package_root.event_names",
    requiredEventNameGroups
  )
  assertRequiredObjectKeys(
    javascriptPackageRoot.event_detail_keys,
    "javascript_package_root.event_detail_keys",
    requiredEventDetailGroups
  )
  assertRequiredKeys(
    javascriptPackageRoot.event_names_without_detail,
    "javascript_package_root.event_names_without_detail",
    requiredNoDetailGroups
  )

  requiredNoDetailGroups.forEach((group) => {
    const groupEvents = javascriptPackageRoot.event_names[group]
    const noDetailEventNames = javascriptPackageRoot.event_names_without_detail[group]

    assertStringMap(groupEvents, `javascript_package_root.event_names.${group}`)
    assertUniqueStringList(noDetailEventNames, `javascript_package_root.event_names_without_detail.${group}`)

    const validEventNames = new Set(Object.keys(groupEvents))
    noDetailEventNames.forEach((eventName) => {
      assert(
        validEventNames.has(eventName),
        `javascript_package_root.event_names_without_detail.${group} includes unknown event: ${eventName}`
      )
      assert(
        !(javascriptPackageRoot.event_detail_keys[group] && javascriptPackageRoot.event_detail_keys[group][eventName]),
        `javascript_package_root.event_names_without_detail.${group} overlaps detail-bearing event: ${eventName}`
      )
    })
  })
}

const requiredUiConfigBuilderOptionKeys = [
  "build",
  "build_turbo",
  "build_static",
  "build_client_side"
]

const requiredPathTreeBuilderNodeShapeKeys = ["folder_node", "record_node"]

const requiredHelperOptionKeys = [
  "tree_view_rows",
  "tree_view_window",
  "tree_view_breadcrumb",
  "tree_view_toolbar"
]

const requiredGroupedOptionKeys = [
  "initial_expansion",
  "render_scope",
  "toggle_scope",
  "toggle_icons",
  "selection",
  "lazy_loading",
  "row_status"
]

const requiredLocalizedNameI18nKeyGroups = [
  "model_names",
  "attribute_names",
  "node_type_names"
]

const requiredIntegrationHookKeys = ["state", "remote_state", "transfer"]

const manifest = loadManifest()

assertTopLevelKeys(manifest)
assertUniqueStringList(manifest.module_methods, "module_methods")
assertObjectWithLists(manifest.configuration_options, "configuration_options", ["tree_view_configure"])
assertUniqueStringList(manifest.public_constants, "public_constants")
assertUniqueStringList(manifest.filtered_tree_modes, "filtered_tree_modes")
assertObjectWithLists(manifest.visible_rows_row_metadata, "visible_rows_row_metadata", ["fields", "predicates"])
assertUniqueStringList(manifest.node_presenter_builder_names, "node_presenter_builder_names")
assertObjectWithLists(manifest.graph_adapter_initializer, "graph_adapter_initializer", ["required_keywords", "optional_keywords"])
assertObjectWithLists(manifest.path_tree_builder_initializer, "path_tree_builder_initializer", ["required_keywords", "optional_keywords"])
assertObjectWithLists(manifest.ui_config_builder_option_keys, "ui_config_builder_option_keys", requiredUiConfigBuilderOptionKeys)
assertPathTreeBuilderNodeShapes(manifest.path_tree_builder_node_shapes, "path_tree_builder_node_shapes", requiredPathTreeBuilderNodeShapeKeys)
assertObjectWithLists(manifest.helper_option_keys, "helper_option_keys", requiredHelperOptionKeys)
assertUniqueStringList(manifest.render_window_metadata, "render_window_metadata")
assertStringMap(manifest.toolbar_actions, "toolbar_actions")
assertObjectWithLists(manifest.toolbar_action_metadata, "toolbar_action_metadata", ["keys", "data_keys"])
assertObjectWithLists(manifest.grouped_option_keys, "grouped_option_keys", requiredGroupedOptionKeys)
assertObjectWithLists(manifest.resource_table_render_state_call, "resource_table_render_state_call", ["required_keywords", "optional_keywords"])
assertString(manifest.resource_table_render_state_call.render_options_contract, "resource_table_render_state_call.render_options_contract")
assertUniqueStringList(manifest.render_state_callback_builder_keys, "render_state_callback_builder_keys")
assertUniqueStringList(manifest.css_custom_property_tokens, "css_custom_property_tokens")

assertRequiredObjectKeys(
  manifest.localized_name_i18n_keys,
  "localized_name_i18n_keys",
  requiredLocalizedNameI18nKeyGroups
)
for (const [name, config] of Object.entries(manifest.localized_name_i18n_keys)) {
  assertObject(config, `localized_name_i18n_keys.${name}`)
  assertString(config.helper, `localized_name_i18n_keys.${name}.helper`)
  assertString(config.fallback, `localized_name_i18n_keys.${name}.fallback`)
}
assertUniqueStringList(
  manifest.localized_name_i18n_keys.model_names.delegated_lookup_prefixes,
  "localized_name_i18n_keys.model_names.delegated_lookup_prefixes"
)
assertUniqueStringList(
  manifest.localized_name_i18n_keys.attribute_names.delegated_lookup_prefixes,
  "localized_name_i18n_keys.attribute_names.delegated_lookup_prefixes"
)
assertString(
  manifest.localized_name_i18n_keys.node_type_names.lookup_prefix,
  "localized_name_i18n_keys.node_type_names.lookup_prefix"
)

assertObject(manifest.setup_generators, "setup_generators")
assertObject(manifest.setup_generators.persisted_state_install, "setup_generators.persisted_state_install")
assertString(manifest.setup_generators.persisted_state_install.name, "setup_generators.persisted_state_install.name")
assertString(manifest.setup_generators.persisted_state_install.class_name, "setup_generators.persisted_state_install.class_name")
assertEntries(
  manifest.setup_generators.persisted_state_install.optional_arguments,
  "setup_generators.persisted_state_install.optional_arguments",
  ["name", "banner"]
)
assertUniqueStringList(
  manifest.setup_generators.persisted_state_install.generated_paths,
  "setup_generators.persisted_state_install.generated_paths"
)

assertObject(manifest.diagnostics, "diagnostics")
assertUniqueStringList(manifest.diagnostics.accepted_checks, "diagnostics.accepted_checks")
assertUniqueStringList(manifest.diagnostics.run_options, "diagnostics.run_options")
assertObjectWithLists(manifest.diagnostics.result_surface, "diagnostics.result_surface", ["attributes", "methods"])

const javascriptPackageRoot = manifest.javascript_package_root
assertObject(javascriptPackageRoot, "javascript_package_root")
assertUniqueStringList(javascriptPackageRoot.named_exports, "javascript_package_root.named_exports")
assertEntries(javascriptPackageRoot.controller_registrations, "javascript_package_root.controller_registrations", ["key", "identifier", "export"])
assertStringMap(javascriptPackageRoot.transfer_drop_positions, "javascript_package_root.transfer_drop_positions")
assertRequiredKeys(javascriptPackageRoot.transfer_data_attributes, "javascript_package_root.transfer_data_attributes", ["payload", "disabled"])
assertStringMap(javascriptPackageRoot.transfer_data_attributes, "javascript_package_root.transfer_data_attributes")
assertStringMap(javascriptPackageRoot.transfer_data_mime_types, "javascript_package_root.transfer_data_mime_types")
assertStringMap(javascriptPackageRoot.remote_state_values, "javascript_package_root.remote_state_values")
assertStringMap(javascriptPackageRoot.remote_state_data_hooks, "javascript_package_root.remote_state_data_hooks")
assertStringMap(javascriptPackageRoot.toolbar_data_hooks, "javascript_package_root.toolbar_data_hooks")
assertObject(javascriptPackageRoot.integration_hooks, "javascript_package_root.integration_hooks")
requiredIntegrationHookKeys.forEach((key) => {
  assertStringMap(javascriptPackageRoot.integration_hooks[key], `javascript_package_root.integration_hooks.${key}`)
})
assertStringMap(javascriptPackageRoot.selection_data_hooks, "javascript_package_root.selection_data_hooks")
assertStringMap(javascriptPackageRoot.selection_checkbox_hooks, "javascript_package_root.selection_checkbox_hooks")
assertStringMap(javascriptPackageRoot.empty_state_hooks, "javascript_package_root.empty_state_hooks")

assertObject(javascriptPackageRoot.event_names, "javascript_package_root.event_names")
assertObject(javascriptPackageRoot.event_detail_keys, "javascript_package_root.event_detail_keys")
assertObject(javascriptPackageRoot.event_names_without_detail, "javascript_package_root.event_names_without_detail")
assertEventClassification(javascriptPackageRoot)

Object.entries(javascriptPackageRoot.event_names).forEach(([group, events]) => {
  assertStringMap(events, `javascript_package_root.event_names.${group}`)
})

Object.entries(javascriptPackageRoot.event_detail_keys).forEach(([group, events]) => {
  assertObject(events, `javascript_package_root.event_detail_keys.${group}`)
  Object.entries(events).forEach(([eventName, keys]) => {
    assertUniqueStringList(keys, `javascript_package_root.event_detail_keys.${group}.${eventName}`)
  })
})

Object.entries(javascriptPackageRoot.event_names_without_detail).forEach(([group, eventNames]) => {
  assertUniqueStringList(eventNames, `javascript_package_root.event_names_without_detail.${group}`)
})

console.log("Public API manifest structure smoke passed.")
