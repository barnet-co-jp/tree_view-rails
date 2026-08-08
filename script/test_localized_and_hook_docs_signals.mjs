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

function assertMatches(source, pattern, label) {
  assert(pattern.test(source), `${label}: missing ${pattern}`)
}

const manifest = read("config/public_api_manifest.yml")
const publicApiDocs = [
  ["docs/en/public-api.md", read("docs/en/public-api.md")],
  ["docs/ja/public-api.md", read("docs/ja/public-api.md")]
]
const localizedNameDocs = [
  ["docs/en/localized-names.md", read("docs/en/localized-names.md")],
  ["docs/ja/localized-names.md", read("docs/ja/localized-names.md")]
]
const lazyLoadingDocs = [
  ["docs/en/lazy-loading.md", read("docs/en/lazy-loading.md")],
  ["docs/ja/lazy-loading.md", read("docs/ja/lazy-loading.md")]
]
const jsEventDocs = [
  ["docs/en/js-events.md", read("docs/en/js-events.md")],
  ["docs/ja/js-events.md", read("docs/ja/js-events.md")]
]
const selectionCheckboxHookDocs = [
  ["docs/en/selection-checkbox-hooks.md", read("docs/en/selection-checkbox-hooks.md")],
  ["docs/ja/selection-checkbox-hooks.md", read("docs/ja/selection-checkbox-hooks.md")]
]

const localizedNameManifestSignals = [
  "localized_name_i18n_keys:",
  "model_name_for",
  "attribute_name_for",
  "type_name_for",
  "activerecord.models",
  "activemodel.models",
  "activerecord.attributes",
  "activemodel.attributes",
  "tree_view.node_types",
  "humanized_class_name_or_default",
  "humanized_attribute_name_or_default",
  "humanized_node_type_or_default"
]

localizedNameManifestSignals.forEach((signal) => {
  assertIncludes(manifest, signal, "LocalizedNames public API manifest surface")
})

localizedNameDocs.forEach(([relativePath, document]) => {
  [
    "TreeView.model_name_for",
    "TreeView.attribute_name_for",
    "TreeView.type_name_for",
    "TreeView::LocalizedNames",
    "config/public_api_manifest.yml",
    "activerecord.models",
    "activemodel.models",
    "activerecord.attributes",
    "activemodel.attributes",
    "tree_view.node_types"
  ].forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} LocalizedNames docs`)
  })

  assertMatches(
    document,
    /fallback|humanize|humanized|fallback label|fallback copy/,
    `${relativePath}: LocalizedNames docs no longer describe fallback behavior`
  )

  assertMatches(
    document,
    /host app.*translation|host app.*locale|translation file|translation completeness|host app の translation file|host app の責務/,
    `${relativePath}: LocalizedNames docs no longer keep translation ownership with the host app`
  )

  assertMatches(
    document,
    /only resolve display names|表示名を解決するだけ/,
    `${relativePath}: LocalizedNames docs no longer separate name resolution from UI rendering`
  )
})

const publicApiHookExports = [
  {
    name: "TreeViewRemoteStateDataHooks",
    docs: ["data-tree-lazy", "data-tree-children-url", "data-tree-loaded", "data-tree-remote-state"],
    boundary: /request dispatch|response handling|retry UI|authorization-safe copy|request dispatch、response handling、retry UI、authorization-safe copy/
  },
  {
    name: "TreeViewToolbarDataHooks",
    docs: ["data-tree-view-toolbar", "data-tree-view-toolbar-action", "data-tree-view-toolbar-disabled"],
    boundary: /action policy|authorization copy|final UI|action policy、label、authorization copy、最終 UI/
  },
  {
    name: "TreeViewSelectionCheckboxHooks",
    docs: ["tree-selection-checkbox", "data-tree-selection-disabled-reason"],
    boundary: /rendered selection checkbox|selection checkbox element|描画済み selection checkbox|selection cell partial/
  }
]

publicApiHookExports.forEach(({ name }) => {
  assertIncludes(manifest, name, `public API manifest JavaScript export surface (${name})`)
})

publicApiDocs.forEach(([relativePath, document]) => {
  publicApiHookExports.forEach(({ name, docs, boundary }) => {
    assertIncludes(document, name, `${relativePath} JavaScript hook export docs`)

    docs.forEach((signal) => {
      assertIncludes(document, signal, `${relativePath} ${name} documented hook values`)
    })

    assertMatches(document, boundary, `${relativePath}: ${name} docs no longer name the host-app responsibility boundary`)
  })
})

;[
  "selection_checkbox_hooks:",
  "checkbox_class: tree-selection-checkbox",
  "disabled_reason_attribute: data-tree-selection-disabled-reason"
].forEach((signal) => {
  assertIncludes(manifest, signal, "public API manifest selection checkbox hook source")
})

selectionCheckboxHookDocs.forEach(([relativePath, document]) => {
  [
    "TreeViewSelectionCheckboxHooks",
    "checkboxClass",
    "tree-selection-checkbox",
    "disabledReasonAttribute",
    "data-tree-selection-disabled-reason",
    "TreeViewSelectionDataHooks"
  ].forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} selection checkbox hook docs`)
  })

  assertMatches(
    document,
    /generated hidden-input bookkeeping|payload semantics|host-app business actions|generated hidden-input bookkeeping attribute|payload semantics|host app の business action/,
    `${relativePath}: selection checkbox hook docs no longer separate checkbox DOM hooks from broader selection behavior`
  )
})

