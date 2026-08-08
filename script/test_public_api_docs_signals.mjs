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

const manifest = read("config/public_api_manifest.yml")
const publicApiDocs = [
  ["docs/en/public-api.md", read("docs/en/public-api.md")],
  ["docs/ja/public-api.md", read("docs/ja/public-api.md")]
]
const lazyLoadingDocs = [
  ["docs/en/lazy-loading.md", read("docs/en/lazy-loading.md")],
  ["docs/ja/lazy-loading.md", read("docs/ja/lazy-loading.md")]
]
const selectionDocs = [
  ["docs/en/selection.md", read("docs/en/selection.md")],
  ["docs/ja/selection.md", read("docs/ja/selection.md")]
]
const toolbarDocs = [
  ["docs/en/toolbar.md", read("docs/en/toolbar.md")],
  ["docs/ja/toolbar.md", read("docs/ja/toolbar.md")]
]
const toolbarBoundaryNote = read("docs/toolbar_action_html_boundary.md")
const mockupDocsReadme = read("docs/mockups/README.md")
const graphAdapterDocs = [
  ["docs/en/graph-adapter.md", read("docs/en/graph-adapter.md")],
  ["docs/ja/graph-adapter.md", read("docs/ja/graph-adapter.md")]
]
const diagnosticsDocs = [
  ["docs/en/tree-diagnostics.md", read("docs/en/tree-diagnostics.md")],
  ["docs/ja/tree-diagnostics.md", read("docs/ja/tree-diagnostics.md")]
]
const pathTreeBuilderDocs = [
  ["docs/en/path-tree-builder.md", read("docs/en/path-tree-builder.md")],
  ["docs/ja/path-tree-builder.md", read("docs/ja/path-tree-builder.md")]
]
const persistedStateDocs = [
  ["docs/en/persisted-state.md", read("docs/en/persisted-state.md")],
  ["docs/ja/persisted-state.md", read("docs/ja/persisted-state.md")]
]
const developmentDocs = [
  ["docs/en/development.md", read("docs/en/development.md")],
  ["docs/ja/development.md", read("docs/ja/development.md")]
]
const stylingStateCueDocs = [
  ["docs/en/styling-state-cues.md", read("docs/en/styling-state-cues.md")],
  ["docs/ja/styling-state-cues.md", read("docs/ja/styling-state-cues.md")]
]

const callbackBuilderSignals = [
  "render_state_callback_builder_keys",
  "row_event_payload_builder",
  "depth_label_builder",
  "toggle_icon_builder"
]

const hostLifecycleSignals = [
  "TreeViewEventNames.hostLifecycle",
  "loading",
  "loaded",
  "error",
  "retry",
  "TreeViewEventNames.remoteState",
  "TreeViewEventDetailKeys"
]

const lazyLoadingHostLifecycleSignals = [
  "TreeViewEventNames.hostLifecycle",
  "tree-view:loading",
  "tree-view:loaded",
  "tree-view:error",
  "tree-view:retry",
  "TreeViewEventNames.remoteState",
  "TreeViewRemoteStateValues"
]

const remoteStateValueSignals = [
  "TreeViewRemoteStateValues",
  "loading",
  "loaded",
  "error"
]

const remoteStateDataHookSignals = [
  "TreeViewRemoteStateDataHooks",
  "data-tree-lazy",
  "data-tree-children-url",
  "data-tree-loaded",
  "data-tree-remote-state"
]

const selectionDataHookSignals = [
  "TreeViewSelectionDataHooks",
  "TreeViewSelectionDataHooks.hiddenInputNameValue",
  "data-tree-view-selection-hidden-input-name-value"
]

const selectionHiddenInputSubmissionBoundarySignals = [
  "TreeView.parse_selection_params",
  "data-tree-view-selection-hidden-input-name-value",
  "TreeViewSelectionDataHooks.hiddenInputNameValue",
  "selection-multi-tree-form.html"
]

const selectionHiddenInputBookkeepingSignals = [
  "data-tree-view-selection-source-id",
  "data-tree-view-selection-generated-hidden-input"
]

