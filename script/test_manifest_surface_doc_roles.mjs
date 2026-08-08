import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8")
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertIncludes(source, needle, label) {
  assert(source.includes(needle), `${label}: missing ${needle}`)
}

function assertAll(source, needles, label) {
  needles.forEach((needle) => assertIncludes(source, needle, label))
}

function assertDocs(paths, needles, label) {
  paths.forEach((relativePath) => {
    assertAll(read(relativePath), needles, `${relativePath} ${label}`)
  })
}

function assertDocsMatch(paths, pattern, label) {
  paths.forEach((relativePath) => {
    assert(pattern.test(read(relativePath)), `${relativePath} ${label}`)
  })
}

const manifest = read("config/public_api_manifest.yml")
const publicApiDocPaths = ["docs/en/public-api.md", "docs/ja/public-api.md"]
const developmentDocPaths = ["docs/en/development.md", "docs/ja/development.md"]

const rubyModuleMethodManifestSignals = [
  "module_methods:",
  "- configure",
  "- configuration",
  "- reset_configuration!",
  "- parse_selection_params",
  "- node_key",
  "- model_name_for",
  "- attribute_name_for",
  "- type_name_for"
]

const rubyModuleMethodDocsSignals = [
  "TreeView.configure",
  "TreeView.configuration",
  "TreeView.reset_configuration!",
  "TreeView.parse_selection_params",
  "TreeView.node_key",
  "TreeView.model_name_for",
  "TreeView.attribute_name_for",
  "TreeView.type_name_for"
]

const publicHelperManifestSignals = [
  "helper_methods:",
  "- tree_view_rows",
  "- tree_view_window",
  "- tree_node_dom_id",
  "- tree_children_container_dom_id",
  "- tree_remote_state_placeholder_dom_id",
  "- tree_remote_state_placeholder_attributes",
  "- tree_selection_value",
  "- tree_view_breadcrumb",
  "- tree_view_toolbar",
  "- tree_view_toolbar_supported_actions",
  "- tree_view_toolbar_actions",
  "- tree_view_toolbar_action_metadata"
]

const publicHelperDocsSignals = [
  "tree_view_rows(render_state)",
  "tree_view_window(render_state, offset:, limit:)",
  "tree_node_dom_id(item_or_id, ui: @tree_ui)",
  "tree_children_container_dom_id(item, ui: @tree_ui)",
  "tree_remote_state_placeholder_dom_id(item, ui: @tree_ui)",
  "tree_remote_state_placeholder_attributes(item, state: nil, ui: @tree_ui)",
  "tree_selection_value(item, tree, builder = nil)",
  "tree_view_breadcrumb(tree, item, ...)",
  "tree_view_toolbar(render_state, ...)",
  "tree_view_toolbar_supported_actions",
  "tree_view_toolbar_actions(render_state, ...)",
  "tree_view_toolbar_action_metadata(render_state, action, ...)"
]

const specialManifestSurfaceSignals = [
  "graph_adapter_initializer:",
  "roots",
  "children_resolver",
  "node_key_resolver",
  "path_tree_builder_node_shapes:",
  "folder_node:",
  "record_node:",
  "folder_node?",
  "record_node?"
]

const developmentManifestRoleSignals = [
  "Ruby module methods",
  "GraphAdapter initializer keywords",
  "PathTreeBuilder node shapes",
  "helper names",
  "script/test_public_api_docs_signals.mjs",
  "public API docs signal smoke",
  "npm run test:public-api-manifest-structure",
  "manifest structure"
]

assertAll(manifest, rubyModuleMethodManifestSignals, "public API manifest Ruby module method surface")
assertAll(manifest, publicHelperManifestSignals, "public API manifest helper method surface")
assertAll(manifest, specialManifestSurfaceSignals, "public API manifest specialized docs surface")
assertDocs(publicApiDocPaths, rubyModuleMethodDocsSignals, "Ruby stable entrypoint docs")
assertDocs(publicApiDocPaths, publicHelperDocsSignals, "manifest-backed public helper docs")
assertDocs(publicApiDocPaths, ["TreeView::GraphAdapter", "TreeView::PathTreeBuilder"], "specialized public entrypoint docs")
assertDocs(publicApiDocPaths, ["runtime configuration API", "config/public_api_manifest.yml"], "manifest boundary docs")
assertDocsMatch(
  publicApiDocPaths,
  /packaged audit artifact and compatibility contract|audit artifact であり、互換性 contract/,
  "manifest audit artifact boundary docs"
)
assertDocsMatch(
  publicApiDocPaths,
  /machine-readable helper-method contract|machine-readable な helper-method contract/,
  "manifest-backed helper surface boundary docs"
)

assertDocs(developmentDocPaths, developmentManifestRoleSignals, "manifest and docs-signal role summary")
assertDocs(
  developmentDocPaths,
  [
    "path_tree_builder_node_shapes",
    "FolderNode",
    "RecordNode",
    "spec/public_api_path_tree_builder_contract_spec.rb",
    "script/test_public_api_docs_signals.mjs",
    "folder key generation strategy",
    "sorting algorithm",
    "file-manager behavior",
    "row action design"
  ],
  "PathTreeBuilder node-shape guard responsibility"
)
assertDocsMatch(
  developmentDocPaths,
  /field and predicate surface|field \/ predicate surface/,
  "PathTreeBuilder manifest-backed field and predicate boundary"
)
assertDocsMatch(
  developmentDocPaths,
  /does not freeze|固定しません/,
  "PathTreeBuilder behavior outside the node-shape manifest"
)
