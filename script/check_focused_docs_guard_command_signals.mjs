import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8")
}

const packageJson = JSON.parse(read("package.json"))
const focusedGuards = [
  {
    scriptName: "test:tree-view-rows-docs-signals",
    command: "node script/test_tree_view_rows_docs_signals.mjs",
    group: "tree_view_rows helper docs signals",
    signals: ["helper_option_keys.tree_view_rows", "tree_view_window", "virtual scrolling"]
  },
  {
    scriptName: "test:grouped-option-docs-signals",
    command: "node script/test_grouped_option_docs_signals.mjs",
    group: "RenderState grouped option docs signals",
    signals: ["grouped option manifest surface", "selection", "row-status"]
  },
  {
    scriptName: "test:public-api-exported-controller-class-docs-signals",
    command: "node script/test_public_api_exported_controller_class_docs_signals.mjs",
    group: "Public API exported controller class docs signals",
    signals: [
      "registerTreeViewControllers(application)",
      "script/test_entrypoints.mjs",
      "script/test_controller_entries_contract.mjs"
    ]
  },
  {
    scriptName: "test:readme-quick-start-signal",
    command: "node script/test_readme_quick_start_signal.mjs",
    group: "README quick start signal",
    signals: ["Controller / View / Row partial", "Installation"]
  },
  {
    scriptName: "test:docs-policy-signal-guards",
    command: "node script/test_docs_policy_signal_guards.mjs",
    group: "Docs policy signal guards",
    signals: ["repository-maintainer docs", "technical asset responsibility"]
  },
  {
    scriptName: "test:public-setup-surface-docs-signals",
    command: "node script/test_public_setup_surface_docs_signals.mjs",
    group: "Public setup surface docs signals",
    signals: ["setup generator", "persisted state", "installation-facing docs"]
  }
]

const developmentDocs = [
  {
    path: "docs/en/development.md",
    source: read("docs/en/development.md"),
    commonHeading: "## Common commands",
    heading: "### Focused docs guard commands",
    boundarySignals: [
      "focused triage commands",
      "not replacements for `npm run test:docs-entrypoints`",
      "do not change runtime behavior, public API surfaces, manifest schema, or host-app policy"
    ]
  },
  {
    path: "docs/ja/development.md",
    source: read("docs/ja/development.md"),
    commonHeading: "## よく使うコマンド",
    heading: "### Docs guard の focused command",
    boundarySignals: [
      "focused triage command",
      "`npm run test:docs-entrypoints` の代替ではなく",
      "runtime behavior、public API surface、manifest schema、host-app policy を変更するものではありません"
    ]
  }
]

const missingSignals = []

function extractSection(document, heading, docPath) {
  const start = document.indexOf(`${heading}\n`)
  if (start === -1) {
    missingSignals.push(`${docPath}: heading ${heading}`)
    return ""
  }

  const contentStart = start + heading.length + 1
  const nextHeading = document.indexOf("\n### ", contentStart)
  const nextTopLevelHeading = document.indexOf("\n## ", contentStart)
  const candidates = [nextHeading, nextTopLevelHeading].filter((index) => index >= 0)
  const end = candidates.length > 0 ? Math.min(...candidates) : document.length

  return document.slice(contentStart, end)
}

for (const { scriptName, command } of focusedGuards) {
  if (packageJson.scripts?.[scriptName] !== command) {
    missingSignals.push(`package.json scripts.${scriptName}: expected ${command}`)
  }
}

const aggregateCommand = "node script/check_focused_docs_guard_command_signals.mjs"
const aggregateParts = packageJson.scripts?.["test:development-docs-commands"]
  ?.split(" && ")
  .filter((command) => command === aggregateCommand) ?? []

if (aggregateParts.length !== 1) {
  missingSignals.push(
    `package.json scripts.test:development-docs-commands: expected ${aggregateCommand} exactly once`
  )
}

const expectedScriptNames = focusedGuards.map(({ scriptName }) => scriptName)

for (const doc of developmentDocs) {
  const commonCommandsSection = extractSection(doc.source, doc.commonHeading, doc.path)
  const focusedSection = extractSection(doc.source, doc.heading, doc.path)
  const commonCommandNames = [...commonCommandsSection.matchAll(/^npm run (test:[a-z0-9:-]+)$/gm)]
    .map((match) => match[1])
  const focusedCommandNames = [...focusedSection.matchAll(/^- `npm run (test:[a-z0-9:-]+)`/gm)]
    .map((match) => match[1])

  if (JSON.stringify(focusedCommandNames) !== JSON.stringify(expectedScriptNames)) {
    missingSignals.push(
      `${doc.path}: focused command inventory expected ${expectedScriptNames.join(", ")}; found ${focusedCommandNames.join(", ") || "none"}`
    )
  }

  for (const { scriptName, group, signals } of focusedGuards) {
    const commonOccurrences = commonCommandNames.filter((name) => name === scriptName).length
    const focusedOccurrences = focusedCommandNames.filter((name) => name === scriptName).length

    if (commonOccurrences !== 1) {
      missingSignals.push(
        `${doc.path}: Common commands must contain npm run ${scriptName} exactly once; found ${commonOccurrences}`
      )
    }

    if (focusedOccurrences !== 1) {
      missingSignals.push(
        `${doc.path}: focused section must contain npm run ${scriptName} exactly once; found ${focusedOccurrences}`
      )
    }

    for (const signal of [group, ...signals]) {
      if (!focusedSection.includes(signal)) {
        missingSignals.push(`${doc.path}: ${scriptName} focused scope signal ${signal}`)
      }
    }
  }

  for (const signal of doc.boundarySignals) {
    if (!focusedSection.includes(signal)) {
      missingSignals.push(`${doc.path}: focused command boundary signal ${signal}`)
    }
  }
}

if (missingSignals.length > 0) {
  console.error("[focused-docs-guard-command-signals] missing or unsynchronized signals:")
  for (const signal of missingSignals) {
    console.error(`- ${signal}`)
  }
  process.exit(1)
}

console.log(
  `[focused-docs-guard-command-signals] ${focusedGuards.length} package aliases and bilingual Development docs signals are synchronized`
)
