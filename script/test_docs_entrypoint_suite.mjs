import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))

const checks = [
  {
    group: "Foundational docs entrypoints",
    command: "node",
    args: ["script/test_docs_entrypoints.mjs"]
  },
  {
    group: "Feature docs entrypoints",
    command: "node",
    args: ["script/test_docs_feature_entrypoints.mjs"]
  },
  {
    group: "Repository-only maintainer entrypoints",
    command: "node",
    args: ["script/test_repository_only_maintainer_entrypoints.mjs"]
  },
  {
    group: "Docs entrypoint signals",
    command: "node",
    args: ["script/test_docs_entrypoint_signals.mjs"]
  },
  {
    group: "Event names docs signals",
    command: "node",
    args: ["script/test_event_names_public_api_signals.mjs"]
  },
  {
    group: "Host app extension diagnostics signals",
    command: "node",
    args: ["script/test_host_app_extension_diagnostics_signals.mjs"]
  },
  {
    group: "Diagnostics docs signals",
    command: "node",
    args: ["script/test_diagnostics_docs_signals.mjs"]
  },
  {
    group: "Development docs Node version signals",
    command: "node",
    args: ["script/test_development_docs_node_version_signals.mjs"]
  },
  {
    group: "Development docs command signals",
    command: "npm",
    args: ["run", "test:development-docs-commands"]
  },
  {
    group: "Public setup surface docs signals",
    command: "node",
    args: ["script/test_public_setup_surface_docs_signals.mjs"]
  },
  {
    group: "Configuration docs signals",
    command: "node",
    args: ["script/test_configuration_docs_signals.mjs"]
  },
  {
    group: "Breadcrumb docs signals",
    command: "node",
    args: ["script/test_breadcrumb_docs_signals.mjs"]
  },
  {
    group: "Docs reader journey signals",
    command: "node",
    args: ["script/test_docs_reader_journey_signals.mjs"]
  },
  {
    group: "Decision guide signals",
    command: "node",
    args: ["script/test_decision_guide_signals.mjs"]
  },
  {
    group: "Quality docs smoke signals",
    command: "node",
    args: ["script/test_quality_docs_smoke_signals.mjs"]
  },
  {
    group: "Docs policy signal guards",
    command: "node",
    args: ["script/test_docs_policy_signal_guards.mjs"]
  },
  {
    group: "Release docs signals",
    command: "node",
    args: ["script/test_release_docs_signals.mjs"]
  },
  {
    group: "Release package contents signals",
    command: "node",
    args: ["script/test_release_package_contents_signals.mjs"]
  },
  {
    group: "README quick start signal",
    command: "node",
    args: ["script/test_readme_quick_start_signal.mjs"]
  },
  {
    group: "Mockup docs and asset signals",
    command: "node",
    args: ["script/test_mockup_docs_asset_signals.mjs"]
  },
  {
    group: "README orientation asset signals",
    command: "node",
    args: ["script/test_readme_orientation_asset_signals.mjs"]
  },
  {
    group: "Public API docs signals",
    command: "node",
    args: ["script/test_public_api_docs_signals.mjs"]
  },
  {
    group: "Public API transfer integration signals",
    command: "node",
    args: ["script/guard_public_api_transfer_integration_signals.mjs"]
  },
  {
    group: "Manifest-backed public surface signals",
    command: "node",
    args: ["script/test_manifest_backed_public_surface_signals.mjs"]
  },
  {
    group: "Public API exported controller class docs signals",
    command: "node",
    args: ["script/test_public_api_exported_controller_class_docs_signals.mjs"]
  },
  {
    group: "Host lifecycle no-detail docs signals",
    command: "node",
    args: ["script/test_host_lifecycle_no_detail_docs_signals.mjs"]
  },
  {
    group: "tree_view_rows helper docs signals",
    command: "node",
    args: ["script/test_tree_view_rows_docs_signals.mjs"]
  },
  {
    group: "RenderState grouped option docs signals",
    command: "node",
    args: ["script/test_grouped_option_docs_signals.mjs"]
  },
  {
    group: "RenderState callback builder docs signals",
    command: "node",
    args: ["script/test_render_state_callback_builder_docs_signals.mjs"]
  },
  {
    group: "Public API manifest structure",
    command: "npm",
    args: ["run", "test:public-api-manifest-structure"]
  },
  {
    group: "Public API entrypoint guard signals",
    command: "node",
    args: ["script/test_public_api_entrypoint_guard_signals.mjs"]
  },
  {
    group: "Controller registration docs signals",
    command: "node",
    args: ["script/check_controller_registration_docs_signals.mjs"]
  },
  {
    group: "Render window and resource table docs signals",
    command: "node",
    args: ["script/test_render_window_resource_table_docs_signals.mjs"]
  },
  {
    group: "Localized and hook docs signals",
    command: "node",
    args: ["script/test_localized_and_hook_docs_signals.mjs"]
  },
  {
    group: "Docs i18n parity",
    command: "npm",
    args: ["run", "test:docs-i18n"]
  },
  {
    group: "Docs entrypoint suite option contract",
    command: "node",
    args: ["script/test_docs_entrypoint_suite.mjs", "--self-test"]
  }
]

