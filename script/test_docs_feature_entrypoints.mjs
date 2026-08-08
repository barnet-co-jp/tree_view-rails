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
    feature: "NodePresenter row partial patterns",
    rootPattern: /NodePresenter row partial patterns/,
    links: [
      ["README.md", "docs/en/node-presenter-row-partials.md"],
      ["README.md", "docs/ja/node-presenter-row-partials.md"],
      ["docs/en/README.md", "node-presenter-row-partials.md"],
      ["docs/ja/README.md", "node-presenter-row-partials.md"],
      ["docs/en/host-app-extension-points.md", "node-presenter-row-partials.md"],
      ["docs/ja/host-app-extension-points.md", "node-presenter-row-partials.md"]
    ],
    signals: [
      [
        "docs/en/node-presenter-row-partials.md",
        /host-app row partials[\s\S]*without adding a generic Column \/ Action DSL[\s\S]*`row_partial`, a builder, or host-app UI code/,
        "English NodePresenter row partial docs no longer state the host-app ownership and no-generic-DSL boundary"
      ],
      [
        "docs/ja/node-presenter-row-partials.md",
        /汎用的な Column \/ Action DSL を追加せず[\s\S]*host app の row partial[\s\S]*`row_partial`、builder、host app 側 UI code/,
        "Japanese NodePresenter row partial docs no longer state the host-app ownership and no-generic-DSL boundary"
      ],
      [
        "docs/en/node-presenter-row-partials.md",
        /node-presenter-row-partials\.html[\s\S]*host-app-owned columns and permissions/,
        "English NodePresenter row partial docs no longer link the visual reference and host-owned columns/permissions boundary"
      ],
      [
        "docs/ja/node-presenter-row-partials.md",
        /host app 側の column や permission[\s\S]*node-presenter-row-partials\.html/,
        "Japanese NodePresenter row partial docs no longer link the visual reference and host-owned columns/permissions boundary"
      ],
      [
        "docs/en/node-presenter-row-partials.md",
        /node_presenter_builder_names[\s\S]*public builder names[\s\S]*stabilizes the available builder names only[\s\S]*remains host-app owned/,
        "English NodePresenter row partial docs no longer distinguish builder-name compatibility from host-owned meanings"
      ],
      [
        "docs/ja/node-presenter-row-partials.md",
        /node_presenter_builder_names[\s\S]*公開 builder 名[\s\S]*安定させるのは利用可能な builder 名[\s\S]*host app 側の責務/,
        "Japanese NodePresenter row partial docs no longer distinguish builder-name compatibility from host-owned meanings"
      ],
      [
        "docs/mockups/node-presenter-row-partials.html",
        /Presenter-backed row partial sample[\s\S]*Adjacent columns stay host-app owned[\s\S]*Host-app-owned surface[\s\S]*Business columns, counts, routes, and authorization policy/,
        "NodePresenter row partial mockup no longer preserves the host-owned columns and permissions visual boundary"
      ]
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
    ],
    signals: [
      [
        "docs/en/accessibility-semantics.md",
        /Home and End move focus to the first and last visible rendered row[\s\S]*does not add typeahead, PageUp\/PageDown traversal, roving tabindex ownership[\s\S]*WAI-ARIA treegrid cell/,
        "English accessibility docs no longer preserve Home/End visible-row behavior and full-treegrid non-goals"
      ],
      [
        "docs/ja/accessibility-semantics.md",
        /Home \/ End は表示中の描画 row の先頭 \/ 末尾へ focus を移し[\s\S]*typeahead、PageUp \/ PageDown traversal、roving tabindex の所有[\s\S]*WAI-ARIA treegrid cell/,
        "Japanese accessibility docs no longer preserve Home/End visible-row behavior and full-treegrid non-goals"
      ],
      [
        "docs/mockups/keyboard-focus-states.html",
        /Static reference[\s\S]*lightweight focus cue[\s\S]*focus order, shortcut keys, and full treegrid keyboard behavior remain host-app responsibilities[\s\S]*does not introduce roving tabindex, arrow-key navigation, or full WAI-ARIA treegrid behavior/,
        "Keyboard focus mockup no longer preserves the static lightweight cue and host-owned keyboard model boundary"
      ],
      [
        "docs/mockups/README.md",
        /keyboard-focus-states\.html[\s\S]*without promising a full keyboard model[\s\S]*Keep tab order, shortcut keys, roving tabindex, and full treegrid keyboard behavior/,
        "Mockup index no longer preserves the keyboard focus reference and host-owned keyboard model boundary"
      ]
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
    ],
    signals: [
      [
        "docs/en/host-app-extension-points.md",
        /direction-aware stylesheet overrides owned by the host app[\s\S]*RTL, vertical writing, or design-system-specific current-row and hierarchy cues[\s\S]*documented hooks intact[\s\S]*Direction-aware styling boundary/,
        "English host-app extension docs no longer route host-owned direction-aware overrides to the linked boundary guide"
      ],
      [
        "docs/ja/host-app-extension-points.md",
        /host app が所有する direction-aware stylesheet override[\s\S]*RTL、vertical writing、design-system-specific な current-row \/ hierarchy cue[\s\S]*documented hook を維持[\s\S]*Direction-aware styling boundary/,
        "Japanese host-app extension docs no longer route host-owned direction-aware overrides to the linked boundary guide"
      ],
      [
        "docs/en/direction-aware-styling.md",
        /Mockup-only classes and internal stylesheet selectors are review aids[\s\S]*public hooks[\s\S]*manifest-backed compatibility checks[\s\S]*Future public hook criteria[\s\S]*shipped CSS behavior is stable[\s\S]*English and Japanese docs[\s\S]*manifest-backed compatibility checks are updated/,
        "English direction-aware guide no longer preserves the non-promotion boundary and future public-hook criteria"
      ],
      [
        "docs/ja/direction-aware-styling.md",
        /mockup-only class や internal stylesheet selector は[\s\S]*public hook[\s\S]*manifest-backed compatibility check[\s\S]*将来 public hook に昇格する条件[\s\S]*shipped CSS behavior[\s\S]*英日 docs[\s\S]*manifest-backed compatibility check も更新/,
        "Japanese direction-aware guide no longer preserves the non-promotion boundary and future public-hook criteria"
      ]
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
