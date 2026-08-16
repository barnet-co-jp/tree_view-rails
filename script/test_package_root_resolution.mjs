import { execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

const packageRoot = path.resolve("app/javascript/tree_view")
const packageJsonPath = path.join(packageRoot, "package.json")
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"))
const exportsRoot = packageJson.exports?.["."]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(packageJson.main === "./index.js", "tree_view package main must resolve to ./index.js")
assert(packageJson.module === "./index.js", "tree_view package module must resolve to ./index.js")
assert(packageJson.types === "./index.d.ts", "tree_view package types must resolve to ./index.d.ts")
assert(exportsRoot?.import === "./index.js", "tree_view package exports.import must resolve to ./index.js")
assert(exportsRoot?.default === "./index.js", "tree_view package exports.default must resolve to ./index.js")
assert(exportsRoot?.types === "./index.d.ts", "tree_view package exports.types must resolve to ./index.d.ts")
assert(existsSync(path.join(packageRoot, "index.js")), "tree_view package runtime entrypoint is missing")
assert(existsSync(path.join(packageRoot, "index.d.ts")), "tree_view package TypeScript entrypoint is missing")

const fixtureRoot = mkdtempSync(path.join(tmpdir(), "tree-view-package-root-"))

try {
  const nodeModules = path.join(fixtureRoot, "node_modules")
  mkdirSync(nodeModules, { recursive: true })
  symlinkSync(packageRoot, path.join(nodeModules, "tree_view"), "dir")

  const consumerPath = path.join(fixtureRoot, "consumer.mjs")
  writeFileSync(
    consumerPath,
    [
      'import { registerTreeViewControllers, TreeViewControllerIdentifiers } from "tree_view"',
      'if (typeof registerTreeViewControllers !== "function") throw new Error("registerTreeViewControllers did not resolve from bare tree_view import")',
      'if (TreeViewControllerIdentifiers.state !== "tree-view-state") throw new Error("TreeViewControllerIdentifiers did not resolve from bare tree_view import")'
    ].join("\n")
  )

  execFileSync(process.execPath, [consumerPath], { encoding: "utf8" })
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true })
}

console.log("tree_view package-root resolution smoke passed.")
