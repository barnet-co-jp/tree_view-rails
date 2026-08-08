import fs from "node:fs"

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"))
const readme = fs.readFileSync("README.md", "utf8")
const workflow = fs.readFileSync(".github/workflows/ci.yml", "utf8")
const docs = [
  ["docs/en/development.md", fs.readFileSync("docs/en/development.md", "utf8")],
  ["docs/ja/development.md", fs.readFileSync("docs/ja/development.md", "utf8")]
]
const releaseDocs = [
  ["docs/en/release.md", fs.readFileSync("docs/en/release.md", "utf8")],
  ["docs/ja/release.md", fs.readFileSync("docs/ja/release.md", "utf8")]
]
const ciPolicySuiteDocs = [
  [
    "docs/en/ci-policy-suite.md",
    fs.readFileSync("docs/en/ci-policy-suite.md", "utf8"),
    ["checks", "explicit exclusion"]
  ],
  [
    "docs/ja/ci-policy-suite.md",
    fs.readFileSync("docs/ja/ci-policy-suite.md", "utf8"),
    ["checks", "明示的な exclusion"]
  ]
]

const requiredMaintenanceScripts = [
  "test:docs-entrypoints",
  "test:host-app-extension-diagnostics-signals",
  "test:quality-docs-smoke-signals",
  "test:development-docs-commands",
  "test:ci-policy",
  "test:node-version-sources",
  "test:ruby-version-sources",
  "test:public-api-manifest-structure",
  "test:docs-i18n"
]

const optionalLocalCommands = [
  {
    scriptName: "test:vitest-ui",
    command: "npm run test:vitest-ui",
    docs: [
      [
        "docs/en/development.md",
        [
          "local Vitest UI",
          "maintainer convenience command",
          "not a replacement for CI-oriented `npm test`, `npm run test:js:core`, or `npm run test:js`"
        ]
      ],
      [
        "docs/ja/development.md",
        [
          "ローカルの Vitest UI",
          "maintainer 向けの便利コマンド",
          "CI 向けの `npm test`、`npm run test:js:core`、`npm run test:js` の代替ではありません"
        ]
      ]
    ]
  }
]

const requiredReadmeDevelopmentCommands = [
  "npm run test:js",
  "npm run test:entrypoints",
  "npm run test:docs-entrypoints",
  "npm run test:release-docs",
  "npm run test:release-package-contents",
  "npm run test:ci-policy"
]

const requiredReadmeReleaseTriageSignals = [
  "narrow local release triage aliases",
  "`Release docs signals`",
  "`Release package contents signals`",
  "not replacements for the full `npm run test:docs-entrypoints`, `npm run test:entrypoints`, or CI-required suite"
]

const requiredDockerSetupSignals = [
  "cp .env.example .env",
  "docker compose build",
  "docker compose run --rm app bundle install",
  "docker compose run --rm app npm ci",
  "Node 22",
  "npm",
  "lockfile-backed install path"
]

const requiredCiPolicySuiteCommandSignals = [
  "npm run test:ci-policy",
  "node script/test_ci_policy_suite.mjs --list",
  "node script/test_ci_policy_suite.mjs --only <group-or-index>",
  "node script/test_ci_policy_suite.mjs --self-test"
]

const requiredReleaseCiPolicySuiteSignals = [
  "ci-policy-suite.md",
  "node script/test_ci_policy_suite.mjs --list",
  "node script/test_ci_policy_suite.mjs --only <group-or-index>",
  "node script/test_ci_policy_suite.mjs --self-test"
]

const requiredDevelopmentDocsCommandSignals = [
  [
    "docs/en/development.md",
    [
      "npm run test:development-docs-commands",
      "Development docs command-signal guard",
      "`Development docs command signals` group",
      "npm run test:host-app-extension-diagnostics-signals",
      "host app extension / diagnostics guidance",
      "representative docs signal",
      "npm run test:quality-docs-smoke-signals",
      "docs quality / maintenance guidance",
      "docs-only PR triage"
    ]
  ],
  [
    "docs/ja/development.md",
    [
      "npm run test:development-docs-commands",
      "Development docs command signal",
      "`Development docs command signals` group",
      "npm run test:host-app-extension-diagnostics-signals",
      "host app extension / diagnostics guidance",
      "representative docs signal",
      "npm run test:quality-docs-smoke-signals",
      "docs quality / maintenance guidance",
      "docs-only PR triage"
    ]
  ]
]

