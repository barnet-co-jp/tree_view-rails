import fs from "node:fs"

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"))
const docs = [
  ["docs/en/development.md", fs.readFileSync("docs/en/development.md", "utf8")],
  ["docs/ja/development.md", fs.readFileSync("docs/ja/development.md", "utf8")]
]

const expectedScripts = new Map([
  [
    "test:entrypoints-composition",
    "node script/test_entrypoints_package_script_composition.mjs"
  ],
  [
    "test:ci-policy-license-prelude",
    "node script/test_license_package_sensitive_signal.mjs"
  ],
  [
    "test:immutable-package-root-export-signals",
    "node script/test_immutable_package_root_export_signals.mjs"
  ]
])

const developmentDocsScript = packageJson.scripts?.["test:development-docs-commands"] || ""
const missingSignals = []

for (const [scriptName, command] of expectedScripts) {
  if (packageJson.scripts?.[scriptName] !== command) {
    missingSignals.push(`package.json scripts.${scriptName}: expected ${command}`)
  }
}

if (!developmentDocsScript.includes("node script/test_narrow_guard_commands.mjs")) {
  missingSignals.push(
    "package.json scripts.test:development-docs-commands: missing narrow guard command alias signal"
  )
}

if (!developmentDocsScript.includes("node script/test_entrypoints_package_script_composition.mjs")) {
  missingSignals.push(
    "package.json scripts.test:development-docs-commands: missing entrypoints package script composition guard"
  )
}

const entrypointsScript = packageJson.scripts?.["test:entrypoints"] || ""
if (!entrypointsScript.includes("node script/test_immutable_package_root_export_signals.mjs")) {
  missingSignals.push(
    "package.json scripts.test:entrypoints: missing immutable package-root export docs signal guard"
  )
}

const developmentDocSignals = [
  [
    "docs/en/development.md",
    [
      "npm run test:development-docs-commands",
      "Development docs command-signal guard",
      "`Development docs command signals` group",
      "npm run test:entrypoints-composition",
      "`test:entrypoints`, `test:js:core`, and `test:js` package script composition / ordering drift",
      "individual guard contents stay owned by their scripts",
      "npm run test:ci-policy-license-prelude",
      "standalone LICENSE package-sensitive prelude",
      "not a `script/test_ci_policy_suite.mjs` checks-array group",
      "npm run test:immutable-package-root-export-signals",
      "README / Public API / immutable export guide reader-facing docs signal",
      "Runtime export existence remains covered by `script/test_entrypoints.mjs`",
      "literal declaration shape remains covered by `script/test_declaration_literal_shapes.mjs`"
    ]
  ],
  [
    "docs/ja/development.md",
    [
      "npm run test:development-docs-commands",
      "Development docs command signal",
      "`Development docs command signals` group",
      "npm run test:entrypoints-composition",
      "`test:entrypoints`、`test:js:core`、`test:js` の package script composition / ordering drift",
      "個別 guard の内容はそれぞれの script が所有します",
      "npm run test:ci-policy-license-prelude",
      "standalone の LICENSE package-sensitive prelude",
      "`script/test_ci_policy_suite.mjs` の checks array group ではありません",
      "npm run test:immutable-package-root-export-signals",
      "README / Public API / immutable export guide の reader-facing docs signal",
      "Runtime export existence は引き続き `script/test_entrypoints.mjs` が確認",
      "literal declaration shape は `script/test_declaration_literal_shapes.mjs` が確認"
    ]
  ]
]

for (const [docPath, signals] of developmentDocSignals) {
  const doc = docs.find(([path]) => path === docPath)?.[1] || ""
  for (const signal of signals) {
    if (!doc.includes(signal)) {
      missingSignals.push(`${docPath}: missing narrow maintenance command doc signal ${signal}`)
    }
  }
}

if (missingSignals.length > 0) {
  console.error("[narrow-guard-commands] missing narrow maintenance command signals:")
  for (const signal of missingSignals) {
    console.error(`- ${signal}`)
  }
  process.exit(1)
}

console.log(
  `[narrow-guard-commands] ${expectedScripts.size} narrow guard command aliases and Development docs signals are present`
)
