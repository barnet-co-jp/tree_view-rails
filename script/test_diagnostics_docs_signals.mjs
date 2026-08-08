import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const manifest = read("config/public_api_manifest.yml")
const diagnosticsDocs = [
  ["docs/en/tree-diagnostics.md", read("docs/en/tree-diagnostics.md")],
  ["docs/ja/tree-diagnostics.md", read("docs/ja/tree-diagnostics.md")]
]
const developmentDocs = [
  ["docs/en/development.md", read("docs/en/development.md")],
  ["docs/ja/development.md", read("docs/ja/development.md")]
]

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8")
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertIncludes(source, needle, label) {
  assert(source.includes(needle), `${label}: missing ${needle}`)
}

const diagnosticsManifestSurfaceSignals = [
  ["diagnostics accepted checks", "diagnostics:"],
  ["diagnostics accepted checks", "accepted_checks:"],
  ["diagnostics run options", "run_options:"],
  ["diagnostics Result surface", "result_surface:"]
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

diagnosticsManifestSurfaceSignals.forEach(([label, signal]) => {
  assertIncludes(manifest, signal, `public API manifest diagnostics surface (${label})`)
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

developmentDocs.forEach(([relativePath, document]) => {
  [
    "diagnostics.accepted_checks",
    "diagnostics.run_options",
    "diagnostics.result_surface",
    "lib/tree_view/diagnostics.rb",
    "script/test_diagnostics_docs_signals.mjs",
    "individual error detail shape",
    "orphan warning semantics",
    "cycle validation policy"
  ].forEach((signal) => {
    assertIncludes(document, signal, `${relativePath} diagnostics docs-signal responsibility`)
  })

  assert(
    /only keeps representative.*wording aligned|代表 wording の同期だけを担当/.test(document),
    `${relativePath}: Diagnostics docs must limit the lightweight signal to representative bilingual wording`
  )
  assert(
    /does not validate runtime execution|runtime execution を検証せず/.test(document),
    `${relativePath}: Diagnostics docs must keep runtime validation outside the docs-signal guard`
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

console.log("Checked diagnostics docs signals.")
