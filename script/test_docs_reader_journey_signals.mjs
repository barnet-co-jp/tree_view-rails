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
    feature: "Decision guide reader journey",
    files: [
      [
        "docs/en/decision-guide.md",
        [
          "Render controls",
          "Data-loading controls",
          "GraphAdapter",
          "reverse_tree_for",
          "Filtered Trees",
          "Lazy Loading",
          "Children Pagination",
          "RenderWindow",
          "Selection",
          "Toolbar helper",
          "Recommended path by project stage",
          "Common combinations"
        ]
      ],
      [
        "docs/ja/decision-guide.md",
        [
          "描画制御",
          "データ読み込み制御",
          "GraphAdapter",
          "reverse_tree_for",
          "Filtered Trees",
          "Lazy Loading",
          "Children Pagination",
          "RenderWindow",
          "Selection",
          "Toolbar helper",
          "project stageごとのおすすめ順",
          "よくある組み合わせ"
        ]
      ]
    ]
  },
  {
    feature: "Cookbook common-combination reader journey",
    files: [
      [
        "docs/en/cookbook.md",
        [
          "## Build from common combinations",
          "decision-guide.md#common-combinations",
          "### Large folder browser",
          "### Bulk action page",
          "### Status-heavy tree table"
        ]
      ],
      [
        "docs/ja/cookbook.md",
        [
          "## よくある組み合わせから組み立てる",
          "decision-guide.md#よくある組み合わせ",
          "### 大きな folder browser",
          "### bulk action page",
          "### status が多い tree table"
        ]
      ]
    ]
  },
  {
    feature: "Language README user journey",
    files: [
      [
        "docs/en/README.md",
        [
          "For users",
          "Goal-based shortcuts",
          "Set up TreeView for the first time",
          "Choose the right API or rendering mode",
          "Render large or partial trees",
          "Diagnose symptoms or responsibility boundaries",
          "Installation",
          "Minimal usage",
          "Usage",
          "Decision guide",
          "Troubleshooting",
          "FAQ",
          "Visual reference mockups",
          "Demo application boundary",
          "Reading order"
        ]
      ],
      [
        "docs/ja/README.md",
        [
          "利用者向け",
          "目的別ショートカット",
          "初めて TreeView を導入する",
          "使う API や描画方式を選ぶ",
          "大きな tree や一部描画を扱う",
          "症状や責務境界から調べる",
          "導入手順",
          "最小利用例",
          "使い方",
          "API判断ガイド",
          "トラブルシューティング",
          "FAQ",
          "視覚リファレンス mockup",
          "Demo application boundary",
          "読む順番"
        ]
      ]
    ]
  },
  {
    feature: "FAQ responsibility-boundary reader journey",
    files: [
      [
        "docs/en/faq.md",
        [
          "Why does persisted state save as soon as the page loads?",
          "tree-view-state:state-changed",
          "initial connect",
          "event.detail.reason",
          "`connect`",
          "`refresh`",
          "`expanded`",
          "`collapsed`",
          "[Persisted State](persisted-state.md)",
          "[JavaScript event contract](js-events.md)",
          "not proof that the user changed the tree",
          "host app should save only user-initiated changes",
          "dirty-state policy in the host app",
          "Does TreeView infer breadcrumbs for resolver or adapter mode?",
          "GraphAdapter",
          "host app choose the breadcrumb trail",
          "Does selecting a parent include descendants that have not loaded yet?",
          "rendered DOM",
          "unloaded descendants",
          "host-app-owned server-side intent or query filter"
        ]
      ],
      [
        "docs/ja/faq.md",
        [
          "persisted state が画面表示直後に保存されるのはなぜですか？",
          "tree-view-state:state-changed",
          "初回 connect",
          "event.detail.reason",
          "`connect`",
          "`refresh`",
          "`expanded`",
          "`collapsed`",
          "[Persisted State](persisted-state.md)",
          "[JavaScript event contract](js-events.md)",
          "ユーザーが tree を変更した証拠ではありません",
          "host app 側の dirty-state policy",
          "resolver mode や adapter mode でも TreeView が breadcrumb を推測しますか？",
          "GraphAdapter",
          "host app 側で breadcrumb trail を選び",
          "parent を選択すると、まだ読み込まれていない descendants も含まれますか？",
          "描画済み DOM",
          "unloaded descendants",
          "host app 側の server-side intent や query filter"
        ]
      ]
    ]
  },
  {
    feature: "Tree diagnostics reader journey",
    files: [
      [
        "README.md",
        [
          "Tree identity and diagnostics",
          "docs/en/tree-diagnostics.md",
          "docs/ja/tree-diagnostics.md"
        ]
      ],
      [
        "docs/README.md",
        [
          "en/tree-diagnostics.md",
          "ja/tree-diagnostics.md"
        ]
      ],
      [
        "docs/en/README.md",
        [
          "Tree diagnostics",
          "tree-diagnostics.md",
          "Structure inspection APIs for node keys, DOM IDs, orphans, and cycles",
          "Diagnose symptoms or responsibility boundaries"
        ]
      ],
      [
        "docs/ja/README.md",
        [
          "Tree diagnostics",
          "tree-diagnostics.md",
          "node_key、DOM ID、orphan、cycle などの構造確認 API",
          "症状や責務境界から調べる"
        ]
      ],
      [
        "docs/en/tree-diagnostics.md",
        [
          "TreeView::Diagnostics.run",
          "pre-render validation",
          "Result",
          "data policy"
        ]
      ],
      [
        "docs/ja/tree-diagnostics.md",
        [
          "TreeView::Diagnostics.run",
          "描画前validation",
          "Result",
          "data policy"
        ]
      ]
    ]
  },
  {
    feature: "ActiveRecord repeated-query troubleshooting reader journey",
    files: [
      [
        "docs/en/troubleshooting.md",
        [
          "Tree rendering triggers repeated queries or high ActiveRecord time",
          "ActiveRecord:",
          "Views:",
          "Document Load",
          "DocumentVersion Load",
          "CACHE",
          "row partial calls helpers or associations that perform database work for every row",
          "Return arrays, not lazy ActiveRecord relations, from `GraphAdapter` `children_resolver` callbacks",
          "Cache child collections by parent id in the host app",
          "Precompute authorization, version, or display metadata before the row partial renders",
          "Cookbook: GraphAdapter and ActiveRecord performance",
          "cookbook.md#graphadapter-and-activerecord-performance",
          "Rendering Boundaries",
          "Tree diagnostics"
        ]
      ],
      [
        "docs/ja/troubleshooting.md",
        [
          "tree rendering 中に query が繰り返される / ActiveRecord time が大きい",
          "ActiveRecord:",
          "Views:",
          "Document Load",
          "DocumentVersion Load",
          "CACHE",
          "row partial から呼ぶ helper や association access が row ごとに DB work",
          "`GraphAdapter` の `children_resolver` から lazy な ActiveRecord relation ではなく配列を返す",
          "parent id ごとの children cache",
          "authorization、version、表示用 metadata",
          "Cookbook: GraphAdapter と ActiveRecord の性能",
          "cookbook.md#graphadapter-と-activerecord-の性能",
          "Rendering Boundaries",
          "Tree diagnostics"
        ]
      ]
    ]
  },
  {
    feature: "Troubleshooting diagnostics reader journey",
    files: [
      [
        "docs/en/troubleshooting.md",
        [
          "Row partial output looks broken or table cells do not line up",
          "tree node keys and UI DOM IDs",
          "tree.node_key_for(item)",
          "Tree diagnostics",
          "Node keys",
          "GraphAdapter rows look duplicated, incomplete, or shaped differently than expected",
          "`nil` becomes an empty child list",
          "node_key_resolver:",
          "cycles or duplicate keys",
          "Duplicate node keys, orphan records, DOM ID collisions, or cycles appear",
          "validate_node_keys: true",
          "orphan_strategy:",
          "render_state.validate_unique_dom_ids!",
          "TreeView::CycleDiagnostics.new(tree).report"
        ]
      ],
      [
        "docs/ja/troubleshooting.md",
        [
          "row partial の表示が崩れる / table cell 数が合わない",
          "tree node key と UI DOM ID",
          "tree.node_key_for(item)",
          "Tree diagnostics",
          "Node keys",
          "GraphAdapter の行が重複する / 足りない / 想定と違う形になる",
          "`nil` は空の child list",
          "node_key_resolver:",
          "cycle や duplicate key",
          "duplicate node key / orphan / DOM ID collision / cycle が出る",
          "validate_node_keys: true",
          "orphan_strategy:",
          "render_state.validate_unique_dom_ids!",
          "TreeView::CycleDiagnostics.new(tree).report"
        ]
      ]
    ]
  },
  {
    feature: "Render log level reader journey",
    files: [
      [
        "README.md",
        [
          "docs/en/render-log-level.md",
          "docs/ja/render-log-level.md",
          "accepted values",
          "host app's global Rails logger level"
        ]
      ],
      [
        "docs/README.md",
        [
          "en/render-log-level.md",
          "ja/render-log-level.md",
          "host app's global Rails logger level"
        ]
      ],
      [
        "docs/en/README.md",
        [
          "Render log level",
          "render-log-level.md",
          "Configure TreeView partial render log silencing",
          "TreeView render log verbosity in host app logs"
        ]
      ],
      [
        "docs/ja/README.md",
        [
          "render log レベル",
          "render-log-level.md",
          "TreeView partial render log の抑制設定",
          "host app log 上の TreeView render log"
        ]
      ]
    ]
  },
  {
    feature: "Selection and children pagination unloaded descendants boundary",
    files: [
      [
        "docs/en/selection.md",
        [
          "DOM-based",
          "rendered rows only",
          "unloaded descendants",
          "server-side intent or query filter",
          "Children Pagination",
          "children-pagination-selection-boundary.html"
        ]
      ],
      [
        "docs/ja/selection.md",
        [
          "DOMベース",
          "描画済み行だけ",
          "unloaded descendants",
          "server-side intent",
          "Children Pagination",
          "children-pagination-selection-boundary.html"
        ]
      ],
      [
        "docs/en/children-pagination.md",
        [
          "Selection and drag/drop interactions",
          "unloaded descendants",
          "server-side selection intent",
          "query-backed actions",
          "DOM-submitted checkbox values",
          "Selection](selection.md#linked-checkbox-behavior)",
          "children-pagination-selection-boundary.html"
        ]
      ],
      [
        "docs/ja/children-pagination.md",
        [
          "selection / drag-drop との相互作用",
          "unloaded descendants",
          "server-side selection intent",
          "query-backed action",
          "DOMから送られるcheckbox値",
          "Selection](selection.md#連動checkbox挙動)",
          "children-pagination-selection-boundary.html"
        ]
      ]
    ]
  },
  {
    feature: "Accessibility semantics mockup reader journey",
    files: [
      [
        "docs/en/accessibility-semantics.md",
        [
          "accessibility-semantics.html",
          "table-first ARIA policy",
          "toggle `aria-expanded`",
          "omitted `aria-controls`",
          "host-app-owned page-structure boundaries"
        ]
      ],
      [
        "docs/ja/accessibility-semantics.md",
        [
          "accessibility-semantics.html",
          "table-first ARIA policy",
          "toggle の `aria-expanded`",
          "`aria-controls` 非採用",
          "host-app-owned page structure boundary"
        ]
      ],
      [
        "docs/mockups/accessibility-semantics.html",
        [
          "data-tree-view-sample=\"accessibility-semantics\"",
          "Table-first, not treegrid",
          "aria-controls",
          "host-app decisions"
        ]
      ]
    ]
  },
  {
    feature: "Public name decisions reader journey",
    files: [
      [
        "docs/en/README.md",
        ["Public Name Decisions", "public-name-decisions.md"]
      ],
      [
        "docs/ja/README.md",
        ["公開名の判断メモ", "public-name-decisions.md"]
      ],
      [
        "docs/en/public-name-decisions.md",
        [
          "badge_builder",
          "recommended hook",
          "icon_builder",
          "compatibility alias",
          "row_event_payload_builder",
          "transfer-specific",
          "not a generic event payload hook",
          "loading_builder",
          "error_builder",
          "boolean predicates",
          "do not build UI"
        ]
      ],
      [
        "docs/ja/public-name-decisions.md",
        [
          "badge_builder",
          "推奨します",
          "icon_builder",
          "compatibility alias",
          "row_event_payload_builder",
          "transfer専用",
          "汎用payload hookではありません",
          "loading_builder",
          "error_builder",
          "boolean predicate",
          "UIをbuildするhookではありません"
        ]
      ]
    ]
  },
  {
    feature: "Mockup README smoke and review policy",
    files: [
      [
        "docs/mockups/README.md",
        [
          "Automated smoke coverage",
          "npm run test:browser",
          "review gallery",
          "local links",
          "representative sample regions",
          "without adding screenshot baselines or visual diff review",
          "Review policy",
          "static HTML/CSS",
          "product-neutral",
          "source HTML/CSS should remain the canonical mockup",
          "playground app"
        ]
      ]
    ]
  }
]

signalGroups.forEach(({ feature, files }) => {
  files.forEach(([sourcePath, signals]) => assertSignals(sourcePath, feature, signals))
})
