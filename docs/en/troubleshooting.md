# Troubleshooting

This page is a symptom-based entry point for common TreeView integration problems.

Use it when you already know what is going wrong in the host app, but are not sure which API page to open first.

TreeView provides rendering primitives, JavaScript hooks, and validation helpers. The host app still owns routes, controller actions, authorization, queries, Turbo Stream responses, business actions, and layout decisions.

## Localized labels show missing translations or unexpected fallback text

Localized display names come from Rails / ActiveModel / I18n when those APIs are available. When TreeView cannot resolve a locale value, the localized-name helpers fall back to humanized class, attribute, or node type names unless the caller passes `default:`.

Check these points.

- Confirm the host app has the expected `activerecord.models`, `activerecord.attributes`, or `tree_view.node_types` locale keys for the current locale.
- Pass `default:` when a row partial, presenter, or helper already knows the fallback copy that should appear for missing translations or plain Ruby objects.
- Keep final translation text and product copy in the host app; TreeView only resolves names for the caller to render.
- If toolbar action labels are the only missing text, check the `tree_view.toolbar.labels` keys or the explicit `labels:` override first.

Read next:

- [Localized names](localized-names.md)
- [Public API](public-api.md)
- [Host App Extension Points](host-app-extension-points.md)

## Toggle links do not expand or collapse

Check the tree mode first.

- `build_turbo` / `build` expects host-app Turbo Stream endpoints.
- `build_static` renders a snapshot only. Collapsed descendants are not present in the browser, so nothing can be opened client-side.
- `build_client_side` expects descendants to already exist in the initial HTML and uses TreeView JavaScript to show or hide them.

Then confirm the matching wiring.

- Turbo mode: verify `show_descendants_path_builder`, `hide_descendants_path_builder`, routes, controller actions, authorization, and Turbo Stream responses in the host app.
- Client-side mode: verify TreeView controllers are registered and the tree root renders `tree_view_state_data(@render_state)`.
- Lazy loading cannot be combined with client-side toggle mode.

Read next:

- [Usage](usage.md)
- [Turbo Frame option](turbo-frame.md)
- [Lazy Loading](lazy-loading.md)
- [Installation](installation.md)

## Toolbar actions render as disabled buttons

Toolbar actions become disabled buttons when TreeView cannot build a path for that action. This is usually a host-app routing or state contract issue, not a toolbar styling issue.

Check these points.

- Confirm the render state was built with a `UiConfig` that responds to `toggle_all_path`.
- In Turbo mode, pass `toggle_all_path_builder:` to `build_turbo` so `UiConfig#toggle_all_path(state:)` can return a path for `:expanded`, `:collapsed`, and any optional `:current_path` action.
- If a single action is disabled, confirm the host app builder returns a non-`nil` path for that action's state value.
- For `collapse_all_except_current_path`, confirm the host app has a clear `:current_path` policy and knows which branch should remain open.
- Keep route, authorization, Turbo Stream response, and expanded-key persistence checks in the host app; TreeView only emits the toolbar action and target state.

Read next:

- [Toolbar helper](toolbar.md)
- [Turbo Frame option](turbo-frame.md)
- [Usage](usage.md)

## Breadcrumbs fail or cannot find a parent path

Breadcrumb path lookup is records-mode only. TreeView can render breadcrumbs when it can walk `parent_id_method` relationships from the current record back to a root.

Check these points.

- Confirm the tree was built from `records:` with `parent_id_method:`. Resolver mode and adapter mode do not expose a unique parent path to the bundled breadcrumb helper.
- If the error says parent path helpers are only supported in records mode, keep the failure as a mode boundary signal instead of trying to infer parents from graph-like data.
- If the data is graph-like, has multiple possible parents, or comes from `GraphAdapter`, let the host app choose the breadcrumb trail and render its own links or labels.
- Keep route, authorization, layout placement, and analytics behavior in the host app; TreeView only owns records-mode path lookup and helper HTML.