const docsEntrypointScriptExclusions = new Map([
  ["test_ci_policy_docs_routing.mjs", "registered through npm run test:ci-policy"],
  [
    "test_ci_policy_permissions_docs_signals.mjs",
    "registered through npm run test:ci-policy"
  ],
  [
    "test_importmap_docs_entrypoint_routing.mjs",
    "registered through npm run test:ci-policy"
  ],
  [
    "test_development_docs_command_signals.mjs",
    "registered through npm run test:development-docs-commands"
  ],
  ["test_docs_entrypoint_suite.mjs", "this suite's self-test entrypoint"],
  ["test_docs_i18n_parity.mjs", "registered through npm run test:docs-i18n"]
])

const docsEntrypointScriptPatterns = [
  /^check_controller_registration_docs_signals\.mjs$/,
  /^guard_.*signals\.mjs$/,
  /^test_event_names_public_api_signals\.mjs$/,
  /^test_.*docs.*\.mjs$/,
  /^test_.*readme.*signals\.mjs$/,
  /^test_.*mockup.*signals\.mjs$/,
  /^test_breadcrumb_.*signals\.mjs$/,
  /^test_configuration_.*signals\.mjs$/,
  /^test_decision_guide_signals\.mjs$/,
  /^test_grouped_option_.*signals\.mjs$/,
  /^test_localized_and_hook_.*signals\.mjs$/,
  /^test_quality_.*signals\.mjs$/,
  /^test_release_.*signals\.mjs$/,
  /^test_tree_view_rows_.*signals\.mjs$/
]

function commandLine({ command, args }) {
  return [command, ...args].join(" ")
}

function formatDuration(milliseconds) {
  if (milliseconds < 1000) return `${milliseconds}ms`

  return `${(milliseconds / 1000).toFixed(1)}s`
}

function formatAvailableGroups() {
  return checks.map((check, index) => `  ${index + 1}. ${check.group}`).join("\n")
}

function printCheckList(selectedChecks = checks) {
  console.log(`[docs-entrypoints] ${selectedChecks.length} checks configured`)

  selectedChecks.forEach((check, index) => {
    console.log(
      `[docs-entrypoints] ${index + 1}. ${check.group}: ${commandLine(check)}`
    )
  })
}

function usage() {
  console.error("[docs-entrypoints] usage: node script/test_docs_entrypoint_suite.mjs [--list] [--only <group-or-index>] [--self-test]")
  console.error("[docs-entrypoints] use --list to show available groups")
}

function registeredNodeScriptPaths() {
  return new Set(
    checks
      .filter((check) => check.command === "node" && check.args[0]?.startsWith("script/"))
      .map((check) => check.args[0])
  )
}

function isDocsEntrypointCandidate(filename) {
  if (!filename.endsWith(".mjs")) return false
  if (docsEntrypointScriptExclusions.has(filename)) return false

  return docsEntrypointScriptPatterns.some((pattern) => pattern.test(filename))
}

function docsEntrypointCandidateScriptPaths() {
  return readdirSync(scriptDir)
    .filter(isDocsEntrypointCandidate)
    .map((filename) => `script/${filename}`)
    .sort()
}

function unregisteredDocsEntrypointScriptPaths() {
  const registeredPaths = registeredNodeScriptPaths()
  return docsEntrypointCandidateScriptPaths().filter((scriptPath) => !registeredPaths.has(scriptPath))
}

function assertDocsEntrypointScriptsRegistered() {
  const unregisteredScripts = unregisteredDocsEntrypointScriptPaths()

  assert.deepEqual(
    unregisteredScripts,
    [],
    [
      "docs entrypoint suite is missing docs smoke/signal script registrations:",
      ...unregisteredScripts.map((scriptPath) => `  - ${scriptPath}`),
      "Add each script to the checks array or document an explicit exclusion."
    ].join("\n")
  )
}

