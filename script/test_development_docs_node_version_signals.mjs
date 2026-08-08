import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8")
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertSignals(sourcePath, feature, signals) {
  const source = read(sourcePath)

  signals.forEach((signal) => {
    assert(
      source.includes(signal),
      `${feature}: ${sourcePath} is missing representative signal ${JSON.stringify(signal)}`
    )
  })
}

const nodeVersionSourceSignals = [
  {
    feature: "English development docs Node 22 version-source guard",
    sourcePath: "docs/en/development.md",
    signals: [
      "Node 22",
      ".nvmrc",
      "`engines.node`",
      "workflow `node-version`",
      "Dockerfile",
      "script/test_node_version_sources.mjs",
      "npm run test:node-version-sources",
      "npm run test:entrypoints",
      "without changing the lockfile-backed install policy"
    ]
  },
  {
    feature: "Japanese development docs Node 22 version-source guard",
    sourcePath: "docs/ja/development.md",
    signals: [
      "Node 22",
      ".nvmrc",
      "`engines.node`",
      "workflow の `node-version`",
      "Dockerfile",
      "script/test_node_version_sources.mjs",
      "npm run test:node-version-sources",
      "npm run test:entrypoints",
      "lockfile-backed install policy を変えずに確認します"
    ]
  },
  {
    feature: "English release docs Node 22 version-source boundary",
    sourcePath: "docs/en/release.md",
    signals: [
      "Node 22 source guard",
      ".nvmrc",
      "`engines.node`",
      "workflow `node-version`",
      "script/test_node_version_sources.mjs",
      "lockfile-backed install path confirms dependency resolution"
    ]
  },
  {
    feature: "Japanese release docs Node 22 version-source boundary",
    sourcePath: "docs/ja/release.md",
    signals: [
      "Node 22 source guard",
      ".nvmrc",
      "`engines.node`",
      "workflow の `node-version`",
      "script/test_node_version_sources.mjs",
      "lockfile-backed install path は dependency resolution の整合を確認する"
    ]
  }
]

nodeVersionSourceSignals.forEach(({ feature, sourcePath, signals }) => {
  assertSignals(sourcePath, feature, signals)
})

const nodeVersionSourceFiles = [
  [".nvmrc", "22"],
  ["package.json", "\"node\": \"22.x\""],
  [".github/workflows/ci.yml", "node-version: \"22\""],
  ["Dockerfile", "ARG NODE_MAJOR=22"],
  ["script/test_node_version_sources.mjs", "NODE_MAJOR"]
]

nodeVersionSourceFiles.forEach(([sourcePath, signal]) => {
  assertSignals(sourcePath, "Node 22 source file inventory", [signal])
})
