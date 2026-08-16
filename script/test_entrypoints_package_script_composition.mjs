import fs from "node:fs"

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"))
const testEntrypointsCommand = packageJson.scripts?.["test:entrypoints"]
const testJsCoreCommand = packageJson.scripts?.["test:js:core"]
const testJsCommand = packageJson.scripts?.["test:js"]

const requiredCommands = [
  "node script/test_entrypoints.mjs",
  "node script/test_package_root_resolution.mjs",
  "node script/test_controller_entries_contract.mjs",
  "node script/test_declaration_literal_shapes.mjs",
  "node script/test_immutable_package_root_export_signals.mjs",
  "node script/test_render_state_callback_builder_docs_signals.mjs",
  "npm run test:public-api-manifest-structure",
  "npm run test:css-custom-property-manifest",
  "npm run test:toggle-icons-docs",
  "npm run test:docs-entrypoints",
  "npm run test:ci-policy",
  "npm run test:node-version-sources",
  "npm run test:ruby-version-sources"
]

const requiredScriptComposition = [
  {
    scriptName: "test:js:core",
    command: testJsCoreCommand,
    requiredCommands: ["npm run test:entrypoints", "npm test"]
  },
  {
    scriptName: "test:js",
    command: testJsCommand,
    requiredCommands: ["npm run test:js:core", "npm run test:browser"]
  }
]

const missingCommands = []
const outOfOrderCommands = []

function assertOrderedCommands({ label, command, requiredCommands }) {
  if (typeof command !== "string" || command.trim() === "") {
    missingCommands.push(`package.json scripts.${label}`)
    return
  }

  let lastCommandIndex = -1

  for (const requiredCommand of requiredCommands) {
    const commandIndex = command.indexOf(requiredCommand)

    if (commandIndex === -1) {
      missingCommands.push(`package.json scripts.${label}: ${requiredCommand}`)
      continue
    }

    if (commandIndex < lastCommandIndex) {
      outOfOrderCommands.push(`package.json scripts.${label}: ${requiredCommand}`)
      continue
    }

    lastCommandIndex = commandIndex
  }
}

assertOrderedCommands({
  label: "test:entrypoints",
  command: testEntrypointsCommand,
  requiredCommands
})

for (const scriptComposition of requiredScriptComposition) {
  assertOrderedCommands({
    label: scriptComposition.scriptName,
    command: scriptComposition.command,
    requiredCommands: scriptComposition.requiredCommands
  })
}

if (missingCommands.length > 0 || outOfOrderCommands.length > 0) {
  console.error("[entrypoints-package-script-composition] package.json JavaScript test script composition drift detected")

  if (missingCommands.length > 0) {
    console.error("[entrypoints-package-script-composition] missing commands:")
    for (const missingCommand of missingCommands) {
      console.error(`- ${missingCommand}`)
    }
  }

  if (outOfOrderCommands.length > 0) {
    console.error("[entrypoints-package-script-composition] commands out of expected order:")
    for (const outOfOrderCommand of outOfOrderCommands) {
      console.error(`- ${outOfOrderCommand}`)
    }
  }

  console.error("[entrypoints-package-script-composition] package.json scripts.test:entrypoints:")
  console.error(testEntrypointsCommand ?? "<missing>")
  console.error("[entrypoints-package-script-composition] package.json scripts.test:js:core:")
  console.error(testJsCoreCommand ?? "<missing>")
  console.error("[entrypoints-package-script-composition] package.json scripts.test:js:")
  console.error(testJsCommand ?? "<missing>")
  process.exit(1)
}

console.log(
  `[entrypoints-package-script-composition] package.json scripts.test:entrypoints includes ${requiredCommands.length} required maintenance commands in order`
)
console.log(
  "[entrypoints-package-script-composition] package.json scripts.test:js:core keeps test:entrypoints before npm test"
)
console.log(
  "[entrypoints-package-script-composition] package.json scripts.test:js keeps test:js:core before test:browser"
)