const requiredDocsEntrypointSuiteCommandSignals = [
  [
    "docs/en/development.md",
    [
      "npm run test:docs-entrypoints -- --list",
      "npm run test:docs-entrypoints -- --only <group-or-index>",
      "node script/test_docs_entrypoint_suite.mjs --self-test",
      "Docs entrypoint suite option contract",
      "Unknown, ambiguous, or out-of-range values exit non-zero",
      "available groups plus the `--list` hint",
      "candidate docs entrypoint scripts against the suite's `checks` array and explicit exclusions",
      "Explicit exclusions are not silent skips",
      "registered through another npm script or suite",
      "explicit exclusion with its registration route and reason"
    ]
  ],
  [
    "docs/ja/development.md",
    [
      "npm run test:docs-entrypoints -- --list",
      "npm run test:docs-entrypoints -- --only <group-or-index>",
      "node script/test_docs_entrypoint_suite.mjs --self-test",
      "Docs entrypoint suite option contract",
      "unknown、ambiguous、範囲外の値は非 0 終了",
      "available groups と `--list` の案内",
      "candidate docs entrypoint script が suite の `checks` array または明示的な exclusion",
      "明示的な exclusion は silent skip ではありません",
      "別の npm script または suite 経由で登録",
      "登録経路と理由を持つ明示的な exclusion"
    ]
  ]
]

const requiredDevelopmentGuardResponsibilitySignals = [
  [
    "docs/en/development.md",
    [
      "The command hierarchy is",
      "`npm run test:js:core` adds Vitest",
      "`npm run test:js` adds Playwright",
      "CI-policy docs signals and importmap CI-policy routing belong to `npm run test:ci-policy`",
      "Development docs command signals belong to `npm run test:development-docs-commands`",
      "page-set parity belongs to `npm run test:docs-i18n`",
      "`Manifest-backed public surface signals`",
      "public constants, helper methods, setup generator paths, and event detail keys",
      "`Localized and hook docs signals`",
      "localized-name lookup key family",
      "`Render window and resource table docs signals`",
      "`render_window_metadata` and `resource_table_render_state_call`",
      "`script/test_public_api_manifest_structure.mjs` owns manifest shape",
      "`Host app extension diagnostics signals`",
      "`TreeView::Diagnostics.run`",
      "`validate_node_keys: true`",
      "`RenderState#validate_unique_dom_ids!`",
      "`script/test_diagnostics_docs_signals.mjs`",
      "`script/test_controller_entries_contract.mjs` separately compares manifest-backed `javascript_package_root.controller_registrations`",
      "runtime `TreeViewControllerEntries`",
      "`registerTreeViewControllers(application)`",
      "repository root with Ruby available"
    ]
  ],
  [
    "docs/ja/development.md",
    [
      "command hierarchy は",
      "`npm test` で Vitest を追加する `npm run test:js:core`",
      "`npm run test:browser` で Playwright を追加する `npm run test:js`",
      "CI-policy docs signal と importmap CI-policy routing は `npm run test:ci-policy`",
      "Development docs command signal は `npm run test:development-docs-commands`",
      "page-set parity は `npm run test:docs-i18n`",
      "`Manifest-backed public surface signals`",
      "public constants、helper methods、setup generator paths、event detail keys",
      "`Localized and hook docs signals`",
      "localized-name lookup key family",
      "`Render window and resource table docs signals`",
      "`render_window_metadata` / `resource_table_render_state_call`",
      "manifest shape は `script/test_public_api_manifest_structure.mjs`",
      "`Host app extension diagnostics signals`",
      "`TreeView::Diagnostics.run`",
      "`validate_node_keys: true`",
      "`RenderState#validate_unique_dom_ids!`",
      "`script/test_diagnostics_docs_signals.mjs`",
      "manifest-backed な `javascript_package_root.controller_registrations`",
      "runtime の `TreeViewControllerEntries`",
      "`registerTreeViewControllers(application)`",
      "Ruby が使える repository root"
    ]
  ]
]

const requiredDevelopmentCiPolicySignals = [
  [
    "docs/en/development.md",
    [
      "Pull requests run the fast Ruby checks and JavaScript checks",
      "Pushes to `main` also run the broader compatibility and release checks",
      "changed-files policy",
      "ci_policy_sensitive",
      "npm run test:ci-policy",
      "jobs.changes.outputs.*",
      "missing CLI output",
      "stale workflow reference"
    ]
  ],
  [
    "docs/ja/development.md",
    [
      "Pull Requestでは、日常的な変更を守る高速なRuby checksとJavaScript checksを実行します",
      "`main` へのpushでは、より広い互換性確認とrelease向けのchecksも実行します",
      "changed-files policy",
      "ci_policy_sensitive",
      "npm run test:ci-policy",
      "jobs.changes.outputs.*",
      "missing CLI output",
      "stale workflow reference"
    ]
  ]
]