Read next:

- [Breadcrumb](breadcrumb.md#supported-mode)
- [GraphAdapter](graph-adapter.md)
- [Host App Extension Points](host-app-extension-points.md)
- [Rendering Boundaries](rendering-boundaries.md)

## Row partial output looks broken or table cells do not line up

TreeView owns the row wrapper and common tree UI cells. The host app owns the contents of `row_partial`, action cells, and the surrounding table layout.

Check these points in order.

- Confirm the page-level table wrapper belongs to the host app and is consistent with the row partial.
- Confirm the row partial renders the business columns the page expects.
- If selection, resource-table bridging, or other optional cells are enabled, make sure the host app layout still expects those extra cells.
- If the problem appears only for specific records, inspect tree node keys and UI DOM IDs before changing the partial blindly. Expansion state, persisted state, and diagnostics use the tree node key layer, so changing a UI-only DOM ID builder will not change `expanded_keys`, `collapsed_keys`, or saved state. Confirm `tree.node_key_for(item)` when the symptom follows a specific record.

Read next:

- [Rendering Boundaries](rendering-boundaries.md)
- [Resource table bridge](resource-table-bridge.md)
- [Selection](selection.md)
- [Accessibility Semantics](accessibility-semantics.md)
- [Tree diagnostics](tree-diagnostics.md)
- [Node keys](node-keys.md)

## Empty or no-results rows are missing, cramped, or use the wrong copy

Empty-state symptoms usually belong to the host app's page state, search or filter policy, and final product copy. TreeView provides a reusable empty-row wrapper and message slot, but it does not decide why the page is empty or what action the user should take next.

Check these points.

- Decide whether the screen has no root items, no matching results after filtering, or records hidden by permission policy. Those cases often need different copy or next actions.
- If the default empty row is enough, style or target the documented wrapper hooks instead of replacing the partial: `data-tree-view-empty-state="true"`, `.tree-view-empty-row__content`, and `.tree-view-empty-row__message`.
- Keep final empty copy, CTA text, filter reset behavior, permission messaging, and analytics in the host app.
- If the empty row looks cramped or does not span the surrounding table, inspect the host app table wrapper, captions, columns, and resource-table bridge layout before changing TreeView internals.
- Treat the static empty-state mockup as a visual reference for hooks and boundaries, not as a Rails controller, query, or demo-app implementation.

Read next:

- [Accessibility Semantics: Empty-state and hidden-count hooks](accessibility-semantics.md#empty-state-and-hidden-count-hooks)
- [Usage](usage.md)
- [empty-state mockup](../mockups/empty-state.html)
- [Mockup Empty-state guidance](../mockups/README.md#empty-state-guidance)

## Tree rendering triggers repeated queries or high ActiveRecord time

Treat this as a host-app data loading and row partial problem first. TreeView can traverse the tree and render rows, but it does not choose eager-loading, authorization, caching, or derived-value strategies for application records.

Check these signals in the Rails log while rendering the tree.

- `ActiveRecord:` time is high compared with `Views:` time.
- Similar `Document Load`, `DocumentVersion Load`, or application-specific query lines repeat while rows render.
- Repeated queries are not marked `CACHE`.
- The row partial calls helpers or associations that perform database work for every row.

Then move the expensive work out of the render loop.

- Materialize parent records before building the tree.
- Return arrays, not lazy ActiveRecord relations, from `GraphAdapter` `children_resolver` callbacks.
- Cache child collections by parent id in the host app.
- Precompute authorization, version, or display metadata before the row partial renders.

Read next:

- [Cookbook: GraphAdapter and ActiveRecord performance](cookbook.md#graphadapter-and-activerecord-performance)
- [Rendering Boundaries](rendering-boundaries.md)
- [Tree diagnostics](tree-diagnostics.md)

## Large trees render too much HTML or the app needs virtual scrolling

Start by separating HTML output pressure from host-app data pressure. TreeView can limit what it renders, but it does not reduce database queries, implement scroll-position-driven virtualization, or choose the host app's pagination strategy.

Check these points.

- If the initial page opens too many nodes, limit initial expansion with `max_initial_depth` before adding pagination or custom JavaScript.
- If the rendered descendants are deeper than the screen needs, use `max_render_depth` or `max_leaf_distance` to reduce the render scope.
- If the data is already loaded but the HTML output is too large, use `TreeView::RenderWindow` or `tree_view_rows(..., window:)` to slice the currently visible rows.
- If fetching or preparing every descendant is the expensive part, move to lazy loading so the host app fetches children only when the user asks.
- If one parent can have many children, use children pagination in the host app and keep cursor, limit, ordering, authorization, and next-page detection there.
- If the product requires scroll-position-driven virtual scrolling, implement that in the host app. TreeView's windowed rendering is an HTML-output slice, not a full virtual scroll engine.

Read next:

- [Render scale](render-scale.md)
- [Windowed Rendering](windowed-rendering.md)
- [Lazy Loading](lazy-loading.md)
- [Children Pagination](children-pagination.md)

## Children pagination placeholders or unloaded descendants behave unexpectedly

Children pagination is a host-app pattern built on lazy loading. TreeView provides child URL hooks and row data, but the host app owns the page query, next-page placeholder, bulk-action intent, and server-side validation.

Check these points.

- If the next-page placeholder never appears, confirm the host app detected another page, rendered the placeholder where it wants the next request to start, and returned the expected Turbo Stream response.
- If a loaded page appends but the old placeholder remains, inspect the host app's `children_more` replacement or removal target before changing TreeView row partials.
- If checkbox selection, cascade, drag/drop, or bulk actions seem to ignore unloaded descendants, decide whether the action applies only to loaded DOM rows or to the full filtered child set.
- Use DOM-submitted checkbox values only when the action is intentionally limited to loaded rows. Use a query-backed or server-side intent when the action should include unloaded children.
- Keep ordering, cursor validation, authorization, move validation, and final user-facing copy in the host app.

Read next:

- [Children Pagination](children-pagination.md#selection-and-dragdrop-interactions)
- [Lazy Loading](lazy-loading.md)
- [Selection](selection.md)
- [children-pagination-selection-boundary mockup](../mockups/children-pagination-selection-boundary.html)

## GraphAdapter rows look duplicated, incomplete, or shaped differently than expected

GraphAdapter symptoms usually come from the host app's resolver output or node-key strategy. TreeView normalizes resolver results so it can render rows, but it does not decide traversal policy, authorization, cycle handling, or query planning for graph-like data.

Check these points before changing row partials or TreeView internals.

- Confirm each `children_resolver` branch returns the child collection the host app actually wants to render. Return arrays for predictable rendering and performance.
- Remember that `nil` becomes an empty child list and a single object is wrapped as one child. If that surprises the screen, make the resolver branch explicit.
- If the same logical node appears under multiple parents, decide in the host app whether that duplicate path is intentional or should be filtered before building the tree.
- For heterogeneous nodes, pass a `node_key_resolver:` that namespaces node keys by type or source system.
- If cycles or duplicate keys appear, use diagnostics first instead of adding GraphAdapter-specific validation behavior.
- Keep authorization, eager loading, cache, pagination, and cycle policy in the host app; GraphAdapter only supplies roots and child arrays to `TreeView::Tree`.

Read next:

- [GraphAdapter](graph-adapter.md)
- [Cookbook: GraphAdapter and ActiveRecord performance](cookbook.md#graphadapter-and-activerecord-performance)
- [Tree diagnostics](tree-diagnostics.md)
- [Node keys](node-keys.md)

## CSS or JavaScript integration does not seem to apply

Start with installation wiring.

- Import the stylesheet with `@import "tree_view";`.
- Add the importmap pin when JavaScript-powered features are needed: `pin "tree_view", to: "tree_view/index.js"`.
- Register TreeView controllers in the host app when using client-side toggling, selection, transfer hooks, remote loading state, or other browser-side features.
- When the host app registers only some controllers or chooses a custom boot order, import `TreeViewControllerIdentifiers` from `tree_view/index.js` instead of hand-copying identifier strings.
- When selective registration or boot-order tests need the documented identifier/controller pairs, import `TreeViewControllerEntries` from `tree_view/index.js` instead of hand-copying both identifier strings and controller imports.
- Use [Installation: JavaScript / importmap](installation.md#javascript--importmap) for the minimal `registerTreeViewControllers(application)` example, [Controller registration](controller-registration.md) for the complete default and custom registration paths, and [Public API: JavaScript surface](public-api.md#javascript-surface) when checking the exported contract.

Then split CSS loading symptoms from JavaScript registration symptoms.

- If CSS is missing in a Propshaft app, confirm the host app stylesheet that imports `tree_view` is actually loaded by the layout. Propshaft does not make the gem stylesheet visible unless the host app chooses to load or import it.
- If CSS is missing in a Sprockets app, confirm the host app stylesheet imports `tree_view`, and that the Sprockets asset paths / precompile targets still include the TreeView stylesheet when the app relies on engine-provided assets.
- If JavaScript behavior is missing but CSS applies, inspect the importmap pin and Stimulus/controller registration separately. The stylesheet import does not register TreeView controllers.
- If CSS is missing but JavaScript events fire, inspect the host app asset pipeline first instead of changing controller registration.

Remember the boundary.

- Static rendering can work without TreeView JavaScript.
- Selection cascade, client-side expand/collapse, transfer events, and remote loading state need the JavaScript controllers.
- Missing CSS usually means the host app stylesheet pipeline was not wired to load the gem asset.
- Asset pipeline choice, precompile targets, stylesheet load order, importmap pins, and controller boot order remain host-app responsibilities.

Read next:

- [Installation: CSS import](installation.md#css-import)
- [Installation: Propshaft](installation.md#propshaft)
- [Installation: Sprockets](installation.md#sprockets)
- [Installation: JavaScript / importmap](installation.md#javascript--importmap)
- [Public API: JavaScript surface](public-api.md#javascript-surface)
- [Usage](usage.md)
- [JavaScript event contract](js-events.md)

## Drag/drop events report invalid payloads or `sourcePayload` is `null`

Treat this as an integration signal first. TreeView reports transfer payload parse boundaries, but the host app still owns final rejection copy, logging, authorization, and recovery behavior.

Check these points.

- If `tree-view-transfer:drop` reports `sourcePayload: null`, confirm the browser `DataTransfer` contained a TreeView row payload under `application/json` or `text/plain`. External drags, empty transfer values, and browser events without a TreeView row payload all leave the source payload unavailable.
- If `tree-view-transfer:invalid-transfer` fires, the transferred non-empty value could not be parsed as JSON. Inspect the drag source and any host-app code that writes to `DataTransfer`.
- If `tree-view-transfer:invalid-payload` fires, the target row's `data-tree-transfer-payload` could not be parsed. Inspect `row_event_payload_builder`, `row_data_builder`, and the rendered row attributes before changing drop handling.
- A valid `sourcePayload` is not the same as an accepted move. The host app still decides permission, target compatibility, `before` / `inside` / `after` policy, persistence, and user-facing retry or rejection messages.

Read next:

- [Drag and Drop: Missing or invalid source payloads](drag-and-drop.md#missing-or-invalid-source-payloads)
- [JavaScript event contract: transfer events](js-events.md#transfer-events)
- [Host App Extension Points](host-app-extension-points.md)

## TreeView partial render logs are missing or too noisy

TreeView lowers the log level around helper-rendered partials by default. That is intentional and only affects partial rendering that goes through TreeView helpers.

Check these points.

- `TreeView.configuration.render_log_level` defaults to `:warn`.
- Set `TreeView.configure { |config| config.render_log_level = :info }` or `:debug` when you want more render visibility while inspecting row partial wiring.
- Set `TreeView.configure { |config| config.render_log_level = nil }` when you want Rails render logs to remain unchanged.
- If changing `render_log_level` has no effect, confirm the host app logger responds to `silence`; otherwise TreeView falls back to normal rendering without wrapping the logger.
- If the missing or noisy lines come from controller, SQL, or business logs, adjust the host app logging policy instead of expecting TreeView to change them.

Read next:

- [Render log level](render-log-level.md)
- [Usage](usage.md)
- [Rendering Boundaries](rendering-boundaries.md)

## Lazy loading does not replace children or remote state stays stuck

Lazy loading is Turbo/server-driven.

Check these points.

- Confirm `load_children_path_builder` is present on the `UiConfig`.
- Confirm `lazy_loading: { enabled: true }` is set on `RenderState`.
- Confirm the host app endpoint returns the subtree or placeholder region it owns.
- Confirm the host app keeps `loaded_keys` in sync so already-loaded rows are rendered as loaded on the next response.
- Confirm the page is not using `build_client_side` together with lazy loading.

If the row shows loading or error state but never settles, inspect the host-app request/response lifecycle rather than the row partial first.

When the host app listens for retry or remote-state events, also confirm the browser-side detail matches the row wiring.

- `tree-view-remote-state:retry` carries `row`, `childrenUrl`, and `nodeKey` in `event.detail`.
- `childrenUrl` comes from the row's `data-tree-children-url` attribute.
- `nodeKey` comes from the row's `data-tree-view-state-node-key` attribute.
- If either value is `null`, inspect the rendered row attributes before changing retry handling.

Read next:

- [Lazy Loading](lazy-loading.md)
- [Children Pagination](children-pagination.md)
- [JavaScript event contract](js-events.md#tree-view-remote-stateretry)

## Selection payloads are missing or not what the host app expects

Selection checkboxes submit JSON strings, not plain IDs.

Check these points.

- Parse submitted values with `TreeView.parse_selection_params` on the server side.
- In JavaScript, remember that TreeView only reports checked and enabled checkboxes.
- Invalid JSON payloads are omitted from the selected payload array and reported through `tree-view-selection:invalid-payload`.
- If a regular form submit raises `ArgumentError`, inspect the submitted checkbox values before changing the parser. `TreeView.parse_selection_params` skips `nil` and empty strings, accepts hash-like entries and JSON objects, and raises when a non-empty value is invalid JSON or parses to something other than a JSON object.
- Decide in the host app whether malformed submitted values should be rescued, rejected, logged, or shown as validation copy. TreeView does not choose that request policy.
- Use grouped `selection:` options for row payload generation, disabled-state decisions, and checkbox visibility.
- If a user can check boxes but a regular HTML form submit sends no selection params, configure `data-tree-view-selection-hidden-input-name-value` on the `tree-view-selection` host element. Listening for `tree-view-selection:selected` or `tree-view-selection:change` alone does not create form params.
- Hidden input sync writes one hidden input per valid checked payload to the nearest form. If the tree is outside the form, TreeView still dispatches selection events but does not create hidden inputs.
- Disabled checkboxes and invalid JSON payloads are skipped for hidden inputs, matching the JavaScript event payload behavior.
- When one form contains multiple trees, use separate hidden input names when the server should receive separate params. Reuse a name only when the host app intentionally accepts one combined array; TreeView uses source ids only to keep each controller from removing another controller's generated inputs.
- If you expect client-side max-count limits or linked checkbox behavior, configure `data-tree-view-selection-max-count-value`, `data-tree-view-selection-cascade-value`, and `data-tree-view-selection-indeterminate-value` on the same host element.
- Cascade and indeterminate behavior only affects rendered rows in the current DOM.
- If max-count, multi-tree, or unloaded-descendant behavior still does not match the product action, keep final params grouping, bulk-action semantics, server-side validation, and user-facing business copy in the host app.

Read next:

- [Selection](selection.md)
- [selection max-count mockup](../mockups/selection-max-count.html)
- [selection multi-tree form mockup](../mockups/selection-multi-tree-form.html)
- [children-pagination-selection-boundary mockup](../mockups/children-pagination-selection-boundary.html)
- [Host App Extension Points](host-app-extension-points.md)
- [Public API](public-api.md)
- [JavaScript event contract](js-events.md)

## Persisted state does not save or restore as expected

Persisted state is split between gem helpers and host-app policy.

Check these points.

- Run the install generator and review the generated model and migration.
- Make sure the owner model includes the generated owner concern when needed.
- Use a stable `tree_instance_key` per screen or per tree placement.
- Confirm the host app save endpoint chooses the owner, authorizes the request, and calls `StateStore` or `TreeView::PersistedStateController` correctly.
- If explicit `expanded_keys` are passed into `RenderState`, they override the persisted state.
- If restored expansion state targets the wrong rows or does not affect the expected rows, compare the saved keys with `tree.node_key_for(item)`. Persisted expansion belongs to the tree node key layer, not UI-only DOM IDs or Turbo target builders.
- If a browser listener saves immediately on page load, remember that `tree-view-state:state-changed` is also dispatched on initial connect. Treat the first event as the current expanded-state snapshot, then debounce, ignore the first event, or use a host-app dirty-state policy when only user-initiated saves should be sent.
- If the same `expandedKeys` snapshot is saved repeatedly, inspect the host-app listener before changing TreeView. TreeView publishes state changes; the host app owns autosave timing, duplicate suppression, retry behavior, authorization, and endpoint responses.
- If `StateStore#save!` raises from the backing model, inspect the generated model validations, owner lookup, uniqueness constraints, and any database constraints for the same owner / `tree_instance_key` pair. TreeView calls the backing model's `save!`; it does not rescue validation failures or decide retry behavior.
- If `StateStore#clear!` raises, inspect the matching persisted-state record's `destroy!` path, including host-app callbacks, constraints, transactions, and authorization around the reset endpoint. TreeView calls `destroy!` for the matching record and leaves failure handling to the host app.
- If `clear!` returns an empty state when no record existed, treat that as the no-op boundary: the tree is already cleared for that owner / key. If the UI still shows old expansion, check the rendered `expanded_keys`, browser event listener, and host-app response rather than changing `clear!` behavior.
- For the detailed StateStore boundary, read the save and clear examples in [Persisted State](persisted-state.md#server-side-storage-with-statestore).
- For the detailed browser wiring boundary, read the practical notes in [Persisted State](persisted-state.md#browser-event-wiring).

Read next:

- [Persisted State](persisted-state.md)
- [JavaScript event contract](js-events.md)
- [Tree diagnostics](tree-diagnostics.md)
- [Node keys](node-keys.md)

## Duplicate node keys, orphan records, DOM ID collisions, or cycles appear

These are data-shape or identifier problems first.

Check these points.

- Enable `validate_node_keys: true` when building the tree.
- Choose `orphan_strategy:` intentionally for filtered or permission-scoped datasets.
- Call `render_state.validate_unique_dom_ids!` in development, tests, or pre-release checks.
- Use `TreeView::CycleDiagnostics.new(tree).report` when parent relationships may contain invalid loops.

Read next:

- [Tree diagnostics](tree-diagnostics.md)
- [Error hierarchy](errors.md)
- [Node keys](node-keys.md)

## When the problem is really host-app scope

Open the host-app code first when the issue depends on:

- queries or filtering policy
- authorization
- controller actions or routes
- Turbo Stream response shape
- business actions after selection or drag/drop
- table design, captions, or page layout

TreeView documents these responsibility boundaries on purpose so the gem stays reusable.

Read next:

- [Rendering Boundaries](rendering-boundaries.md)
- [FAQ](faq.md)
- [Design policy](design-policy.md)
