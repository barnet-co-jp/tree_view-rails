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
  const target = href.split("#", 1)[0]
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

function assertRootSignal(feature, rootPattern, message) {
  if (!rootPattern) return

  assert(rootPattern.test(rootReadme), `${feature}: ${message}`)
}

function assertDocumentSignal(sourcePath, signalPattern, feature, message) {
  const source = read(sourcePath)

  assert(signalPattern.test(source), `${feature}: ${message}`)
}

const rootReadme = read("README.md")

const foundationalEntrypoints = [
  {
    feature: "First-time setup docs",
    rootPattern: /Installation[\s\S]*Minimal usage[\s\S]*Usage/,
    links: [
      ["README.md", "docs/en/installation.md"],
      ["README.md", "docs/ja/installation.md"],
      ["README.md", "docs/en/minimal-usage.md"],
      ["README.md", "docs/ja/minimal-usage.md"],
      ["README.md", "docs/en/usage.md"],
      ["README.md", "docs/ja/usage.md"],
      ["docs/README.md", "en/installation.md"],
      ["docs/README.md", "ja/installation.md"],
      ["docs/README.md", "en/minimal-usage.md"],
      ["docs/README.md", "ja/minimal-usage.md"],
      ["docs/README.md", "en/usage.md"],
      ["docs/README.md", "ja/usage.md"],
      ["docs/en/README.md", "installation.md"],
      ["docs/en/README.md", "minimal-usage.md"],
      ["docs/en/README.md", "usage.md"],
      ["docs/ja/README.md", "installation.md"],
      ["docs/ja/README.md", "minimal-usage.md"],
      ["docs/ja/README.md", "usage.md"]
    ],
    signals: [
      [
        "docs/en/installation.md",
        /@import "tree_view";[\s\S]*pin "tree_view", to: "tree_view\/index\.js"[\s\S]*app\/assets\/stylesheets\/tree_view\.scss[\s\S]*app\/javascript\/tree_view\/\*\*\/\*[\s\S]*config\/importmap\.tree_view\.rb[\s\S]*config\/public_api_manifest\.yml[\s\S]*Propshaft[\s\S]*packaged plain CSS asset directly by logical asset name[\s\S]*Do not rely on Propshaft itself to compile Sass[\s\S]*Sprockets[\s\S]*Sprockets-compatible asset hooks/,
        "English installation docs no longer expose the CSS/importmap, packaged files, and explicit Propshaft/Sprockets setup signals"
      ],
      [
        "docs/ja/installation.md",
        /@import "tree_view";[\s\S]*pin "tree_view", to: "tree_view\/index\.js"[\s\S]*app\/assets\/stylesheets\/tree_view\.scss[\s\S]*app\/javascript\/tree_view\/\*\*\/\*[\s\S]*config\/importmap\.tree_view\.rb[\s\S]*config\/public_api_manifest\.yml[\s\S]*Propshaft[\s\S]*同梱の plain CSS asset を logical asset として直接読み込む構成[\s\S]*Propshaft 自体に Sass compile を期待しないでください[\s\S]*Sprockets[\s\S]*Sprockets互換のasset hook/,
        "Japanese installation docs no longer expose the CSS/importmap, packaged files, and explicit Propshaft/Sprockets setup signals"
      ],
      [
        "docs/en/installation.md",
        /Static rendering works without dedicated TreeView JavaScript[\s\S]*registerTreeViewControllers\(application\)[\s\S]*selective registration or a custom boot order[\s\S]*Public API/,
        "English installation docs no longer preserve the static-rendering, default controller registration, and advanced boot handoff boundary"
      ],
      [
        "docs/ja/installation.md",
        /static表示だけであれば専用JavaScriptなしでも利用できます[\s\S]*registerTreeViewControllers\(application\)[\s\S]*部分登録したい場合や custom boot order[\s\S]*Public API/,
        "Japanese installation docs no longer preserve the static-rendering, default controller registration, and advanced boot handoff boundary"
      ],
      [
        "docs/en/minimal-usage.md",
        /TreeView::Tree[\s\S]*TreeView::UiConfigBuilder[\s\S]*build_static[\s\S]*TreeView::RenderState[\s\S]*tree_view_rows\(@render_state\)[\s\S]*row_partial[\s\S]*minimal-usage-first-render\.html/,
        "English minimal-usage docs no longer expose the minimal controller/view/row-partial path and first-render mockup link"
      ],
      [
        "docs/ja/minimal-usage.md",
        /TreeView::Tree[\s\S]*TreeView::UiConfigBuilder[\s\S]*build_static[\s\S]*TreeView::RenderState[\s\S]*tree_view_rows\(@render_state\)[\s\S]*row_partial[\s\S]*minimal-usage-first-render\.html/,
        "Japanese minimal-usage docs no longer expose the minimal controller/view/row-partial path and first-render mockup link"
      ],
      [
        "docs/mockups/minimal-usage-first-render.html",
        /data-tree-view-sample="minimal-usage-first-render"[\s\S]*Included[\s\S]*Initial table wrapper[\s\S]*Excluded[\s\S]*Checkbox selection[\s\S]*badges[\s\S]*row actions[\s\S]*CRUD links[\s\S]*routes[\s\S]*seeded demo records/,
        "minimal-usage-first-render mockup no longer states the first-render included/excluded boundary"
      ]
    ]
  },
  {
    feature: "Decision guide docs",
    rootPattern: /Decision guide|API判断ガイド/,
    links: [
      ["README.md", "docs/en/decision-guide.md"],
      ["README.md", "docs/ja/decision-guide.md"],
      ["docs/README.md", "en/decision-guide.md"],
      ["docs/README.md", "ja/decision-guide.md"],
      ["docs/en/README.md", "decision-guide.md"],
      ["docs/ja/README.md", "decision-guide.md"]
    ]
  },
  {
    feature: "FAQ and troubleshooting docs",
    rootPattern: /FAQ[\s\S]*Troubleshooting|Troubleshooting[\s\S]*FAQ/,
    links: [
      ["README.md", "docs/en/faq.md"],
      ["README.md", "docs/ja/faq.md"],
      ["README.md", "docs/en/troubleshooting.md"],
      ["README.md", "docs/ja/troubleshooting.md"],
      ["docs/README.md", "en/faq.md"],
      ["docs/README.md", "ja/faq.md"],
      ["docs/README.md", "en/troubleshooting.md"],
      ["docs/README.md", "ja/troubleshooting.md"],
      ["docs/en/README.md", "faq.md"],
      ["docs/en/README.md", "troubleshooting.md"],
      ["docs/ja/README.md", "faq.md"],
      ["docs/ja/README.md", "troubleshooting.md"]
    ],
    signals: [
      [
        "docs/en/faq.md",
        /database queries[\s\S]*TreeView::RenderWindow[\s\S]*virtual scrolling[\s\S]*keyboard navigation[\s\S]*CRUD[\s\S]*authorization[\s\S]*TreeView::Diagnostics\.run[\s\S]*persisted state[\s\S]*children pagination/i,
        "English FAQ no longer covers the main host-app responsibility boundary questions"
      ],
      [
        "docs/ja/faq.md",
        /DB query[\s\S]*TreeView::RenderWindow[\s\S]*virtual scroll[\s\S]*keyboard navigation[\s\S]*CRUD[\s\S]*authorization[\s\S]*TreeView::Diagnostics\.run[\s\S]*persisted state[\s\S]*children pagination/,
        "Japanese FAQ no longer covers the main host-app responsibility boundary questions"
      ],
      [
        "docs/en/troubleshooting.md",
        /Localized labels[\s\S]*Toggle links[\s\S]*Toolbar actions[\s\S]*Breadcrumbs[\s\S]*Row partial[\s\S]*Empty or no-results[\s\S]*ActiveRecord time[\s\S]*virtual scrolling[\s\S]*Children pagination[\s\S]*GraphAdapter[\s\S]*CSS or JavaScript integration[\s\S]*Lazy loading[\s\S]*persisted state/i,
        "English troubleshooting docs no longer expose the representative symptom-driven entrypoints"
      ],
      [
        "docs/ja/troubleshooting.md",
        /localized label[\s\S]*toggle link[\s\S]*toolbar action[\s\S]*breadcrumb[\s\S]*row partial[\s\S]*empty[\s\S]*ActiveRecord time[\s\S]*virtual scroll[\s\S]*children pagination[\s\S]*GraphAdapter[\s\S]*CSS や JavaScript の統合[\s\S]*lazy loading[\s\S]*persisted state/,
        "Japanese troubleshooting docs no longer expose the representative symptom-driven entrypoints"
      ]
    ]
  }
]

foundationalEntrypoints.forEach(({ feature, rootPattern, links, signals = [] }) => {
  assertRootSignal(feature, rootPattern, "README.md no longer exposes the representative docs signal")

  links.forEach(([sourcePath, href]) => assertRelativeLink(sourcePath, href, feature))
  signals.forEach(([sourcePath, signalPattern, message]) => {
    assertDocumentSignal(sourcePath, signalPattern, feature, message)
  })
})