const toolbarDataHookSignals = [
  "TreeViewToolbarDataHooks",
  "data-tree-view-toolbar",
  "data-tree-view-toolbar-action",
  "data-tree-view-toolbar-disabled"
]

const toolbarActionMetadataSignals = [
  "toolbar_actions",
  "toolbar_action_metadata",
  "tree_view_toolbar_action_metadata",
  "action",
  "state",
  "label",
  "path",
  "disabled",
  "data",
  "tree_view_toolbar_action",
  "tree_view_toolbar_disabled",
  "path: nil",
  "disabled: true"
]

const toolbarHelperOptionKeySignals = [
  "helper_option_keys:",
  "tree_view_toolbar:",
  "- actions",
  "- labels",
  "- class_name",
  "- button_class_name",
  "- html",
  "- action_html"
]

const toolbarContractSourceSignals = [
  ["visual companion link", "../mockups/toolbar-actions.html"],
  ["HTML boundary note link", "../toolbar_action_html_boundary.md"],
  ["action-state manifest key", "toolbar_actions"],
  ["action metadata manifest key", "toolbar_action_metadata"],
  ["helper option-key contract", "tree_view_toolbar"]
]

const emptyStateHookSignals = [
  "TreeViewEmptyStateHooks",
  "wrapperAttribute",
  "contentClass",
  "messageClass",
  "data-tree-view-empty-state"
]

const graphAdapterInitializerSignals = [
  "graph_adapter_initializer",
  "roots",
  "children_resolver",
  "node_key_resolver"
]

const graphAdapterBoundarySignals = [
  "authorization",
  "query planning",
  "host-app responsibility"
]

const diagnosticsAcceptedCheckSignals = [
  "node_keys",
  "dom_ids",
  "orphans",
  "cycles"
]

const diagnosticsRunOptionSignals = [
  "run_options",
  "checks",
  "raise_errors"
]

const diagnosticsResultSurfaceSignals = [
  "checks",
  "errors",
  "warnings",
  "success?"
]

const pathTreeBuilderNodeShapeSignals = [
  "FolderNode",
  "RecordNode",
  "key",
  "parent_key",
  "label",
  "path",
  "node_type",
  "record",
  "folder_node?",
  "record_node?"
]

const persistedStateInstallGeneratorSignals = [
  "setup_generators:",
  "persisted_state_install:",
  "tree_view:state:install",
  "OWNER_MODEL",
  "db/migrate/*_create_tree_view_states.rb",
  "app/models/tree_view_state.rb",
  "app/models/concerns/tree_view_state_owner.rb"
]

const persistedStateInstallDocsSignals = [
  "tree_view:state:install",
  "public-setup-surface.md",
  "bin/rails generate tree_view:state:install User",
  "db/migrate/*_create_tree_view_states.rb",
  "app/models/tree_view_state.rb",
  "app/models/concerns/tree_view_state_owner.rb"
]

const initialExpansionGroupedOptionSignals = [
  "grouped_option_keys:",
  "initial_expansion:",
  "- default",
  "- max_depth",
  "- expanded_keys",
  "- collapsed_keys",
  "- current_item",
  "- current_key",
  "- auto_expand_ancestors"
]

const initialExpansionDocsSignals = [
  "`initial_expansion`",
  "`default`",
  "`max_depth`",
  "`expanded_keys`",
  "`collapsed_keys`",
  "`current_item`",
  "`current_key`",
  "`auto_expand_ancestors`"
]

const persistedStateLifecycleSignals = [
  "TreeView::PersistedState.from",
  "TreeView::StateStore",
  "persisted_state = store.find(",
  "persisted_state = store.save!(",
  "persisted_state = store.clear!(",
  "matching_count = store.prune_count(",
  "deleted_count = store.prune!("
]

const publicConstantSignals = [
  "TreeView::Error",
  "TreeView::ConfigurationError",
  "TreeView::InvalidTreeError",
  "TreeView::DuplicateNodeKeyError",
  "TreeView::CycleDetectedError",
  "TreeView::InvalidRenderWindowError",
  "TreeView::RenderState",
  "TreeView::ResourceTableRenderState",
  "TreeView::VisibleRows",
  "TreeView::RenderWindow",
  "TreeView::PersistedState",
  "TreeView::StateStore",
  "TreeView::Diagnostics"
]

