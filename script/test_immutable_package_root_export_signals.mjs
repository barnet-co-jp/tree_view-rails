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

const docs = [
  ["docs/en/public-api-immutable-exports.md", read("docs/en/public-api-immutable-exports.md")],
  ["docs/ja/public-api-immutable-exports.md", read("docs/ja/public-api-immutable-exports.md")]
]

const publicApiDocs = [
  ["docs/en/public-api.md", read("docs/en/public-api.md")],
  ["docs/ja/public-api.md", read("docs/ja/public-api.md")]
]

const readme = read("README.md")

const representativeExports = [
  "TreeViewEventNames",
  "TreeViewEventDetailKeys",
  "TreeViewRemoteStateValues",
  "TreeViewStateChangeReasons",
  "TreeViewTransferDropPositions"
]

const representativeHookObjects = [
  "TreeViewRemoteStateDataHooks",
  "TreeViewToolbarDataHooks",
  "TreeViewSelectionDataHooks",
  "TreeViewSelectionCheckboxHooks",
  "TreeViewEmptyStateHooks"
]

const readmeRepresentativeExports = [
  "TreeViewEventNames",
  "TreeViewControllerEntries",
  "TreeViewTransferDataAttributes",
  "TreeViewSelectionCheckboxHooks"
]

const readmeRepresentativeHookObjects = [
  "TreeViewIntegrationHooks",
  "TreeViewRemoteStateDataHooks",
  "TreeViewToolbarDataHooks",
  "TreeViewEmptyStateHooks"
]

docs.forEach(([relativePath, document]) => {
  assertIncludes(document, "immutable reference constants", `${relativePath} immutable export contract`)
  assertIncludes(document, "Object.isFrozen", `${relativePath} runtime frozen guard route`)
  assertIncludes(document, "script/test_entrypoints.mjs", `${relativePath} runtime guard script route`)
  assertIncludes(document, "script/test_declaration_literal_shapes.mjs", `${relativePath} declaration-shape guard route`)
  assertIncludes(document, "Public API", `${relativePath} public API route`)

  representativeExports.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} representative immutable export docs`)
  })

  representativeHookObjects.forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} representative data hook object docs`)
  })

  assert(
    /Do not mutate these objects|mutate する設定 object ではありません/.test(document),
    `${relativePath}: immutable export docs no longer warn that host apps must not mutate package-root constants`
  )

  assert(
    /does not change runtime values|runtime value.*変更しません/.test(document),
    `${relativePath}: immutable export docs no longer separate reader-facing guidance from runtime values`
  )
})

publicApiDocs.forEach(([relativePath, document]) => {
  assertIncludes(document, "public-api-immutable-exports.md", `${relativePath} immutable export guide route`)
  assertIncludes(document, "TreeViewEventNames", `${relativePath} package-root event constants route`)
  assertIncludes(document, "TreeViewEventDetailKeys", `${relativePath} package-root detail-key constants route`)
  assertIncludes(document, "data hook", `${relativePath} package-root data-hook object route`)
})

readmeRepresentativeExports.forEach((signal) => {
  assertIncludes(readme, signal, `README.md package-root export overview`)
})

readmeRepresentativeHookObjects.forEach((signal) => {
  assertIncludes(readme, signal, `README.md package-root data-hook overview`)
})

assertIncludes(readme, "docs/en/public-api.md#javascript-surface", "README.md Public API JavaScript surface route")
assertIncludes(readme, "docs/ja/public-api.md#javascript-surface", "README.md Japanese Public API JavaScript surface route")
assertIncludes(readme, "docs/en/public-api-immutable-exports.md", "README.md immutable package-root exports route")
assertIncludes(readme, "docs/ja/public-api-immutable-exports.md", "README.md Japanese immutable package-root exports route")

assert(
  /package-root exports from `tree_view`, such as/.test(readme),
  "README.md: package-root export guidance should stay an entry point with representative examples, not a complete inventory"
)

assert(
  /documented data hook objects/.test(readme),
  "README.md: package-root export guidance no longer points readers at documented data hook objects"
)
