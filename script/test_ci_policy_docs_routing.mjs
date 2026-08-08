import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { classifyChangedFiles } from "./ci_changed_files_policy.mjs"

const dependabotPath = ".github/dependabot.yml"
const ciWorkflowPath = ".github/workflows/ci.yml"
const ciPolicyDocsPaths = [
  "docs/en/ci-policy-suite.md",
  "docs/ja/ci-policy-suite.md"
]
const workflowDefinitionPaths = [
  ".github/workflows/package-verification.yml",
  ".github/workflows/docker-smoke.yaml"
]
const ciPolicyDocsRoutingScriptPath = "script/test_ci_policy_docs_routing.mjs"
const workflowSource = readFileSync(ciWorkflowPath, "utf8")

const expected = {
  docs_only: true,
  mockups_changed: false,
  browser_smoke_changed: false,
  package_sensitive: true,
  docker_setup_sensitive: false,
  docs_entrypoint_sensitive: true,
  ci_policy_sensitive: true
}

const expectedWorkflowDefinitionChange = {
  docs_only: false,
  mockups_changed: false,
  browser_smoke_changed: false,
  package_sensitive: true,
  docker_setup_sensitive: true,
  docs_entrypoint_sensitive: false,
  ci_policy_sensitive: true
}

const expectedCiPolicyScriptChange = {
  docs_only: false,
  mockups_changed: false,
  browser_smoke_changed: false,
  package_sensitive: false,
  docker_setup_sensitive: false,
  docs_entrypoint_sensitive: false,
  ci_policy_sensitive: true
}

function policyCliOutput(input) {
  return execFileSync(process.execPath, ["script/ci_changed_files_policy.mjs"], {
    input,
    encoding: "utf8"
  })
}

function parsePolicyCliOutput(output) {
  return Object.fromEntries(
    output.trim().split(/\r?\n/).map((line) => {
      assert.match(line, /^[a-z_]+=(true|false)$/)
      const [key, value] = line.split("=")

      return [key, value === "true"]
    })
  )
}

function dependabotUpdateBlock(source, ecosystem) {
  const marker = `  - package-ecosystem: "${ecosystem}"\n`
  const start = source.indexOf(marker)

  assert.notEqual(start, -1, `${dependabotPath} must define a ${ecosystem} update lane`)

  const remaining = source.slice(start + marker.length)
  const nextUpdateOffset = remaining.search(/\n  - package-ecosystem: /)
  return nextUpdateOffset === -1 ? remaining : remaining.slice(0, nextUpdateOffset + 1)
}

function assertIncludes(source, needle, label) {
  assert.ok(source.includes(needle), `${label}: missing ${needle}`)
}

function routingOutputRow(source, output, label) {
  const row = source.split(/\r?\n/).find((line) => line.startsWith(`| \`${output}\``))

  assert.ok(row, `${label}: missing ${output} representative routing row`)

  return row
}

function assertRoutingOutputRowIncludes(source, output, signal, label) {
  assertIncludes(routingOutputRow(source, output, label), signal, `${label} ${output} representative routing row`)
}

function assertWorkflowDispatchNotConfigured() {
  assert.ok(
    !workflowSource.includes("workflow_dispatch:"),
    `${ciWorkflowPath}: unexpected workflow_dispatch trigger; update the trigger policy docs and review this as an intentional CI policy change before adding manual runs`
  )
}

function assertDependabotLaneSignal() {
  const dependabotSource = readFileSync(dependabotPath, "utf8")
  const githubActionsLane = dependabotUpdateBlock(dependabotSource, "github-actions")

  assertIncludes(githubActionsLane, 'directory: "/"', `${dependabotPath} github-actions lane directory`)
  assertIncludes(githubActionsLane, 'interval: "weekly"', `${dependabotPath} github-actions lane schedule interval`)
  assertIncludes(githubActionsLane, 'day: "monday"', `${dependabotPath} github-actions lane schedule day`)
  assertIncludes(githubActionsLane, 'time: "09:00"', `${dependabotPath} github-actions lane schedule time`)
  assertIncludes(githubActionsLane, 'timezone: "Asia/Tokyo"', `${dependabotPath} github-actions lane schedule timezone`)
  assertIncludes(githubActionsLane, "open-pull-requests-limit: 5", `${dependabotPath} github-actions lane open PR limit`)
}