const remoteStateDataHookManifestSignals = [
  "remote_state_data_hooks:",
  "lazy_attribute: data-tree-lazy",
  "children_url_attribute: data-tree-children-url",
  "loaded_attribute: data-tree-loaded",
  "remote_state_attribute: data-tree-remote-state"
]

remoteStateDataHookManifestSignals.forEach((signal) => {
  assertIncludes(manifest, signal, "public API manifest remote-state DOM hook source")
})

lazyLoadingDocs.forEach(([relativePath, document]) => {
  [
    "data-tree-lazy",
    "data-tree-children-url",
    "data-tree-loaded",
    "data-tree-remote-state"
  ].forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} TreeViewRemoteStateDataHooks lazy-loading DOM hook docs`)
  })

  assertMatches(
    document,
    /TreeViewRemoteStateValues\.loading.*\.loaded.*\.error|TreeViewRemoteStateValues\.loading.*\.loaded.*\.error/s,
    `${relativePath}: Lazy Loading docs no longer name TreeViewRemoteStateValues as common state values`
  )

  assertMatches(
    document,
    /not event names|event 名ではありません/,
    `${relativePath}: Lazy Loading docs no longer separate remote-state values from event names`
  )

  assertMatches(
    document,
    /TreeViewEventNames\.hostLifecycle\.loading|TreeViewEventNames\.hostLifecycle\.loading/,
    `${relativePath}: Lazy Loading docs no longer point host apps at hostLifecycle event names`
  )
})

jsEventDocs.forEach(([relativePath, document]) => {
  assertIncludes(document, "TreeViewEventNames.hostLifecycle", `${relativePath} host lifecycle event-name docs`)
  assertIncludes(document, "TreeViewEventNames.remoteState", `${relativePath} remote-state controller event-name docs`)
  assertIncludes(document, "TreeViewRemoteStateValues", `${relativePath} remote-state value export docs`)

  assertMatches(
    document,
    /host apps dispatching lazy-loading request lifecycle events|lazy-loading request lifecycle event を host app 側で dispatch/,
    `${relativePath}: JS event docs no longer keep hostLifecycle events host-app-dispatched`
  )

  assertMatches(
    document,
    /TreeView controller-emitted remote-state events|TreeView controller 自身が emit する remote-state event/,
    `${relativePath}: JS event docs no longer separate controller-emitted remote-state events from host lifecycle events`
  )
})