const requiredNpmLockfileDriftRecoverySignals = [
  [
    "docs/en/development.md",
    [
      "npm lockfile drift guard",
      "`package-lock.json`",
      "`package.json`",
      "dependency or Node engine metadata",
      "`npm install`",
      "`npm ci`"
    ]
  ],
  [
    "docs/ja/development.md",
    [
      "npm lockfile drift guard",
      "`package-lock.json`",
      "`package.json`",
      "dependency や Node engine metadata",
      "`npm install`",
      "`npm ci`"
    ]
  ]
]

const requiredManifestStructureDuplicateKeySignals = [
  [
    "docs/en/development.md",
    [
      "`npm run test:public-api-manifest-structure`",
      "duplicate-key guardrails",
      "duplicate YAML keys",
      "manifest structure smoke",
      "silently overwrite a manifest section",
      "source-of-truth drift safety guard",
      "not as a public API adoption decision"
    ]
  ],
  [
    "docs/ja/development.md",
    [
      "`npm run test:public-api-manifest-structure`",
      "duplicate-key guardrails",
      "duplicate YAML keys",
      "manifest structure",
      "manifest section を silent overwrite",
      "source-of-truth drift safety guard",
      "public API の採用判断ではありません"
    ]
  ]
]

const requiredReleaseCiPolicySensitiveSignals = [
  [
    "docs/en/release.md",
    [
      "CI-policy-sensitive docs-only PRs run `npm run test:ci-policy`",
      "Docs-only PRs that are not docs-entrypoint-sensitive and do not touch mockups, CI-policy-sensitive, or browser-smoke-sensitive paths can skip JavaScript checks entirely",
      "changed-files policy"
    ]
  ],
  [
    "docs/ja/release.md",
    [
      "CI-policy-sensitive な docs-only PR では `npm run test:ci-policy`",
      "docs-entrypoint-sensitive でも CI-policy-sensitive でもなく、mockup / browser-smoke path も触らない docs-only PR は JavaScript checks を完全に skip できます",
      "changed-files policy"
    ]
  ]
]

const requiredWorkflowTriggerSignals = [
  "on:\n  pull_request:",
  "push:\n    branches:\n      - main"
]

const missingSignals = []

function docSource(docList, docPath) {
  return docList.find(([path]) => path === docPath)?.[1]
}

for (const scriptName of requiredMaintenanceScripts) {
  if (!packageJson.scripts?.[scriptName]) {
    missingSignals.push(`package.json scripts.${scriptName}`)
    continue
  }

  const command = `npm run ${scriptName}`

  for (const [docPath, doc] of docs) {
    if (!doc.includes(command)) {
      missingSignals.push(`${docPath}: ${command}`)
    }
  }
}

for (const optionalCommand of optionalLocalCommands) {
  if (!packageJson.scripts?.[optionalCommand.scriptName]) {
    missingSignals.push(`package.json optional local script ${optionalCommand.scriptName}`)
  }

  if (requiredMaintenanceScripts.includes(optionalCommand.scriptName)) {
    missingSignals.push(
      `script/test_development_docs_command_signals.mjs: optional local command ${optionalCommand.scriptName} must not be listed in requiredMaintenanceScripts because it is not a CI/release maintenance guard`
    )
  }

  for (const [docPath, signals] of optionalCommand.docs) {
    const doc = docSource(docs, docPath)

    if (!doc?.includes(optionalCommand.command)) {
      missingSignals.push(`${docPath}: optional local command ${optionalCommand.command}`)
    }

    for (const signal of signals) {
      if (!doc?.includes(signal)) {
        missingSignals.push(`${docPath}: optional local command boundary signal ${signal}`)
      }
    }
  }
}

for (const command of requiredReadmeDevelopmentCommands) {
  if (!readme.includes(command)) {
    missingSignals.push(`README.md Development command: ${command}`)
  }
}

for (const signal of requiredReadmeReleaseTriageSignals) {
  if (!readme.includes(signal)) {
    missingSignals.push(`README.md release narrow command signal ${signal}`)
  }
}

for (const signal of requiredDockerSetupSignals) {
  for (const [docPath, doc] of docs) {
    if (!doc.includes(signal)) {
      missingSignals.push(`${docPath}: Docker setup signal ${signal}`)
    }
  }
}

for (const [docPath, signals] of requiredDevelopmentDocsCommandSignals) {
  const doc = docSource(docs, docPath)

  for (const signal of signals) {
    if (!doc?.includes(signal)) {
      missingSignals.push(`${docPath}: Development docs command signal ${signal}`)
    }
  }
}

