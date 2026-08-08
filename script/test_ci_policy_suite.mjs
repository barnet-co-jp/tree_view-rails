import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageJsonPath = path.join(scriptDir, "..", "package.json")
const ciPolicyPackageScriptName = "test:ci-policy"
const ciPolicyStandalonePreludePath = "script/test_license_package_sensitive_signal.mjs"
const ciPolicyStandalonePreludeCommand = `node ${ciPolicyStandalonePreludePath}`

const checks = [
  {
    group: "Changed-file policy signals",
    command: "node",
    args: ["script/test_ci_changed_files_policy.mjs"]
  },
  {
    group: "Workflow changed-file detection signals",
    command: "node",
    args: ["script/test_ci_workflow_changed_file_detection_signals.mjs"]
  },
  {
    group: "Dependabot maintenance evidence signals",
    command: "node",
    args: ["script/test_ci_dependabot_maintenance_evidence_signals.mjs"]
  },
  {
    group: "CI matrix boundary signals",
    command: "node",
    args: ["script/test_ci_matrix_boundary_signals.mjs"]
  },
  {
    group: "Workflow concurrency signals",
    command: "node",
    args: ["script/test_ci_workflow_concurrency_signals.mjs"]
  },
  {
    group: "Workflow permissions signals",
    command: "node",
    args: ["script/test_ci_workflow_permissions_signals.mjs"]
  },
  {
    group: "Workflow permissions docs signals",
    command: "node",
    args: ["script/test_ci_policy_permissions_docs_signals.mjs"]
  },
  {
    group: "CI observation guidance signals",
    command: "node",
    args: ["script/test_ci_observation_guidance_signals.mjs"]
  },
  {
    group: "CI policy docs routing signals",
    command: "node",
    args: ["script/test_ci_policy_docs_routing.mjs"]
  },
  {
    group: "Importmap docs entrypoint routing signals",
    command: "node",
    args: ["script/test_importmap_docs_entrypoint_routing.mjs"]
  },
  {
    group: "Package lock dependency drift",
    command: "node",
    args: ["script/test_package_lock_dependency_drift.mjs"]
  },
  {
    group: "Gemfile lock dependency drift",
    command: "node",
    args: ["script/test_gemfile_lock_dependency_drift.mjs"]
  }
]

const ciPolicyScriptExclusions = new Map([
  ["test_ci_policy_suite.mjs", "this suite's self-test entrypoint"]
])

const ciPolicyScriptPatterns = [
  /^test_ci_.*\.mjs$/,
  /^test_.*lock_dependency_drift\.mjs$/
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
  console.log(`[ci-policy] ${selectedChecks.length} checks configured`)

  selectedChecks.forEach((check, index) => {
    console.log(`[ci-policy] ${index + 1}. ${check.group}: ${commandLine(check)}`)
  })
}

function usage() {
  console.error("[ci-policy] usage: node script/test_ci_policy_suite.mjs [--list] [--only <group-or-index>] [--self-test]")
  console.error("[ci-policy] use --list to show available groups")
}

function registeredNodeScriptPaths() {
  return new Set(
    checks
      .filter((check) => check.command === "node" && check.args[0]?.startsWith("script/"))
      .map((check) => check.args[0])
  )
}

function isCiPolicyCandidate(filename) {
  if (!filename.endsWith(".mjs")) return false
  if (ciPolicyScriptExclusions.has(filename)) return false

  return ciPolicyScriptPatterns.some((pattern) => pattern.test(filename))
}

function ciPolicyCandidateScriptPaths() {
  return readdirSync(scriptDir)
    .filter(isCiPolicyCandidate)
    .map((filename) => `script/${filename}`)
    .sort()
}

function unregisteredCiPolicyScriptPaths() {
  const registeredPaths = registeredNodeScriptPaths()
  return ciPolicyCandidateScriptPaths().filter((scriptPath) => !registeredPaths.has(scriptPath))
}

