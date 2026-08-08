import fs from "node:fs"

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"))
const docs = [
  ["docs/en/development.md", fs.readFileSync("docs/en/development.md", "utf8")],
  ["docs/ja/development.md", fs.readFileSync("docs/ja/development.md", "utf8")]
]

const requiredScripts = [
  [
    "test:public-api-entrypoint-signals",
    "node script/test_public_api_entrypoint_guard_signals.mjs"
  ],
  [
    "test:public-api-transfer-integration-signals",
    "node script/guard_public_api_transfer_integration_signals.mjs"
  ],
  [
    "test:host-lifecycle-no-detail-signals",
    "node script/test_host_lifecycle_no_detail_docs_signals.mjs"
  ],
  [
    "test:event-names-docs-signals",
    "node script/test_event_names_public_api_signals.mjs"
  ],
  [
    "test:controller-registration-docs-signals",
    "node script/check_controller_registration_docs_signals.mjs"
  ]
]

const docSignals = [
  "npm run test:public-api-entrypoint-signals",
  "npm run test:public-api-transfer-integration-signals",
  "npm run test:host-lifecycle-no-detail-signals",
  "npm run test:event-names-docs-signals",
  "npm run test:controller-registration-docs-signals",
  "script/test_entrypoints.mjs",
  "script/test_declaration_literal_shapes.mjs"
]

const missingSignals = []

for (const [scriptName, command] of requiredScripts) {
  if (packageJson.scripts?.[scriptName] !== command) {
    missingSignals.push(`package.json scripts.${scriptName}: ${command}`)
  }
}

for (const [docPath, doc] of docs) {
  for (const signal of docSignals) {
    if (!doc.includes(signal)) {
      missingSignals.push(`${docPath}: ${signal}`)
    }
  }
}

if (!packageJson.scripts?.["test:development-docs-commands"]?.includes("node script/check_public_guard_command_signals.mjs")) {
  missingSignals.push("package.json scripts.test:development-docs-commands")
}

if (missingSignals.length > 0) {
  console.error("[public-docs-guard-command-signals] missing signals:")
  for (const signal of missingSignals) {
    console.error(`- ${signal}`)
  }
  process.exit(1)
}

console.log("[public-docs-guard-command-signals] focused public docs guard commands are documented and wired")
