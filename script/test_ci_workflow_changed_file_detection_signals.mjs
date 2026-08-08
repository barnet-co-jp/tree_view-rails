import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { classifyChangedFiles } from "./ci_changed_files_policy.mjs"

const workflowPath = ".github/workflows/ci.yml"
const packagePath = "package.json"
const policyCliPath = "script/ci_changed_files_policy.mjs"
const docsEntrypointSuitePath = "script/test_docs_entrypoint_suite.mjs"
const workflowSource = readFileSync(workflowPath, "utf8")
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"))
const docsEntrypointSuiteSource = readFileSync(docsEntrypointSuitePath, "utf8")

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertIncludes(source, needle, label) {
  assert(source.includes(needle), `${label}: missing ${needle}`)
}

function assertAbsent(source, needle, label) {
  assert(!source.includes(needle), `${label}: unexpected ${needle}`)
}

function workflowJobBlock(workflowSource, jobName) {
  const marker = `  ${jobName}:\n`
  const start = workflowSource.indexOf(marker)
  assert(start !== -1, `${workflowPath} must define jobs.${jobName}`)

  const bodyStart = start + marker.length
  const remainingWorkflow = workflowSource.slice(bodyStart)
  const nextJobOffset = remainingWorkflow.search(/\n  [a-z_]+:\n/)

  return nextJobOffset === -1 ? remainingWorkflow : remainingWorkflow.slice(0, nextJobOffset + 1)
}

function workflowTopLevelJobNames(workflowSource) {
  const jobsStart = workflowSource.indexOf("\njobs:\n")
  assert(jobsStart !== -1, `${workflowPath} must define a top-level jobs block`)

  return [...workflowSource.slice(jobsStart).matchAll(/^  (?<jobName>[a-z_]+):$/gm)]
    .map((match) => match.groups.jobName)
}

function assertJobExecutionPolicy(jobName, jobSource, timeoutMinutes) {
  const runnerLines = jobSource.split(/\r?\n/).filter((line) => line.trimStart().startsWith("runs-on:"))
  const timeoutLines = jobSource.split(/\r?\n/).filter((line) => line.trimStart().startsWith("timeout-minutes:"))
  const expectedRunner = "    runs-on: ubuntu-latest"
  const expectedTimeout = `    timeout-minutes: ${timeoutMinutes}`

  assert(
    runnerLines.length === 1 && runnerLines[0] === expectedRunner,
    `${workflowPath} jobs.${jobName} runner policy: expected ${expectedRunner}; actual ${runnerLines.join(", ") || "(missing)"}`
  )
  assert(
    timeoutLines.length === 1 && timeoutLines[0] === expectedTimeout,
    `${workflowPath} jobs.${jobName} timeout policy: expected ${expectedTimeout}; actual ${timeoutLines.join(", ") || "(missing)"}`
  )
  assertOrdered(
    jobSource,
    expectedRunner,
    expectedTimeout,
    `${workflowPath} jobs.${jobName} execution policy`
  )
}

function assertOrdered(source, earlier, later, label) {
  const earlierIndex = source.indexOf(earlier)
  const laterIndex = earlierIndex === -1 ? source.indexOf(later) : source.indexOf(later, earlierIndex + earlier.length)

  assert(earlierIndex !== -1, `${label}: missing ${earlier}`)
  assert(laterIndex !== -1, `${label}: missing ${later} after ${earlier}`)
  assert(earlierIndex < laterIndex, `${label}: expected ${earlier} before ${later}`)
}

function assertMatrixFailFastPolicy(jobName, jobSource) {
  assertIncludes(
    jobSource,
    "strategy:\n      fail-fast: false\n",
    `${workflowPath} jobs.${jobName} matrix fail-fast policy`
  )
}

function workflowTopLevelTriggerBlock(workflowSource) {
  const match = workflowSource.match(/^on:\n(?<body>[\s\S]*?)\n\npermissions:\n/m)

  assert(
    match,
    `${workflowPath} CI trigger policy must define a top-level on block before permissions`
  )

  return match.groups.body
}

function workflowTopLevelPermissionsBlock(workflowSource) {
  const match = workflowSource.match(/^permissions:\n(?<body>[\s\S]*?)\n\nconcurrency:\n/m)

  assert(
    match,
    `${workflowPath} CI permissions policy must define a top-level permissions block before concurrency`
  )

  return match.groups.body
}