function assertCiPolicyDocsDependabotSignals() {
  const docsSignals = [
    [
      "docs/en/ci-policy-suite.md",
      [
        ".github/dependabot.yml",
        "github-actions",
        "weekly Monday 09:00 Asia/Tokyo",
        "open pull request limit of 5",
        "action-major guard",
        "SHA pinning / allowed action policy"
      ]
    ],
    [
      "docs/ja/ci-policy-suite.md",
      [
        ".github/dependabot.yml",
        "github-actions",
        "weekly Monday 09:00 Asia/Tokyo",
        "open pull request limit 5",
        "action-major guard",
        "SHA pinning / allowed action policy"
      ]
    ]
  ]

  for (const [docsPath, signals] of docsSignals) {
    const docsSource = readFileSync(docsPath, "utf8")

    for (const signal of signals) {
      assertIncludes(docsSource, signal, `${docsPath} GitHub Actions Dependabot lane docs signal`)
    }
  }
}

function assertCiPolicyDocsDockerSetupSignals() {
  const docsSignals = [
    [
      "docs/en/ci-policy-suite.md",
      [
        "docker_setup_sensitive",
        "Dockerfile",
        "docker-compose.yml",
        "package.json",
        "package-lock.json",
        ".nvmrc",
        ".github/workflows/ci.yml",
        "docker_development_setup",
        "Node 22",
        "npm ci",
        "Docker image design"
      ]
    ],
    [
      "docs/ja/ci-policy-suite.md",
      [
        "docker_setup_sensitive",
        "Dockerfile",
        "docker-compose.yml",
        "package.json",
        "package-lock.json",
        ".nvmrc",
        ".github/workflows/ci.yml",
        "docker_development_setup",
        "Node 22",
        "npm ci",
        "Docker image design"
      ]
    ]
  ]

  for (const [docsPath, signals] of docsSignals) {
    const docsSource = readFileSync(docsPath, "utf8")

    for (const signal of signals) {
      assertIncludes(docsSource, signal, `${docsPath} Docker development setup lane docs signal`)
    }
  }
}

function assertCiPolicyDocsJobExecutionPolicySignals() {
  const jobTimeoutRows = [
    "| `changes` | 10 |",
    "| `lint` | 10 |",
    "| `pr_specs` | 15 |",
    "| `pr_rails_matrix` | 20 |",
    "| `ruby_matrix` | 20 |",
    "| `rails_matrix` | 20 |",
    "| `javascript` | 30 |",
    "| `docker_development_setup` | 40 |",
    "| `gem_package` | 15 |"
  ]
  const docsSignals = [
    [
      "docs/en/ci-policy-suite.md",
      [
        "## Job execution policy",
        "runs-on: ubuntu-latest",
        "timeout-minutes",
        "each matrix execution",
        "safety bound, not a normal-duration SLA",
        "intentionally skipped check",
        "Playwright browser dependencies",
        "required check names"
      ]
    ],
    [
      "docs/ja/ci-policy-suite.md",
      [
        "## Job execution policy",
        "runs-on: ubuntu-latest",
        "timeout-minutes",
        "各 matrix execution",
        "safety bound であり、通常所要時間の SLA ではありません",
        "intentionally skipped check",
        "Playwright browser dependency",
        "required check name"
      ]
    ]
  ]

  for (const [docsPath, signals] of docsSignals) {
    const docsSource = readFileSync(docsPath, "utf8")

    for (const signal of [...signals, ...jobTimeoutRows]) {
      assertIncludes(docsSource, signal, `${docsPath} job execution policy docs signal`)
    }
  }
}

function assertCiPolicyDocsChangedFileDetectionSignals() {
  const docsSignals = [
    [
      "docs/en/ci-policy-suite.md",
      [
        "## Pull request changed-file detection",
        "fetches the base branch",
        "merge base",
        "three-dot diff",
        'origin/${{ github.base_ref }}...HEAD',
        "falls back to `git diff --name-only origin/${{ github.base_ref }} HEAD`",
        "script/ci_changed_files_policy.mjs",
        "script/test_ci_workflow_changed_file_detection_signals.mjs",
        "classification logic"
      ]
    ],
    [
      "docs/ja/ci-policy-suite.md",
      [
        "## Pull Request changed-file detection",
        "base branch を fetch",
        "merge base",
        "three-dot diff",
        'origin/${{ github.base_ref }}...HEAD',
        "fallback として `git diff --name-only origin/${{ github.base_ref }} HEAD`",
        "script/ci_changed_files_policy.mjs",
        "script/test_ci_workflow_changed_file_detection_signals.mjs",
        "classification logic"
      ]
    ]
  ]

  for (const [docsPath, signals] of docsSignals) {
    const docsSource = readFileSync(docsPath, "utf8")

    for (const signal of signals) {
      assertIncludes(docsSource, signal, `${docsPath} changed-file detection docs signal`)
    }
  }
}

