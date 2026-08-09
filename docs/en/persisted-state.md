# Persisted State

This page explains APIs for saving and restoring TreeView expansion state in the host app.

## Overview

Persisted state lets a host app save expansion state per user, screen, or owner and restore it on the next render.

TreeView is responsible for:

- `TreeView::PersistedState` as the persisted-state value object
- `TreeView::StateStore` for loading, saving, clearing, previewing cleanup counts, and scoped pruning through a host app model
- `TreeView::PersistedStateController` for a small controller concern that bridges request params to `StateStore#save!`
- an install generator for the migration, model, and concern
- passing persisted expanded keys into `RenderState`

The host app remains responsible for storage ownership, authorization, save timing, cleanup policy, controller actions, and UI wiring.

Use [Public Setup Surface](public-setup-surface.md) when you need the path-level contract for the persisted-state install generator. It tracks the generator name, optional owner argument, and generated destination paths without freezing the migration schema or generated template contents.

For a static visual reference of the save/restore handoff, see [Persisted State boundary mockup](../mockups/persisted-state-boundary.html). The mockup shows representative before, changed, restored, save-failed, and retry cues without turning storage, save endpoints, authorization, or retry policy into gem-owned behavior.

## PersistedState.from normalization

Use `TreeView::PersistedState.from(value)` when host-app integration code needs to normalize an optional persisted-state value before passing it into `RenderState`.

`from` accepts only the current persisted-state boundary shapes:

- `nil` returns `nil`, so callers can keep optional persisted state optional.
- an existing `TreeView::PersistedState` instance is returned unchanged.
- Hash-like input is read through `to_h`, symbolized, and converted from `tree_instance_key` / `expanded_keys` into a `TreeView::PersistedState` value object.
- non Hash-like input raises `ArgumentError` with a `Hash-like` message fragment.

This normalization boundary does not change `StateStore` persistence behavior, generator output, migration shape, storage lifecycle, or host-app authorization policy.

## Generator

Use the generator to create model and migration templates.

```bash
bin/rails generate tree_view:state:install
```

Generated files:

- `db/migrate/*_create_tree_view_states.rb`
- `app/models/tree_view_state.rb`
- `app/models/concerns/tree_view_state_owner.rb`

Review the migration, then run:

```bash
bin/rails db:migrate
```

### Include the owner concern automatically

Pass an owner model name when you want the generator to include `TreeViewStateOwner` in an existing owner model.

```bash
bin/rails generate tree_view:state:install User
```

This still creates the same migration, model, and concern files. If `app/models/user.rb` exists and does not already include `TreeViewStateOwner`, the generator adds the include line.

For a namespaced owner, pass the constant name. The generator resolves the conventional file path and can update both `class Admin::User < ApplicationRecord` and module-wrapped `module Admin; class User < ApplicationRecord` style definitions.

```bash
bin/rails generate tree_view:state:install Admin::User
```

If `app/models/admin/user.rb` exists and contains one of those representative class definitions, the generator adds the include line inside the owner class.

If the owner model file does not exist, or the class definition is too custom for the generator to find safely, the generator skips model injection and you can include the concern manually.

### If owner injection is skipped

When the generator reports that the owner model file does not exist or the class definition was not found, first confirm which model should own the saved tree state. Then add `include TreeViewStateOwner` to that existing model after the generated concern exists at `app/models/concerns/tree_view_state_owner.rb`.

For a plain owner model, the manual include is the same line the generator would add:

```ruby
# app/models/user.rb
class User < ApplicationRecord
  include TreeViewStateOwner
end
```

For a namespaced or module-wrapped owner, add the include inside the actual class that will be passed as the `owner:` to `TreeView::StateStore`:

```ruby
# app/models/admin/user.rb
module Admin
  class User < ApplicationRecord
    include TreeViewStateOwner
  end
end
```

Manual include is the expected follow-up when the owner model is generated later or uses a project-specific file layout or class definition that the generator did not update. Do not change the generated migration or `TreeViewState` model for this case; the host app only needs the owner class to include the concern before it calls `tree_view_state_for`, `save_tree_view_state!`, or passes the owner into `TreeView::StateStore`.

## Owner model

Include the concern in the host app owner model.

```ruby
class User < ApplicationRecord
  include TreeViewStateOwner
end
```

The owner can be a user, workspace, project, or any model that should own the screen state.

## StateStore

`TreeView::StateStore` reads and writes persisted state through the generated host app model. The store is initialized with the model, and each read or write receives the owner and tree instance key.

