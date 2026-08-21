# Public API

This page describes which APIs host Rails apps may depend on directly, which parts are internal, and how compatibility is handled.

## Public API manifest

`config/public_api_manifest.yml` is a packaged audit artifact and compatibility contract. It records machine-readable public helper methods, grouped option keys, JavaScript package-root exports, controller identifiers, event surfaces, and selected documented hooks so specs, package checks, and entrypoint smoke checks can compare docs-facing contracts with current code.

Host apps should not treat the manifest as a runtime configuration API. Use the documented Ruby classes, helpers, options, JavaScript exports, and feature guides instead. The manifest is included in the gem package so maintainers can catch missing files or contract drift during release verification; its schema may evolve as long as the documented public surface remains compatible.

## Stable public entry points

Host apps may use these entry points directly:

- `TreeView.configure`
- `TreeView.configuration`
- `TreeView.reset_configuration!`
- `TreeView.parse_selection_params`
- `TreeView.node_key`
- `TreeView.model_name_for`
- `TreeView.attribute_name_for`
- `TreeView.type_name_for`
- `TreeView::Error`
- `TreeView::ConfigurationError`
- `TreeView::InvalidTreeError`
- `TreeView::DuplicateNodeKeyError`
- `TreeView::CycleDetectedError`
- `TreeView::InvalidRenderWindowError`
- `TreeView::Configuration`
- `TreeView::LocalizedNames`
- `TreeView::Tree`
- `TreeView::RenderState`
- `TreeView::ResourceTableRenderState.call`
- `TreeView::VisibleRows`
- `TreeView::RenderWindow`
- `TreeView::FilteredTree`
- `TreeView::UiConfig`
- `TreeView::UiConfigBuilder`
- `TreeView::GraphAdapter`
- `TreeView::NodePresenter`
- `TreeView::PathTree`
- `TreeView::PathTreeBuilder`
- `TreeView::ReverseTree`
- `TreeView::PersistedState`
- `TreeView::StateStore`
- `TreeView::Diagnostics`
- `tree_view_rows(render_state)`
- `tree_view_rows(render_state, window: { offset:, limit: })`
- `tree_view_window(render_state, offset:, limit:)`
- `tree_view_state_data(render_state)`
- `tree_node_dom_id(item_or_id, ui: @tree_ui)`
- `tree_children_container_dom_id(item, ui: @tree_ui)`
- `tree_remote_state_placeholder_dom_id(item, ui: @tree_ui)`
- `tree_remote_state_placeholder_attributes(item, state: nil, ui: @tree_ui)`
- `tree_selection_value(item, tree, builder = nil)`
- `tree_view_breadcrumb(tree, item, ...)`
- `tree_view_toolbar(render_state, ...)`
- `tree_view_toolbar_supported_actions`
- `tree_view_toolbar_actions(render_state, ...)`
- `tree_view_toolbar_action_metadata(render_state, action, ...)`

Use `TreeView::ResourceTableRenderState.call` when another table layer already owns column inference and table state, and TreeView should only build the hierarchical render state. See [Resource table bridge](resource-table-bridge.md).