function assertCiPolicyDocsNonPullRequestDefaultOutputSignals() {
  const docsSignals = [
    [
      "docs/en/ci-policy-suite.md",
      [
        "For non-pull-request events such as `main` pushes",
        "does not derive a changed-file list",
        "Before the base-ref fetch and pull-request diff logic",
        "conservative default outputs with `docs_only=false`",
        "`mockups_changed=false`",
        "`browser_smoke_changed=false`",
        "`package_sensitive`, `docker_setup_sensitive`, `docs_entrypoint_sensitive`, and `ci_policy_sensitive` set to `true`",
        "default-branch evidence routing",
        "pull requests may use changed-file shortcuts",
        "main-push runs use the conservative defaults to run broad release-facing package, Docker setup, docs entrypoint, and CI policy gates",
        "without changing pull-request classifier behavior"
      ]
    ],
    [
      "docs/ja/ci-policy-suite.md",
      [
        "`main` push など Pull Request ではない event",
        "changed-file list を作りません",
        "base-ref fetch と Pull Request 用 diff logic より前",
        "保守的な default outputs として `docs_only=false`",
        "`mockups_changed=false`",
        "`browser_smoke_changed=false`",
        "`package_sensitive`、`docker_setup_sensitive`、`docs_entrypoint_sensitive`、`ci_policy_sensitive` を `true`",
        "default branch evidence routing",
        "Pull Request は changed-file shortcut を利用できます",
        "main-push run はこの保守的な default によって package、Docker setup、docs entrypoint、CI policy の広い release-facing gate を実行します",
        "Pull Request classifier の挙動を変えず"
      ]
    ]
  ]

  for (const [docsPath, signals] of docsSignals) {
    const docsSource = readFileSync(docsPath, "utf8")

    for (const signal of signals) {
      assertIncludes(docsSource, signal, `${docsPath} non-pull-request default output docs signal`)
    }
  }
}

function assertCiPolicyDocsTriggerPolicySignals() {
  const docsSignals = [
    [
      "docs/en/ci-policy-suite.md",
      [
        "## Workflow trigger policy",
        "`pull_request` event",
        "`push` events on `main`",
        "review-time signal for a proposed head",
        "post-merge release, package, and compatibility evidence",
        "Manual `workflow_dispatch` runs are not part of the current trigger policy",
        "current head SHA",
        "GitHub Actions rerun controls",
        "rather than adding a manual trigger",
        "does not use `pull_request_target`",
        "CI trust boundary",
        "read-only workflow permissions",
        "Trigger policy decides when the workflow starts",
        "permissions guard protects the `GITHUB_TOKEN` token scope",
        "concurrency guard limits stale pull request run cancellation"
      ]
    ],
    [
      "docs/ja/ci-policy-suite.md",
      [
        "## Workflow trigger policy",
        "`pull_request` event",
        "`main` への `push` event",
        "review-time signal",
        "post-merge release、package、compatibility evidence",
        "Manual `workflow_dispatch` run は現行 trigger policy に含めません",
        "current head SHA",
        "GitHub Actions rerun 操作",
        "manual trigger を追加するのではなく",
        "`pull_request_target` を使いません",
        "CI trust boundary",
        "read-only workflow permissions",
        "trigger policy は workflow の起動条件を決め",
        "permissions guard は `GITHUB_TOKEN` の token scope を守り",
        "concurrency guard は main-push evidence を cancel せず"
      ]
    ]
  ]

  for (const [docsPath, signals] of docsSignals) {
    const docsSource = readFileSync(docsPath, "utf8")

    for (const signal of signals) {
      assertIncludes(docsSource, signal, `${docsPath} workflow trigger policy docs signal`)
    }
  }
}