function workflowTopLevelConcurrencyBlock(workflowSource) {
  const match = workflowSource.match(/^concurrency:\n(?<body>[\s\S]*?)\n\njobs:\n/m)

  assert(
    match,
    `${workflowPath} CI concurrency policy must define a top-level concurrency block before jobs`
  )

  return match.groups.body
}

function assertWorkflowTriggerPolicy(workflowSource) {
  const triggerBlock = workflowTopLevelTriggerBlock(workflowSource)

  assertIncludes(
    triggerBlock,
    "  pull_request:\n",
    `${workflowPath} CI trigger policy pull_request trigger`
  )
  assertIncludes(
    triggerBlock,
    "  push:\n",
    `${workflowPath} CI trigger policy push trigger`
  )
  assertIncludes(
    triggerBlock,
    "    branches:\n",
    `${workflowPath} CI trigger policy push branches`
  )
  assertIncludes(
    triggerBlock,
    "      - main",
    `${workflowPath} CI trigger policy push main branch`
  )
  assertAbsent(
    triggerBlock,
    "pull_request_target",
    `${workflowPath} CI trigger policy privilege boundary trigger`
  )
}

function assertWorkflowPermissionsPolicy(workflowSource) {
  const permissionsBlock = workflowTopLevelPermissionsBlock(workflowSource)

  assertIncludes(
    permissionsBlock,
    "  contents: read",
    `${workflowPath} CI permissions policy repository contents token scope`
  )
  assertAbsent(
    permissionsBlock,
    "contents: write",
    `${workflowPath} CI permissions policy must not grant repository contents write access`
  )
  assertAbsent(
    permissionsBlock,
    "write-all",
    `${workflowPath} CI permissions policy must not use broad write-all access`
  )
  assertAbsent(
    permissionsBlock,
    "pull-requests: write",
    `${workflowPath} CI permissions policy must not grant pull request write access`
  )
}

function assertWorkflowConcurrencyPolicy(workflowSource) {
  const concurrencyBlock = workflowTopLevelConcurrencyBlock(workflowSource)

  assertIncludes(
    concurrencyBlock,
    "  group: ${{ github.workflow }}-${{ github.event_name }}-${{ github.event.pull_request.number || github.ref }}",
    `${workflowPath} CI concurrency policy group`
  )
  assertIncludes(
    concurrencyBlock,
    "  cancel-in-progress: ${{ github.event_name == 'pull_request' }}",
    `${workflowPath} CI concurrency policy pull-request-only cancellation`
  )
  assertAbsent(
    concurrencyBlock,
    "cancel-in-progress: true",
    `${workflowPath} CI concurrency policy must not cancel main push runs unconditionally`
  )
}

function workflowNonPullRequestDefaultOutputBlock(changesJob) {
  const match = changesJob.match(
    /if \[ "\$\{\{ github\.event_name \}\}" != "pull_request" \]; then\n(?<body>(?:            echo "[a-z_]+=(?:true|false)" >> "\$GITHUB_OUTPUT"\n)+)            exit 0\n          fi/
  )

  assert(
    match,
    `${workflowPath} jobs.changes must define non-pull-request default outputs before pull request file detection`
  )
  return match.groups.body
}

function assertDefaultWorkflowOutput(block, key, value) {
  assertIncludes(
    block,
    `echo "${key}=${value}" >> "$GITHUB_OUTPUT"`,
    `${workflowPath} jobs.changes non-pull-request default output ${key}`
  )
}

function sortedUnique(values) {
  return [...new Set(values)].sort()
}

function workflowChangesOutputKeys(changesJob) {
  const match = changesJob.match(/^    outputs:\n(?<body>(?:      [a-z_]+: .*\n)+)/m)

  assert(
    match,
    `${workflowPath} jobs.changes.outputs must define changed-files policy output keys`
  )

  return sortedUnique([...match.groups.body.matchAll(/^      (?<key>[a-z_]+): /gm)].map((entry) => entry.groups.key))
}

function workflowDefaultOutputKeys(defaultOutputBlock) {
  return sortedUnique(
    [...defaultOutputBlock.matchAll(/echo "(?<key>[a-z_]+)=(?:true|false)" >> "\$GITHUB_OUTPUT"/g)]
      .map((entry) => entry.groups.key)
  )
}

