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

const signalGroups = [
  {
    feature: "Toolbar label resolution docs signal",
    files: [
      [
        "docs/en/toolbar.md",
        [
          "Label resolution",
          "labels:",
          "tree_view.toolbar.labels.*",
          "TreeView's built-in English fallback label",
          "tree_view_toolbar_action_metadata",
          "final wording, locale-file policy"
        ]
      ],
      [
        "docs/ja/toolbar.md",
        [
          "label resolution",
          "labels:",
          "tree_view.toolbar.labels.*",
          "英語 fallback label",
          "tree_view_toolbar_action_metadata",
          "最終文言、locale file policy"
        ]
      ],
      [
        "docs/en/public-api.md",
        ["tree_view_toolbar_action_metadata", "label", "metadata shape"]
      ],
      [
        "docs/ja/public-api.md",
        ["tree_view_toolbar_action_metadata", "label", "metadata shape"]
      ],
      [
        "config/public_api_manifest.yml",
        ["toolbar_action_metadata:", "label"]
      ]
    ]
  },
  {
    feature: "CI changed-files policy docs signal",
    files: [
      [
        "script/ci_changed_files_policy.mjs",
        [
          "docs_only",
          "mockups_changed",
          "browser_smoke_changed",
          "package_sensitive",
          "docker_setup_sensitive"
        ]
      ],
      [
        ".github/workflows/ci.yml",
        [
          "docs_only",
          "mockups_changed",
          "browser_smoke_changed",
          "package_sensitive",
          "docker_setup_sensitive",
          "docker_development_setup",
          "gem_package"
        ]
      ],
      [
        "docs/en/development.md",
        [
          "Docs-only pull requests",
          "docs/mockups/**",
          "test/browser/**",
          ".github/workflows/**",
          "gem package verification",
          "Dockerfile"
        ]
      ],
      [
        "docs/ja/development.md",
        [
          "docs-only Pull Request",
          "docs/mockups/**",
          "test/browser/**",
          ".github/workflows/**",
          "gem package verification",
          "Dockerfile"
        ]
      ]
    ]
  },
  {
    feature: "Stacked follow-up freshness docs signal",
    files: [
      [
        "docs/en/development.md",
        [
          "Re-evaluate stacked follow-ups after a parent squash merge",
          "`ahead_by`, `behind_by`, and `status`",
          "head SHA exactly matches",
          "not fresh current-main evidence",
          "latest `main` with only the follow-up-specific diff",
          "PR body",
          "close intent",
          "pr-overlap-preflight.md"
        ]
      ],
      [
        "docs/ja/development.md",
        [
          "親 PR の squash merge 後に stacked follow-up を再評価する",
          "`ahead_by`、`behind_by`、`status`",
          "current head SHA と完全に一致",
          "fresh current-main evidence ではありません",
          "最新 `main` から follow-up 固有差分だけ",
          "PR body",
          "close intent",
          "pr-overlap-preflight.md"
        ]
      ]
    ]
  },
  {
    feature: "i18n audit maintenance checklist docs signal",
    files: [
      [
        "docs/i18n-audit.md",
        [
          "Documentation maintenance checklist",
          "Root-level prose docs should stay limited to intentional entry points, maintenance notes, or technical assets",
          "## Update matrix",
          "## Root-level docs policy",
          "## Technical assets",
          "docs/mockups/README.md` is the source of truth for the current static mockup file inventory",
          "this checklist should describe responsibility rather than repeat every individual mockup HTML page",
          "Update this technical-assets section only when the source-of-truth rule or asset-group responsibility changes"
        ]
      ]
    ]
  }
]

signalGroups.forEach(({ feature, files }) => {
  files.forEach(([sourcePath, signals]) => assertSignals(sourcePath, feature, signals))
})
