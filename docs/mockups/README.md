# TreeView mockups

This directory contains static HTML/CSS mockups for reviewing TreeView's baseline output without running a Rails app.

These files are intentionally small, reviewable assets in the gem repository. They show representative DOM structure, CSS hooks, ARIA attributes, and row states emitted by the reusable TreeView primitives.

They are **not** a complete Rails application and should not grow into host-app CRUD, query, authorization, seed data, or controller examples. Full playground/application examples belong in `barnet-co-jp/tree_view-rails-demo` once that demo repository is public.

When a review starts from the gallery or a focused mockup page, confirm this static mockup / real demo app boundary before requesting new routes, persistence, CRUD flows, seeded records, or authorization examples in this directory.

## Review task chooser

Use this short chooser when you know the review question but do not yet know which mockup to open first. The Files table and Recommended review flow below remain the detailed inventory.

| Review question | Start with | Related follow-up |
|---|---|---|
| Baseline or first render | [review-gallery.html](review-gallery.html), [default-tree.html](default-tree.html), [minimal-usage-first-render.html](minimal-usage-first-render.html) | [resource-table-bridge.html](resource-table-bridge.html), [table-caption-context.html](table-caption-context.html) |
| Responsive, narrow, or current-row scanning | [narrow-sidebar-tree.html](narrow-sidebar-tree.html), [current-branch-sidebar.html](current-branch-sidebar.html) | [direction-aware-cues/index.html](direction-aware-cues/index.html), [localized-row-labels.html](localized-row-labels.html) |
| Interaction, loading, or transfer states | [interaction-states.html](interaction-states.html), [lazy-loading-handoff.html](lazy-loading-handoff.html), [drop-positions.html](drop-positions.html) | [children-pagination.html](children-pagination.html), [persisted-state-boundary.html](persisted-state-boundary.html), [turbo-frame-target.html](turbo-frame-target.html) |
| Accessibility, focus, or contrast cues | [keyboard-focus-states.html](keyboard-focus-states.html), [accessibility-semantics.html](accessibility-semantics.html), [high-contrast-state-cues/index.html](high-contrast-state-cues/index.html) | [keyboard-current-row/index.html](keyboard-current-row/index.html), [reduced-motion-state-cues.html](reduced-motion-state-cues.html) |
| Selection or form boundaries | [selection-max-count.html](selection-max-count.html), [selection-multi-tree-form.html](selection-multi-tree-form.html), [children-pagination-selection-boundary.html](children-pagination-selection-boundary.html) | [form-editing-rows.html](form-editing-rows.html), [interactive-marker-behaviors.html](interactive-marker-behaviors.html) |
| Toolbar action availability | [toolbar-actions.html](toolbar-actions.html) | [node-presenter-row-partials.html](node-presenter-row-partials.html), [path-tree-builder-rows.html](path-tree-builder-rows.html) |
| Empty, hidden-message, or table boundary questions | [empty-state.html](empty-state.html), [resource-table-empty-colspan-boundary.html](resource-table-empty-colspan-boundary.html) | [filtered-tree-modes.html](filtered-tree-modes.html), [table-caption-context.html](table-caption-context.html) |

## Files