function assertCiPolicyScriptsRegistered() {
  const unregisteredScripts = unregisteredCiPolicyScriptPaths()

  assert.deepEqual(
    unregisteredScripts,
    [],
    [
      "CI policy suite is missing guard script registrations:",
      ...unregisteredScripts.map((scriptPath) => `  - ${scriptPath}`),
      "Add each script to the checks array or document an explicit exclusion."
    ].join("\n")
  )
}

function ciPolicyPackageScript() {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"))
  return packageJson.scripts?.[ciPolicyPackageScriptName] ?? ""
}

function assertCiPolicyStandalonePreludeRegistered() {
  const commandParts = ciPolicyPackageScript()
    .split("&&")
    .map((commandPart) => commandPart.trim())
    .filter(Boolean)

  assert.equal(
    commandParts[0],
    ciPolicyStandalonePreludeCommand,
    [
      `package.json scripts.${ciPolicyPackageScriptName} must start with ${ciPolicyStandalonePreludeCommand}.`,
      "The standalone LICENSE package-sensitive guard is intentionally a prelude before the suite self-test, not a checks-array group."
    ].join("\n")
  )
  assert.ok(
    commandParts.includes("node script/test_ci_policy_suite.mjs --self-test"),
    `package.json scripts.${ciPolicyPackageScriptName} must still run the CI policy suite self-test`
  )
  assert.ok(
    commandParts.includes("node script/test_ci_policy_suite.mjs"),
    `package.json scripts.${ciPolicyPackageScriptName} must still run the CI policy suite after the standalone prelude`
  )
}

function resolveOnlyGroupResult(groupName) {
  if (/^\d+$/.test(groupName)) {
    const groupIndex = Number(groupName) - 1
    const indexedMatch = checks[groupIndex]
    if (indexedMatch) return { check: indexedMatch }

    return {
      error: "out_of_range",
      message: `[ci-policy] --only index out of range: ${groupName}`
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
      message: `[ci-policy] ambiguous --only group: ${groupName}`,
      matches: partialMatches
    }
  }

  return {
    error: "unknown",
    message: `[ci-policy] unknown --only group: ${groupName}`
  }
}

function printOnlyGroupError(result) {
  console.error(result.message)

  if (result.error === "ambiguous") {
    console.error("[ci-policy] matching groups:")
    console.error(result.matches.map((check) => `  - ${check.group}`).join("\n"))
  }

  console.error("[ci-policy] available groups:")
  console.error(formatAvailableGroups())
  console.error("[ci-policy] run with --list to inspect commands")
}

function resolveOnlyGroup(groupName) {
  const result = resolveOnlyGroupResult(groupName)
  if (result.check) return result.check

  printOnlyGroupError(result)
  process.exit(1)
}