function policyCliOutputKeys() {
  const output = execFileSync(process.execPath, [policyCliPath], {
    input: "\n",
    encoding: "utf8"
  })

  return sortedUnique(
    output.trim().split(/\r?\n/).filter(Boolean).map((line) => {
      const match = line.match(/^(?<key>[a-z_]+)=(?:true|false)$/)
      assert(match, `${policyCliPath} output key-set smoke: invalid key=value boolean line ${line}`)
      return match.groups.key
    })
  )
}

function assertSameOutputKeySet(actualLabel, actualKeys, expectedLabel, expectedKeys) {
  const actual = sortedUnique(actualKeys)
  const expected = sortedUnique(expectedKeys)
  const missing = expected.filter((key) => !actual.includes(key))
  const extra = actual.filter((key) => !expected.includes(key))

  assert(
    missing.length === 0 && extra.length === 0,
    [
      `${actualLabel} output key set must match ${expectedLabel}`,
      `missing from ${actualLabel}: ${missing.join(", ") || "(none)"}`,
      `extra in ${actualLabel}: ${extra.join(", ") || "(none)"}`,
      `expected ${expectedLabel}: ${expected.join(", ")}`,
      `actual ${actualLabel}: ${actual.join(", ")}`
    ].join("\n")
  )
}

function assertPackageScript(scriptName) {
  assert(
    Object.hasOwn(packageJson.scripts ?? {}, scriptName),
    `${packagePath} scripts must define ${scriptName} for the CI JavaScript job`
  )
}

function packageScript(scriptName) {
  assertPackageScript(scriptName)

  const script = packageJson.scripts[scriptName]
  assert(
    typeof script === "string" && script.length > 0,
    `${packagePath} scripts.${scriptName} must be a non-empty command string`
  )

  return script
}

assertWorkflowTriggerPolicy(workflowSource)
assertWorkflowPermissionsPolicy(workflowSource)
assertWorkflowConcurrencyPolicy(workflowSource)

const changesJob = workflowJobBlock(workflowSource, "changes")
const lintJob = workflowJobBlock(workflowSource, "lint")
const prSpecsJob = workflowJobBlock(workflowSource, "pr_specs")
const prRailsMatrixJob = workflowJobBlock(workflowSource, "pr_rails_matrix")
const rubyMatrixJob = workflowJobBlock(workflowSource, "ruby_matrix")
const railsMatrixJob = workflowJobBlock(workflowSource, "rails_matrix")
const javascriptJob = workflowJobBlock(workflowSource, "javascript")
const dockerDevelopmentSetupJob = workflowJobBlock(workflowSource, "docker_development_setup")
const gemPackageJob = workflowJobBlock(workflowSource, "gem_package")

const workflowJobExecutionPolicies = [
  ["changes", changesJob, 10],
  ["lint", lintJob, 10],
  ["pr_specs", prSpecsJob, 15],
  ["pr_rails_matrix", prRailsMatrixJob, 20],
  ["ruby_matrix", rubyMatrixJob, 20],
  ["rails_matrix", railsMatrixJob, 20],
  ["javascript", javascriptJob, 30],
  ["docker_development_setup", dockerDevelopmentSetupJob, 40],
  ["gem_package", gemPackageJob, 15]
]
const expectedWorkflowJobNames = workflowJobExecutionPolicies.map(([jobName]) => jobName).sort()
const actualWorkflowJobNames = workflowTopLevelJobNames(workflowSource).sort()

assert(
  JSON.stringify(actualWorkflowJobNames) === JSON.stringify(expectedWorkflowJobNames),
  `${workflowPath} job execution policy inventory: expected ${expectedWorkflowJobNames.join(", ")}; actual ${actualWorkflowJobNames.join(", ")}`
)
workflowJobExecutionPolicies.forEach(([jobName, jobSource, timeoutMinutes]) => {
  assertJobExecutionPolicy(jobName, jobSource, timeoutMinutes)
})

const nonPullRequestDefaultOutputs = {
  docs_only: false,
  mockups_changed: false,
  browser_smoke_changed: false,
  package_sensitive: true,
  docker_setup_sensitive: true,
  docs_entrypoint_sensitive: true,
  ci_policy_sensitive: true
}
const nonPullRequestDefaultOutputBlock = workflowNonPullRequestDefaultOutputBlock(changesJob)
Object.entries(nonPullRequestDefaultOutputs).forEach(([key, value]) => {
  assertDefaultWorkflowOutput(nonPullRequestDefaultOutputBlock, key, value)
})