const cssCustomPropertyTokenSignals = [
  "--tree-view-selected-row-background",
  "--tree-view-current-row-accent-color",
  "--tree-view-drop-target-row-background",
  "--tree-view-focus-outline-color",
  "--tree-view-focus-background",
  "--tree-view-branch-line-color",
  "--tree-view-current-branch-line-color",
  "--tree-view-hidden-count-background",
  "--tree-view-hidden-count-color"
]

const cssCustomPropertyBoundarySignals = [
  "css_custom_property_tokens",
  "packaged stylesheet",
  "token names",
  "fallback values",
  "theme API"
]

const developmentManifestTrackingSignals = [
  "config/public_api_manifest.yml",
  "RenderState callback builder keys",
  "event_names_without_detail",
  "remote-state values",
  "selection data hooks",
  "empty-state hooks"
]

const developmentEntrypointGuardSignals = [
  "script/test_public_api_docs_signals.mjs",
  "script/test_entrypoints.mjs",
  "script/test_declaration_literal_shapes.mjs",
  "payload shape",
  "transfer values"
]

const manifestBackedDocsSignalSurfaces = [
  ["RenderState callback builder keys", "render_state_callback_builder_keys:"],
  ["public constants", "public_constants:"],
  ["host lifecycle no-detail events", "event_names_without_detail:"],
  ["host lifecycle event names", "host_lifecycle:"],
  ["remote-state values", "remote_state_values:"],
  ["remote-state data hooks", "remote_state_data_hooks:"],
  ["selection data hooks", "selection_data_hooks:"],
  ["empty-state hooks", "empty_state_hooks:"],
  ["toolbar data hooks", "toolbar_data_hooks:"],
  ["toolbar actions", "toolbar_actions:"],
  ["toolbar action metadata", "toolbar_action_metadata:"],
  ["GraphAdapter initializer", "graph_adapter_initializer:"],
  ["diagnostics accepted checks", "diagnostics:"],
  ["diagnostics accepted checks", "accepted_checks:"],
  ["diagnostics run options", "run_options:"],
  ["diagnostics Result surface", "result_surface:"],
  ["PathTreeBuilder node shapes", "path_tree_builder_node_shapes:"],
  ["persisted-state install generator", "setup_generators:"],
  ["persisted-state install generator", "persisted_state_install:"],
  ["initial_expansion grouped option keys", "grouped_option_keys:"],
  ["initial_expansion grouped option keys", "initial_expansion:"],
  ["CSS custom property tokens", "css_custom_property_tokens:"]
]

manifestBackedDocsSignalSurfaces.forEach(([label, manifestNeedle]) => {
  assertIncludes(manifest, manifestNeedle, `public API docs signal manifest surface (${label})`)
})

callbackBuilderSignals.forEach((signal) => {
  assertIncludes(manifest, signal, "public API manifest callback builder key surface")
})

graphAdapterInitializerSignals.forEach((signal) => {
  assertIncludes(manifest, signal, "public API manifest GraphAdapter initializer surface")
})

remoteStateDataHookSignals.forEach((signal) => {
  assertIncludes(manifest, signal, "public API manifest remote-state data hook surface")
})

toolbarDataHookSignals.forEach((signal) => {
  assertIncludes(manifest, signal, "public API manifest toolbar data hook surface")
})

toolbarActionMetadataSignals.slice(0, 10).forEach((signal) => {
  assertIncludes(manifest, signal, "public API manifest toolbar action metadata surface")
})

toolbarHelperOptionKeySignals.forEach((signal) => {
  assertIncludes(manifest, signal, "public API manifest tree_view_toolbar helper option-key surface")
})

diagnosticsAcceptedCheckSignals.forEach((signal) => {
  assertIncludes(manifest, signal, "public API manifest diagnostics accepted checks")
})

