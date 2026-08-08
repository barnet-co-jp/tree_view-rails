import { readFileSync } from "node:fs"

const dependabotPath = ".github/dependabot.yml"
const workflowPath = ".github/workflows/ci.yml"
const actionSmokePath = "script/test_ci_workflow_changed_file_detection_signals.mjs"
const dependabot = readFileSync(dependabotPath, "utf8")
const workflow = readFileSync(workflowPath, "utf8")
const actionSmoke = readFileSync(actionSmokePath, "utf8")

const developmentDocs = [
  ["docs/en/development.md", readFileSync("docs/en/development.md", "utf8")],
  ["docs/ja/development.md", readFileSync("docs/ja/development.md", "utf8")]
]

const recoveryDocs = [
  ["docs/en/dependabot-bundler-recovery.md", readFileSync("docs/en/dependabot-bundler-recovery.md", "utf8")],
  ["docs/ja/dependabot-bundler-recovery.md", readFileSync("docs/ja/dependabot-bundler-recovery.md", "utf8")]
]

const missingSignals = []

function requireSignal(source, signal, label) {
  if (!source.includes(signal)) missingSignals.push(`${label}: ${signal}`)
}

function dependabotLane(ecosystem) {
  const escapedEcosystem = ecosystem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = dependabot.match(
    new RegExp(`  - package-ecosystem: "${escapedEcosystem}"(?<body>[\\s\\S]*?)(?=\\n  - package-ecosystem:|$)`)
  )

  if (!match) {
    missingSignals.push(`${dependabotPath}: missing Dependabot ecosystem lane ${ecosystem}`)
    return ""
  }

  return match[0]
}

for (const ecosystem of ["bundler", "github-actions"]) {
  const lane = dependabotLane(ecosystem)
  requireSignal(lane, 'interval: "weekly"', `${dependabotPath} ${ecosystem} schedule`)
  requireSignal(
    lane,
    "open-pull-requests-limit: 5",
    `${dependabotPath} ${ecosystem} missing Dependabot open PR limit signal`
  )
}

const sharedDevelopmentSignals = [
  "open-pull-requests-limit: 5",
  "queue-size boundary",
  "#2168",
  "#2494",
  "#2496",
  "`github-actions` update lane",
  "`npm run test:ci-policy`",
  "action-major",
  "`package-lock.json`",
  "`package.json`",
  "lockfile-only",
  "mergeability",
  "head SHA",
  "GitHub Actions",
  "combined status",
  "package-sensitive CI evidence",
  "`ruby/setup-ruby@v1`",
  "Bundler lockfile drift guard",
  "`npm run test:js:core`",
  "failure pattern",
  "security-review evidence",
  "recovery evidence",
  "`actions/setup-node`",
  "`cache: npm`",
  "`npm ci`",
  "install",
  "#2501"
]

for (const [docPath, doc] of developmentDocs) {
  for (const signal of sharedDevelopmentSignals) {
    requireSignal(doc, signal, `${docPath} missing Dependabot or npm cache boundary docs signal`)
  }
}

const sharedRecoverySignals = [
  "head SHA",
  "GitHub Actions workflow run number",
  "`ruby/setup-ruby@v1`",
  "Bundler lockfile drift guard",
  "`npm run test:js:core`",
  "pattern",
  "broad cleanup",
  "failure-recovery lane",
  "security-review lane",
  "upstream advisory",
  "package-sensitive evidence"
]

for (const [docPath, doc] of recoveryDocs) {
  for (const signal of sharedRecoverySignals) {
    requireSignal(doc, signal, `${docPath} missing Bundler recovery or security review responsibility signal`)
  }
}

requireSignal(
  actionSmoke,
  "workflowActionMajorSignals",
  `${actionSmokePath} missing action major smoke ownership signal`
)
requireSignal(
  actionSmoke,
  "actions/checkout@v7",
  `${actionSmokePath} missing representative checkout action major signal`
)
requireSignal(
  actionSmoke,
  "actions/setup-node@v7",
  `${actionSmokePath} missing representative setup-node action major signal`
)

const javascriptJobMatch = workflow.match(/  javascript:\n(?<body>[\s\S]*?)(?=\n  [a-z_]+:\n|$)/)
if (!javascriptJobMatch) {
  missingSignals.push(`${workflowPath}: missing javascript job for npm cache boundary`)
} else {
  const javascriptJob = javascriptJobMatch[0]
  requireSignal(javascriptJob, "uses: actions/setup-node@v7", `${workflowPath} javascript setup-node signal`)
  requireSignal(javascriptJob, "cache: npm", `${workflowPath} javascript missing npm cache workflow signal`)
  requireSignal(javascriptJob, "run: npm ci", `${workflowPath} javascript lockfile-backed install signal`)
}

if (missingSignals.length > 0) {
  console.error("[dependabot-maintenance-evidence] missing signals:")
  for (const signal of missingSignals) console.error(`- ${signal}`)
  process.exit(1)
}

console.log("[dependabot-maintenance-evidence] bilingual review, recovery, queue, action-major, and npm cache signals are aligned")
