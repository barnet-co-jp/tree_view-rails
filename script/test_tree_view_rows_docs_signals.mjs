import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8")
}

function loadTreeViewHelperOptionKeys() {
  try {
    return JSON.parse(
      execFileSync(
        "ruby",
        [
          "-e",
          [
            'require "json"',
            'require "yaml"',
            'data = YAML.load_file("config/public_api_manifest.yml")',
            'print JSON.generate(data.fetch("helper_option_keys").slice("tree_view_rows", "tree_view_window"))'
          ].join("; ")
        ],
        { encoding: "utf8" }
      )
    )
  } catch (error) {
    const rubyOutput = [error.stdout, error.stderr]
      .filter((output) => output && output.length > 0)
      .join("\n")
      .trim()
    const detail = rubyOutput || error.message

    throw new Error(
      [
        "Could not load helper_option_keys.tree_view_rows and helper_option_keys.tree_view_window from config/public_api_manifest.yml.",
        "The docs signal smoke expects the manifest to track row rendering and companion window metadata option keys separately.",
        `Loader output: ${detail}`
      ].join("\n"),
      { cause: error }
    )
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertIncludes(source, needle, label) {
  assert(source.includes(needle), `${label}: missing ${needle}`)
}

const helperOptionKeys = loadTreeViewHelperOptionKeys()
const treeViewRowsOptionKeys = helperOptionKeys.tree_view_rows
const treeViewWindowOptionKeys = helperOptionKeys.tree_view_window
const expectedRowsOptionKeys = ["mode", "collapsed", "window"]
const expectedWindowOptionKeys = ["offset", "limit"]

expectedRowsOptionKeys.forEach((key) => {
  assert(
    treeViewRowsOptionKeys.includes(key),
    `config/public_api_manifest.yml helper_option_keys.tree_view_rows is missing ${key}`
  )
})

expectedWindowOptionKeys.forEach((key) => {
  assert(
    treeViewWindowOptionKeys.includes(key),
    `config/public_api_manifest.yml helper_option_keys.tree_view_window is missing ${key}`
  )
})

;[
  ["tree_view_rows", treeViewRowsOptionKeys],
  ["tree_view_window", treeViewWindowOptionKeys]
].forEach(([helperName, optionKeys]) => {
  assert(
    optionKeys.length === new Set(optionKeys).size,
    `config/public_api_manifest.yml helper_option_keys.${helperName} contains duplicate keys`
  )
})

const publicApiDocs = [
  ["docs/en/public-api.md", read("docs/en/public-api.md")],
  ["docs/ja/public-api.md", read("docs/ja/public-api.md")]
]

publicApiDocs.forEach(([relativePath, document]) => {
  assertIncludes(document, "tree_view_rows(render_state)", `${relativePath} stable helper entrypoint`)
  assertIncludes(
    document,
    "tree_view_rows(render_state, window: { offset:, limit: })",
    `${relativePath} windowed tree_view_rows entrypoint`
  )
  assertIncludes(
    document,
    "tree_view_rows(render_state, window: nil)",
    `${relativePath} public helper surface option signature`
  )
  assertIncludes(
    document,
    "tree_view_window(render_state, offset:, limit:)",
    `${relativePath} companion metadata helper entrypoint`
  )
})

const windowedRenderingDocs = [
  ["docs/en/windowed-rendering.md", read("docs/en/windowed-rendering.md")],
  ["docs/ja/windowed-rendering.md", read("docs/ja/windowed-rendering.md")]
]

windowedRenderingDocs.forEach(([relativePath, document]) => {
  assertIncludes(
    document,
    "tree_view_rows(@render_state, window: { offset: 0, limit: 50 })",
    `${relativePath} tree_view_rows window usage`
  )
  assertIncludes(
    document,
    "tree_view_window(@render_state, offset: 0, limit: 50)",
    `${relativePath} tree_view_window metadata usage`
  )
  assert(
    /route helper|URL parameter|pagination controls|pagination policy|route や UI policy|route helper、URL parameter、disabled button/.test(document),
    `${relativePath}: windowed rendering docs no longer separate tree_view_rows row rendering from host-app pagination and route ownership`
  )
  assert(
    /virtual scrolling in the host app|host app側でvirtual scrolling/.test(document),
    `${relativePath}: windowed rendering docs no longer keep virtual scrolling outside the tree_view_rows option surface`
  )
})
