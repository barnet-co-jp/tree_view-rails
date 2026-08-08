import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8")
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertIncludes(source, needle, label) {
  assert(source.includes(needle), `${label}: missing ${needle}`)
}

const manifest = read("config/public_api_manifest.yml")
const readme = read("README.md")

const publicApiDocs = [
  ["docs/en/public-api.md", read("docs/en/public-api.md")],
  ["docs/ja/public-api.md", read("docs/ja/public-api.md")]
]

const developmentDocs = [
  ["docs/en/development.md", read("docs/en/development.md")],
  ["docs/ja/development.md", read("docs/ja/development.md")]
]

const readmePackageRootExportSignals = [
  "tree_view/index.js",
  "TreeViewEventNames",
  "TreeViewEventDetailKeys",
  "TreeViewControllerEntries",
  "TreeViewIntegrationHooks",
  "TreeViewRemoteStateDataHooks",
  "documented data hook objects",
  "docs/en/public-api.md#javascript-surface",
  "docs/ja/public-api.md#javascript-surface",
  "docs/en/js-events.md",
  "docs/ja/js-events.md"
]

readmePackageRootExportSignals.forEach((signal) => {
  assertIncludes(readme, signal, "README package-root export guidance")
})

assert(
  /raw event names, data attributes, and controller identifiers/.test(readme),
  "README package-root export guidance no longer states the raw hook-copying boundary"
)

const publicApiDeclarationBoundarySignals = [
  ["runtime entrypoint", "tree_view/index.js"],
  ["TypeScript declaration", "app/javascript/tree_view/index.d.ts"],
  ["manifest source of truth", "config/public_api_manifest.yml"],
  ["compile-time declaration role", "compile-time aid"],
  ["importmap-only host-app boundary", "importmap-only"]
]

publicApiDeclarationBoundarySignals.forEach(([label, signal]) => {
  publicApiDocs.forEach(([relativePath, document]) => {
    assertIncludes(document, signal, `${relativePath} JavaScript declaration boundary ${label}`)
  })
})

publicApiDocs.forEach(([relativePath, document]) => {
  assert(
    /entrypoint smoke checks?/.test(document),
    `${relativePath}: JavaScript declaration boundary no longer points to entrypoint smoke checks as source of truth`
  )

  assert(
    /runtime behavior.*public surface/.test(document),
    `${relativePath}: JavaScript declaration boundary no longer separates declaration files from runtime behavior and public surface`
  )
})

assertIncludes(manifest, "javascript_package_root:", "public API manifest JavaScript package-root boundary")
assertIncludes(manifest, "named_exports:", "public API manifest JavaScript package-root boundary")

const readmeManifestBackedExportSignals = [
  "TreeViewControllerEntries",
  "TreeViewIntegrationHooks",
  "TreeViewRemoteStateDataHooks"
]

readmeManifestBackedExportSignals.forEach((signal) => {
  assertIncludes(manifest, `- ${signal}`, `public API manifest README representative export (${signal})`)
  assertIncludes(readme, signal, `README manifest-backed representative export (${signal})`)
})

const resourceTableManifestSignals = [
  "resource_table_render_state_call:",
  "required_keywords:",
  "- records",
  "- context",
  "optional_keywords:",
  "- row_partial",
  "- table_key",
  "- columns",
  "- table_state",
  "- ui_config",
  "render_options_contract: render_state_pass_through"
]

resourceTableManifestSignals.forEach((signal) => {
  assertIncludes(manifest, signal, "public API manifest ResourceTableRenderState.call surface")
})

const resourceTableDocsSignals = [
  "TreeView::ResourceTableRenderState.call",
  "Resource table bridge"
]

publicApiDocs.forEach(([relativePath, document]) => {
  resourceTableDocsSignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} ResourceTableRenderState.call guidance`)
  })

  assert(
    /another table layer already owns column inference and table state|別の table layer が列推論や table state を持っていて/.test(document),
    `${relativePath}: ResourceTableRenderState.call docs no longer preserve the host-table-layer ownership boundary`
  )
})

const developmentManifestSummarySignals = [
  "config/public_api_manifest.yml",
  "toolbar data hooks",
  "toolbar action metadata",
  "GraphAdapter initializer keywords",
  "diagnostics accepted checks / run options / Result surface",
  "PathTreeBuilder node shapes",
  "ResourceTableRenderState call keywords"
]

developmentDocs.forEach(([relativePath, document]) => {
  developmentManifestSummarySignals.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} public API manifest tracking summary`)
  })
})
