# Migration guide

This page explains how TreeView handles compatibility and what adopters should expect when upgrading.

It complements [Public API](public-api.md), [JavaScript event contract](js-events.md), and the [Release checklist](release.md) by turning those policies into an upgrade-oriented checklist.

## Versioning policy

`tree_view` follows semantic versioning.

- Patch versions fix bugs or documentation errors without changing public behavior.
- Minor versions add backward-compatible APIs, options, hooks, or docs.
- Major versions may include intentional breaking changes.

Even before `1.0.0`, breaking changes should be deliberate and documented with migration notes in `CHANGELOG.md` and related docs.

### Scoped v1.0.1 integration-repair exception

`v1.0.1` is intentionally treated as a patch-level integration repair even though it adds the optional `GraphAdapter#parent_resolver` and `PathTreeBuilder#folder_key_resolver` keywords. These additions complete downstream integration paths discovered immediately after `v1.0.0`: existing calls keep the same defaults and behavior, and adopters opt into the new resolvers only when they need parent-path traversal or stable host-defined folder keys.

This is a scoped release decision, not a general relaxation of the versioning policy. Unrelated backward-compatible public API or option additions after this integration-repair release should use the normal minor-version rule.

## What should stay stable in `0.1.x`

Within the `0.1.x` line, host apps should expect these documented integration points to remain stable unless a change is explicitly called out:

- documented Ruby classes, modules, helpers, and methods listed in [Public API](public-api.md)
- documented keyword arguments, grouped options, and documented option priority
- documented `tree_view/index.js` exports and documented Stimulus event names / payload keys
- documented CSS classes, data attributes, and browser-facing integration hooks
- documented selection payload shapes and persisted-state semantics

If a change would alter one of those contracts, treat it as compatibility-affecting even when the implementation looks small.

## Deprecation policy

When a breaking change is useful but not urgent, TreeView should prefer a deprecation path:

1. Keep the current API working.
2. Add and document the replacement API.
3. Add a deprecation note in `CHANGELOG.md` and the relevant feature docs.
4. Keep the compatibility path until the next minor release when practical.

Deprecations should explain which replacement to adopt and whether behavior, payload shape, or naming changes.

## Renamed APIs and moved entry points

When a documented API needs a better name:

- keep the old name working during the deprecation window when practical
- document the new name in the relevant API or feature page
- update examples so new integrations copy the new name first
- call out the rename in `CHANGELOG.md` and release notes
- include a focused migration note before the old name is removed

The same approach applies to documented helper names, option names, JavaScript exports, and grouped-option keys.

## Ruby public API compatibility

For Ruby APIs, treat these as migration-relevant changes:

- removing or renaming a documented class, module, helper, or method
- removing or renaming a documented option
- changing a documented default that changes rendered output or parsed params
- changing documented priority between flat options and grouped options
- changing documented persisted-state semantics
- removing a documented public error class or moving it outside the `TreeView::Error` hierarchy

Backward-compatible additions are usually safe in minor releases, but they should still be documented so adopters know what changed.

## JavaScript event compatibility

The documented TreeView event names and documented `event.detail` fields are public integration points.

When upgrading:

- additive `detail` fields may appear in minor releases
- removing an event, renaming an event, renaming a documented field, or changing a documented field meaning should be treated as compatibility-impacting
- internal controller methods, internal file layout, undocumented `data-*` attributes, and DOM traversal details remain implementation details

See [JavaScript event contract](js-events.md) for the current public event surface.

## CSS and data-attribute compatibility

Host apps may rely on documented CSS classes, documented data attributes, and documented browser-facing hooks.

When upgrading:

- adding extra classes or data attributes is usually backward-compatible
- removing documented hooks or changing their documented meaning should be treated as a breaking change
- undocumented helper classes, undocumented attributes, DOM structure details, and gem partial locals are internal details and may change without a migration promise

See [Public API](public-api.md) for the current CSS and DOM boundary.

## Release notes and migration notes

When a release includes a compatibility-affecting change or deprecation:

- add the change to `CHANGELOG.md`
- use the appropriate category such as `Changed`, `Deprecated`, or `Removed`
- add a focused migration note that explains what changed, what stays compatible, and what adopters should update
- update the related API, feature, or setup docs in both Japanese and English when the guidance is shared across languages

If a release is docs-only, a short `Documentation` note is enough unless it changes adoption or upgrade guidance in a meaningful way.

## Recommended maintainer checklist

Before releasing a compatibility-affecting change:

- confirm the affected API is really part of the documented public surface
- add or update compatibility specs when documented entry points intentionally change
- update [Public API](public-api.md), [Release checklist](release.md), and related feature docs together
- update `CHANGELOG.md` with migration or deprecation notes
- make sure both language trees stay aligned when the guidance is user-facing

## Related documents

- [Public API](public-api.md)
- [JavaScript event contract](js-events.md)
- [Release checklist](release.md)
- [Documentation maintenance checklist](../i18n-audit.md)