diagnosticsRunOptionSignals.forEach((signal) => {
  assertIncludes(manifest, signal, "public API manifest diagnostics run options")
})

diagnosticsResultSurfaceSignals.forEach((signal) => {
  assertIncludes(manifest, signal, "public API manifest diagnostics Result surface")
})

pathTreeBuilderNodeShapeSignals.forEach((signal) => {
  assertIncludes(manifest, signal, "public API manifest PathTreeBuilder node shape surface")
})

persistedStateInstallGeneratorSignals.forEach((signal) => {
  assertIncludes(manifest, signal, "public API manifest persisted-state install generator setup surface")
})

initialExpansionGroupedOptionSignals.forEach((signal) => {
  assertIncludes(manifest, signal, "public API manifest initial_expansion grouped option key surface")
})

publicConstantSignals.forEach((signal) => {
  assertIncludes(manifest, signal.replace("TreeView::", "- "), "public API manifest public constants surface")
})

cssCustomPropertyTokenSignals.forEach((signal) => {
  assertIncludes(manifest, signal, "public API manifest CSS custom property token surface")
})

assertIncludes(manifest, "event_names_without_detail", "public API manifest no-detail event surface")
assertIncludes(manifest, "host_lifecycle", "public API manifest no-detail event surface")
hostLifecycleSignals.slice(1, 5).forEach((signal) => {
  assertIncludes(manifest, signal, "public API manifest host lifecycle no-detail event names")
})

publicApiDocs.forEach(([relativePath, document]) => {
  publicConstantSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} public constant docs from config/public_api_manifest.yml public_constants`)
  })

  callbackBuilderSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} RenderState callback builder docs`)
  })

  assert(
    /callback arity|return[- ]value|return value|callback arity|戻り値/.test(document),
    `${relativePath}: RenderState callback builder docs no longer mention callback arity or return-value boundary`
  )

  initialExpansionDocsSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} RenderState initial_expansion grouped option docs`)
  })

  assert(
    /flat keyword options.*`initial_expansion:`.*flat keyword options still win|個別 keyword option.*`initial_expansion:`.*優先されるのは個別 keyword option/.test(document),
    `${relativePath}: initial_expansion docs no longer preserve flat keyword option priority over grouped options`
  )

  hostLifecycleSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} host lifecycle event docs`)
  })

  assert(
    /host app|host-app|host app 側|host-app 側/.test(document),
    `${relativePath}: host lifecycle event docs no longer name the host-app ownership boundary`
  )

  assertIncludes(document, "TreeViewRemoteStateDataHooks", `${relativePath} remote-state data hook docs`)
  assertIncludes(document, "TreeViewToolbarDataHooks", `${relativePath} toolbar data hook docs`)

  selectionDataHookSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} selection data hook docs`)
  })

  emptyStateHookSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} empty-state hook docs`)
  })

  assert(
    /final empty-state copy|permission message|filter-reset behavior|最終的な empty-state copy|permission message/.test(document),
    `${relativePath}: empty-state hook docs no longer preserve the host-app-owned final-copy boundary`
  )
})