function assertCiPolicyDocsRoutingOutputSignals() {
  const sharedSignals = [
    "## Representative routing outputs",
    "`docs_only`",
    "`package_sensitive`",
    "`docs_entrypoint_sensitive`",
    "`ci_policy_sensitive`",
    "`docker_setup_sensitive`",
    "`mockups_changed`",
    "`browser_smoke_changed`",
    "README.md",
    "docs/**",
    "AGENTS.md",
    "Product Profile.md",
    "CHANGELOG.md",
    "Gemfile",
    "Gemfile.lock",
    "Rakefile",
    "tree_view.gemspec",
    "script/check_gem_package_contents.rb",
    "lib/**",
    "config/locales/**",
    "config/public_api_manifest.yml",
    "docs/en/ci-policy-suite.md",
    "docs/ja/ci-policy-suite.md",
    ".github/workflows/ci.yml",
    "script/ci_changed_files_policy.mjs",
    "script/test_ci_policy_suite.mjs",
    "script/test_ci_changed_files_policy.mjs",
    "focused `script/test_ci_*` guards",
    "lock dependency drift guard scripts",
    "Dockerfile",
    "docker-compose.yml",
    "package.json",
    "package-lock.json",
    ".nvmrc",
    "docs/mockups/**",
    "test/browser/**",
    "CI policy guard scripts",
    "routing policy",
    "full changed-file classifier mirror",
    "executable fixture",
    "source of truth"
  ]

  const docsSignals = [
    ["docs/en/ci-policy-suite.md", sharedSignals],
    ["docs/ja/ci-policy-suite.md", sharedSignals]
  ]

  for (const [docsPath, signals] of docsSignals) {
    const docsSource = readFileSync(docsPath, "utf8")

    for (const signal of signals) {
      assertIncludes(docsSource, signal, `${docsPath} routing output docs signal`)
    }

    assertRoutingOutputRowIncludes(
      docsSource,
      "package_sensitive",
      ".nvmrc",
      `${docsPath} missing .nvmrc package-sensitive Node install-source confidence routing signal`
    )
    assertRoutingOutputRowIncludes(
      docsSource,
      "package_sensitive",
      "lib/**",
      `${docsPath} missing lib/** package-sensitive routing signal`
    )
    assertRoutingOutputRowIncludes(
      docsSource,
      "package_sensitive",
      "config/locales/**",
      `${docsPath} missing config/locales/** package-sensitive routing signal`
    )
    assertRoutingOutputRowIncludes(
      docsSource,
      "docs_entrypoint_sensitive",
      "CHANGELOG.md",
      `${docsPath} missing CHANGELOG.md docs-entrypoint routing signal`
    )
    assertRoutingOutputRowIncludes(
      docsSource,
      "ci_policy_sensitive",
      "script/test_ci_policy_suite.mjs",
      `${docsPath} missing CI policy suite routing signal`
    )
    assertRoutingOutputRowIncludes(
      docsSource,
      "ci_policy_sensitive",
      "focused `script/test_ci_*` guards",
      `${docsPath} missing focused CI policy guard routing signal`
    )
    assertRoutingOutputRowIncludes(
      docsSource,
      "ci_policy_sensitive",
      "lock dependency drift guard scripts",
      `${docsPath} missing lock dependency drift guard routing signal`
    )
  }
}

function assertCiPolicyDocsDocsOnlyRetentionSignals() {
  const docsSignals = [
    [
      "docs/en/ci-policy-suite.md",
      [
        "## Docs-only check retention",
        "usual CI job names visible",
        "representative Rails compatibility matrix",
        "docs-only skip message",
        "mockups",
        "browser-smoke files",
        "docs-entrypoint-sensitive files",
        "CI-policy-sensitive files",
        "Package-facing docs",
        "README.md",
        "CHANGELOG.md",
        "docs/**",
        "AGENTS.md",
        "Product Profile.md",
        "repository-only maintainer entrypoint smoke",
        "not package-, docs-entrypoint-, or CI-policy-sensitive",
        "manual-review routed",
        "not as proof that every heavyweight lane ran"
      ]
    ],
    [
      "docs/ja/ci-policy-suite.md",
      [
        "## docs-only check retention",
        "通常の CI job 名は残します",
        "representative Rails compatibility matrix",
        "docs-only skip message",
        "mockup",
        "browser-smoke file",
        "docs-entrypoint-sensitive file",
        "CI-policy-sensitive file",
        "package-facing docs",
        "README.md",
        "CHANGELOG.md",
        "docs/**",
        "AGENTS.md",
        "Product Profile.md",
        "repository-only maintainer entrypoint smoke",
        "意図的に package-sensitive / docs-entrypoint-sensitive / CI-policy-sensitive にはしていません",
        "manual-review routed",
        "すべての heavyweight lane が実行された証明として扱わないでください"
      ]
    ]
  ]

  for (const [docsPath, signals] of docsSignals) {
    const docsSource = readFileSync(docsPath, "utf8")

    for (const signal of signals) {
      assertIncludes(docsSource, signal, `${docsPath} docs-only retention docs signal`)
    }
  }
}