`TreeView::FilteredTree` is a stable public entry point for filtered tree results. Its mode set is also tracked in `config/public_api_manifest.yml` as the `filtered_tree_modes` contract; see [Filtered Trees: Modes](filtered-trees.md#modes) for the documented mode table and the host-app boundary for search query, ranking, authorization, and highlighting.

`TreeView::GraphAdapter` is the adapter-mode entry point for heterogeneous or graph-like nodes that do not fit one parent-id column. See [GraphAdapter](graph-adapter.md) and [API overview: adapter mode](api-overview.md#adapter-mode) for the host-app traversal, authorization, query planning, and node-key boundaries.

`TreeView::Diagnostics` is the aggregate pre-render validation entry point for node key, DOM ID, orphan, and cycle checks. See [Tree diagnostics](tree-diagnostics.md) for the `TreeView::Diagnostics.run` flow, `Result` surface, and host-app data correction boundary.

## Public error surface

Host apps may rescue `TreeView::Error` to handle documented TreeView validation and configuration failures separately from unrelated application errors.

`TreeView::Error` inherits from `ArgumentError` for compatibility with existing integrations. New integrations should prefer `TreeView::Error` or a documented subclass when handling TreeView-specific failures.

Documented public subclasses are listed in [Error hierarchy](errors.md).

## Public helper surface

The supported helper surface is the documented helper method names exposed by `TreeViewHelper` and related helper modules, tracked as the machine-readable helper-method contract in `config/public_api_manifest.yml`.

Host apps should include `TreeViewHelper` and depend on documented helper methods. They should not directly include internal implementation modules such as `TreeViewHelper::Rendering` or `TreeViewHelper::Selection`.

Documented non-toolbar helpers that are part of that public helper surface include:

- `tree_view_rows(render_state, window: nil)` renders TreeView rows, including opt-in windowed rendering.
- `tree_view_window(render_state, offset:, limit:)` returns documented window metadata for visible rows.
- `tree_view_state_data(render_state)` returns the root `data-*` wiring for TreeView state and configured client-side, selection, transfer, and remote-state controllers.
- `tree_node_dom_id(item_or_id, ui: @tree_ui)` builds node DOM IDs through the resolved `UiConfig`.
- `tree_children_container_dom_id(item, ui: @tree_ui)` builds the stable children-container DOM ID used by lazy-loading host-app placeholder regions.
- `tree_remote_state_placeholder_dom_id(item, ui: @tree_ui)` builds the stable remote-state placeholder DOM ID for one row.
- `tree_remote_state_placeholder_attributes(item, state: nil, ui: @tree_ui)` returns the documented placeholder `id` and optional `data-tree-remote-state` attribute for host-app lazy-loading responses.
- `tree_selection_value(item, tree, builder = nil)` serializes the documented checkbox payload contract for host-app selection wiring and assertions.
- `tree_view_breadcrumb(tree, item, ...)` renders a breadcrumb path for a node.

For host apps that own lazy-loading placeholder regions, these three lazy-loading helpers are part of the same stable helper surface described in [Lazy Loading](lazy-loading.md). Use them instead of reconstructing placeholder IDs or `data-tree-remote-state` attributes by hand.

Pass the parent item that owns the lazy-loading placeholder to the lazy-loading helper methods. `tree_node_dom_id(item_or_id, ...)` remains the broader DOM ID helper for item-like or id-like values; the placeholder helpers are documented for item-based lazy-loading regions so they stay aligned with the row and Turbo Stream examples.

DOM and path helpers that are absent from `config/public_api_manifest.yml` remain internal composition helpers, even when bundled partials call them. For example, `tree_button_dom_id`, `tree_show_button_dom_id`, `tree_selection_checkbox_dom_id`, and toggle or lazy-loading path helpers are reserved for TreeView's own partial and helper composition. Host apps should depend on the manifest-backed node, children-container, and remote-state placeholder helpers above rather than those internal helper names.

For app-owned toolbar builders, use `tree_view_toolbar_supported_actions`, `tree_view_toolbar_actions`, and `tree_view_toolbar_action_metadata` rather than internal constants.
Documented toolbar helpers are part of that public helper surface:

- `tree_view_toolbar(render_state, actions: ..., labels: ..., class_name: ..., button_class_name: ..., html: ..., action_html: ...)` renders TreeView's bundled toolbar markup and accepts documented additive HTML attributes for the toolbar container and action elements.
- `tree_view_toolbar_supported_actions` returns the supported toolbar action symbols for app-owned toolbar builders.
- `tree_view_toolbar_actions(render_state, actions: ..., labels: {})` returns action hashes so the host app can render its own toolbar markup.
- `tree_view_toolbar_action_metadata(render_state, action, label: nil)` returns metadata for one supported action.

`html:` adds container attributes such as `class`, `data`, or `aria` while preserving TreeView's required toolbar data hook. `action_html:` adds attributes to each action link or disabled button through an action-aware Proc, action-keyed Hash, or flat Hash while preserving TreeView's required action and disabled data hooks. Use custom rendering helpers when the host app needs different markup, authorization copy, or additional controls.

Supported toolbar action symbols are `:expand_all`, `:collapse_all`, and `:collapse_all_except_current_path`.

These actions request tree-wide toggle states `:expanded`, `:collapsed`, and `:current_path` respectively. When the current UI mode does not expose `toggle_all_path_builder`, metadata returns `path: nil` and `disabled: true`, leaving fallback UI decisions to the host app.

Internal constants such as `TREE_VIEW_TOOLBAR_ACTIONS`, `TREE_VIEW_TOOLBAR_LABELS`, and `TREE_VIEW_TOOLBAR_STATES` are implementation details. Host apps should depend on the documented helper methods and returned metadata shape instead of referencing those constants directly.

Helper methods that are not documented in `config/public_api_manifest.yml` are not part of the public compatibility contract even if bundled partials call them internally.

Internal module names may change as long as documented helper behavior is preserved.

## Public option surface

The public option surface includes documented keyword arguments and grouped options for these objects:

- `TreeView::Configuration`
- `TreeView::Tree`
- `TreeView::PathTreeBuilder`
- `TreeView::RenderState`
- `TreeView::ResourceTableRenderState.call`
- `TreeView::UiConfig`
- `TreeView::UiConfigBuilder`
- `TreeView::RenderWindow`
- `TreeView::PersistedState`
- `TreeView::StateStore`

Documented configuration options include:

- `initial_state`
- `render_log_level`

`TreeView.configure`, `TreeView.configuration`, and `TreeView.reset_configuration!` are the stable configuration entry points. Depend on documented option names and behavior rather than the internal shape of the configuration object. The manifest tracks these option names, not their accepted value sets: `initial_state` accepts `:expanded` and `:collapsed`, while `render_log_level` accepts the documented Ruby logger levels or `nil` to disable TreeView render log silencing. Those accepted values are guarded by compatibility specs and feature docs rather than a separate manifest value schema. See [Render log level](render-log-level.md) for the `render_log_level` values, default, disable path, and host-app logging boundary.

Documented localized display-name helpers include:

- `TreeView.model_name_for(item_or_class, count: 1, default: nil)`
- `TreeView.attribute_name_for(item_or_class, attribute, default: nil)`
- `TreeView.type_name_for(item, count: 1, default: nil)`

Localized display-name helpers resolve labels through the host app's Rails / ActiveModel / I18n locale data when available, then fall back to humanized names or an explicit `default:` value. They only return display names; host app row partials, helpers, or presenters still decide where those names appear in the UI. See [Localized names](localized-names.md) for fallback behavior and row-rendering examples.

Documented Turbo UI options include:

- `UiConfig#turbo_frame`
- `UiConfigBuilder#build_turbo(turbo_frame:)`
- `UiConfigBuilder#build(..., turbo_frame:)`

See [API reference](api.md), [Localized names](localized-names.md), and [Turbo Frame option](turbo-frame.md) for details.

### RenderState grouped option keys

`TreeView::RenderState` grouped options are part of the public option surface. The exact machine-readable key set lives in `config/public_api_manifest.yml`, and `spec/public_api_compatibility_spec.rb` checks that manifest against the current `TreeView::RenderState` constants and representative behavior.

| Group | Documented public keys | Notes |
|---|---|---|
| `initial_expansion` | `default`, `max_depth`, `expanded_keys`, `collapsed_keys`, `current_item`, `current_key`, `auto_expand_ancestors` | When flat keyword options and `initial_expansion:` are both supplied, the flat keyword options still win. |
| `render_scope` | `max_depth`, `max_leaf_distance` | Mirrors the documented render-depth and leaf-distance controls for `TreeView::RenderState`. |
| `toggle_scope` | `max_depth_from_root`, `max_leaf_distance` | Mirrors the documented tree-wide toggle depth and toggle leaf-distance controls. |
| `toggle_icons` | `by_state`, `by_depth`, `by_type` | Mirrors the documented declarative toggle icon map. `toggle_icon_builder` remains a callable escape hatch and is not manifest-backed. |
| `selection` | `enabled`, `visibility`, `payload_builder`, `checkbox_name`, `disabled_builder`, `disabled_reason_builder`, `selected_keys`, `cascade`, `indeterminate`, `max_count` | Mirrors `TreeView::RenderState::SelectionConfig` and keeps grouped selection wiring aligned with the documented flat selection keywords. |
| `lazy_loading` | `enabled`, `loaded_keys`, `scope` | Mirrors the documented lazy-loading row-state hooks and optional host-app scope passthrough. |
| `row_status` | `row_disabled_builder`, `row_readonly_builder`, `row_disabled_reason_builder` | Mirrors the documented row disabled / readonly state hook and disabled-reason surface. |

### RenderState flat callback builder keys

`TreeView::RenderState` also exposes flat callback builder keywords for host-app rendering extensions. Their machine-readable key list lives under `render_state_callback_builder_keys` in `config/public_api_manifest.yml`, and the focused compatibility spec checks that each listed key remains both an initializer keyword and a public reader.

These keys are a key-surface contract only: `row_class_builder`, `row_data_builder`, `row_event_payload_builder`, `loading_builder`, `error_builder`, `depth_label_builder`, `badge_builder`, `icon_builder`, and `toggle_icon_builder` remain distinct from grouped option hashes, individual scalar options, and the declarative `toggle_icons` map. This contract does not change callback arity, return-value validation, row rendering, `NodePresenter` fallback behavior, or toggle icon lookup priority.

`loading_builder` and `error_builder` are row-level callback surfaces that let host apps render documented loading or error rows while keeping request lifecycle, retry UI, authorization-safe error copy, and response handling in the host app. See [Lazy Loading](lazy-loading.md) for the request-state boundary and the related interaction-state references.

`row_data_builder` stays inside that key-surface contract. Host-app data hash shape, merged row data attributes, and TreeView-owned row status keys are documented and guarded in [Row status](row-status.md) rather than promoted to a manifest-backed return-shape schema.

## Host app extension points

Host apps are expected to provide these pieces:

- records or adapter data
- path resolvers when building generated folder trees with `PathTreeBuilder`
- I18n translations for localized model, attribute, or node type display names
- `row_partial`
- Turbo mode path builders
- optional Turbo Frame targets through `turbo_frame:`
- row class / data builders
- row event payload builders
- selection payload / disabled builders
- hidden message / breadcrumb / depth label / row status builders
- lazy loading path builders and remote-state handling
- persisted state storage model

## JavaScript surface

The public JavaScript entrypoint is `tree_view/index.js`. The bundled `app/javascript/tree_view/index.d.ts` declaration mirrors the package-root export names for TypeScript-aware tooling, but it does not change runtime behavior or add a separate public surface. Treat `tree_view/index.js`, `config/public_api_manifest.yml`, and the entrypoint smoke checks as the source of truth; the declaration is a compile-time aid for npm-style tooling, while importmap-only host apps do not need extra runtime setup for it.

Package-root literal exports such as `TreeViewEventNames`, `TreeViewEventDetailKeys`, and the data hook objects are immutable reference constants for host-app JavaScript, browser tests, and shared helpers. Use [Immutable JavaScript package-root exports](public-api-immutable-exports.md) when you need the boundary between runtime `Object.freeze` checks, TypeScript `Readonly` / `readonly` declaration shapes, and reader-facing docs guidance.

Stable enough for host apps to use:

- `registerTreeViewControllers(application)`
- `TreeViewEventNames`
- `TreeViewEventDetailKeys`
- `TreeViewStateChangeReasons`
- `TreeViewTransferDropPositions`
- `TreeViewTransferDataAttributes`
- `TreeViewTransferDataMimeTypes`
- `TreeViewRemoteStateValues`
- `TreeViewRemoteStateDataHooks`
- `TreeViewControllerIdentifiers`
- `TreeViewControllerEntries`
- `TreeViewIntegrationHooks`
- `TreeViewToolbarDataHooks`
- `TreeViewSelectionDataHooks`
- `TreeViewSelectionCheckboxHooks`
- `TreeViewEmptyStateHooks`
- exported controller classes
  - `TreeViewStateController`
  - `TreeViewClientController`
  - `TreeViewSelectionController`
  - `TreeViewTransferController`
  - `TreeViewRemoteStateController`
- documented JavaScript events and payload keys
- documented `data-tree-view-*` integration hooks

`registerTreeViewControllers(application)` registers the five controller exports above with the documented identifiers in the bundled entrypoint order.

`TreeViewEventNames` exposes the documented event names as a machine-readable package-root export. Use it when wiring host-app listeners and you want to avoid hand-copying event-name strings such as `TreeViewEventNames.selection.change` or `TreeViewEventNames.transfer.drop`.
`TreeViewEventDetailKeys` exposes the documented `event.detail` key lists as a machine-readable package-root export. Use it when host-app tests or listeners need to compare against the documented key names without changing the payload shape; the field meanings still live in [JavaScript event contract](js-events.md).
`TreeViewStateChangeReasons` exposes the documented state snapshot publish reasons (`connect`, `refresh`, `expanded`, and `collapsed`) as immutable package-root values for host-app listeners and tests. It does not change state-controller dispatch behavior.
`TreeViewTransferDropPositions` exposes the documented coarse drop-position values for transfer events: `before`, `inside`, and `after`. `TreeViewEventNames.transfer.*` names transfer events, `TreeViewEventDetailKeys.transfer.*` lists the documented `event.detail` keys, and `TreeViewTransferDropPositions` carries the position values described in [Drag and Drop](drag-and-drop.md#drop-behavior).
`TreeViewTransferDataAttributes` exposes the documented transfer payload and disabled-row DOM attribute names. Use `TreeViewTransferDataAttributes.payload` for `data-tree-transfer-payload` and `TreeViewTransferDataAttributes.disabled` for `data-tree-transfer-disabled` when host-app JavaScript, browser tests, or shared helpers need transfer wiring attributes without hand-copying strings. These exports name DOM wiring attributes only; payload shape, authorization, persistence, and final drop behavior still live in [Drag and Drop](drag-and-drop.md#drop-behavior).
`TreeViewTransferDataMimeTypes` exposes the documented TreeView transfer MIME type values: `application/json` for the primary JSON payload and `text/plain` as the browser compatibility fallback. Use it when host-app JavaScript or tests need to read or assert TreeView transfer data without hand-copying MIME strings; drag/drop behavior, payload shape, and final business handling still live in [Drag and Drop](drag-and-drop.md#drop-behavior).
`TreeViewRemoteStateValues` exposes the documented remote-state value set for lazy-loading rows: `loading`, `loaded`, and `error`. Use it when host-app JavaScript or tests need to compare `data-tree-remote-state` values without hand-copying strings; `TreeViewEventNames.remoteState.*` still names controller-emitted events, and `TreeViewEventDetailKeys.remoteState.*` still lists their `event.detail` keys.
`TreeViewRemoteStateDataHooks` exposes the documented lazy-loading and remote-state data attribute names as a machine-readable package-root export. Use it when custom lazy-loading markup, tests, or copied host-app partials need to reference `data-tree-lazy`, `data-tree-children-url`, `data-tree-loaded`, or `data-tree-remote-state` without hand-copying strings; request dispatch, response handling, retry UI, and authorization-safe copy stay with the host app and [Lazy Loading](lazy-loading.md).
`TreeViewControllerIdentifiers` exposes the same documented identifiers as a machine-readable object. Host apps that selectively register controllers or choose a custom boot order should use this export instead of hand-copying identifier strings.
`TreeViewControllerEntries` exposes the documented identifier/controller pairs in bundled registration order. Use it when host apps need custom registration, boot-order review, or tests that should not hand-copy identifier/controller tuples. `registerTreeViewControllers(application)` remains the standard registration path; the entries list is a manifest-backed convenience for selective wiring, not a new registration policy. See [Controller registration](controller-registration.md) for the complete default and custom registration paths.
`TreeViewIntegrationHooks` exposes documented integration hook attribute names as a machine-readable object for host-app JavaScript and tests that need to query or assert TreeView-owned wiring without hand-copying strings. Representative keys cover state row identity, remote-state children URLs, and transfer payload hooks; their detailed behavior still lives in the feature docs and [JavaScript event contract](js-events.md).

`TreeViewRemoteStateDataHooks.childrenUrlAttribute` and `TreeViewIntegrationHooks.remoteState.childrenUrl` intentionally point to the same `data-tree-children-url` attribute. Prefer `TreeViewRemoteStateDataHooks` when working inside lazy-loading or remote-state data-hook inventories, and use `TreeViewIntegrationHooks` when a broader integration surface or test fixture is checking TreeView-owned wiring across features.

`TreeViewToolbarDataHooks` exposes the documented toolbar container, action, and disabled data hook attribute names as a machine-readable package-root export. Use it when custom toolbar markup or tests need to reference TreeView-owned toolbar hooks without hand-copying strings; supported actions and metadata still come from the toolbar helpers, while action policy, labels, authorization copy, and final UI remain host-app responsibilities documented in [Toolbar](toolbar.md).
`TreeViewSelectionDataHooks` exposes the documented `tree-view-selection` host-element value attributes as a machine-readable object. Use it when JavaScript needs to author or query those host-owned attributes without hand-copying strings such as `TreeViewSelectionDataHooks.hiddenInputNameValue`.
`TreeViewSelectionCheckboxHooks` exposes the rendered selection checkbox class and disabled-reason attribute emitted by TreeView's selection cell partial. Use it for browser-level tests or host-app JavaScript that needs to find TreeView-rendered checkbox elements, not for host-authored `tree-view-selection` controller values. See [Selection checkbox hooks](selection-checkbox-hooks.md).
`TreeViewEmptyStateHooks` exposes the documented empty-state wrapper attribute and baseline row classes as a machine-readable object. Use it when host-app JavaScript, tests, or copied styling need to target the shipped empty-state reference pattern without hand-copying `data-tree-view-empty-state`, `.tree-view-empty-row__content`, or `.tree-view-empty-row__message`. The final empty-state copy, CTA, permission message, and filter-reset behavior stay host-app responsibilities.

Within `TreeViewEventNames`, lazy-loading request lifecycle names live under `hostLifecycle`:

- `loading`
- `loaded`
- `error`
- `retry`

Use `TreeViewEventNames.hostLifecycle.*` only for the host-app dispatch surface described in [Lazy Loading](lazy-loading.md). TreeView's own controller-emitted remote-state events remain under `TreeViewEventNames.remoteState.*`.

Documented keys on `TreeViewTransferDataAttributes`:

- `payload`
- `disabled`

Documented keys on `TreeViewTransferDataMimeTypes`:

- `applicationJson`
- `textPlain`

Documented keys on `TreeViewRemoteStateValues`:

- `loading`
- `loaded`
- `error`

Documented keys on `TreeViewRemoteStateDataHooks`:

- `lazyAttribute`
- `childrenUrlAttribute`
- `loadedAttribute`
- `remoteStateAttribute`

Documented keys on `TreeViewControllerIdentifiers`:

- `state`
- `client`
- `selection`
- `transfer`
- `remoteState`

Documented `TreeViewControllerEntries` mappings:

| Key | Stimulus identifier | Controller export |
|---|---|---|
| `state` | `tree-view-state` | `TreeViewStateController` |
| `client` | `tree-view-client` | `TreeViewClientController` |
| `selection` | `tree-view-selection` | `TreeViewSelectionController` |
| `transfer` | `tree-view-transfer` | `TreeViewTransferController` |
| `remoteState` | `tree-view-remote-state` | `TreeViewRemoteStateController` |

`registerTreeViewControllers(application)` remains the standard full-registration route. Use `TreeViewControllerEntries` only for selective or custom registration, where the host app owns filtering and boot order.

Documented keys on `TreeViewIntegrationHooks`:

- `state.viewKeyValue`
- `state.nodeKey`
- `remoteState.childrenUrl`
- `transfer.payload`

Documented keys on `TreeViewToolbarDataHooks`:

- `toolbarAttribute`
- `actionAttribute`
- `disabledAttribute`

Documented keys on `TreeViewSelectionDataHooks`:

- `hiddenInputNameValue`
- `maxCountValue`
- `cascadeValue`
- `indeterminateValue`

Documented keys on `TreeViewSelectionCheckboxHooks`:

- `checkboxClass`
- `disabledReasonAttribute`

Documented keys on `TreeViewEmptyStateHooks`:

- `wrapperAttribute`
- `contentClass`
- `messageClass`

The `tree-view-selection` controller's documented host-element value attributes are also part of the stable host-app wiring surface:

- `data-tree-view-selection-hidden-input-name-value`
- `data-tree-view-selection-max-count-value`
- `data-tree-view-selection-cascade-value`
- `data-tree-view-selection-indeterminate-value`

Use those attributes when configuring the controller on the host element. Use the `selection:` render-state builders for row payload generation, disabled-state decisions, and checkbox visibility. Generated hidden input marker attributes and source-id attributes are managed by TreeView and are not host-authored public hooks. See [Selection](selection.md) and [Host app extension points](host-app-extension-points.md#selection-builders).

The machine-readable source of truth for the package-root JavaScript exports, bundled controller identifiers, controller entry list, transfer drop-position values, transfer data attribute values, transfer data MIME type values, remote-state values, remote-state data hook values, toolbar data hook values, integration hook values, selection data hook values, selection checkbox hook values, and empty-state hook values lives in `config/public_api_manifest.yml`. The compatibility spec and entrypoint smoke check read that contract to detect drift.

Internal by default:

- private controller methods
- file layout under `app/javascript/tree_view/`
- undocumented `data-*` attributes outside the documented host-app wiring surface
- DOM traversal details inside controllers

## CSS and DOM surface

Host apps may rely on documented CSS classes, data attributes, and JavaScript events intended as integration hooks.

`data-turbo-frame` emitted from configured Turbo toggle links is part of the documented host-app integration surface.

Representative documented hooks are tracked where their feature behavior is explained:

| Hook area | Representative hooks | Contract boundary |
|---|---|---|
| Toolbar | `data-tree-view-toolbar`, `data-tree-view-toolbar-action`, `data-tree-view-toolbar-disabled` | TreeView-owned hooks documented in [Toolbar](toolbar.md). Use helper methods for supported actions and metadata instead of internal constants. |
| Selection | `data-tree-view-selection-hidden-input-name-value`, `data-tree-view-selection-max-count-value`, `data-tree-view-selection-cascade-value`, `data-tree-view-selection-indeterminate-value`, `.tree-selection-checkbox`, `data-tree-selection-disabled-reason` | Stable host-element controller values are documented in [Selection](selection.md) and mirrored by `TreeViewSelectionDataHooks`. The rendered checkbox class and disabled-reason attribute are documented in [Selection checkbox hooks](selection-checkbox-hooks.md) and mirrored by `TreeViewSelectionCheckboxHooks`. Row payloads and disabled decisions stay with `selection:` render-state builders. Generated hidden input marker attributes and source-id attributes are TreeView-managed internals. |
| Lazy loading | `data-tree-remote-state`, remote placeholder IDs, lazy-loading lifecycle events | Stable placeholder and event hooks documented in [Lazy Loading](lazy-loading.md). Host apps still own request dispatch and response handling. Use `tree_children_container_dom_id`, `tree_remote_state_placeholder_dom_id`, and `tree_remote_state_placeholder_attributes` for placeholder IDs and state attributes rather than internal path or toggle helpers. |
| Empty state | `data-tree-view-empty-state`, `.tree-view-empty-row__content`, `.tree-view-empty-row__message` | Reusable baseline hooks documented in the [mockup inventory](../mockups/README.md) and mirrored by `TreeViewEmptyStateHooks`. They describe the shipped empty-state reference pattern, not every internal row class or the host app's final copy / CTA workflow. |
| Interaction markers | marker row classes and `data-*` hooks shown in focused mockups | Reference hooks documented through [mockups](../mockups/README.md) and mirrored by `TreeViewIntegrationHooks` when promoted to package-root exports. Promote any hook to a machine-readable contract in `config/public_api_manifest.yml` only when it needs compatibility checks. |
| Direction-aware styling | current-row cues, hierarchy connectors, toggle spacing, RTL / vertical writing override references | Responsibility boundary and host-app stylesheet override guidance live in [Direction-aware styling boundary](direction-aware-styling.md). These cues are not machine-readable public styling hooks unless they are explicitly promoted into manifest-backed checks. |

This inventory is intentionally representative, not exhaustive. `config/public_api_manifest.yml` remains the machine-readable source of truth for helper methods, JavaScript package-root exports, controller identifiers, integration hooks, selection data hooks, selection checkbox hooks, empty-state hooks, and RenderState grouped option keys. Docs-only hook inventories should point to feature guides and mockups; they should not turn every emitted class or `data-*` attribute into a compatibility contract.

DOM helper names that are not listed in the manifest remain internal even when the generated DOM IDs or attributes appear in bundled markup. In particular, button, selection-checkbox, toggle-path, and lazy-loading path helper names are not public host-app dependencies unless they are promoted into the manifest and documented here.

Undocumented CSS helper classes, data attributes, DOM structure details, and gem partial locals are implementation details.

## Breaking change criteria

Treat these as breaking changes:

- removing or renaming a documented class, module, helper, or method
- removing or renaming a documented option
- changing a documented default that changes rendered output or parsed params
- changing documented priority between flat options and grouped options
- changing documented JavaScript event names or payload keys
- removing documented CSS/data hooks
- changing documented `tree_view_rows(render_state)` behavior
- changing documented selection or row event payload shapes
- changing persisted state semantics
- removing a documented public error class or moving a documented error out of the `TreeView::Error` hierarchy

These are usually not breaking changes:

- adding optional keyword arguments with backward-compatible defaults
- adding CSS classes while keeping documented classes
- adding data attributes
- adding event detail keys
- adding new `TreeView::Error` subclasses for newly documented validation/configuration failures
- refactoring internal helper modules
- moving controller files while keeping `tree_view/index.js` exports stable
- changing docs structure while preserving README/docs entry links

## Deprecation policy

When a breaking change is useful but not urgent:

1. Keep the existing API working.
2. Add and document the replacement API.
3. Add a deprecation note in `CHANGELOG.md` and relevant docs.
4. Keep the compatibility path until the next minor release when practical.

Even before `1.0`, breaking changes should be intentional and include migration notes.