lazyLoadingDocs.forEach(([relativePath, document]) => {
  remoteStateValueSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} remote-state value docs`)
  })

  remoteStateDataHookSignals.slice(1).forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} remote-state data hook docs`)
  })

  assert(
    /not event names|event 名ではありません/.test(document),
    `${relativePath}: remote-state value docs no longer separate state values from event names`
  )

  lazyLoadingHostLifecycleSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} host lifecycle event reader-journey docs`)
  })

  assert(
    /The host app can dispatch these events|host app側は、fetchやTurbo requestの状態に応じてこれらのeventをdispatchできます/.test(document),
    `${relativePath}: Lazy Loading docs no longer say host apps dispatch the lifecycle events`
  )

  assert(
    /host app remains responsible for fetch behavior|実際のfetch、Turbo request、controller action、認可、query、retry UI、children pagination/.test(document),
    `${relativePath}: Lazy Loading docs no longer preserve the host-app-owned remote loading boundary`
  )

  assertIncludes(document, "authorize!", `${relativePath} lazy-loading authorization guard docs`)
  assertIncludes(document, "visible_to(current_user)", `${relativePath} lazy-loading authorization query docs`)
  assert(
    /Do not treat lazy loading as authorization|lazy loadingをauthorizationの代わりに使わないでください/.test(document),
    `${relativePath}: Lazy Loading docs no longer preserve the server-side authorization warning`
  )

  assert(
    /separate surface|別 surface/.test(document),
    `${relativePath}: Lazy Loading docs no longer separate host lifecycle events from remote-state controller events`
  )
})

selectionDocs.forEach(([relativePath, document]) => {
  selectionDataHookSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} selection data hook docs`)
  })

  selectionHiddenInputSubmissionBoundarySignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} selection hidden input submission docs`)
  })

  selectionHiddenInputBookkeepingSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} selection hidden input bookkeeping boundary docs`)
  })

  assert(
    /hidden input `name` stays host-app controlled|hidden input の `name` は host app 側で決められます/.test(document),
    `${relativePath}: selection hidden input docs no longer state that submitted param names are host-app controlled`
  )

  assert(
    /Values are written as JSON strings|value は JSON 文字列で書き込まれる/.test(document),
    `${relativePath}: selection hidden input docs no longer preserve the JSON submitted-value contract`
  )

  assert(
    /Disabled checkboxes and invalid JSON payloads are skipped|disabled checkbox と不正な JSON payload は.*skip/.test(document),
    `${relativePath}: selection hidden input docs no longer match the disabled and invalid-payload skip boundary`
  )

  assert(
    /TreeView-owned bookkeeping|TreeView 側の bookkeeping/.test(document),
    `${relativePath}: selection hidden input docs no longer keep generated marker and source-id attributes as TreeView-owned bookkeeping`
  )
})

toolbarDocs.forEach(([relativePath, document]) => {
  toolbarDataHookSignals.slice(1).forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} toolbar data hook docs`)
  })

  toolbarActionMetadataSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} toolbar action metadata docs`)
  })

  toolbarContractSourceSignals.forEach(([label, signal]) => {
    assertIncludes(document, signal, `${relativePath} toolbar contract source ${label}`)
  })

  assert(
    /Authorization, route availability, and final fallback copy still belong to the host app|authorization、route availability、fallback copy の最終判断は引き続き host app 側の責務/.test(document),
    `${relativePath}: toolbar action metadata docs no longer preserve the host-app-owned fallback boundary`
  )

  assert(
    /final labels, locale files|final label、locale file|最終文言、locale file policy/.test(document),
    `${relativePath}: toolbar data hook docs no longer preserve the host-app-owned label and locale boundary`
  )

  assert(
    /compatibility checks and integration audits|compatibility check と integration audit/.test(document),
    `${relativePath}: toolbar action metadata docs no longer point readers at the manifest-backed integration contract`
  )
})

toolbarDataHookSignals.slice(1).forEach((signal) => {
  assertIncludes(toolbarBoundaryNote, signal, "docs/toolbar_action_html_boundary.md toolbar owned hook boundary")
})

assert(
  /Host-app attributes may be added|host app 側/.test(toolbarBoundaryNote),
  "docs/toolbar_action_html_boundary.md: toolbar boundary note no longer separates host-app-owned attributes from TreeView-owned hooks"
)

assertIncludes(mockupDocsReadme, "toolbar-actions.html", "docs/mockups/README.md toolbar visual companion inventory")
assertIncludes(mockupDocsReadme, "docs/en/toolbar.md", "docs/mockups/README.md toolbar helper contract source guidance")
assertIncludes(mockupDocsReadme, "docs/ja/toolbar.md", "docs/mockups/README.md toolbar helper contract source guidance")
assertIncludes(mockupDocsReadme, "config/public_api_manifest.yml", "docs/mockups/README.md toolbar manifest source guidance")
assert(
  /helper metadata contract sources|helper metadata contract sources/.test(mockupDocsReadme),
  "docs/mockups/README.md: toolbar guidance no longer separates manifest/docs contract sources from the visual mockup responsibility boundary"
)