for (const [docPath, signals] of requiredDocsEntrypointSuiteCommandSignals) {
  const doc = docSource(docs, docPath)

  for (const signal of signals) {
    if (!doc?.includes(signal)) {
      missingSignals.push(`${docPath}: docs entrypoint suite command signal ${signal}`)
    }
  }
}

for (const [docPath, signals] of requiredDevelopmentGuardResponsibilitySignals) {
  const doc = docSource(docs, docPath)

  for (const signal of signals) {
    if (!doc?.includes(signal)) {
      missingSignals.push(`${docPath}: Development guard responsibility signal ${signal}`)
    }
  }
}

for (const [docPath, doc, registrationSignals] of ciPolicySuiteDocs) {
  for (const signal of requiredCiPolicySuiteCommandSignals) {
    if (!doc.includes(signal)) {
      missingSignals.push(`${docPath}: CI policy suite docs command signal ${signal}`)
    }
  }

  for (const signal of registrationSignals) {
    if (!doc.includes(signal)) {
      missingSignals.push(`${docPath}: CI policy suite registration signal ${signal}`)
    }
  }
}

for (const [docPath, doc] of releaseDocs) {
  for (const signal of requiredReleaseCiPolicySuiteSignals) {
    if (!doc.includes(signal)) {
      missingSignals.push(`${docPath}: CI policy suite release entrypoint signal ${signal}`)
    }
  }
}

for (const [docPath, signals] of requiredDevelopmentCiPolicySignals) {
  const doc = docSource(docs, docPath)

  for (const signal of signals) {
    if (!doc?.includes(signal)) {
      missingSignals.push(`${docPath}: CI policy trigger/routing signal ${signal}`)
    }
  }
}

for (const [docPath, signals] of requiredNpmLockfileDriftRecoverySignals) {
  const doc = docSource(docs, docPath)

  for (const signal of signals) {
    if (!doc?.includes(signal)) {
      missingSignals.push(`${docPath}: npm lockfile drift recovery docs signal ${signal}`)
    }
  }
}

for (const [docPath, signals] of requiredManifestStructureDuplicateKeySignals) {
  const doc = docSource(docs, docPath)

  for (const signal of signals) {
    if (!doc?.includes(signal)) {
      missingSignals.push(`${docPath}: manifest duplicate-key docs signal ${signal}`)
    }
  }
}

for (const [docPath, signals] of requiredReleaseCiPolicySensitiveSignals) {
  const doc = docSource(releaseDocs, docPath)

  for (const signal of signals) {
    if (!doc?.includes(signal)) {
      missingSignals.push(`${docPath}: CI policy-sensitive release docs signal ${signal}`)
    }
  }
}

for (const signal of requiredWorkflowTriggerSignals) {
  if (!workflow.includes(signal)) {
    missingSignals.push(`.github/workflows/ci.yml: CI workflow trigger signal ${signal}`)
  }
}

if (workflow.includes("pull_request_target")) {
  missingSignals.push(".github/workflows/ci.yml: CI workflow must not use pull_request_target for PR checks")
}

if (missingSignals.length > 0) {
  console.error("[development-docs-command-signals] missing maintenance command signals:")
  for (const signal of missingSignals) {
    console.error(`- ${signal}`)
  }
  process.exit(1)
}

console.log(
  `[development-docs-command-signals] ${requiredMaintenanceScripts.length} maintenance commands, ${optionalLocalCommands.length} optional local command boundary signals, ${requiredReadmeDevelopmentCommands.length} README Development commands, ${requiredReadmeReleaseTriageSignals.length} README release triage signals, ${requiredDockerSetupSignals.length} Docker setup signals, ${requiredDevelopmentDocsCommandSignals.length} Development docs command signal groups, ${requiredDocsEntrypointSuiteCommandSignals.length} docs entrypoint suite command signal groups, ${requiredCiPolicySuiteCommandSignals.length} CI policy suite command signals, ${requiredReleaseCiPolicySuiteSignals.length} release entrypoint signals, ${requiredDevelopmentCiPolicySignals.length} CI policy docs groups, ${requiredNpmLockfileDriftRecoverySignals.length} npm lockfile drift recovery docs groups, ${requiredManifestStructureDuplicateKeySignals.length} manifest duplicate-key docs groups, ${requiredReleaseCiPolicySensitiveSignals.length} release CI policy docs groups, and ${requiredWorkflowTriggerSignals.length} workflow trigger signals are present in package.json, workflow, and docs`
)