| File | Covers |
|---|---|
| [review-gallery.html](review-gallery.html) | Single-surface comparison hub for the current baseline and focused mockup references, with review-path jump links, embedded previews, and links to each full page. |
| [default-tree.html](default-tree.html) | Default table/tree output, checkbox selection, expanded/collapsed rows, badges, depth labels, row actions, and baseline CSS. |
| [minimal-usage-first-render.html](minimal-usage-first-render.html) | Minimal usage first-render reference showing the small table/tree output from the controller, view, and row-partial docs without checkbox selection, badges, row actions, routes, CRUD, or seed data. |
| [readme-representative-visual-candidates.md](readme-representative-visual-candidates.md) | Candidate note for choosing a future README screenshot or GIF source before adding generated assets in #360. |
| [resource-table-bridge.html](resource-table-bridge.html) | Resource table bridge reference showing shared hierarchy rows across fuller and narrower visible column sets without host-app table logic. |
| [resource-table-empty-colspan-boundary.html](resource-table-empty-colspan-boundary.html) | Focused resource-table empty-row reference showing broad `colspan="999"` fallback, host-owned exact colspan, selection/action columns, and TreeView empty-state wrapper boundaries. |
| [table-caption-context.html](table-caption-context.html) | Focused table caption and surrounding page structure reference showing host-app-owned heading, caption, summary, and actions around TreeView-owned row cues. |
| [narrow-sidebar-tree.html](narrow-sidebar-tree.html) | Narrow sidebar and small-width reference that keeps toggle controls, primary labels, and current or selection cues visible while secondary metadata wraps below. |
| [current-branch-sidebar.html](current-branch-sidebar.html) | Current branch sidebar reference showing current row, expanded ancestors, collapsed sibling branches, and depth/toggle cues without host-app navigation policy. |
| [row-status-depth-labels.html](row-status-depth-labels.html) | Focused comparison for row-wide status cues, selection checkbox disabled state, and depth labels without host-app authorization or business wording. |
| [toggle-icon-states.html](toggle-icon-states.html) | Focused comparison for expanded, collapsed, leaf, loading, and depth/type-based toggle icon states without choosing a host-app icon library. |
| [interaction-states.html](interaction-states.html) | Lazy-loading, loading, error/retry, next-page, and drag/drop visual states. |
| [children-pagination.html](children-pagination.html) | Focused comparison for next-page placeholder placement and branch-scoped load-more affordances without host-app cursor or Turbo behavior. |
| [reduced-motion-state-cues.html](reduced-motion-state-cues.html) | Focused low-motion reference for loading, retry, current/selected, and drop-target cues that remain readable without animation. |
| [keyboard-focus-states.html](keyboard-focus-states.html) | Focused keyboard reference showing static focus-visible samples for toggle links, native controls, toolbar actions, and row actions without promising a full keyboard model. |
| [accessibility-semantics.html](accessibility-semantics.html) | Focused table-first accessibility semantics reference showing row-level ARIA placement, toggle `aria-expanded`, omitted `aria-controls`, and host-app-owned structure boundaries without promising a full treegrid model. |
| [keyboard-current-row/index.html](keyboard-current-row/index.html) | Focused keyboard reference comparing focus-visible cues, current-row styling, expansion state, and host-app-owned row actions in one tree. |
| [high-contrast-state-cues/index.html](high-contrast-state-cues/index.html) | Focused high-contrast reference for current, selected, focus-visible, error/retry, and drop-target cues that remain distinguishable beyond color alone. |
| [stylesheet-theme-boundary/index.html](stylesheet-theme-boundary/index.html) | Focused comparison of TreeView state cues across light, dark, and high-contrast-like host themes while keeping final theme and contrast policy host-app owned. |
| [direction-aware-cues/index.html](direction-aware-cues/index.html) | Focused direction-aware reference comparing LTR baseline, RTL override, and vertical writing stress cases without promoting public styling hooks. |
| [lazy-loading-handoff.html](lazy-loading-handoff.html) | Focused lazy-loading reference showing children container ownership, remote-state placeholder handoff, and error/retry slot boundaries. |
| [drop-positions.html](drop-positions.html) | Focused comparison for before, inside, and after drop-position cues plus transfer disabled / invalid payload boundaries and four post-drop outcomes: pending save, accepted move, policy rejection, and retry needed, while host apps own reorder, persistence, and retry policy. |
| [persisted-state-boundary.html](persisted-state-boundary.html) | Focused persisted-state reference showing before, changed, restored, save-failed, retry, and cleanup retention review cues while keeping storage, retry policy, cleanup schedule, and retention policy host-app owned. |
| [turbo-frame-target.html](turbo-frame-target.html) | Focused Turbo Frame target boundary showing `data-turbo-frame` on TreeView toggle links beside the host-app-owned frame wrapper. |
| [drag-interactive-controls.html](drag-interactive-controls.html) | Focused comparison for native interactive controls, `data-tree-view-interactive`, and `data-tree-view-ignore-drag` inside draggable rows. |
| [interactive-marker-behaviors.html](interactive-marker-behaviors.html) | Focused comparison for `data-tree-view-interactive`, `data-tree-view-ignore-keyboard`, `data-tree-view-ignore-row-click`, and `data-tree-view-ignore-drag`, including the reserved host-app row-click boundary. |
| [windowed-rendering.html](windowed-rendering.html) | Focused comparison for `offset` / `limit` slices, current-row anchoring, and first / middle / last window metadata without host-app pagination behavior. |
| [large-tree-strategy/index.html](large-tree-strategy/index.html) | Focused large-tree strategy comparison across full render, scope limits, windowed rows, lazy loading, and host-owned virtual scrolling without changing runtime behavior or query policy. |
| [breadcrumb-paths.html](breadcrumb-paths.html) | Focused comparison for breadcrumb-path context beside the tree's own current-row cue, without modeling host-app routes or Turbo navigation. |
| [filtered-tree-modes.html](filtered-tree-modes.html) | Focused comparison for `filtered_tree_for` modes, showing matched-only, ancestor-retaining, and descendant-retaining output plus an embedded ReverseTree child-to-parent / matched-leaf-to-ancestor visual reference, without adding host-app search behavior. |
| [graph-adapter-heterogeneous-nodes/index.html](graph-adapter-heterogeneous-nodes/index.html) | Focused GraphAdapter data-shape reference comparing project, folder, document, and external nodes while keeping type labels, icons, status, actions, traversal, and graph modeling host-app owned. |
| [path-tree-builder-rows.html](path-tree-builder-rows.html) | Focused PathTreeBuilder comparison for generated folder rows versus record-backed rows, keeping host-app columns/actions outside the gem contract. |
| [node-presenter-row-partials.html](node-presenter-row-partials.html) | Focused NodePresenter row partial reference showing resolver-provided label, href, tooltip, badge, icon, and optional action beside host-app-owned columns and permissions. |
| [localized-row-labels.html](localized-row-labels.html) | Focused localized and long translated row label reference showing primary label, type badge, attribute label, secondary metadata, and tooltip cues without choosing final host-app translations. |
| [form-editing-rows.html](form-editing-rows.html) | Focused comparison for bulk-edit rows, per-row edit placement, and the boundary between TreeView selection checkboxes and host-app business controls. |
| [row-action-menu-boundary/index.html](row-action-menu-boundary/index.html) | Focused row-action menu boundary showing host-owned button/link actions, interactive and drag-ignore markers, and a visual-only open state without runtime menu behavior. |
| [form-editing-replacement-risk/index.html](form-editing-replacement-risk/index.html) | Focused unsaved-edit replacement-risk reference covering dirty rows and collapse, lazy-load, Turbo, filter, or window replacement while dirty tracking and recovery remain host-app owned. |
| [selection-max-count.html](selection-max-count.html) | Focused selection max-count reference showing below-limit, limit-reached, and limit-exceeded feedback while keeping final action copy host-app owned. |
| [selection-multi-tree-form.html](selection-multi-tree-form.html) | Focused multi-tree selection form reference showing source-specific selected counts, submit summary, empty state, and generated hidden input boundary as a review aid. |
| [children-pagination-selection-boundary.html](children-pagination-selection-boundary.html) | Focused children-pagination selection boundary reference showing loaded-row selection, unloaded descendants, rendered-only cascade/indeterminate cues, and host-app-owned bulk action semantics. |
| [toolbar-actions.html](toolbar-actions.html) | Expand-all, collapse-all, and collapse-to-current-path toolbar reference showing enabled, disabled fallback, missing-path fallback, current-state, metadata-boundary, and long/localized label variants without host-app routes or authorization copy. |
| [empty-state.html](empty-state.html) | No-root-items, no-results, and permission-hidden `hidden_message` reference for the empty-row wrapper hook, full-width message slot, and host-app-owned copy. |
| [default-tree.css](default-tree.css) | Shared CSS for the static mockups. |