stylingStateCueDocs.forEach(([relativePath, document]) => {
  cssCustomPropertyTokenSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} CSS custom property token docs`)
  })

  cssCustomPropertyBoundarySignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} CSS custom property manifest-backed boundary docs`)
  })

  assert(
    /fallback values.*host-app configuration or a theme API|fallback 値を host app 向け configuration や theme API にするものではありません/.test(document),
    `${relativePath}: CSS custom property docs no longer separate token names from fallback values and theme API policy`
  )

  assert(
    /complete theme system|dark-mode policy|density scale|complete theme system、dark-mode policy、density scale/.test(document),
    `${relativePath}: CSS custom property docs no longer keep full theme system policy outside TreeView's state-cue surface`
  )
})

graphAdapterDocs.forEach(([relativePath, document]) => {
  assertIncludes(document, "TreeView::GraphAdapter", `${relativePath} GraphAdapter guide entrypoint docs`)

  graphAdapterInitializerSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} GraphAdapter initializer manifest boundary docs`)
  })

  graphAdapterBoundarySignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} GraphAdapter host-app responsibility boundary docs`)
  })

  assert(
    /constructor surface|constructor surface|constructor surface/.test(document),
    `${relativePath}: GraphAdapter docs no longer identify the initializer constructor surface boundary`
  )

  assert(
    /traversal semantics|traversal semantics|traversal semantics/.test(document),
    `${relativePath}: GraphAdapter docs no longer separate traversal semantics from the manifest schema`
  )
})

diagnosticsDocs.forEach(([relativePath, document]) => {
  assertIncludes(document, "TreeView::Diagnostics.run", `${relativePath} diagnostics aggregate entrypoint docs`)
  assertIncludes(document, "checks:", `${relativePath} diagnostics accepted checks docs`)
  assertIncludes(document, "raise_errors:", `${relativePath} diagnostics run option docs`)
  assertIncludes(document, "Result", `${relativePath} diagnostics Result surface docs`)

  diagnosticsAcceptedCheckSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} diagnostics accepted check docs`)
  })

  diagnosticsRunOptionSignals.slice(1).forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} diagnostics run option docs`)
  })

  diagnosticsResultSurfaceSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} diagnostics Result reader docs`)
  })

  assert(
    /manifest-backed.*diagnostics contract|manifest-backed な diagnostics contract/.test(document),
    `${relativePath}: diagnostics docs no longer identify the manifest-backed contract boundary`
  )

  assert(
    /run option key surface|option key surface/.test(document),
    `${relativePath}: diagnostics docs no longer identify the run option key surface boundary`
  )

  assert(
    /individual error entry internals|warning detail shape|orphan warning semantics|cycle validation policy|個々の error entry 内部|warning detail shape|orphan warning semantics|cycle validation policy/.test(document),
    `${relativePath}: diagnostics docs no longer keep detailed error and warning shapes outside the manifest schema`
  )
})

pathTreeBuilderDocs.forEach(([relativePath, document]) => {
  assertIncludes(document, "TreeView::PathTreeBuilder", `${relativePath} PathTreeBuilder docs`)

  pathTreeBuilderNodeShapeSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} PathTreeBuilder node shape docs`)
  })

  assert(
    /public API manifest|public API manifest/.test(document),
    `${relativePath}: PathTreeBuilder docs no longer identify the manifest-backed node shape contract`
  )

  assert(
    /folder key generation strategy|sort algorithm|file-manager behavior|row action design|folder key generation strategy|sort algorithm|file-manager behavior|row action design/.test(document),
    `${relativePath}: PathTreeBuilder docs no longer keep generated-key, sorting, file-manager, and row-action behavior outside the node shape contract`
  )
})