function resolveOnlyGroupResult(groupName) {
  if (/^\d+$/.test(groupName)) {
    const groupIndex = Number(groupName) - 1
    const indexedMatch = checks[groupIndex]
    if (indexedMatch) return { check: indexedMatch }

    return {
      error: "out_of_range",
      message: `[docs-entrypoints] --only index out of range: ${groupName}`
    }
  }

  const exactMatches = checks.filter((check) => check.group === groupName)
  if (exactMatches.length === 1) return { check: exactMatches[0] }

  const normalizedGroupName = groupName.toLowerCase()
  const caseInsensitiveExactMatches = checks.filter(
    (check) => check.group.toLowerCase() === normalizedGroupName
  )
  if (caseInsensitiveExactMatches.length === 1) return { check: caseInsensitiveExactMatches[0] }

  const partialMatches = checks.filter((check) =>
    check.group.toLowerCase().includes(normalizedGroupName)
  )

  if (partialMatches.length === 1) return { check: partialMatches[0] }

  if (partialMatches.length > 1) {
    return {
      error: "ambiguous",
      message: `[docs-entrypoints] ambiguous --only group: ${groupName}`,
      matches: partialMatches
    }
  }

  return {
    error: "unknown",
    message: `[docs-entrypoints] unknown --only group: ${groupName}`
  }
}

function printOnlyGroupError(result) {
  console.error(result.message)

  if (result.error === "ambiguous") {
    console.error("[docs-entrypoints] matching groups:")
    console.error(result.matches.map((check) => `  - ${check.group}`).join("\n"))
  }

  console.error("[docs-entrypoints] available groups:")
  console.error(formatAvailableGroups())
  console.error("[docs-entrypoints] run with --list to inspect commands")
}

function resolveOnlyGroup(groupName) {
  const result = resolveOnlyGroupResult(groupName)
  if (result.check) return result.check

  printOnlyGroupError(result)
  process.exit(1)
}

function runSelfTest() {
  const availableGroups = formatAvailableGroups()
  const registeredPaths = registeredNodeScriptPaths()
  const candidatePaths = docsEntrypointCandidateScriptPaths()

  assert.match(
    availableGroups,
    /1\. Foundational docs entrypoints/,
    "available group list should include a stable first index"
  )
  assert.ok(
    availableGroups.includes(`${checks.length}. Docs entrypoint suite option contract`),
    "available group list should include the self-test group"
  )

  assert.equal(
    resolveOnlyGroupResult("1").check.group,
    "Foundational docs entrypoints",
    "numeric --only should resolve a one-based index"
  )
  assert.equal(
    resolveOnlyGroupResult("public api docs signals").check.group,
    "Public API docs signals",
    "case-insensitive exact --only should resolve a group"
  )
  assert.equal(
    resolveOnlyGroupResult("Manifest-backed public surface").check.group,
    "Manifest-backed public surface signals",
    "unique partial --only should resolve the manifest-backed public surface docs signal"
  )
  assert.equal(
    resolveOnlyGroupResult("Public API transfer").check.group,
    "Public API transfer integration signals",
    "unique partial --only should resolve the transfer integration guard"
  )
  assert.equal(
    resolveOnlyGroupResult("Event names").check.group,
    "Event names docs signals",
    "unique partial --only should resolve the event names docs signal"
  )
  assert.equal(
    resolveOnlyGroupResult("Localized and hook").check.group,
    "Localized and hook docs signals",
    "unique partial --only should resolve a group"
  )
  assert.equal(
    resolveOnlyGroupResult("Controller registration").check.group,
    "Controller registration docs signals",
    "unique partial --only should resolve the controller registration docs signal"
  )

  const outOfRange = resolveOnlyGroupResult("999")
  assert.equal(outOfRange.error, "out_of_range")
  assert.match(outOfRange.message, /--only index out of range: 999/)

  const unknown = resolveOnlyGroupResult("does-not-exist")
  assert.equal(unknown.error, "unknown")
  assert.match(unknown.message, /unknown --only group: does-not-exist/)

  const ambiguous = resolveOnlyGroupResult("Public API")
  assert.equal(ambiguous.error, "ambiguous")
  assert.deepEqual(
    ambiguous.matches.map((check) => check.group),
    [
      "Public API docs signals",
      "Public API transfer integration signals",
      "Public API exported controller class docs signals",
      "Public API manifest structure",
      "Public API entrypoint guard signals"
    ],
    "ambiguous --only should report all matching groups"
  )

  assert.ok(
    candidatePaths.includes("script/test_event_names_public_api_signals.mjs"),
    "docs script registration candidates should include event names public API signals"
  )
  assert.ok(
    candidatePaths.includes("script/test_diagnostics_docs_signals.mjs"),
    "docs script registration candidates should include diagnostics docs signals"
  )
  assert.ok(
    candidatePaths.includes("script/test_public_api_docs_signals.mjs"),
    "docs script registration candidates should include public API docs signals"
  )
  assert.ok(
    candidatePaths.includes("script/test_release_package_contents_signals.mjs"),
    "docs script registration candidates should include release package contents signals"
  )
  assert.ok(
    candidatePaths.includes("script/guard_public_api_transfer_integration_signals.mjs"),
    "docs script registration candidates should include guard-based public API docs signals"
  )
  assert.ok(
    registeredPaths.has("script/guard_public_api_transfer_integration_signals.mjs"),
    "guard-based public API docs signals should be registered in the suite"
  )
  assert.ok(
    candidatePaths.includes("script/check_controller_registration_docs_signals.mjs"),
    "docs script registration candidates should include controller registration docs signals"
  )
  assert.ok(
    !candidatePaths.includes("script/test_docs_i18n_parity.mjs"),
    "npm-registered docs checks should stay out of direct node script registration candidates"
  )
  assertDocsEntrypointScriptsRegistered()

  console.log("[docs-entrypoints] self-test passed")
}

