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

const featureEntrypoints = [
  {
    feature: "GraphAdapter",
    rootPattern: /Use `GraphAdapter`/,
    links: [
      ["README.md", "docs/en/graph-adapter.md"],
      ["README.md", "docs/ja/graph-adapter.md"],
      ["docs/README.md", "en/graph-adapter.md"],
      ["docs/README.md", "ja/graph-adapter.md"],
      ["docs/en/README.md", "graph-adapter.md"],
      ["docs/ja/README.md", "graph-adapter.md"]
    ]
  },
  {
    feature: "PathTreeBuilder",
    rootPattern: /PathTreeBuilder/,
    links: [
      ["docs/README.md", "en/path-tree-builder.md"],
      ["docs/README.md", "ja/path-tree-builder.md"],
      ["docs/en/README.md", "path-tree-builder.md"],
      ["docs/ja/README.md", "path-tree-builder.md"]
    ]
  },
  {
    feature: "ReverseTree",
    rootPattern: /ReverseTree/,
    links: [
      ["docs/README.md", "en/reverse-tree.md"],
      ["docs/README.md", "ja/reverse-tree.md"],
      ["docs/en/README.md", "reverse-tree.md"],
      ["docs/ja/README.md", "reverse-tree.md"]
    ]
  },
  {
    feature: "VisibleRows / RenderWindow",
    rootPattern: /VisibleRows[\s\S]*RenderWindow|RenderWindow[\s\S]*VisibleRows/,
    links: [
      ["docs/README.md", "en/windowed-rendering.md"],
      ["docs/README.md", "ja/windowed-rendering.md"],
      ["docs/en/README.md", "windowed-rendering.md"],
      ["docs/ja/README.md", "windowed-rendering.md"]
    ]
  },
  {
    feature: "Filtered Trees",
    rootPattern: /Filtered Trees/,
    links: [
      ["README.md", "docs/en/filtered-trees.md"],
      ["README.md", "docs/ja/filtered-trees.md"],
      ["docs/README.md", "en/filtered-trees.md"],
      ["docs/README.md", "ja/filtered-trees.md"],
      ["docs/en/README.md", "filtered-trees.md"],
      ["docs/ja/README.md", "filtered-trees.md"]
    ]
  },
  {
    feature: "Render Scale strategy",
    rootPattern: /Render Scale[\s\S]*Lazy Loading[\s\S]*Children Pagination/,
    links: [
      ["README.md", "docs/en/render-scale.md"],
      ["README.md", "docs/ja/render-scale.md"],
      ["README.md", "docs/en/lazy-loading.md"],
      ["README.md", "docs/ja/lazy-loading.md"],
      ["README.md", "docs/en/windowed-rendering.md"],
      ["README.md", "docs/ja/windowed-rendering.md"],
      ["README.md", "docs/en/children-pagination.md"],
      ["README.md", "docs/ja/children-pagination.md"],
      ["README.md", "docs/en/rendering-boundaries.md"],
      ["README.md", "docs/ja/rendering-boundaries.md"],
      ["docs/README.md", "en/lazy-loading.md"],
      ["docs/README.md", "ja/lazy-loading.md"],
      ["docs/README.md", "en/windowed-rendering.md"],
      ["docs/README.md", "ja/windowed-rendering.md"],
      ["docs/README.md", "en/children-pagination.md"],
      ["docs/README.md", "ja/children-pagination.md"],
      ["docs/en/README.md", "render-scale.md"],
      ["docs/en/README.md", "lazy-loading.md"],
      ["docs/en/README.md", "windowed-rendering.md"],
      ["docs/en/README.md", "children-pagination.md"],
      ["docs/ja/README.md", "render-scale.md"],
      ["docs/ja/README.md", "lazy-loading.md"],
      ["docs/ja/README.md", "windowed-rendering.md"],
      ["docs/ja/README.md", "children-pagination.md"]
    ]
  },
  {
    feature: "Rendering Boundaries",
    rootPattern: /Rendering Boundaries|描画責務の境界/,
    links: [
      ["README.md", "docs/en/rendering-boundaries.md"],
      ["README.md", "docs/ja/rendering-boundaries.md"],
      ["docs/en/README.md", "rendering-boundaries.md"],
      ["docs/ja/README.md", "rendering-boundaries.md"]
    ],
    signals: [
      [
        "docs/en/rendering-boundaries.md",
        /row_partial[\s\S]*host app partial renders application-specific columns/,
        "English rendering-boundaries docs no longer state the row_partial ownership boundary"
      ],
      [
        "docs/en/rendering-boundaries.md",
        /controller action, query, and Turbo Stream response[\s\S]*host app/,
        "English rendering-boundaries docs no longer state the Turbo response ownership boundary"
      ],
      [
        "docs/ja/rendering-boundaries.md",
        /row_partial[\s\S]*host app partialが業務固有のcolumns/,
        "Japanese rendering-boundaries docs no longer state the row_partial ownership boundary"
      ],
      [
        "docs/ja/rendering-boundaries.md",
        /controller action、query、Turbo Stream responseはhost app側の責務/,
        "Japanese rendering-boundaries docs no longer state the Turbo response ownership boundary"
      ]
    ]
  },
  {
    feature: "Turbo Frame option",
    rootPattern: /Turbo Frame option/,
    links: [
      ["README.md", "docs/en/turbo-frame.md"],
      ["README.md", "docs/ja/turbo-frame.md"],
      ["docs/README.md", "en/turbo-frame.md"],
      ["docs/README.md", "ja/turbo-frame.md"],
      ["docs/en/README.md", "turbo-frame.md"],
      ["docs/ja/README.md", "turbo-frame.md"]
    ]
  },
  {
    feature: "Selection",
    rootPattern: /checkbox selection|selection hooks/i,
    links: [
      ["README.md", "docs/en/selection.md"],
      ["README.md", "docs/ja/selection.md"],
      ["docs/README.md", "en/selection.md"],
      ["docs/README.md", "ja/selection.md"],
      ["docs/en/README.md", "selection.md"],
      ["docs/ja/README.md", "selection.md"]
    ],
    signals: [
      [
        "docs/en/public-api.md",
        /TreeViewSelectionDataHooks[\s\S]*hiddenInputNameValue[\s\S]*maxCountValue[\s\S]*cascadeValue[\s\S]*indeterminateValue[\s\S]*data-tree-view-selection-hidden-input-name-value[\s\S]*data-tree-view-selection-max-count-value[\s\S]*data-tree-view-selection-cascade-value[\s\S]*data-tree-view-selection-indeterminate-value/,
        "English public API docs no longer expose the TreeViewSelectionDataHooks host-authored value attributes"
      ],
      [
        "docs/ja/public-api.md",
        /TreeViewSelectionDataHooks[\s\S]*hiddenInputNameValue[\s\S]*maxCountValue[\s\S]*cascadeValue[\s\S]*indeterminateValue[\s\S]*data-tree-view-selection-hidden-input-name-value[\s\S]*data-tree-view-selection-max-count-value[\s\S]*data-tree-view-selection-cascade-value[\s\S]*data-tree-view-selection-indeterminate-value/,
        "Japanese public API docs no longer expose the TreeViewSelectionDataHooks host-authored value attributes"
      ],
      [
        "docs/en/selection.md",
        /TreeViewSelectionDataHooks\.hiddenInputNameValue[\s\S]*TreeViewSelectionDataHooks\.maxCountValue[\s\S]*TreeViewSelectionDataHooks\.cascadeValue[\s\S]*TreeViewSelectionDataHooks\.indeterminateValue/,
        "English selection docs no longer expose the machine-readable selection data hooks"
      ],
      [
        "docs/ja/selection.md",
        /TreeViewSelectionDataHooks\.hiddenInputNameValue[\s\S]*TreeViewSelectionDataHooks\.maxCountValue[\s\S]*TreeViewSelectionDataHooks\.cascadeValue[\s\S]*TreeViewSelectionDataHooks\.indeterminateValue/,
        "Japanese selection docs no longer expose the machine-readable selection data hooks"
      ]
    ]
  },
  {
    feature: "Forms and editing rows",
    rootPattern: /Forms and editing rows|Form と編集行/,
    links: [
      ["README.md", "docs/en/form-editing.md"],
      ["README.md", "docs/ja/form-editing.md"],
      ["docs/en/README.md", "form-editing.md"],
      ["docs/ja/README.md", "form-editing.md"]
    ]
  },
  {
    feature: "Resource table bridge",
    rootPattern: /Resource table bridge/,
    links: [
      ["README.md", "docs/en/resource-table-bridge.md"],
      ["README.md", "docs/ja/resource-table-bridge.md"],
      ["docs/README.md", "en/resource-table-bridge.md"],
      ["docs/README.md", "ja/resource-table-bridge.md"],
      ["docs/en/README.md", "resource-table-bridge.md"],
      ["docs/ja/README.md", "resource-table-bridge.md"]
    ]
  },
  {
    feature: "Toolbar helper",
    rootPattern: /tree_view_toolbar|Toolbar helper/,
    links: [
      ["README.md", "docs/en/toolbar.md"],
      ["README.md", "docs/ja/toolbar.md"],
      ["docs/en/README.md", "toolbar.md"],
      ["docs/ja/README.md", "toolbar.md"]
    ]
  },
  {
    feature: "Breadcrumb helper",
    rootPattern: /tree_view_breadcrumb|Breadcrumb helper/,
    links: [
      ["README.md", "docs/en/breadcrumb.md"],
      ["README.md", "docs/ja/breadcrumb.md"],
      ["docs/README.md", "en/breadcrumb.md"],
      ["docs/README.md", "ja/breadcrumb.md"],
      ["docs/en/README.md", "breadcrumb.md"],
      ["docs/ja/README.md", "breadcrumb.md"]
    ]
  },
  {
    feature: "Cookbook",
    rootPattern: /Cookbook/,
    links: [
      ["README.md", "docs/en/cookbook.md"],
      ["README.md", "docs/ja/cookbook.md"],
      ["docs/README.md", "en/cookbook.md"],
      ["docs/README.md", "ja/cookbook.md"],
      ["docs/en/README.md", "cookbook.md"],
      ["docs/ja/README.md", "cookbook.md"]
    ],
    signals: [
      [
        "docs/en/cookbook.md",
        /tree_view_breadcrumb[\s\S]*row_partial[\s\S]*row_actions_partial[\s\S]*data-tree-view-interactive[\s\S]*TreeView::NodePresenter[\s\S]*TreeView\.model_name_for[\s\S]*TreeView\.attribute_name_for[\s\S]*TreeView\.type_name_for/,
        "English Cookbook no longer exposes the representative host-app pattern signals"
      ],
      [
        "docs/ja/cookbook.md",
        /tree_view_breadcrumb[\s\S]*row_partial[\s\S]*row_actions_partial[\s\S]*data-tree-view-interactive[\s\S]*TreeView::NodePresenter[\s\S]*TreeView\.model_name_for[\s\S]*TreeView\.attribute_name_for[\s\S]*TreeView\.type_name_for/,
        "Japanese Cookbook no longer exposes the representative host-app pattern signals"
      ]
    ]
  },
  {
    feature: "Depth Labels",
    links: [
      ["docs/en/README.md", "depth-labels.md"],
      ["docs/ja/README.md", "depth-labels.md"]
    ]
  },
  {
    feature: "Row Status",
    links: [
      ["docs/en/README.md", "row-status.md"],
      ["docs/ja/README.md", "row-status.md"]
    ]
  },
  {
    feature: "Persisted State",
    rootPattern: /PersistedState|StateStore|Persisted State/,
    links: [
      ["docs/README.md", "en/persisted-state.md"],
      ["docs/README.md", "ja/persisted-state.md"],
      ["docs/en/README.md", "persisted-state.md"],
      ["docs/ja/README.md", "persisted-state.md"]
    ]
  },
  {
    feature: "Localized names",
    rootPattern: /Localized names/,
    links: [
      ["README.md", "docs/en/localized-names.md"],
      ["README.md", "docs/ja/localized-names.md"],
      ["docs/README.md", "en/localized-names.md"],
      ["docs/README.md", "ja/localized-names.md"],
      ["docs/en/README.md", "localized-names.md"],
      ["docs/ja/README.md", "localized-names.md"]
    ]
  },
  {
    feature: "Styling state cues",
    rootPattern: /Packaged stylesheet state cues|Styling state cues/,
    links: [
      ["README.md", "docs/en/styling-state-cues.md"],
      ["README.md", "docs/ja/styling-state-cues.md"],
      ["docs/README.md", "en/styling-state-cues.md"],
      ["docs/README.md", "ja/styling-state-cues.md"]
    ]
  },
  {
    feature: "Render log level",
    rootPattern: /render log silencing|render_log_level/i,
    links: [
      ["README.md", "docs/en/render-log-level.md"],
      ["README.md", "docs/ja/render-log-level.md"],
      ["docs/en/README.md", "render-log-level.md"],
      ["docs/ja/README.md", "render-log-level.md"]
    ]
  },
  {
    feature: "JavaScript controllers and events",
    rootPattern: /Register JavaScript controllers/,
    links: [
      ["docs/README.md", "en/public-api.md"],
      ["docs/README.md", "ja/public-api.md"],
      ["docs/en/README.md", "js-events.md"],
      ["docs/ja/README.md", "js-events.md"]
    ]
  },
  {
    feature: "Drag and Drop / Host App Extension Points",
    rootPattern: /Drag and drop[\s\S]*Host app extension boundary|Host app extension boundary[\s\S]*Drag and drop/i,
    links: [
      ["README.md", "docs/en/drag-and-drop.md"],
      ["README.md", "docs/ja/drag-and-drop.md"],
      ["README.md", "docs/en/host-app-extension-points.md"],
      ["README.md", "docs/ja/host-app-extension-points.md"],
      ["docs/en/README.md", "drag-and-drop.md"],
      ["docs/en/README.md", "host-app-extension-points.md"],
      ["docs/ja/README.md", "drag-and-drop.md"],
      ["docs/ja/README.md", "host-app-extension-points.md"]
    ],
    signals: [
      [
        "docs/en/host-app-extension-points.md",
        /row_partial[\s\S]*row_actions_partial[\s\S]*row_data_builder[\s\S]*row_event_payload_builder/,
        "English host-app extension docs no longer expose the row extension surface reverse lookup"
      ],
      [
        "docs/en/host-app-extension-points.md",
        /data-tree-view-interactive[\s\S]*data-tree-view-ignore-keyboard[\s\S]*data-tree-view-ignore-row-click[\s\S]*data-tree-view-ignore-drag/,
        "English host-app extension docs no longer expose the interactive marker boundary"
      ],
      [
        "docs/en/host-app-extension-points.md",
        /data-tree-view-selection-hidden-input-name-value[\s\S]*data-tree-view-selection-max-count-value[\s\S]*data-tree-view-selection-cascade-value[\s\S]*data-tree-view-selection-indeterminate-value/,
        "English host-app extension docs no longer expose the selection controller value attributes"
      ],
      [
        "docs/en/host-app-extension-points.md",
        /TreeView::PersistedState[\s\S]*TreeView::StateStore[\s\S]*show_descendants_path_builder[\s\S]*load_children_path_builder/,
        "English host-app extension docs no longer expose persisted-state and path-builder boundaries"
      ],
      [
        "docs/ja/host-app-extension-points.md",
        /row_partial[\s\S]*row_actions_partial[\s\S]*row_data_builder[\s\S]*row_event_payload_builder/,
        "Japanese host-app extension docs no longer expose the row extension surface reverse lookup"
      ],
      [
        "docs/ja/host-app-extension-points.md",
        /data-tree-view-interactive[\s\S]*data-tree-view-ignore-keyboard[\s\S]*data-tree-view-ignore-row-click[\s\S]*data-tree-view-ignore-drag/,
        "Japanese host-app extension docs no longer expose the interactive marker boundary"
      ],
      [
        "docs/ja/host-app-extension-points.md",
        /data-tree-view-selection-hidden-input-name-value[\s\S]*data-tree-view-selection-max-count-value[\s\S]*data-tree-view-selection-cascade-value[\s\S]*data-tree-view-selection-indeterminate-value/,
        "Japanese host-app extension docs no longer expose the selection controller value attributes"
      ],
      [
        "docs/ja/host-app-extension-points.md",
        /TreeView::PersistedState[\s\S]*TreeView::StateStore[\s\S]*show_descendants_path_builder[\s\S]*load_children_path_builder/,
        "Japanese host-app extension docs no longer expose persisted-state and path-builder boundaries"
      ]
    ]
  },
  {
    feature: "Accessibility Semantics",
    rootPattern: /Accessibility Semantics[\s\S]*ARIA|accessibility-oriented row semantics/i,
    links: [
      ["README.md", "docs/en/accessibility-semantics.md"],
      ["README.md", "docs/ja/accessibility-semantics.md"],
      ["docs/README.md", "en/accessibility-semantics.md"],
      ["docs/README.md", "ja/accessibility-semantics.md"],
      ["docs/en/README.md", "accessibility-semantics.md"],
      ["docs/ja/README.md", "accessibility-semantics.md"]
    ]
  },
  {
    feature: "Direction-aware styling boundary",
    rootPattern: /Direction-aware styling boundary/i,
    links: [
      ["README.md", "docs/en/direction-aware-styling.md"],
      ["README.md", "docs/ja/direction-aware-styling.md"],
      ["docs/README.md", "en/direction-aware-styling.md"],
      ["docs/README.md", "ja/direction-aware-styling.md"],
      ["docs/en/README.md", "direction-aware-styling.md"],
      ["docs/ja/README.md", "direction-aware-styling.md"]
    ]
  },
  {
    feature: "Visual reference mockups",
    rootPattern: /TreeView mockups|Visual reference mockups/,
    links: [
      ["README.md", "docs/mockups/README.md"],
      ["README.md", "docs/mockups/review-gallery.html"],
      ["docs/README.md", "mockups/README.md"],
      ["docs/en/README.md", "../mockups/README.md"],
      ["docs/ja/README.md", "../mockups/README.md"]
    ]
  }
]

featureEntrypoints.forEach(({ feature, rootPattern, links, signals = [] }) => {
  assertRootSignal(feature, rootPattern, "README.md no longer exposes the representative feature signal")

  links.forEach(([sourcePath, href]) => assertRelativeLink(sourcePath, href, feature))
  signals.forEach(([sourcePath, signalPattern, message]) => {
    assertDocumentSignal(sourcePath, signalPattern, feature, message)
  })
})