persistedStateDocs.forEach(([relativePath, document]) => {
  persistedStateInstallDocsSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} persisted-state install generator setup surface docs`)
  })

  assert(
    /generator name, optional owner argument, and generated destination paths|generator 名、任意の owner 引数、生成先 path/.test(document),
    `${relativePath}: persisted-state docs no longer connect generator docs to the public setup surface contract`
  )

  assert(
    /migration schema or generated template contents|migration schema や生成 template 内容/.test(document),
    `${relativePath}: persisted-state docs no longer keep generated schema and templates outside the path-level setup contract`
  )

  persistedStateLifecycleSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} PersistedState / StateStore lifecycle docs`)
  })

  assert(
    /storage ownership, authorization, save timing, cleanup policy|実際の保存先、owner model、認可、保存タイミング、cleanup policy/.test(document),
    `${relativePath}: persisted-state docs no longer keep storage ownership, authorization, and save timing with the host app`
  )

  assert(
    /cleanup scheduling, retention selection, authorization, or audit policy|cleanup schedule、retention の選択、authorization、audit policy/.test(document),
    `${relativePath}: persisted-state docs no longer keep cleanup, retention, authorization, and audit policy with the host app`
  )

  assert(
    /does not provide a cleanup rake task or default TTL|cleanup rake task や default TTL を提供しません/.test(document),
    `${relativePath}: persisted-state docs no longer say TreeView does not own cleanup tasks or default TTL`
  )
})

developmentDocs.forEach(([relativePath, document]) => {
  developmentManifestTrackingSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} public API manifest tracking summary`)
  })

  developmentEntrypointGuardSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} public API smoke guard summary`)
  })
})

const errorHierarchyDocs = [
  ["docs/en/errors.md", read("docs/en/errors.md")],
  ["docs/ja/errors.md", read("docs/ja/errors.md")]
]
const javascriptEventDocs = [
  ["docs/en/js-events.md", read("docs/en/js-events.md")],
  ["docs/ja/js-events.md", read("docs/ja/js-events.md")]
]
const dragAndDropContractDocs = [
  ["docs/en/drag-and-drop.md", read("docs/en/drag-and-drop.md")],
  ["docs/ja/drag-and-drop.md", read("docs/ja/drag-and-drop.md")]
]

const selectionEventDetailSignals = [
  "selectedCount",
  "selectedValues",
  "selectedPayloads",
  "sourceCheckbox",
  "attemptedChecked",
  "payloads",
  "maxCount",
  "attemptedCount",
  "checkbox",
  "value"
]

const transferEventDetailSignals = [
  "sourcePayload",
  "sourceRow",
  "targetPayload",
  "targetRow",
  "position",
  "value",
  "row"
]

const publicErrorHierarchySignals = [
  "TreeView::Error",
  "TreeView::ConfigurationError",
  "TreeView::InvalidTreeError",
  "TreeView::DuplicateNodeKeyError",
  "TreeView::CycleDetectedError",
  "TreeView::InvalidRenderWindowError"
]

publicErrorHierarchySignals.forEach((signal) => {
  assertIncludes(manifest, signal.replace("TreeView::", "- "), "public API manifest error hierarchy source")
})

errorHierarchyDocs.forEach(([relativePath, document]) => {
  publicErrorHierarchySignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} public error hierarchy docs`)
  })

  assert(
    /`TreeView::Error`.*`ArgumentError`|`ArgumentError`.*`TreeView::Error`/s.test(document),
    `${relativePath}: public error docs no longer preserve the ArgumentError compatibility boundary`
  )
  assert(
    /New code should prefer `TreeView::Error`|新しい code では.*`TreeView::Error`/s.test(document),
    `${relativePath}: public error docs no longer recommend TreeView::Error or a documented subclass for new integrations`
  )
  assert(
    /what failed.*which value or key.*what direction usually fixes it|何が失敗したか.*どの値や key.*どう直す方向か/s.test(document),
    `${relativePath}: public error docs no longer preserve the representative message-detail policy`
  )
})

const eventContractManifestSignals = [
  "state_change_reasons:",
  "connect: connect",
  "refresh: refresh",
  "expanded: expanded",
  "collapsed: collapsed",
  "event_detail_keys:",
  "event_names_without_detail:"
]

eventContractManifestSignals.forEach((signal) => {
  assertIncludes(manifest, signal, "public API manifest state reason and event detail source")
})

assertIncludes(manifest, "selection:", "public API manifest selection event detail group")
selectionEventDetailSignals.forEach((signal) => {
  assertIncludes(manifest, `- ${signal}`, "public API manifest selection event detail keys")
})
assertIncludes(manifest, "transfer:", "public API manifest transfer event detail group")
transferEventDetailSignals.forEach((signal) => {
  assertIncludes(manifest, `- ${signal}`, "public API manifest transfer event detail keys")
})

javascriptEventDocs.forEach(([relativePath, document]) => {
  [
    "TreeViewStateChangeReasons",
    "connect",
    "refresh",
    "expanded",
    "collapsed",
    "TreeViewEventDetailKeys",
    "viewKey",
    "childrenUrl",
    "event_names_without_detail",
    "event_detail_keys",
    ...selectionEventDetailSignals,
    ...transferEventDetailSignals
  ].forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} state reason and representative event detail docs`)
  })

  assert(
    /intentionally do not define public `event\.detail` fields|意図的に公開 `event\.detail` field を定義していません/.test(document),
    `${relativePath}: JavaScript event docs no longer preserve the host lifecycle no-detail boundary`
  )
  assert(
    /controller-emitted|controller 自身が emit|controller-emitted events|TreeView controller 自身/.test(document),
    `${relativePath}: JavaScript event docs no longer distinguish controller-emitted detail events from host lifecycle events`
  )
})

