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

const readme = read("README.md")
const orientationAsset = read("docs/mockups/assets/readme-default-tree.svg")
const defaultTreeMockup = read("docs/mockups/default-tree.html")
const visualCandidates = read("docs/mockups/readme-representative-visual-candidates.md")

const readmeSignals = [
  "docs/mockups/assets/readme-default-tree.svg",
  "Static TreeView mockup showing expanded and collapsed hierarchy rows",
  "single orientation asset derived from the `default-tree.html` baseline rows",
  "linked mockups for full static review paths and focused state comparisons",
  "docs/mockups/default-tree.html"
]

readmeSignals.forEach((signal) => {
  assert(
    readme.includes(signal),
    `README orientation asset signal is missing ${JSON.stringify(signal)}`
  )
})

assert(
  orientationAsset.trim().startsWith("<svg"),
  "README orientation asset should remain a non-empty SVG file"
)

assert(
  defaultTreeMockup.includes("tree-view-table"),
  "default-tree.html should remain the baseline mockup source for the README orientation asset"
)

const visualCandidateSignals = [
  "Source: `default-tree.html`",
  "Selected README asset: `assets/readme-default-tree.svg`",
  "Keep the current asset when `default-tree.html` still shows the same baseline table-first hierarchy shape.",
  "Update the asset when the baseline first viewport changes enough that the README image would misrepresent row structure, hierarchy cues, selection, badges, or row actions.",
  "Do not treat `review-gallery.html` as the source of truth for the README image",
  "if only focused mockups, review-gallery cards, or state-specific references change, keep this README asset in place"
]

visualCandidateSignals.forEach((signal) => {
  assert(
    visualCandidates.includes(signal),
    `README visual candidate boundary signal is missing ${JSON.stringify(signal)}`
  )
})