## Recommended review flow

1. Start with [review-gallery.html](review-gallery.html) when you want a quick side-by-side pass across the current mockup set, or use its review-path links to jump directly to a state family.
2. Before asking for a missing workflow in a mockup, confirm whether it belongs in the future real Rails demo app instead. Static mockups should not add CRUD, authorization, routes, seed data, controller behavior, or full host-app flows.
3. Open the linked full mockup page when one surface needs deeper inspection or longer notes.
4. Use [minimal-usage-first-render.html](minimal-usage-first-render.html) when review needs to inspect the first visible output from the minimal usage docs before richer baseline states.
5. Use [narrow-sidebar-tree.html](narrow-sidebar-tree.html) when review needs a focused pass on 22rem or 18rem frames where hierarchy cues stay visible while secondary metadata wraps below the primary label.
6. Use [current-branch-sidebar.html](current-branch-sidebar.html) when review needs to isolate `current_item:` / `current_key:` plus `auto_expand_ancestors: true` as a visual reference for the current row, ancestor path, and collapsed siblings.
7. Use [row-status-depth-labels.html](row-status-depth-labels.html) when review needs to compare row-wide readonly/disabled cues, selection checkbox disabled state, and depth-label meaning boundaries.
8. Use [toggle-icon-states.html](toggle-icon-states.html) when review needs to compare `toggle_icons:` expanded, collapsed, leaf, loading, and depth/type variation without selecting a final icon library.
9. Use [resource-table-bridge.html](resource-table-bridge.html) when review needs a focused pass on table-owned columns plus TreeView-owned hierarchy cues; use [resource-table-empty-colspan-boundary.html](resource-table-empty-colspan-boundary.html) when the question is empty-row colspan ownership across selection, metadata, and action columns.
10. Use [interaction-states.html](interaction-states.html) when review needs a focused pass on lazy loading, retry, pagination placeholders, or drag/drop states.
11. Use [children-pagination.html](children-pagination.html) when review needs a narrower pass on where next-page placeholder rows and load-more affordances sit inside one expanded branch.
12. Use [reduced-motion-state-cues.html](reduced-motion-state-cues.html) when review needs to compare loading, retry, current/selected, and drop-target cues that remain readable without animation.
13. Use [keyboard-focus-states.html](keyboard-focus-states.html) when review needs to compare visible focus cues across toggle links, native controls, toolbar actions, and row actions without treating the mockup as a keyboard navigation contract.
14. Use [accessibility-semantics.html](accessibility-semantics.html) when review needs to compare table-first row ARIA placement, toggle `aria-expanded`, omitted `aria-controls`, and host-app-owned page structure without treating TreeView as a full treegrid implementation.
15. Use [keyboard-current-row/index.html](keyboard-current-row/index.html) when review needs to compare focus-visible cues beside `aria-current="page"`, expanded/collapsed rows, and host-app-owned row actions in the same tree.
16. Use [high contrast state cues](high-contrast-state-cues/index.html) when review needs to compare current, selected, focus-visible, error/retry, and drop-target cues without relying on color alone.
17. Use [direction-aware cues](direction-aware-cues/index.html) when review needs to compare LTR baseline, RTL host-app override, and vertical writing stress cases without treating directional styling as a public hook contract.
18. Use [lazy-loading-handoff.html](lazy-loading-handoff.html) when review needs to isolate children container ownership and remote-state slot handoff from the broader interaction-state page.
19. Use [drop-positions.html](drop-positions.html) when review needs to compare before, inside, after, transfer disabled, and invalid transfer boundary cues plus the four post-drop outcomes—pending save, accepted move, policy rejection, and retry needed—while reorder rules, persistence, acceptance policy, and retry behavior remain host-app owned.
20. Use [persisted-state-boundary.html](persisted-state-boundary.html) when review needs to compare persisted expansion state before, changed, restored, save-failed, retry, and cleanup retention cues without adding host-app persistence behavior, cleanup jobs, or retention policy.
21. Use [turbo-frame-target.html](turbo-frame-target.html) when review needs a focused pass on the configured `data-turbo-frame` link attribute and the host-app-owned frame target boundary.
22. Use [drag-interactive-controls.html](drag-interactive-controls.html) when review needs a focused pass on draggable rows that contain native controls, custom interactive markers, or drag-only ignore markers.
23. Use [interactive-marker-behaviors.html](interactive-marker-behaviors.html) when review needs to compare the broad interactive marker against the narrower keyboard, row-click, and drag behavior markers.
24. Use [windowed-rendering.html](windowed-rendering.html) when review needs to compare visible-row slicing, current-row anchoring, and first / last window boundary metadata without adding host-app paging controls.
25. Use [large-tree-strategy/index.html](large-tree-strategy/index.html) when review needs to compare first-render cost, render scope, windowing, lazy loading, and host-owned virtual scrolling without changing runtime strategy or query policy.
26. Use [breadcrumb-paths.html](breadcrumb-paths.html) when review needs to compare breadcrumb-path context against the tree's own current-row cue without modeling host-app route design.
27. Use [filtered-tree-modes.html](filtered-tree-modes.html) when review needs to compare matched nodes against ancestor or descendant context and its embedded ReverseTree child-to-parent / matched-leaf-to-ancestor visual reference without adding host-app search UI or a separate mockup page.
28. Use [graph-adapter-heterogeneous-nodes/index.html](graph-adapter-heterogeneous-nodes/index.html) when review needs to check whether heterogeneous or graph-like node types remain readable while adapter construction, traversal, and data modeling stay in the API docs and host app.
29. Use [path-tree-builder-rows.html](path-tree-builder-rows.html) when review needs to compare generated folder rows with record-backed rows without designing a file-manager application.
30. Use [node-presenter-row-partials.html](node-presenter-row-partials.html) when review needs to compare NodePresenter-provided row partial values against host-app-owned columns, permissions, and final actions.
31. Use [localized-row-labels.html](localized-row-labels.html) when review needs to compare long localized row labels, type badges, attribute labels, secondary metadata, and tooltip cues without deciding final host-app translations.
32. Use [form-editing-rows.html](form-editing-rows.html) when review needs to compare bulk edit rows, per-row edit action placement, or selection-versus-business checkbox roles without adding a real save workflow.
33. Use [row-action-menu-boundary/index.html](row-action-menu-boundary/index.html) when review needs to inspect host-owned row menu triggers, native action controls, interactive/drag-ignore markers, and a visual-only open state without adding menu runtime, routes, or authorization policy.
34. Use [form-editing-replacement-risk/index.html](form-editing-replacement-risk/index.html) when review needs to compare dirty-row cues against collapse, lazy-load, Turbo, filter, or window replacement risks while dirty tracking, confirmation, persistence, and recovery remain host-app owned.
35. Use [selection-max-count.html](selection-max-count.html) when review needs to compare below-limit, limit-reached, and limit-exceeded selection feedback without adding runtime behavior or final bulk-action copy.
36. Use [selection-multi-tree-form.html](selection-multi-tree-form.html) when review needs to compare multiple TreeView selection groups in one form, source-specific counts, and generated hidden input sync boundaries. Treat its hidden input rows as a review aid; [Selection](../en/selection.md#hidden-input-sync-for-regular-form-submit) is the contract for per-payload hidden input sync.
37. Use [children-pagination-selection-boundary.html](children-pagination-selection-boundary.html) when selection review intersects with children pagination, rendered-only cascade/indeterminate cues, or unloaded descendant boundaries.
38. Use [table-caption-context.html](table-caption-context.html) when review needs to compare host-app-owned heading, caption, summary, and adjacent actions around TreeView-owned row hierarchy cues.
39. Use [empty-state.html](empty-state.html) when review needs a focused pass on no-root-items, no-results, or permission-hidden rows, the reusable empty-row wrapper hook, or the host-app-owned copy boundary.
40. Use [toolbar-actions.html](toolbar-actions.html) when review needs a focused pass on expand, collapse, collapse-to-current-path, disabled fallback, missing-path fallback, current-state cues, or long/localized label wrapping affordances instead of row-by-row hierarchy layout.
41. Keep host-app wording, permissions, routes, and business actions out of this directory even when the gallery highlights a gap.

## Demo boundary guidance

- Use these mockups to review static DOM structure, CSS hooks, ARIA attributes, row states, and product-neutral responsibility boundaries.
- Use the future real Rails demo app for end-to-end flows that need routes, controller behavior, persistence, authorization, seeded records, CRUD screens, or business workflow copy.
- Do not add direct public demo links from the mockups until the demo repository is public and its publication checklist is ready.

## Automated smoke coverage

- `npm run test:browser` opens every HTML mockup listed in the Files table and checks the review gallery, local links, main headings, back-to-gallery links, representative sample regions on full pages and inside gallery previews, and the existing lazy-loading viewport overflow smoke.
- The smoke coverage is intentionally narrow. It catches broken HTML, blank pages, missing review links, and missing representative regions without adding screenshot baselines or visual diff review.

## Visual evidence handoff

- Treat `npm run test:browser` success as smoke coverage, not as final visual readability approval.
- Some mockups intentionally preserve horizontal scrolling at narrow widths so reviewers can inspect wide reference tables, columns, side-by-side comparisons, long-label stress cases, or form-boundary controls. Treat that deliberate overflow differently from accidental overlap, clipped hierarchy cues, or unreadable labels.
- For static mockup pull requests that add or change focused visual references, include a short PR note or comment that names the target mockup file, the desktop and narrow viewport used for review, and whether the relevant rows, labels, tables, and state cues remain readable without overlap or clipping.
- Screenshots are acceptable evidence, but an equivalent browser-capable review note is also fine when it clearly names the checked viewport and surface. Keep this evidence in the pull request discussion instead of committing generated screenshot assets by default.
- If the authoring environment cannot produce browser-capable evidence, say so in the PR and leave the visual readability check as a reviewer gate rather than treating CI smoke success as a substitute.

## Copy and language policy

- Mockups use short, product-neutral English copy so reviewers can compare layout and state cues without language changes becoming visual noise.
- `toolbar-actions.html` intentionally includes a narrow long/localized label stress case so reviewers can inspect wrapping, metadata fallback, disabled state, and current-state cues without choosing final translations.
- `localized-row-labels.html` intentionally uses long localized-style English labels and a deliberate CJK / Japanese-width sample to stress row wrapping, badge placement, attribute labels, secondary metadata, tooltip cues, and CJK character width without choosing final translations.
- Final labels, localization, permission messaging, and business wording remain host-app responsibilities.
- If a future mockup intentionally uses another language, document that exception here so reviewers know it is deliberate.

Record deliberate copy or language exceptions in this list. Add a row when a mockup needs non-neutral copy, localized-style text, or another language for a review purpose; do not use this list to choose final host-app copy.

| Mockup | Deliberate exception | Review reason |
|---|---|---|
| `toolbar-actions.html` | Long / localized-style toolbar labels | Stress wrapping, metadata fallback, disabled state, and current-state cues without choosing final translations. |
| `localized-row-labels.html` | Long localized-style row labels and metadata, plus deliberate CJK / Japanese-width sample text | Stress primary label wrapping, badge placement, attribute labels, secondary metadata, tooltip cues without choosing final translations, and CJK character width / badge proximity using intentional Japanese sample copy. |

## Selection form guidance

- Use selection form mockups to compare visible counts, source separation, and generated hidden input boundaries at review time.
- Use [children-pagination-selection-boundary.html](children-pagination-selection-boundary.html) when selection review intersects with children pagination, rendered-only cascade/indeterminate cues, or unloaded descendant boundaries.
- Treat [Selection](../en/selection.md#hidden-input-sync-for-regular-form-submit) as the source of truth for hidden input sync: TreeView mirrors one JSON payload per hidden input, and host apps own final params grouping, submit summaries, and business action copy.
- Treat [Children pagination](../en/children-pagination.md#selection-and-dragdrop-interactions) as the source of truth when a bulk action should include unloaded descendants: host apps need a query-backed or server-side intent rather than relying on DOM-submitted loaded rows.

## Children pagination guidance

- Use `children-pagination.html` to review next-page placeholder placement and branch-scoped load-more affordances without turning the mockup into a cursor, Turbo Stream, or authorization contract.
- Keep cursor encoding, page limits, retry behavior, and final button copy in the host app.
- Use `children-pagination-selection-boundary.html` when the review question includes selection state across loaded rows and unloaded descendants.

## Narrow-width guidance

- Keep the toggle control, the primary node label, and the current or selected cue visible in the first scan line.
- Move owner, status, badges, and less-frequent actions into stacked metadata or a compact action surface before hiding hierarchy cues.
- When a mockup is a wide reference, inspectable column view, side-by-side comparison, long-label stress case, or form-boundary reference, narrow horizontal scrolling can be intentional. Still flag overlap, clipped controls, hidden primary labels, or state cues that cannot be inspected.
- Treat exact truncation, action menus, and responsive breakpoints as host-app responsibilities. These mockups are reference layouts, not a shipped responsive design system.

## Current-branch guidance

- Use the current-branch sidebar mockup to review the visual result of expanding only the ancestors of the current item.
- Keep sibling branches collapsed unless the host app has a product reason to expose them by default.
- Treat route selection, sidebar ordering, permission-aware labels, and final navigation behavior as host-app responsibilities.

## Direction-aware guidance

- Use the direction-aware cues mockup to compare the baseline current-row / hierarchy cues with RTL and vertical writing stress samples.
- Keep final RTL policy, locale-specific spacing, design-system colors, and any public styling hook promotion in the host app or a separate product decision.

## Empty-state guidance

- Use `data-tree-view-empty-state="true"` together with `.tree-view-empty-row__content` and `.tree-view-empty-row__message` as the reusable baseline hook.
- Use `empty-state.html` when review needs to compare `empty_message` no-root/no-results states with the `hidden_message` permission-hidden slot.
- Keep final empty copy, CTA, permission messaging, and filter-reset behavior in the host app.

## PathTreeBuilder guidance

- Keep generated folder rows visually distinct from record-backed rows, but avoid business-specific folder permission wording.
- Treat record columns, file actions, download affordances, and final file-manager behavior as host-app responsibilities.

## Toolbar guidance

- Use `toolbar-actions.html` to review visual action availability, current-path emphasis, disabled fallback, and missing-path fallback without treating the page as a public API manifest for `tree_view_toolbar_action_metadata`.
- Keep route builders, authorization policy, final localized labels, and permission messages in the host app.
- Treat `docs/en/toolbar.md`, `docs/ja/toolbar.md`, `docs/en/public-api.md`, `docs/ja/public-api.md`, and `config/public_api_manifest.yml` as the helper metadata contract sources; use this mockup only as the visual review aid for those states.

## Drag/drop guidance

- Use focused static mockups to compare coarse visual cues such as dragging, valid target, blocked target, drop position, and invalid transfer boundaries.
- Treat final move authorization, persistence, audit trails, and business copy as host-app responsibilities.

## Motion guidance

- Use `reduced-motion-state-cues.html` when the review question is whether loading, retry, current/selected, or drop-target states remain understandable without animation.
- Keep animation policy, visual regression baselines, and runtime event behavior in separate implementation or quality issues.

## Keyboard focus guidance

- Use `keyboard-focus-states.html` to review static focus-visible cues across representative focus targets.
- Use `accessibility-semantics.html` when the review question is row-level ARIA placement, toggle `aria-expanded`, omitted `aria-controls`, or the table-first / host-app-owned boundary rather than visual focus styling.
- Use `keyboard-current-row/index.html` when the review needs to compare focus, current-row, expansion, and row-action cues together.
- Use the [high contrast state cues](high-contrast-state-cues/index.html) focused subpage when the review question is whether state cues remain distinguishable without relying on color alone.
- Keep tab order, shortcut keys, roving tabindex, and full treegrid keyboard behavior in the host app or a separate implementation issue.

## Review policy

- Prefer static HTML/CSS that can be inspected directly in pull-request diffs.
- Keep mockups product-neutral and free of host-app business behavior.
- Add screenshots only when visual regression review needs them; the source HTML/CSS should remain the canonical mockup.
- If a mockup needs Rails routes, controllers, database records, authorization, or Turbo responses to make sense, it belongs in a playground app rather than this directory.