selectionDocs.forEach(([relativePath, document]) => {
  ["selectedCount", "selectedPayloads", "maxCount", "checkbox", "value"].forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} selection event detail reader docs`)
  })
  assert(
    /host app.*responsib|host app 側.*責務|host app側で実装/.test(document),
    `${relativePath}: selection docs no longer preserve host-app-owned business actions and authorization`
  )
})

dragAndDropContractDocs.forEach(([relativePath, document]) => {
  transferEventDetailSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} transfer event detail reader docs`)
  })
  assert(
    /authorization.*persistence|認可.*保存|host app.*responsib|host app側の責務/.test(document),
    `${relativePath}: transfer docs no longer preserve host-app-owned authorization and persistence`
  )
})

const transferContractManifestSignals = [
  "transfer_drop_positions:",
  "before: before",
  "inside: inside",
  "after: after",
  "transfer_data_attributes:",
  "payload: data-tree-transfer-payload",
  "disabled: data-tree-transfer-disabled",
  "transfer_data_mime_types:",
  "application_json: application/json",
  "text_plain: text/plain"
]

transferContractManifestSignals.forEach((signal) => {
  assertIncludes(manifest, signal, "public API manifest transfer value and data-attribute source")
})

const transferReaderSignals = [
  "TreeViewTransferDropPositions",
  "before",
  "inside",
  "after",
  "TreeViewTransferDataAttributes.payload",
  "TreeViewTransferDataAttributes.disabled",
  "data-tree-transfer-payload",
  "data-tree-transfer-disabled",
  "TreeViewTransferDataMimeTypes.applicationJson",
  "TreeViewTransferDataMimeTypes.textPlain",
  "application/json",
  "text/plain"
]

const transferPublicApiSignals = [
  "TreeViewTransferDropPositions",
  "TreeViewTransferDataAttributes",
  "data-tree-transfer-payload",
  "data-tree-transfer-disabled",
  "TreeViewTransferDataMimeTypes",
  "application/json",
  "text/plain"
]

publicApiDocs.forEach(([relativePath, document]) => {
  transferPublicApiSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} transfer package-root public surface docs`)
  })
})

dragAndDropContractDocs.forEach(([relativePath, document]) => {
  transferReaderSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} transfer value and data-attribute docs`)
  })

  assert(
    /DOM wiring attributes? only|DOM wiring attribute 名だけ/.test(document),
    `${relativePath}: transfer data-attribute docs no longer limit the export to DOM wiring names`
  )
  assert(
    /payload shape, authorization, persistence, and final drop behavior remain host-app responsibilities|payload shape、authorization、保存、最終的な drop behavior は引き続き host app 側の責務/.test(document),
    `${relativePath}: transfer docs no longer preserve the host-app-owned payload, authorization, persistence, and operation boundary`
  )
})
