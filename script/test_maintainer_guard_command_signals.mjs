import fs from "node:fs"

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"))
const docs = [
  ["docs/en/development.md", fs.readFileSync("docs/en/development.md", "utf8")],
  ["docs/ja/development.md", fs.readFileSync("docs/ja/development.md", "utf8")]
]

const requiredScripts = [
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
      "npm run test:repository-only-maintainer-entrypoints",
      "repository-only maintainer entry points",
      "checkout-only maintainer files rather than gem-packaged host-app API guides",
      "npm run test:manifest-surface-doc-roles",
      "manifest-backed public surface and reader-facing docs signal roles",
      "module methods, helper methods, GraphAdapter initializer keywords, and PathTreeBuilder node shapes",
      "node script/test_ci_policy_suite.mjs --list",
      "node script/test_ci_policy_suite.mjs --only <group-or-index>",
      "node script/test_ci_policy_suite.mjs --self-test",
      "CI policy suite targeted triage"
    ]
  ],
  [
    "docs/ja/development.md",
    [
      "npm run test:repository-only-maintainer-entrypoints",
      "repository-only maintainer entry points",
      "gem-packaged host-app API guide ではない checkout-only maintainer files",
      "npm run test:manifest-surface-doc-roles",
      "manifest-backed public surface と reader-facing docs signal の役割",
      "module methods、helper methods、GraphAdapter initializer keywords、PathTreeBuilder node shapes",
      "node script/test_ci_policy_suite.mjs --list",
      "node script/test_ci_policy_suite.mjs --only <group-or-index>",
      "node script/test_ci_policy_suite.mjs --self-test",
      "CI policy suite targeted triage"
    ]
  ]
]

const missingSignals = []

for (const [scriptName, command] of requiredScripts) {
  if (packageJson.scripts?.[scriptName] !== command) {
    missingSignals.push(`package.json scripts.${scriptName}: ${command}`)
  }

  const npmCommand = `npm run ${scriptName}`

  for (const [docPath, doc] of docs) {
    if (!doc.includes(npmCommand)) {
      missingSignals.push(`${docPath}: ${npmCommand}`)
    }
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
