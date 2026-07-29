import fs from "node:fs"

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"))
const docs = [
  ["docs/en/development.md", fs.readFileSync("docs/en/development.md", "utf8")],
  ["docs/ja/development.md", fs.readFileSync("docs/ja/development.md", "utf8")]
]

const requiredScripts = [
  ["test:ci-policy-suite", "node script/test_ci_policy_suite.mjs"],
  [
    "test:repository-only-maintainer-entrypoints",
    "node script/test_repository_only_maintainer_entrypoints.mjs"
  ],
  [
    "test:manifest-surface-doc-roles",
    "node script/test_manifest_surface_doc_roles.mjs"
  ]
]

const docSignals = [
  [
    "docs/en/development.md",
    [
      "node script/test_ci_policy_suite.mjs --self-test",
      "checks candidate docs entrypoint scripts against the suite's `checks` array and explicit exclusions",
      "script/test_repository_only_maintainer_entrypoints.mjs",
      "repository-only maintainer entry points",
      "without treating them as gem-packaged host-app API guides",
      "config/public_api_manifest.yml",
      "module methods",
      "helper methods",
      "GraphAdapter initializer keywords",
      "PathTreeBuilder node shapes"
    ]
  ],
  [
    "docs/ja/development.md",
    [
      "node script/test_ci_policy_suite.mjs --self-test",
      "candidate docs entrypoint script が suite の `checks` array または明示的な exclusion",
      "script/test_repository_only_maintainer_entrypoints.mjs",
      "repository-only maintainer entry points",
      "gem 同梱の host-app API guide として扱うものではありません",
      "config/public_api_manifest.yml",
      "module methods",
      "helper methods",
      "GraphAdapter initializer keywords",
      "PathTreeBuilder node shapes"
    ]
  ]
]

const missingSignals = []

for (const [scriptName, command] of requiredScripts) {
  if (packageJson.scripts?.[scriptName] !== command) {
    missingSignals.push(`package.json scripts.${scriptName}: ${command}`)
  }
}

for (const [docPath, signals] of docSignals) {
  const doc = docs.find(([path]) => path === docPath)?.[1]

  for (const signal of signals) {
    if (!doc?.includes(signal)) {
      missingSignals.push(`${docPath}: maintainer guard command signal ${signal}`)
    }
  }
}

if (missingSignals.length > 0) {
  console.error("[maintainer-guard-command-signals] missing command signals:")
  for (const signal of missingSignals) {
    console.error(`- ${signal}`)
  }
  process.exit(1)
}

console.log("[maintainer-guard-command-signals] maintainer guard command signals are present in package.json and Development docs")