```ruby
store = TreeView::StateStore.new(model: TreeViewState)

persisted_state = store.find(
  owner: current_user,
  tree_instance_key: "documents:index"
)
```

Save expansion state:

```ruby
persisted_state = store.save!(
  owner: current_user,
  tree_instance_key: "documents:index",
  expanded_keys: expanded_keys
)
```

`StateStore#save!` looks up or initializes the backing row by `owner:` plus `tree_instance_key:` and replaces its `expanded_keys` snapshot. For the generated polymorphic model, the logical owner is stored as `owner_type` and `owner_id`; the generated migration's unique index on `owner_type`, `owner_id`, and `tree_instance_key` enforces one row for that identity.

The lookup followed by `save!` is not an atomic upsert. Two concurrent first saves for the same identity can both initialize a row, and one insert can raise the backing database or model unique-constraint exception. TreeView propagates that exception; it does not automatically retry, reload and merge `expanded_keys`, choose a last-write policy, or acquire application or database locks. The host app owns rescue, retry, and conflict policy.

Clear saved expansion state for the same owner and tree instance key:

```ruby
persisted_state = store.clear!(
  owner: current_user,
  tree_instance_key: "documents:index"
)
```

`clear!` deletes the matching persisted-state record when one exists. When no record exists, it still returns a `TreeView::PersistedState` for the requested key with empty `expanded_keys`, matching the empty-state behavior of `find`.

Preview how many old persisted-state rows match the same cleanup scope without deleting them:

```ruby
matching_count = store.prune_count(
  older_than: 90.days.ago,
  owner: current_user,
  tree_instance_key: "documents:index"
)
```

`prune_count` requires `older_than:` and returns only an integer count. It uses the same `updated_at < older_than`, `owner:`, and `tree_instance_key:` conditions as `prune!`, but it does not delete rows or expose matching records.

Prune old persisted-state rows with an explicit timestamp:

```ruby
deleted_count = store.prune!(
  older_than: 90.days.ago,
  owner: current_user,
  tree_instance_key: "documents:index"
)
```

`prune!` requires `older_than:` and returns the number of deleted rows. `owner:` and `tree_instance_key:` are optional scopes; omit one or both only when the host app intentionally wants a broader cleanup. The helper uses the generated model's `updated_at` timestamp from `t.timestamps`, and TreeView does not choose a default retention period.

TreeView only provides the store API. The host app still owns the reset route, authorization, confirmation UI, retry behavior, response shape, deleted-owner handling, audit policy, and privacy retention rules. `prune_count` is a preview for the host app's cleanup plan; it does not move cleanup scheduling, retention selection, authorization, or audit policy into TreeView.

### Storage lifecycle and cleanup policy

`StateStore#clear!` is a reset for one owner and one `tree_instance_key`. `StateStore#prune_count` previews the same scope that `StateStore#prune!` would delete, and `StateStore#prune!` is an opt-in cleanup helper for rows older than an explicit `older_than:` timestamp.

Long-running host apps should still treat persisted-state lifecycle as part of their own storage policy. For example, the host app decides whether old rows should expire, whether rows for deleted owners should be removed by an existing dependent-destroy or cleanup job, and whether audit or privacy rules require a shorter retention period.

TreeView does not provide a cleanup rake task or default TTL. If the host app needs scheduled cleanup, call `prune_count` when it wants a count-only preview, and call `prune!` from an app-owned job or task with the owner, `tree_instance_key`, timestamp, authorization, and retention scope that matches the app's policy.

## Minimal controller concern

If your host app wants to keep the save endpoint small, include `TreeView::PersistedStateController` in the controller and let it bridge the raw request values to `StateStore#save!`.

```ruby
class TreeStatesController < ApplicationController
  include TreeView::PersistedStateController

  def update
    authorize current_user, :update?

    persisted_state = save_tree_view_persisted_state!(
      model: TreeViewState,
      owner: current_user,
      tree_instance_key: params.require(:tree_instance_key),
      expanded_keys: params[:expanded_keys]
    )

    render json: {
      tree_instance_key: persisted_state.tree_instance_key,
      expanded_keys: persisted_state.expanded_keys
    }
  end
end
```

The concern keeps responsibility boundaries narrow:

- it normalizes `expanded_keys` from either an array-like param or a comma-separated string
- it still requires the host app to choose the owner, authorization, route, save timing, and response shape
- it does not provide a finished controller or lock the host app into Turbo Stream vs JSON responses

## Browser event wiring