const workflowOutputKeys = workflowChangesOutputKeys(changesJob)
const nonPullRequestDefaultOutputKeys = workflowDefaultOutputKeys(nonPullRequestDefaultOutputBlock)
const policyRuntimeOutputKeys = Object.keys(classifyChangedFiles([]))
const policyCliKeys = policyCliOutputKeys()

assertSameOutputKeySet(
  `${workflowPath} jobs.changes.outputs`,
  workflowOutputKeys,
  "classifyChangedFiles result",
  policyRuntimeOutputKeys
)
assertSameOutputKeySet(
  `${workflowPath} jobs.changes non-pull-request defaults`,
  nonPullRequestDefaultOutputKeys,
  `${workflowPath} jobs.changes.outputs`,
  workflowOutputKeys
)
assertSameOutputKeySet(
  `${policyCliPath} CLI output`,
  policyCliKeys,
  "classifyChangedFiles result",
  policyRuntimeOutputKeys
)

assertOrdered(
  changesJob,
  'if [ "${{ github.event_name }}" != "pull_request" ]; then',
  'git fetch origin "${{ github.base_ref }}" --depth=1',
  `${workflowPath} jobs.changes must emit non-pull-request defaults before pull request fetch`
)

const changedFileDetectionSignals = [
  ["base ref fetch", 'git fetch origin "${{ github.base_ref }}" --depth=1'],
  ["merge-base branch", 'git merge-base "origin/${{ github.base_ref }}" HEAD'],
  ["three-dot diff", 'git diff --name-only "origin/${{ github.base_ref }}"...HEAD'],
  ["fallback diff", 'git diff --name-only "origin/${{ github.base_ref }}" HEAD'],
  ["policy invocation", 'node script/ci_changed_files_policy.mjs <<EOF >> "$GITHUB_OUTPUT"'],
  ["changed files heredoc", "$changed_files"]
]

changedFileDetectionSignals.forEach(([label, signal]) => {
  assertIncludes(changesJob, signal, `${workflowPath} jobs.changes changed-file detection ${label}`)
})

assertOrdered(
  changesJob,
  'git fetch origin "${{ github.base_ref }}" --depth=1',
  'git merge-base "origin/${{ github.base_ref }}" HEAD',
  `${workflowPath} jobs.changes must fetch the base ref before merge-base detection`
)

assertOrdered(
  changesJob,
  'git merge-base "origin/${{ github.base_ref }}" HEAD',
  'git diff --name-only "origin/${{ github.base_ref }}"...HEAD',
  `${workflowPath} jobs.changes must try merge-base before the three-dot diff`
)

assertOrdered(
  changesJob,
  'git diff --name-only "origin/${{ github.base_ref }}"...HEAD',
  'git diff --name-only "origin/${{ github.base_ref }}" HEAD',
  `${workflowPath} jobs.changes must keep a fallback diff after the three-dot diff path`
)

assertOrdered(
  changesJob,
  'git diff --name-only "origin/${{ github.base_ref }}" HEAD',
  'node script/ci_changed_files_policy.mjs <<EOF >> "$GITHUB_OUTPUT"',
  `${workflowPath} jobs.changes must pass the collected file list into the policy script`
)

const workflowActionMajorSignals = [
  ["changes", changesJob, "actions/checkout@v7"],
  ["lint", lintJob, "actions/checkout@v7"],
  ["pr_specs", prSpecsJob, "actions/checkout@v7"],
  ["pr_rails_matrix", prRailsMatrixJob, "actions/checkout@v7"],
  ["ruby_matrix", rubyMatrixJob, "actions/checkout@v7"],
  ["rails_matrix", railsMatrixJob, "actions/checkout@v7"],
  ["javascript", javascriptJob, "actions/checkout@v7"],
  ["docker_development_setup", dockerDevelopmentSetupJob, "actions/checkout@v7"],
  ["gem_package", gemPackageJob, "actions/checkout@v7"],
  ["lint", lintJob, "ruby/setup-ruby@v1"],
  ["pr_specs", prSpecsJob, "ruby/setup-ruby@v1"],
  ["pr_rails_matrix", prRailsMatrixJob, "ruby/setup-ruby@v1"],
  ["ruby_matrix", rubyMatrixJob, "ruby/setup-ruby@v1"],
  ["rails_matrix", railsMatrixJob, "ruby/setup-ruby@v1"],
  ["javascript", javascriptJob, "ruby/setup-ruby@v1"],
  ["gem_package", gemPackageJob, "ruby/setup-ruby@v1"],
  ["javascript", javascriptJob, "actions/setup-node@v7"]
]