function parseArgs(argv) {
  const options = { list: false, only: null, selfTest: false }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === "--list") {
      options.list = true
      continue
    }

    if (arg === "--self-test") {
      options.selfTest = true
      continue
    }

    if (arg === "--only") {
      const groupName = argv[index + 1]

      if (!groupName || groupName.startsWith("--")) {
        console.error("[docs-entrypoints] --only requires a group name or index")
        usage()
        console.error("[docs-entrypoints] available groups:")
        console.error(formatAvailableGroups())
        process.exit(1)
      }

      options.only = resolveOnlyGroup(groupName)
      index += 1
      continue
    }

    console.error(`[docs-entrypoints] unknown argument: ${arg}`)
    usage()
    process.exit(1)
  }

  return options
}

const options = parseArgs(process.argv.slice(2))

if (options.selfTest) {
  runSelfTest()
  process.exit(0)
}

if (options.list) {
  printCheckList()
  process.exit(0)
}

const selectedChecks = options.only ? [options.only] : checks
const suiteStartedAt = Date.now()
const passedChecks = []

printCheckList(selectedChecks)

for (const [index, check] of selectedChecks.entries()) {
  const checkStartedAt = Date.now()

  console.log(`\n[docs-entrypoints] ${index + 1}/${selectedChecks.length} ${check.group}`)
  console.log(`$ ${commandLine(check)}`)

  const result = spawnSync(check.command, check.args, { stdio: "inherit" })
  const elapsed = Date.now() - checkStartedAt

  if (result.error) {
    console.error(
      `[docs-entrypoints] ${check.group} failed to start after ${formatDuration(elapsed)}: ${result.error.message}`
    )
    console.error(
      `[docs-entrypoints] summary: ${passedChecks.length}/${selectedChecks.length} checks passed before failure`
    )
    process.exit(1)
  }

  if (result.signal) {
    console.error(
      `[docs-entrypoints] ${check.group} stopped by signal ${result.signal} after ${formatDuration(elapsed)}: ${commandLine(check)}`
    )
    console.error(
      `[docs-entrypoints] summary: ${passedChecks.length}/${selectedChecks.length} checks passed before failure`
    )
    process.exit(1)
  }

  if (result.status !== 0) {
    console.error(
      `[docs-entrypoints] ${check.group} failed with exit code ${result.status} after ${formatDuration(elapsed)}: ${commandLine(check)}`
    )
    console.error(
      `[docs-entrypoints] summary: ${passedChecks.length}/${selectedChecks.length} checks passed before failure`
    )
    process.exit(result.status ?? 1)
  }

  passedChecks.push(check.group)
  console.log(
    `[docs-entrypoints] ${check.group} passed in ${formatDuration(elapsed)}`
  )
}

console.log(
  `\n[docs-entrypoints] all ${selectedChecks.length} checks passed in ${formatDuration(Date.now() - suiteStartedAt)}`
)
