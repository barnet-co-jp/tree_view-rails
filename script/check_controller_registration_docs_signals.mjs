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
const controllerRegistrationDocs = [
  ["docs/en/controller-registration.md", read("docs/en/controller-registration.md")],
  ["docs/ja/controller-registration.md", read("docs/ja/controller-registration.md")]
]

const manifestSignals = [
  "javascript_package_root:",
  "TreeViewControllerEntries",
  "controller_registrations:",
  "key: state",
  "identifier: tree-view-state",
  "export: TreeViewStateController",
  "key: client",
  "identifier: tree-view-client",
  "export: TreeViewClientController",
  "key: selection",
  "identifier: tree-view-selection",
  "export: TreeViewSelectionController",
  "key: transfer",
  "identifier: tree-view-transfer",
  "export: TreeViewTransferController",
  "key: remoteState",
  "identifier: tree-view-remote-state",
  "export: TreeViewRemoteStateController"
]

manifestSignals.forEach((signal) => {
  assertIncludes(manifest, signal, "public API manifest controller registration surface")
})

controllerRegistrationDocs.forEach(([relativePath, document]) => {
  assertIncludes(
    document,
    "registerTreeViewControllers(application)",
    `${relativePath} default registration helper docs`
  )
  assertIncludes(
    document,
    "TreeViewControllerEntries",
    `${relativePath} controller entries export docs`
  )
  assertIncludes(
    document,
    "application.register(identifier, controller)",
    `${relativePath} custom registration example docs`
  )

  assert(
    /state.*client.*selection.*transfer.*remote state/s.test(document),
    `${relativePath}: controller registration docs no longer preserve the documented controller order`
  )

  assert(
    /filter.*reorder.*host app|host app.*filter.*reorder|host app.*boot sequence|host app 側.*boot sequence|host app は entry を filter \/ reorder/.test(document),
    `${relativePath}: controller registration docs no longer preserve the host-app-owned custom boot boundary`
  )

  assert(
    /does not rename identifiers|identifier の rename/.test(document),
    `${relativePath}: controller registration docs no longer state that identifiers and behavior are unchanged`
  )
})

const publicApiDocs = [
  ["docs/en/public-api.md", read("docs/en/public-api.md")],
  ["docs/ja/public-api.md", read("docs/ja/public-api.md")]
]

const documentedControllerEntryRows = [
  "| `state` | `tree-view-state` | `TreeViewStateController` |",
  "| `client` | `tree-view-client` | `TreeViewClientController` |",
  "| `selection` | `tree-view-selection` | `TreeViewSelectionController` |",
  "| `transfer` | `tree-view-transfer` | `TreeViewTransferController` |",
  "| `remoteState` | `tree-view-remote-state` | `TreeViewRemoteStateController` |"
]

publicApiDocs.forEach(([relativePath, document]) => {
  assertIncludes(document, "TreeViewControllerEntries", `${relativePath} controller entry list docs`)
  assertIncludes(document, "registerTreeViewControllers(application)", `${relativePath} standard registration route`)

  documentedControllerEntryRows.forEach((row) => {
    assertIncludes(document, row, `${relativePath} controller key / identifier / export mapping`)
  })

  assert(
    /selective or custom registration|selective \/ custom registration/.test(document),
    `${relativePath}: TreeViewControllerEntries docs no longer limit the entry list to selective or custom registration`
  )
})
