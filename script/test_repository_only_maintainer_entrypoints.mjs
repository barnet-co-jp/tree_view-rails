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

function assertRelativeLink(sourcePath, href, feature) {
  const source = read(sourcePath)
  const target = decodeURIComponent(href.split("#", 1)[0])
  const resolvedTarget = path.resolve(path.dirname(path.join(repoRoot, sourcePath)), target)

  assert(
    source.includes(href),
    `${feature}: ${sourcePath} does not link to ${href}`
  )
  assert(
    resolvedTarget.startsWith(repoRoot) && existsSync(resolvedTarget),
    `${feature}: ${sourcePath} links to missing local target ${href}`
  )
}

function assertDocumentSignal(sourcePath, signalPattern, feature, message) {
  const source = read(sourcePath)

  assert(signalPattern.test(source), `${feature}: ${message}`)
}

const repositoryOnlyEntrypoints = [
  {
    feature: "Root docs repository-only maintainer entrypoints",
    links: [
      ["docs/README.md", "en/README.md"],
      ["docs/README.md", "ja/README.md"],
      ["docs/README.md", "i18n-audit.md"],
      ["docs/README.md", "../CHANGELOG.md"]
    ],
    signals: [
      [
        "docs/README.md",
        /Maintainer entry points[\s\S]*gem-packaged docs[\s\S]*repository-only files[\s\S]*Product Profile[\s\S]*AGENTS\.md[\s\S]*Documentation maintenance checklist[\s\S]*CHANGELOG\.md/,
        "docs/README.md no longer keeps repository-only maintainer files distinct from packaged docs"
      ]
    ]
  },
  {
    feature: "English repository-only maintainer entrypoints",
    links: [
      ["docs/en/README.md", "../README.md"],
      ["docs/en/README.md", "../../CHANGELOG.md"],
      ["docs/en/README.md", "../i18n-audit.md"],
      ["docs/en/README.md", "ci-policy-suite.md"],
      ["docs/en/README.md", "dependabot-policy.md"],
      ["docs/en/README.md", "javascript-ci-cache-boundary.md"]
    ],
    signals: [
      [
        "docs/en/README.md",
        /For maintainers[\s\S]*Product Profile[\s\S]*repository-only[\s\S]*AGENTS\.md[\s\S]*repository-only[\s\S]*Root docs index[\s\S]*CHANGELOG\.md[\s\S]*Documentation i18n audit[\s\S]*Development[\s\S]*CI policy suite[\s\S]*Dependabot maintainer policy[\s\S]*JavaScript CI cache boundary/,
        "English docs README no longer exposes the repository-only maintainer table"
      ]
    ]
  },
  {
    feature: "Japanese repository-only maintainer entrypoints",
    links: [
      ["docs/ja/README.md", "../README.md"],
      ["docs/ja/README.md", "../../CHANGELOG.md"],
      ["docs/ja/README.md", "../i18n-audit.md"],
      ["docs/ja/README.md", "ci-policy-suite.md"],
      ["docs/ja/README.md", "dependabot-policy.md"],
      ["docs/ja/README.md", "javascript-ci-cache-boundary.md"]
    ],
    signals: [
      [
        "docs/ja/README.md",
        /保守者向け[\s\S]*Product Profile[\s\S]*repository-only[\s\S]*AGENTS\.md[\s\S]*repository-only[\s\S]*root docs index[\s\S]*CHANGELOG\.md[\s\S]*Documentation i18n audit[\s\S]*開発・保守方針[\s\S]*CI policy suite[\s\S]*Dependabot maintainer policy[\s\S]*JavaScript CI cache boundary/,
        "Japanese docs README no longer exposes the repository-only maintainer table"
      ]
    ]
  },
  {
    feature: "AGENTS maintainer first-read entrypoints",
    links: [
      ["AGENTS.md", "README.md"],
      ["AGENTS.md", "docs/README.md"],
      ["AGENTS.md", "Product Profile.md"],
      ["AGENTS.md", "CHANGELOG.md"],
      ["AGENTS.md", "docs/i18n-audit.md"]
    ],
    signals: [
      [
        "AGENTS.md",
        /## First Read[\s\S]*1\. `AGENTS\.md`[\s\S]*2\. `README\.md`[\s\S]*3\. `docs\/README\.md`[\s\S]*4\. `Product Profile\.md`[\s\S]*docs\/i18n-audit\.md[\s\S]*CHANGELOG\.md/,
        "AGENTS.md no longer preserves the maintainer first-read order and docs-change follow-up signals"
      ],
      [
        "AGENTS.md",
        /Use these files as the durable documentation source:[\s\S]*`README\.md`[\s\S]*`Product Profile\.md`[\s\S]*`docs\/README\.md`[\s\S]*`CHANGELOG\.md`[\s\S]*`docs\/i18n-audit\.md`/,
        "AGENTS.md no longer lists the durable documentation source files"
      ]
    ]
  },
  {
    feature: "Product Profile maintainer source-of-truth entrypoints",
    links: [
      ["Product Profile.md", "AGENTS.md"],
      ["Product Profile.md", "README.md"],
      ["Product Profile.md", "docs/README.md"],
      ["Product Profile.md", "docs/en/README.md"],
      ["Product Profile.md", "docs/ja/README.md"],
      ["Product Profile.md", "docs/i18n-audit.md"],
      ["Product Profile.md", "config/public_api_manifest.yml"],
      ["Product Profile.md", "docs/en/release.md"],
      ["Product Profile.md", "docs/ja/release.md"],
      ["Product Profile.md", "CHANGELOG.md"]
    ],
    signals: [
      [
        "Product Profile.md",
        /## Source of truth[\s\S]*Current code[\s\S]*Machine-readable public API contracts[\s\S]*Explicit decisions[\s\S]*Durable docs[\s\S]*Entry-point summaries[\s\S]*README\.md[\s\S]*docs\/README\.md[\s\S]*AGENTS\.md[\s\S]*this profile/,
        "Product Profile no longer documents the source-of-truth order for maintainers"
      ],
      [
        "Product Profile.md",
        /## Recommended first reads[\s\S]*`AGENTS\.md`[\s\S]*`README\.md`[\s\S]*`docs\/README\.md`[\s\S]*`docs\/en\/README\.md` or `docs\/ja\/README\.md`[\s\S]*`docs\/i18n-audit\.md`[\s\S]*`config\/public_api_manifest\.yml`[\s\S]*`CHANGELOG\.md`/,
        "Product Profile no longer preserves the recommended first-read maintainer path"
      ]
    ]
  },
  {
    feature: "Maintainer release docs",
    links: [
      ["docs/README.md", "en/release.md"],
      ["docs/README.md", "ja/release.md"],
      ["docs/en/README.md", "release.md"],
      ["docs/ja/README.md", "release.md"],
      ["docs/README.md", "../CHANGELOG.md"],
      ["docs/en/README.md", "../../CHANGELOG.md"],
      ["docs/ja/README.md", "../../CHANGELOG.md"]
    ]
  },
  {
    feature: "Maintainer development docs",
    links: [
      ["docs/README.md", "en/development.md"],
      ["docs/README.md", "ja/development.md"],
      ["docs/en/README.md", "development.md"],
      ["docs/ja/README.md", "development.md"],
      ["docs/README.md", "en/code-quality.md"],
      ["docs/README.md", "ja/code-quality.md"],
      ["docs/en/README.md", "code-quality.md"],
      ["docs/ja/README.md", "code-quality.md"]
    ]
  }
]

repositoryOnlyEntrypoints.forEach(({ feature, links, signals = [] }) => {
  links.forEach(([sourcePath, href]) => assertRelativeLink(sourcePath, href, feature))
  signals.forEach(([sourcePath, signalPattern, message]) => {
    assertDocumentSignal(sourcePath, signalPattern, feature, message)
  })
})