function runSelfTest() {
  const availableGroups = formatAvailableGroups()

  assert.match(
    availableGroups,
    /1\. Changed-file policy signals/,
    "available group list should include a stable first index"
  )
  assert.ok(
    availableGroups.includes(`${checks.length}. Gemfile lock dependency drift`),
    "available group list should include the final lockfile drift group"
  )

  assert.equal(
    resolveOnlyGroupResult("1").check.group,
    "Changed-file policy signals",
    "numeric --only should resolve a one-based index"
  )
  assert.equal(
    resolveOnlyGroupResult("workflow permissions signals").check.group,
    "Workflow permissions signals",
    "case-insensitive exact --only should resolve a group"
  )
  assert.equal(
    resolveOnlyGroupResult("Observation").check.group,
    "CI observation guidance signals",
    "unique partial --only should resolve a group"
  )

  const outOfRange = resolveOnlyGroupResult("999")
  assert.equal(outOfRange.error, "out_of_range")
  assert.match(outOfRange.message, /--only index out of range: 999/)

  const unknown = resolveOnlyGroupResult("does-not-exist")
  assert.equal(unknown.error, "unknown")
  assert.match(unknown.message, /unknown --only group: does-not-exist/)

  const ambiguous = resolveOnlyGroupResult("workflow")
  assert.equal(ambiguous.error, "ambiguous")
  assert.deepEqual(
    ambiguous.matches.map((check) => check.group),
    [
      "Workflow changed-file detection signals",
      "Workflow concurrency signals",
      "Workflow permissions signals",
      "Workflow permissions docs signals"
    ],
    "ambiguous --only should report all matching groups"
  )

  assert.equal(
    ciPolicyScriptExclusions.get("test_ci_policy_suite.mjs"),
    "this suite's self-test entrypoint",
    "the suite entrypoint exclusion should document why it is not a direct guard group"
  )
  assert.ok(
    ciPolicyCandidateScriptPaths().includes("script/test_ci_changed_files_policy.mjs"),
    "CI policy candidates should include changed-file policy signals"
  )
  assert.ok(
    ciPolicyCandidateScriptPaths().includes("script/test_ci_workflow_concurrency_signals.mjs"),
    "CI policy candidates should include workflow concurrency signals"
  )
  assert.ok(
    ciPolicyCandidateScriptPaths().includes("script/test_ci_workflow_permissions_signals.mjs"),
    "CI policy candidates should include workflow permissions signals"
  )
  assert.ok(
    ciPolicyCandidateScriptPaths().includes("script/test_ci_policy_permissions_docs_signals.mjs"),
    "CI policy candidates should include workflow permissions docs signals"
  )
  assert.ok(
    ciPolicyCandidateScriptPaths().includes("script/test_ci_matrix_boundary_signals.mjs"),
    "CI policy candidates should include CI matrix boundary signals"
  )
  assert.ok(
    ciPolicyCandidateScriptPaths().includes("script/test_package_lock_dependency_drift.mjs"),
    "CI policy candidates should include package lock dependency drift"
  )
  assert.ok(
    !ciPolicyCandidateScriptPaths().includes("script/test_ci_policy_suite.mjs"),
    "the suite entrypoint should stay out of direct guard registration candidates"
  )
  assert.ok(
    !ciPolicyCandidateScriptPaths().includes(ciPolicyStandalonePreludePath),
    "the standalone LICENSE package-sensitive guard should stay outside direct suite registration candidates"
  )
  assertCiPolicyScriptsRegistered();
  assertCiPolicyStandalonePreludeRegistered()

  console.log("[ci-policy] self-test passed")
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
        console.error("[ci-policy] --only requires a group name or index")
        usage()
        console.error("[ci-policy] available groups:")
        console.error(formatAvailableGroups())
        process.exit(1)
      }

      options.only = resolveOnlyGroup(groupName)
      index += 1
      continue
    }

    console.error(`[ci-policy] unknown argument: ${arg}`)
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

  console.log(`\n[ci-policy] ${index + 1}/${selectedChecks.length} ${check.group}`)
  console.log(`$ ${commandLine(check)}`)

  const result = spawnSync(check.command, check.args, { stdio: "inherit" })
  const elapsed = Date.now() - checkStartedAt

  if (result.error) {
    console.error(
      `[ci-policy] ${check.group} failed to start after ${formatDuration(elapsed)}: ${result.error.message}`
    )
    console.error(
      `[ci-policy] summary: ${passedChecks.length}/${selectedChecks.length} checks passed before failure`
    )
    process.exit(1)
  }

  if (result.signal) {
    console.error(
      `[ci-policy] ${check.group} stopped by signal ${result.signal} after ${formatDuration(elapsed)}: ${commandLine(check)}`
    )
    console.error(
      `[ci-policy] summary: ${passedChecks.length}/${selectedChecks.length} checks passed before failure`
    )
    process.exit(1)
  }

  if (result.status !== 0) {
    console.error(
      `[ci-policy] ${check.group} failed with exit code ${result.status} after ${formatDuration(elapsed)}: ${commandLine(check)}`
    )
    console.error(
      `[ci-policy] summary: ${passedChecks.length}/${selectedChecks.length} checks passed before failure`
    )
    process.exit(result.status ?? 1)
  }

  passedChecks.push(check.group)
  console.log(`[ci-policy] ${check.group} passed in ${formatDuration(elapsed)}`)
}

console.log(
  `\n[ci-policy] all ${selectedChecks.length} checks passed in ${formatDuration(Date.now() - suiteStartedAt)}`
)