function assertCiPolicyDocsCommandSurfaceSignals() {
  const docsSignals = [
    [
      "docs/en/ci-policy-suite.md",
      [
        "npm run test:ci-policy",
        "node script/test_ci_policy_suite.mjs --list",
        "node script/test_ci_policy_suite.mjs --only <group-or-index>",
        "node script/test_ci_policy_suite.mjs --self-test",
        "Unknown, ambiguous, or out-of-range values fail and print the available groups plus the `--list` hint",
        "fails with the missing script path"
      ]
    ],
    [
      "docs/ja/ci-policy-suite.md",
      [
        "npm run test:ci-policy",
        "node script/test_ci_policy_suite.mjs --list",
        "node script/test_ci_policy_suite.mjs --only <group-or-index>",
        "node script/test_ci_policy_suite.mjs --self-test",
        "unknown、ambiguous、範囲外の値は非 0 終了し、available groups と `--list` の案内を表示します",
        "missing script path を表示して失敗します"
      ]
    ]
  ]

  for (const [docsPath, signals] of docsSignals) {
    const docsSource = readFileSync(docsPath, "utf8")

    for (const signal of signals) {
      assertIncludes(docsSource, signal, `${docsPath} command surface docs signal`)
    }
  }
}

function assertMaintainerAndInstallationRoutingGuidanceSignals() {
  const docsSignals = [
    [
      "AGENTS.md",
      [
        "## Testing",
        "Package-facing docs paths (`README.md`, `CHANGELOG.md`, and `docs/**`) are package-sensitive",
        "README, `docs/**`, and `CHANGELOG.md` run `npm run test:docs-entrypoints`",
        "Repository-only maintainer docs stay outside package checks unless they are paired with package-facing docs",
        "`Product Profile.md` skips JavaScript when it is the only changed path",
        "`AGENTS.md` is CI-policy-sensitive and runs `npm run test:ci-policy` even when it is the only changed path"
      ]
    ],
    [
      "docs/en/installation.md",
      [
        "JavaScript checks through the changed-files policy",
        "npm run test:docs-entrypoints",
        "npm run test:browser",
        "npm run test:js:core",
        "docs-only pull requests keep the check names but skip the heavy Rails lanes"
      ]
    ],
    [
      "docs/ja/installation.md",
      [
        "changed-files policy による JavaScript checks",
        "npm run test:docs-entrypoints",
        "npm run test:browser",
        "npm run test:js:core",
        "docs-only PR では check name を維持したまま重い Rails lane を skip"
      ]
    ],
    [
      ".github/workflows/ci.yml",
      [
        "needs.changes.outputs.docs_entrypoint_sensitive == 'true'",
        "needs.changes.outputs.mockups_changed == 'true'",
        "needs.changes.outputs.browser_smoke_changed == 'true'",
        "needs.changes.outputs.docs_only != 'true'",
        "npm run test:docs-entrypoints",
        "npm run test:browser",
        "npm run test:js:core"
      ]
    ]
  ]

  for (const [docsPath, signals] of docsSignals) {
    const docsSource = readFileSync(docsPath, "utf8")

    for (const signal of signals) {
      assertIncludes(docsSource, signal, `${docsPath} maintainer and Installation CI routing guidance signal`)
    }
  }
}

function assertCiPolicyDocsSuiteRegistrationPolicySignals() {
  const docsSignals = [
    [
      "docs/en/ci-policy-suite.md",
      [
        "The package script runs the suite self-test first",
        "then runs the configured CI policy guard groups",
        "update the suite `checks` array or document an explicit exclusion before relying on CI",
        "self-test scans candidate scripts",
        "fails with the missing script path",
        "Candidate CI policy scripts must either be listed in the `checks` array or named in `ciPolicyScriptExclusions` with a short reason",
        "Keep exclusions narrow",
        "this suite's self-test entrypoint, not a direct guard group"
      ]
    ],
    [
      "docs/ja/ci-policy-suite.md",
      [
        "package script は先に suite self-test を実行し",
        "その後に設定済みの CI policy guard group を実行します",
        "suite の `checks` array を更新するか、明示的な exclusion を残してください",
        "self-test は candidate script を走査し",
        "missing script path を表示して失敗します",
        "Candidate CI policy scripts は、`checks` array に登録するか、短い理由つきで `ciPolicyScriptExclusions` に明示する必要があります",
        "exclusion は狭く保ってください",
        "この suite の self-test entrypoint なので除外されています"
      ]
    ]
  ]

  for (const [docsPath, signals] of docsSignals) {
    const docsSource = readFileSync(docsPath, "utf8")

    for (const signal of signals) {
      assertIncludes(docsSource, signal, `${docsPath} suite registration policy docs signal`)
    }
  }
}

