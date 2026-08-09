import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import {
  evaluatePublicContractReleaseTrail,
  parseUnifiedDiff,
  PUBLIC_CONTRACT_RUNTIME_PATHS
} from "./ci_public_contract_release_trail.mjs"

const packageScripts = JSON.parse(readFileSync("package.json", "utf8")).scripts
const workflowSource = readFileSync(".github/workflows/ci.yml", "utf8")
const releaseDocs = [
  readFileSync("docs/en/release.md", "utf8"),
  readFileSync("docs/ja/release.md", "utf8")
]

function patch(path, { oldPath = path, newPath = path, addedLines = [], removedLines = [] } = {}) {
  return { path: newPath, oldPath, newPath, addedLines, removedLines }
}

function changelog(...addedLines) {
  return patch("CHANGELOG.md", { addedLines })
}

function evaluate(files, patches = []) {
  return evaluatePublicContractReleaseTrail({ files, patches })
}

const manifestOnly = evaluate(["config/public_api_manifest.yml"])
assert.equal(manifestOnly.ok, false)
assert.equal(manifestOnly.status, "missing_changelog")
assert.deepEqual(manifestOnly.runtimePaths, ["config/public_api_manifest.yml"])

const docsOnly = evaluate(["docs/en/public-api.md", "docs/ja/public-api.md"])
assert.equal(docsOnly.ok, true)
assert.equal(docsOnly.status, "skipped")

const emptyChangelog = evaluate(
  ["config/public_api_manifest.yml", "CHANGELOG.md"],
  [patch("config/public_api_manifest.yml", { addedLines: ["new_option"] }), patch("CHANGELOG.md")]
)
assert.equal(emptyChangelog.ok, false)
assert.equal(emptyChangelog.status, "missing_changelog_entry")

for (const runtimePath of PUBLIC_CONTRACT_RUNTIME_PATHS) {
  const withChangelog = evaluate(
    [runtimePath, "CHANGELOG.md"],
    [patch(runtimePath, { addedLines: ["new public contract signal"] }), changelog("- Added the public contract signal.")]
  )
  assert.equal(withChangelog.ok, true, `${runtimePath} plus a substantive CHANGELOG entry must pass`)
  assert.equal(withChangelog.status, "complete")
}

const naturalExportRemoval = patch("app/javascript/tree_view/index.js", {
  removedLines: ["export { LegacyTreeController }"]
})
const categoryOnly = changelog("- Removed LegacyTreeController.")
const missingMigrationAction = evaluate(
  ["app/javascript/tree_view/index.js", "CHANGELOG.md"],
  [naturalExportRemoval, categoryOnly]
)
assert.equal(missingMigrationAction.ok, false)
assert.equal(missingMigrationAction.status, "missing_migration_evidence")
assert.equal(missingMigrationAction.migrationReviewRequired, true)

const withMigrationAction = evaluate(
  ["app/javascript/tree_view/index.js", "CHANGELOG.md"],
  [naturalExportRemoval, changelog("- Removed LegacyTreeController; migrate to TreeViewClientController instead.")]
)
assert.equal(withMigrationAction.ok, true)
assert.equal(withMigrationAction.migrationReviewRequired, true)

const oneLanguageMigrationGuide = evaluate(
  ["app/javascript/tree_view/index.js", "CHANGELOG.md", "docs/en/migration.md"],
  [
    naturalExportRemoval,
    categoryOnly,
    patch("docs/en/migration.md", { addedLines: ["Use TreeViewClientController instead."] })
  ]
)
assert.equal(oneLanguageMigrationGuide.ok, false)
assert.equal(oneLanguageMigrationGuide.status, "missing_migration_evidence")

const synchronizedMigrationGuides = evaluate(
  [
    "app/javascript/tree_view/index.js",
    "CHANGELOG.md",
    "docs/en/migration.md",
    "docs/ja/migration.md"
  ],
  [
    naturalExportRemoval,
    categoryOnly,
    patch("docs/en/migration.md", { addedLines: ["Use TreeViewClientController instead."] }),
    patch("docs/ja/migration.md", { addedLines: ["TreeViewClientController へ移行してください。"] })
  ]
)
assert.equal(synchronizedMigrationGuides.ok, true)

const renamedAway = evaluate(
  ["app/javascript/tree_view/public.js", "CHANGELOG.md"],
  [
    patch("app/javascript/tree_view/public.js", {
      oldPath: "app/javascript/tree_view/index.js",
      newPath: "app/javascript/tree_view/public.js",
      removedLines: ["export { TreeViewClientController }"]
    }),
    changelog("- Renamed the package entrypoint; migrate imports to tree_view/public.js instead.")
  ]
)
assert.equal(renamedAway.ok, true)
assert.deepEqual(renamedAway.runtimePaths, ["app/javascript/tree_view/index.js"])
assert.equal(renamedAway.migrationReviewRequired, true)

const unrelatedChange = evaluate(["lib/tree_view/tree.rb"])
assert.equal(unrelatedChange.ok, true)
assert.equal(unrelatedChange.status, "skipped")

const parsedPatches = parseUnifiedDiff(`diff --git a/app/javascript/tree_view/index.js b/app/javascript/tree_view/public.js
similarity index 90%
rename from app/javascript/tree_view/index.js
rename to app/javascript/tree_view/public.js
--- a/app/javascript/tree_view/index.js
+++ b/app/javascript/tree_view/public.js
@@ -1 +1 @@
-export { LegacyTreeController }
+export { TreeViewClientController }
diff --git a/CHANGELOG.md b/CHANGELOG.md
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -1,0 +2 @@
+- Migrate to TreeViewClientController instead.
`)
assert.deepEqual(parsedPatches, [
  {
    path: "app/javascript/tree_view/public.js",
    oldPath: "app/javascript/tree_view/index.js",
    newPath: "app/javascript/tree_view/public.js",
    addedLines: ["export { TreeViewClientController }"],
    removedLines: ["export { LegacyTreeController }"]
  },
  {
    path: "CHANGELOG.md",
    oldPath: "CHANGELOG.md",
    newPath: "CHANGELOG.md",
    addedLines: ["- Migrate to TreeViewClientController instead."],
    removedLines: []
  }
])

assert.equal(
  packageScripts["test:public-contract-release-trail"],
  "node script/test_ci_public_contract_release_trail.mjs"
)
assert.match(
  workflowSource,
  /node script\/ci_public_contract_release_trail\.mjs --base "origin\/\$\{\{ github\.base_ref \}\}" --head HEAD/
)

for (const source of releaseDocs) {
  assert.match(source, /test:public-contract-release-trail/)
  assert.match(source, /config\/public_api_manifest\.yml/)
  assert.match(source, /app\/javascript\/tree_view\/index\.js/)
  assert.match(source, /app\/javascript\/tree_view\/index\.d\.ts/)
}

console.log("Public contract release trail guard fixtures passed.")