workflowActionMajorSignals.forEach(([jobName, jobSource, action]) => {
  assertIncludes(
    jobSource,
    `uses: ${action}`,
    `${workflowPath} jobs.${jobName} workflow action major version signal`
  )
})

const lintJobSignals = [
  ["representative Ruby version", 'ruby-version: "3.3"'],
  ["Standard command", "run: bundle exec standardrb"]
]

lintJobSignals.forEach(([label, signal]) => {
  assertIncludes(
    lintJob,
    signal,
    `${workflowPath} jobs.lint ${label}`
  )
})

const prSpecsJobSignals = [
  ["representative Ruby version", 'ruby-version: "3.3"'],
  ["RSpec command", "run: bundle exec rspec"]
]

prSpecsJobSignals.forEach(([label, signal]) => {
  assertIncludes(
    prSpecsJob,
    signal,
    `${workflowPath} jobs.pr_specs ${label}`
  )
})

const matrixFailFastPolicyJobs = [
  ["pr_rails_matrix", prRailsMatrixJob],
  ["ruby_matrix", rubyMatrixJob],
  ["rails_matrix", railsMatrixJob]
]

matrixFailFastPolicyJobs.forEach(([jobName, jobSource]) => {
  assertMatrixFailFastPolicy(jobName, jobSource)
})

assertIncludes(
  javascriptJob,
  'node-version: "22"',
  `${workflowPath} jobs.javascript setup-node representative Node version`
)
assert(
  packageJson.engines?.node === "22.x",
  `${packagePath} engines.node must remain aligned with the CI JavaScript job Node major`
)

const rubyMatrixVersionSignals = [
  ["ruby_matrix", rubyMatrixJob, 'ruby-version:'],
  ["ruby_matrix", rubyMatrixJob, '- "3.2"'],
  ["ruby_matrix", rubyMatrixJob, '- "3.3"'],
  ["rails_matrix", railsMatrixJob, 'ruby-version: "3.2"'],
  ["rails_matrix", railsMatrixJob, 'ruby-version: "3.3"'],
  ["pr_rails_matrix", prRailsMatrixJob, 'ruby-version: "3.2"'],
  ["pr_rails_matrix", prRailsMatrixJob, 'ruby-version: "3.3"']
]

rubyMatrixVersionSignals.forEach(([jobName, jobSource, signal]) => {
  assertIncludes(
    jobSource,
    signal,
    `${workflowPath} jobs.${jobName} representative Ruby version signal`
  )
})

const javascriptJobNpmScripts = [
  "test:docs-entrypoints",
  "test:js:core",
  "test:browser"
]

javascriptJobNpmScripts.forEach((scriptName) => {
  assertIncludes(
    javascriptJob,
    `npm run ${scriptName}`,
    `${workflowPath} jobs.javascript npm script command`
  )
  assertPackageScript(scriptName)
})

const gemPackageJobSignals = [
  ["gem build command", "run: gem build tree_view.gemspec"],
  ["package contents checker command", "run: ruby script/check_gem_package_contents.rb tree_view-*.gem"],
  ["built gem install smoke command", "run: gem install tree_view-*.gem"],
  ["built gem require smoke command", 'run: ruby -e "require \'tree_view\'"']
]

gemPackageJobSignals.forEach(([label, signal]) => {
  assertIncludes(
    gemPackageJob,
    signal,
    `${workflowPath} jobs.gem_package ${label}`
  )
})

assertOrdered(
  gemPackageJob,
  "run: gem build tree_view.gemspec",
  "run: ruby script/check_gem_package_contents.rb tree_view-*.gem",
  `${workflowPath} jobs.gem_package must build the gem before package contents verification`
)
assertOrdered(
  gemPackageJob,
  "run: ruby script/check_gem_package_contents.rb tree_view-*.gem",
  "run: gem install tree_view-*.gem",
  `${workflowPath} jobs.gem_package must verify package contents before installing the built gem`
)
assertOrdered(
  gemPackageJob,
  "run: gem install tree_view-*.gem",
  'run: ruby -e "require \'tree_view\'"',
  `${workflowPath} jobs.gem_package must install the built gem before the require smoke`
)

