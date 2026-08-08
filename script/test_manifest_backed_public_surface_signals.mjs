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

const manifest = read("config/public_api_manifest.yml")

const publicConstantSignals = [
  "public_constants:",
  "- Error",
  "- ConfigurationError",
  "- InvalidTreeError",
  "- DuplicateNodeKeyError",
  "- CycleDetectedError",
  "- InvalidRenderWindowError"
]

const publicConstantDocsSignals = [
  "TreeView::Error",
  "TreeView::ConfigurationError",
  "TreeView::InvalidTreeError",
  "TreeView::DuplicateNodeKeyError",
  "TreeView::CycleDetectedError",
  "TreeView::InvalidRenderWindowError"
]

const localizedNameManifestSignals = [
  "localized_name_i18n_keys:",
  "helper: model_name_for",
  "activerecord.models",
  "activemodel.models",
  "helper: attribute_name_for",
  "activerecord.attributes",
  "activemodel.attributes",
  "helper: type_name_for",
  "tree_view.node_types",
  "fallback: humanized_node_type_or_default"
]

const localizedNameDocsSignals = [
  "TreeView.model_name_for",
  "TreeView.attribute_name_for",
  "TreeView.type_name_for",
  "activerecord.models",
  "activemodel.models",
  "activerecord.attributes",
  "activemodel.attributes",
  "tree_view.node_types",
  "fallback"
]

const setupGeneratorManifestSignals = [
  "setup_generators:",
  "persisted_state_install:",
  "name: tree_view:state:install",
  "class_name: TreeView::Generators::State::InstallGenerator",
  "banner: OWNER_MODEL",
  "db/migrate/*_create_tree_view_states.rb",
  "app/models/tree_view_state.rb",
  "app/models/concerns/tree_view_state_owner.rb"
]

const setupGeneratorDocsSignals = [
  "tree_view:state:install",
  "bin/rails generate tree_view:state:install User",
  "config/public_api_manifest.yml",
  "db/migrate/*_create_tree_view_states.rb",
  "app/models/tree_view_state.rb",
  "app/models/concerns/tree_view_state_owner.rb",
  "host app"
]

const stateEventDetailManifestSignals = [
  "event_detail_keys:",
  "state_changed:",
  "- viewKey",
  "- expandedKeys",
  "- reason",
  "remote_state:",
  "change:",
  "retry:",
  "- row",
  "- state",
  "- childrenUrl",
  "- nodeKey"
]

const stateEventDocsSignals = [
  "tree-view-state:state-changed",
  "viewKey",
  "expandedKeys",
  "reason",
  "tree-view-remote-state:change",
  "tree-view-remote-state:retry",
  "childrenUrl",
  "nodeKey",
  "TreeViewEventDetailKeys"
]

const lazyLoadingRemoteStateSignals = [
  "data-tree-children-url",
  "TreeViewEventNames.remoteState.*",
  "TreeViewEventNames.hostLifecycle",
  "TreeViewRemoteStateValues",
  "host app"
]

const helperMethodManifestSignals = [
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

const helperMethodDocsSignals = [
  "tree_view_rows(render_state)",
  "tree_view_rows(render_state, window: { offset:, limit: })",
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

const javascriptEntrypointDocsSignals = [
  "tree_view/index.js",
  "registerTreeViewControllers(application)",
  "config/public_api_manifest.yml"
]

const visibleRowsManifestSignals = [
  "visible_rows_row_metadata:",
  "fields:",
  "- item",
  "- depth",
  "- node_key",
  "- parent_key",
  "- has_children",
  "- expanded",
  "predicates:",
  "- has_children?",
  "- expanded?"
]

const visibleRowsDocsSignals = [
  "TreeView::VisibleRows",
  "`item`",
  "`depth`",
  "`node_key`",
  "`parent_key`",
  "`has_children?`",
  "`expanded?`"
]

const nodePresenterManifestSignals = [
  "node_presenter_builder_names:",
  "- key",
  "- label",
  "- href",
  "- tooltip",
  "- row_class",
  "- row_data",
  "- icon",
  "- badge",
  "- actions"
]

const nodePresenterDocsSignals = [
  "TreeView::NodePresenter",
  "node_presenter_builder_names",
  "key",
  "label",
  "href",
  "tooltip",
  "row_class",
  "row_data",
  "icon",
  "badge",
  "actions",
  "host app"
]

assertAll(manifest, publicConstantSignals, "public API manifest public constants surface")
assertAll(manifest, localizedNameManifestSignals, "public API manifest localized-name surface")
assertAll(manifest, setupGeneratorManifestSignals, "public API manifest setup-generator surface")
assertAll(manifest, stateEventDetailManifestSignals, "public API manifest state and remote-state event detail surface")
assertAll(manifest, helperMethodManifestSignals, "public API manifest helper method surface")
assertAll(manifest, visibleRowsManifestSignals, "public API manifest VisibleRows row metadata surface")
assertAll(manifest, nodePresenterManifestSignals, "public API manifest NodePresenter builder-name surface")

assertDocs(
  ["docs/en/errors.md", "docs/ja/errors.md"],
  publicConstantDocsSignals,
  "public error hierarchy docs"
)

assertDocs(
  ["docs/en/public-api.md", "docs/ja/public-api.md"],
  [...publicConstantDocsSignals, "TreeView.model_name_for", "TreeView.attribute_name_for", "TreeView.type_name_for"],
  "public API manifest-backed public surface docs"
)

assertDocs(
  ["docs/en/public-api.md", "docs/ja/public-api.md"],
  helperMethodDocsSignals,
  "manifest-backed public helper method docs"
)

assertDocs(
  ["docs/en/public-api.md", "docs/ja/public-api.md"],
  javascriptEntrypointDocsSignals,
  "package-root JavaScript entrypoint docs"
)

assertDocs(
  ["docs/en/api.md", "docs/ja/api.md"],
  visibleRowsDocsSignals,
  "VisibleRows row metadata docs"
)

assertDocs(
  ["docs/en/node-presenter-row-partials.md", "docs/ja/node-presenter-row-partials.md"],
  nodePresenterDocsSignals,
  "NodePresenter builder-name and host-app boundary docs"
)

assertDocs(
  ["docs/en/localized-names.md", "docs/ja/localized-names.md"],
  localizedNameDocsSignals,
  "localized-name lookup and fallback docs"
)

assertDocs(
  ["docs/en/public-setup-surface.md", "docs/ja/public-setup-surface.md"],
  setupGeneratorDocsSignals,
  "setup generator public surface docs"
)

assertDocs(
  ["docs/en/js-events.md", "docs/ja/js-events.md"],
  stateEventDocsSignals,
  "state and remote-state event detail docs"
)

assertDocs(
  ["docs/en/lazy-loading.md", "docs/ja/lazy-loading.md"],
  lazyLoadingRemoteStateSignals,
  "lazy-loading remote-state boundary docs"
)