If your host app wants to persist expansion changes as users interact, listen for the public `tree-view-state:state-changed` event on the TreeView state controller element and forward `event.detail.expandedKeys` to your save endpoint.

```js
const element = document.querySelector("[data-controller~='tree-view-state']")

if (element) {
  element.addEventListener("tree-view-state:state-changed", async (event) => {
    const { viewKey, expandedKeys, reason } = event.detail
    if (!viewKey) return
    if (reason === "connect") return

    await fetch("/tree_states", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector("meta[name='csrf-token']")?.content || ""
      },
      body: JSON.stringify({
        tree_instance_key: viewKey,
        expanded_keys: expandedKeys
      })
    })
  })
}
```

A few practical notes:

- `viewKey` comes from `data-tree-view-state-view-key-value`. A common pattern is to keep it aligned with the server-side `tree_instance_key` so the browser listener can save the correct screen state without extra lookup.
- `expandedKeys` is the current expanded node-key snapshot published by the state controller after connect, `refresh`, and expand/collapse updates.
- `reason` identifies why the snapshot was published: `connect`, `refresh`, `expanded`, or `collapsed`. Host apps that only want user-initiated saves can skip `connect` or save only `expanded` / `collapsed` events, while keeping save timing as an app-owned policy.
- TreeView only dispatches the event. The host app still owns the route, authorization, retry behavior, and the decision to save on every change or only at explicit checkpoints.

## RenderState integration

Pass the loaded state to `RenderState`.

```ruby
store = TreeView::StateStore.new(model: TreeViewState)

persisted_state = store.find(
  owner: current_user,
  tree_instance_key: "documents:index"
)

render_state = TreeView::RenderState.new(
  tree: tree,
  root_items: tree.root_items,
  row_partial: "documents/tree_columns",
  ui_config: tree_ui,
  persisted_state: persisted_state
)
```

Explicit `expanded_keys` take precedence over persisted state.

```ruby
render_state = TreeView::RenderState.new(
  tree: tree,
  root_items: tree.root_items,
  row_partial: "documents/tree_columns",
  ui_config: tree_ui,
  persisted_state: persisted_state,
  expanded_keys: forced_expanded_keys
)
```

## Tree instance key

`tree_instance_key` separates saved state.

Examples:

- `documents:index`
- `projects:sidebar`
- `workspace:#{workspace.id}:documents`

Use different keys for different screens or trees, even when the owner is the same.

## Multiple tree instances in one host app

A host app can render more than one persisted tree for the same owner. A common pattern is a sidebar tree plus a detail tree on the main content area.

```ruby
store = TreeView::StateStore.new(model: TreeViewState)

sidebar_state = store.find(
  owner: current_user,
  tree_instance_key: "projects:sidebar"
)

detail_state = store.find(
  owner: current_user,
  tree_instance_key: "projects:#{project.id}:detail"
)
```

Pass each loaded state to the matching render state.

```ruby
@sidebar_render_state = TreeView::RenderState.new(
  tree: sidebar_tree,
  root_items: sidebar_tree.root_items,
  row_partial: "projects/sidebar_tree_columns",
  ui_config: sidebar_tree_ui,
  persisted_state: sidebar_state
)

@detail_render_state = TreeView::RenderState.new(
  tree: detail_tree,
  root_items: detail_tree.root_items,
  row_partial: "projects/detail_tree_columns",
  ui_config: detail_tree_ui,
  persisted_state: detail_state
)
```

Use these rules when choosing keys:

- split keys by placement or responsibility, such as `sidebar`, `index`, or `detail`
- include a record or workspace identifier when the detail tree changes by page
- reuse the same key only when two renders are intentionally sharing the same expansion state

TreeView stores expanded keys only. The host app still decides where save requests enter, when to persist updates, and how to combine persisted state with the current render scope.

## Responsibility boundary

| Area | TreeView | Host app |
|---|---|---|
| persisted state value object | yes | no |
| generated model/migration template | yes | reviews and migrates |
| loading/saving through StateStore | yes | provides owner and key |
| previewing/pruning old rows through StateStore | scoped count/delete helpers only | chooses retention, owner scope, schedule, audit, and authorization policy |
| save helper / controller concern | optional | includes and uses it |
| choosing owner model | optional generator argument | yes |
| deciding save timing | no | yes |
| storage lifecycle / cleanup policy | no default policy | yes |
| controller/API endpoint | no | yes |
| authorization | no | yes |
| response format | no | yes |
| UI event wiring | hooks only | yes |