const docsEntrypointsScript = packageScript("test:docs-entrypoints")
const ciPolicyScript = packageScript("test:ci-policy")
const entrypointsScript = packageScript("test:entrypoints")
const jsCoreScript = packageScript("test:js:core")

const docsEntrypointsSignals = [
  ["package script uses docs entrypoint suite", docsEntrypointsScript, "node script/test_docs_entrypoint_suite.mjs"],
  ["suite registers public API transfer guard", docsEntrypointSuiteSource, "script/guard_public_api_transfer_integration_signals.mjs"],
  ["suite registers manifest-backed public surface guard", docsEntrypointSuiteSource, "script/test_manifest_backed_public_surface_signals.mjs"],
  ["suite registers controller registration docs signal", docsEntrypointSuiteSource, "script/check_controller_registration_docs_signals.mjs"]
]

docsEntrypointsSignals.forEach(([label, source, signal]) => {
  assertIncludes(
    source,
    signal,
    `${packagePath} scripts.test:docs-entrypoints ${label}`
  )
})

const packageGuardSuiteCompositionSignals = [
  ["test:entrypoints runs docs entrypoint guard suite", entrypointsScript, "npm run test:docs-entrypoints"],
  ["test:entrypoints runs CI policy guard suite", entrypointsScript, "npm run test:ci-policy"],
  ["test:entrypoints keeps Node source guard", entrypointsScript, "npm run test:node-version-sources"],
  ["test:entrypoints keeps Ruby source guard", entrypointsScript, "npm run test:ruby-version-sources"],
  ["test:js:core runs entrypoint guard suite before npm test", jsCoreScript, "npm run test:entrypoints"],
  ["test:js:core reaches npm test", jsCoreScript, "npm test"]
]

packageGuardSuiteCompositionSignals.forEach(([label, source, signal]) => {
  assertIncludes(
    source,
    signal,
    `${packagePath} guard suite script composition ${label}`
  )
})

assertOrdered(
  docsEntrypointSuiteSource,
  "script/test_public_api_docs_signals.mjs",
  "script/guard_public_api_transfer_integration_signals.mjs",
  `${docsEntrypointSuitePath} must run public API docs signals before transfer integration signals`
)
assertOrdered(
  docsEntrypointSuiteSource,
  "script/guard_public_api_transfer_integration_signals.mjs",
  "script/test_manifest_backed_public_surface_signals.mjs",
  `${docsEntrypointSuitePath} must run transfer integration signals before manifest-backed public surface signals`
)
assertOrdered(
  ciPolicyScript,
  "node script/test_ci_policy_suite.mjs --self-test",
  "node script/test_ci_policy_suite.mjs",
  `${packagePath} scripts.test:ci-policy must run the suite self-test before the CI policy suite`
)
assertOrdered(
  jsCoreScript,
  "npm run test:entrypoints",
  "npm test",
  `${packagePath} scripts.test:js:core must run entrypoint guards before npm test`
)

console.log("Checked CI workflow trigger policy signals.")
console.log("Checked CI workflow permissions policy signals.")
console.log("Checked CI workflow concurrency policy signals.")
console.log(`Checked ${workflowJobExecutionPolicies.length} CI job runner and timeout policies.`)
console.log("Checked CI changed-file detection workflow signals.")
console.log("Checked CI changed-file output key-set synchronization signals.")
console.log(`Checked ${Object.keys(nonPullRequestDefaultOutputs).length} non-pull-request workflow default outputs.`)
console.log(`Checked ${workflowActionMajorSignals.length} workflow action major version signals.`)
console.log(`Checked ${lintJobSignals.length} CI lint job representative signals.`)
console.log(`Checked ${prSpecsJobSignals.length} CI pr_specs job representative signals.`)
console.log(`Checked ${matrixFailFastPolicyJobs.length} CI matrix fail-fast policy signals.`)
console.log(`Checked ${rubyMatrixVersionSignals.length} representative Ruby workflow version signals.`)
console.log(`Checked ${javascriptJobNpmScripts.length} JavaScript job npm script commands and package.json scripts.`)
console.log(`Checked ${gemPackageJobSignals.length} gem package build, verification, install, and require smoke signals.`)
console.log(`Checked ${docsEntrypointsSignals.length} docs-entrypoints package and suite command signals.`)
console.log(`Checked ${packageGuardSuiteCompositionSignals.length} package guard suite composition signals.`)