for (const docsPath of ciPolicyDocsPaths) {
  assert.deepEqual(
    classifyChangedFiles([docsPath]),
    expected,
    `${docsPath} changes must run docs entrypoint, package, and CI policy guards while staying docs-only`
  )
}

for (const workflowPath of workflowDefinitionPaths) {
  assert.deepEqual(
    classifyChangedFiles([workflowPath]),
    expectedWorkflowDefinitionChange,
    `${workflowPath} changes must run package, Docker, and CI policy guards`
  )
}

assert.deepEqual(
  classifyChangedFiles(workflowDefinitionPaths),
  expectedWorkflowDefinitionChange,
  "multiple workflow definition changes must keep package, Docker, and CI policy guard routing"
)

assert.deepEqual(
  parsePolicyCliOutput(policyCliOutput(`${workflowDefinitionPaths.join("\n")}\n`)),
  expectedWorkflowDefinitionChange,
  "changed-file policy CLI must emit package, Docker, and CI policy routing for workflow definition changes"
)

assert.deepEqual(
  classifyChangedFiles(ciPolicyDocsPaths),
  expected,
  "bilingual CI policy docs changes must keep the same routing as each individual docs path"
)

assert.deepEqual(
  classifyChangedFiles([ciPolicyDocsRoutingScriptPath]),
  expectedCiPolicyScriptChange,
  `${ciPolicyDocsRoutingScriptPath} changes must run the CI policy guard directly`
)

assert.deepEqual(
  parsePolicyCliOutput(policyCliOutput(`${ciPolicyDocsPaths.join("\n")}\n`)),
  expected,
  "changed-file policy CLI must emit CI policy-sensitive routing for bilingual CI policy docs changes"
)

assert.deepEqual(
  parsePolicyCliOutput(policyCliOutput(`${ciPolicyDocsRoutingScriptPath}\n`)),
  expectedCiPolicyScriptChange,
  "changed-file policy CLI must emit CI policy-sensitive routing for CI policy docs routing guard changes"
)

assertWorkflowDispatchNotConfigured()
assertDependabotLaneSignal()
assertCiPolicyDocsDependabotSignals()
assertCiPolicyDocsDockerSetupSignals()
assertCiPolicyDocsJobExecutionPolicySignals()
assertCiPolicyDocsChangedFileDetectionSignals()
assertCiPolicyDocsNonPullRequestDefaultOutputSignals()
assertCiPolicyDocsTriggerPolicySignals()
assertCiPolicyDocsRoutingOutputSignals()
assertCiPolicyDocsDocsOnlyRetentionSignals()
assertCiPolicyDocsCommandSurfaceSignals()
assertMaintainerAndInstallationRoutingGuidanceSignals()
assertCiPolicyDocsSuiteRegistrationPolicySignals()

console.log(`Checked ${ciPolicyDocsPaths.length} CI policy docs routing paths.`)
console.log(`Checked ${workflowDefinitionPaths.length} workflow definition package/Docker routing paths.`)
console.log("Checked CI policy docs routing guard script routing.")
console.log("Checked workflow_dispatch remains outside the current workflow trigger policy.")
console.log("Checked GitHub Actions Dependabot lane config and docs signals.")
console.log("Checked Docker development setup CI docs signals.")
console.log(`Checked ${ciPolicyDocsPaths.length} CI job execution policy docs.`)
console.log("Checked pull request changed-file detection docs signals.")
console.log("Checked non-pull-request default output docs signals.")
console.log("Checked workflow trigger policy docs signals.")
console.log("Checked representative routing output docs signals.")
console.log("Checked docs-only check retention docs signals.")
console.log("Checked CI policy docs command surface signals.")
console.log("Checked AGENTS and bilingual Installation CI routing guidance signals.")
console.log("Checked CI policy suite registration policy docs signals.")
