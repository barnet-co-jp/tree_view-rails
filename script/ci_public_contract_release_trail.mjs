import { execFileSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const PUBLIC_CONTRACT_RUNTIME_PATHS = [
  "config/public_api_manifest.yml",
  "app/javascript/tree_view/index.js",
  "app/javascript/tree_view/index.d.ts"
]

export const PUBLIC_CONTRACT_GUIDANCE_PATHS = [
  "docs/en/public-api.md",
  "docs/ja/public-api.md"
]

const CHANGELOG_PATH = "CHANGELOG.md"
const MIGRATION_PATHS = ["docs/en/migration.md", "docs/ja/migration.md"]
const MIGRATION_REVIEW_PATTERN = /\b(?:breaking|deprecat(?:e|ed|ion)|remov(?:e|ed|al)|renam(?:e|ed))\b/i
const MIGRATION_ACTION_PATTERN = /\b(?:migrat(?:e|ion)|replace|upgrade|use\b.+\binstead)\b|移行|代替|置き換/i

export function evaluatePublicContractReleaseTrail({ files, patches = [] }) {
  const changedFiles = [...new Set(files.map((file) => file.trim()).filter(Boolean))]
  const touchedPaths = new Set([
    ...changedFiles,
    ...patches.flatMap((patch) => [patch.oldPath, patch.newPath, patch.path]).filter(Boolean)
  ])
  const runtimePaths = PUBLIC_CONTRACT_RUNTIME_PATHS.filter((file) => touchedPaths.has(file))
  const guidancePaths = PUBLIC_CONTRACT_GUIDANCE_PATHS.filter((file) => touchedPaths.has(file))

  if (runtimePaths.length === 0) {
    return {
      ok: true,
      status: "skipped",
      runtimePaths,
      migrationReviewRequired: false,
      message: guidancePaths.length > 0
        ? "public API guidance changed without a runtime contract surface; CHANGELOG review remains optional"
        : "no guarded public runtime contract surface changed"
    }
  }

  if (!changedFiles.includes(CHANGELOG_PATH)) {
    return failure("missing_changelog", runtimePaths, patches, `CHANGELOG.md is required when changing ${runtimePaths.join(", ")}`)
  }

  if (!hasSubstantiveChangelogEntry(patches)) {
    return failure("missing_changelog_entry", runtimePaths, patches, "CHANGELOG.md must add a substantive release-note entry for the public contract change")
  }

  const requiresMigrationReview = migrationReviewRequired(runtimePaths, patches)
  if (requiresMigrationReview && !hasMigrationEvidence(changedFiles, patches)) {
    return {
      ok: false,
      status: "missing_migration_evidence",
      runtimePaths,
      migrationReviewRequired: true,
      message: "breaking, deprecation, removal, or rename evidence requires a focused migration action in the CHANGELOG or both migration guides"
    }
  }

  return {
    ok: true,
    status: "complete",
    runtimePaths,
    migrationReviewRequired: requiresMigrationReview,
    message: requiresMigrationReview
      ? "CHANGELOG and migration action evidence accompany the public contract change"
      : "a substantive CHANGELOG entry accompanies the public contract change"
  }
}

export function parseUnifiedDiff(source) {
  const patches = []
  let currentPatch

  for (const line of source.split(/\r?\n/)) {
    const headerMatch = line.match(/^diff --git a\/(.+) b\/(.+)$/)
    if (headerMatch) {
      currentPatch = {
        path: headerMatch[2],
        oldPath: headerMatch[1],
        newPath: headerMatch[2],
        addedLines: [],
        removedLines: []
      }
      patches.push(currentPatch)
      continue
    }

    if (!currentPatch || line.startsWith("+++") || line.startsWith("---")) continue
    if (line.startsWith("rename from ")) currentPatch.oldPath = line.slice("rename from ".length)
    if (line.startsWith("rename to ")) {
      currentPatch.newPath = line.slice("rename to ".length)
      currentPatch.path = currentPatch.newPath
    }
    if (line.startsWith("+")) currentPatch.addedLines.push(line.slice(1))
    if (line.startsWith("-")) currentPatch.removedLines.push(line.slice(1))
  }

  return patches
}

function failure(status, runtimePaths, patches, message) {
  return {
    ok: false,
    status,
    runtimePaths,
    migrationReviewRequired: migrationReviewRequired(runtimePaths, patches),
    message
  }
}

function patchesForPaths(paths, patches) {
  return patches.filter((patch) => paths.some((path) => (
    patch.path === path || patch.oldPath === path || patch.newPath === path
  )))
}

function hasSubstantiveChangelogEntry(patches) {
  return patchesForPaths([CHANGELOG_PATH], patches)
    .flatMap((patch) => patch.addedLines)
    .some((line) => /^\s*-\s+\S/.test(line))
}

function migrationReviewRequired(runtimePaths, patches) {
  const runtimePatches = patchesForPaths(runtimePaths, patches)
  const runtimeWording = runtimePatches
    .flatMap((patch) => [...patch.addedLines, ...patch.removedLines])
    .some((line) => MIGRATION_REVIEW_PATTERN.test(line))
  const changelogWording = patchesForPaths([CHANGELOG_PATH], patches)
    .flatMap((patch) => patch.addedLines)
    .some((line) => MIGRATION_REVIEW_PATTERN.test(line))
  const structuralRemoval = runtimePatches.some((patch) => patch.removedLines.some((line) => (
    isStructuralContractLine(patch.oldPath ?? patch.path, line) && !patch.addedLines.includes(line)
  )))

  return runtimeWording || changelogWording || structuralRemoval
}

function isStructuralContractLine(file, line) {
  if (file === "config/public_api_manifest.yml") return /^\s*(?:-\s+\S|[A-Za-z0-9_]+:)\s*/.test(line)
  return /^\s*export\b/.test(line)
}

function hasMigrationEvidence(changedFiles, patches) {
  const changelogHasAction = patchesForPaths([CHANGELOG_PATH], patches)
    .flatMap((patch) => patch.addedLines)
    .some((line) => MIGRATION_ACTION_PATTERN.test(line))
  if (changelogHasAction) return true

  if (!MIGRATION_PATHS.every((file) => changedFiles.includes(file))) return false

  return MIGRATION_PATHS.every((file) => patchesForPaths([file], patches)
    .flatMap((patch) => patch.addedLines)
    .some((line) => MIGRATION_ACTION_PATTERN.test(line)))
}

function gitDiff(base, head, args) {
  try {
    return execFileSync("git", ["diff", ...args, `${base}...${head}`], { encoding: "utf8" })
  } catch {
    return execFileSync("git", ["diff", ...args, base, head], { encoding: "utf8" })
  }
}

function parseArguments(args) {
  const options = {}

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === "--base" || argument === "--head") {
      options[argument.slice(2)] = args[index + 1]
      index += 1
    }
  }

  if (!options.base || !options.head) {
    throw new Error("usage: node script/ci_public_contract_release_trail.mjs --base <ref> --head <ref>")
  }

  return options
}

function runCli() {
  const { base, head } = parseArguments(process.argv.slice(2))
  const files = gitDiff(base, head, ["--name-only"]).split(/\r?\n/).filter(Boolean)
  const patches = parseUnifiedDiff(gitDiff(base, head, ["--unified=0", "--no-ext-diff"]))
  const result = evaluatePublicContractReleaseTrail({ files, patches })
  const prefix = "[public-contract-release-trail]"

  if (result.ok) {
    console.log(`${prefix} ${result.status}: ${result.message}`)
    return
  }

  console.error(`${prefix} ${result.status}: ${result.message}`)
  console.error(`${prefix} review docs/en/release.md and docs/ja/release.md, then run npm run test:public-contract-release-trail`)
  process.exitCode = 1
}

const currentFile = fileURLToPath(import.meta.url)
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) runCli()
