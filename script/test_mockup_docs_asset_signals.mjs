import { existsSync, readFileSync } from "node:fs"
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

function assertFileExists(relativePath, feature) {
  assert(
    existsSync(path.join(repoRoot, relativePath)),
    `${feature}: expected ${relativePath} to exist`
  )
}

assertSignals("README.md", "README orientation mockup asset", [
  "![Static TreeView mockup showing expanded and collapsed hierarchy rows with selection checkboxes, badges, and row actions.](docs/mockups/assets/readme-default-tree.svg)",
  "single orientation asset derived from the `default-tree.html` baseline rows",
  "review-gallery.html",
  "default-tree.html"
])

assertFileExists(
  "docs/mockups/assets/readme-default-tree.svg",
  "README orientation mockup asset"
)

assertSignals("docs/mockups/assets/readme-default-tree.svg", "README orientation mockup asset", [
  "role=\"img\"",
  "aria-labelledby=\"title desc\"",
  "Default TreeView rendering mock",
  "expanded and collapsed hierarchy rows",
  "selection checkboxes",
  "badges",
  "row actions",
  "TREE_VIEW-RAILS"
])

assertSignals("docs/mockups/README.md", "README/default-tree mockup routing", [
  "[default-tree.html](default-tree.html)",
  "Default table/tree output, checkbox selection, expanded/collapsed rows, badges, depth labels, row actions, and baseline CSS.",
  "[review-gallery.html](review-gallery.html)",
  "Single-surface comparison hub for the current baseline and focused mockup references",
  "broken HTML, blank pages, missing review links, and missing representative regions without adding screenshot baselines or visual diff review"
])

assertSignals("docs/mockups/README.md", "mockup demo app responsibility boundary", [
  "complete Rails application",
  "host-app CRUD, query, authorization, seed data, or controller examples",
  "future real Rails demo app",
  "confirm this static mockup / real demo app boundary before requesting new routes, persistence, CRUD flows, seeded records, or authorization examples",
  "Do not add direct public demo links from the mockups until the demo repository is public and its publication checklist is ready."
])

assertSignals("docs/mockups/README.md", "mockup visual evidence handoff", [
  "## Visual evidence handoff",
  "Treat `npm run test:browser` success as smoke coverage, not as final visual readability approval.",
  "target mockup file",
  "desktop and narrow viewport",
  "readable without overlap or clipping",
  "Keep this evidence in the pull request discussion",
  "browser-capable review note"
])

assertSignals("docs/mockups/README.md", "table caption context mockup routing", [
  "[table-caption-context.html](table-caption-context.html)",
  "Focused table caption and surrounding page structure reference showing host-app-owned heading, caption, summary, and actions around TreeView-owned row cues.",
  "Use [table-caption-context.html](table-caption-context.html) when review needs to compare host-app-owned heading, caption, summary, and adjacent actions around TreeView-owned row hierarchy cues."
])

assertSignals("docs/mockups/table-caption-context.html", "table caption context boundary", [
  "Table caption context mock",
  "Host app actions",
  "Host-owned summary: 4 visible nodes",
  "Host-owned table caption describing the current workspace hierarchy and review context.",
  "tree-depth-label",
  "tree-toggle__hidden-count",
  "tree-node-badge tree-node-badge--info",
  "Host app owns page heading, caption copy, summary text, action labels, routes, authorization, and final business wording.",
  "TreeView owns row hierarchy cues such as branch lines, toggle affordances, depth labels, hidden counts, and selection payload hooks.",
  "This mock does not introduce a caption helper, treegrid semantics, CRUD flow, route policy, or public API option."
])
