# Persisted State

このページでは、TreeViewの開閉状態をhost app側に保存・復元するためのAPIを説明します。

## 概要

persisted state は、ユーザーや画面単位でTreeViewの展開状態を保存し、次回表示時に復元するための機能です。

TreeView gem が担当するのは以下です。

- persisted stateを表す `TreeView::PersistedState`
- host app model経由で保存/読み込み/クリア/cleanup 件数 preview / 範囲指定 prune を行う `TreeView::StateStore`
- request params を `StateStore#save!` へ橋渡しする小さな controller concern `TreeView::PersistedStateController`
- migration / model / concern を生成する install generator
- `RenderState` へ persisted expanded keys を渡すための構造

実際の保存先、owner model、認可、保存タイミング、cleanup policy、controller action、UI更新はhost app側で実装します。

persisted-state install generator の生成先 path-level contract を確認したい場合は [Public Setup Surface](public-setup-surface.md) を参照してください。generator 名、任意の owner 引数、生成先 path を追跡しますが、migration schema や生成 template 内容そのものを固定するものではありません。

保存・復元の受け渡しを静的な visual reference で確認したい場合は、[Persisted State boundary mockup](../mockups/persisted-state-boundary.html) を参照してください。この mockup は、保存前、変更後、復元後、保存失敗、retry の代表的な見え方を示しますが、storage、save endpoint、認可、retry policy を gem 側の責務として扱うものではありません。

## PersistedState.from の正規化境界

host app integration code が optional な persisted-state value を `RenderState` へ渡す前に正規化したい場合は、`TreeView::PersistedState.from(value)` を使えます。

`from` が受け付けるのは、現在の persisted-state 境界で扱う次の形だけです。

- `nil` は `nil` のまま返します。caller は optional persisted state を optional のまま扱えます。
- 既存の `TreeView::PersistedState` instance は、その instance をそのまま返します。
- Hash-like input は `to_h` で読み取り、key を symbol 化したうえで、`tree_instance_key` / `expanded_keys` から `TreeView::PersistedState` value object に変換します。
- non Hash-like input は `ArgumentError` を投げ、message には `Hash-like` fragment が含まれます。

この正規化境界は、`StateStore` の保存挙動、generator output、migration shape、storage lifecycle、host app の authorization policy を変更するものではありません。

## generator

保存用modelとmigrationの雛形は generator で作成できます。

```bash
bin/rails generate tree_view:state:install
```

生成される主なファイル:

- `db/migrate/*_create_tree_view_states.rb`
- `app/models/tree_view_state.rb`
- `app/models/concerns/tree_view_state_owner.rb`

migrationを確認してから実行してください。

```bash
bin/rails db:migrate
```

### owner concern を自動で include する

既存の owner model に `TreeViewStateOwner` を include したい場合は、owner model 名を渡します。

```bash
bin/rails generate tree_view:state:install User
```

この場合も、migration、model、concern は通常どおり生成されます。`app/models/user.rb` が存在し、まだ `TreeViewStateOwner` を include していなければ、generator が include 行を追加します。

namespace 付き owner では constant 名を渡します。generator は慣例的な file path を解決し、`class Admin::User < ApplicationRecord` 形式と、`module Admin; class User < ApplicationRecord` のような module-wrapped 形式の代表例を更新できます。

```bash
bin/rails generate tree_view:state:install Admin::User
```

`app/models/admin/user.rb` が存在し、これらの代表的な class 定義がある場合、generator は owner class の中に include 行を追加します。

owner model file が存在しない場合、または class 定義が project 固有で generator が安全に見つけられない場合、model への注入は skip されます。その場合は concern を手動で include してください。

### owner への注入が skip された場合

owner model file が存在しない、または class 定義が見つからないと表示された場合は、まず保存された tree state を所有する model を確認してください。そのうえで、生成済みの `app/models/concerns/tree_view_state_owner.rb` がある状態で、その model に `include TreeViewStateOwner` を追加します。

通常の owner model では、手動で追加する行は generator が追加するものと同じです。

```ruby
# app/models/user.rb
class User < ApplicationRecord
  include TreeViewStateOwner
end
```

namespace 付き、または `module` で囲まれた owner では、`TreeView::StateStore` の `owner:` に渡す実際の class の中に include します。

```ruby
# app/models/admin/user.rb
module Admin
  class User < ApplicationRecord
    include TreeViewStateOwner
  end
end
```

owner model を後から作る場合、または project 固有の file layout / class definition により generator が更新しなかった場合は、手動 include が自然な follow-up です。このケースでは生成済み migration や `TreeViewState` model を変更する必要はありません。host app 側では、`tree_view_state_for`、`save_tree_view_state!`、または `TreeView::StateStore` へ owner を渡す前に、その owner class が concern を include していれば十分です。

## owner model

host app側のowner modelに concern をincludeします。

```ruby
class User < ApplicationRecord
  include TreeViewStateOwner
end
```

ownerは、ユーザー、workspace、project、または画面状態を所有する任意のmodelにできます。

## StateStore

`TreeView::StateStore` は、生成された host app model 経由で persisted state を読み書きします。store は model で初期化し、読み込み・保存のたびに owner と tree instance key を渡します。

```ruby
store = TreeView::StateStore.new(model: TreeViewState)

persisted_state = store.find(
  owner: current_user,
  tree_instance_key: "documents:index"
)
```

開閉状態を保存する例:

```ruby
persisted_state = store.save!(
  owner: current_user,
  tree_instance_key: "documents:index",
  expanded_keys: expanded_keys
)
```

`StateStore#save!` は、`owner:` と `tree_instance_key:` の組み合わせで backing row を検索または初期化し、`expanded_keys` の snapshot を置き換えます。generated polymorphic model では、論理的な owner は `owner_type` と `owner_id` として保存され、generated migration の `owner_type`、`owner_id`、`tree_instance_key` に対する unique index が同一 identity につき1 rowを保証します。

lookup 後の `save!` は atomic upsert ではありません。同じ identity への初回保存が並行すると双方が row を初期化し、片方の insert が backing database または model の unique constraint 例外になることがあります。TreeView はその例外を caller へ伝播し、自動 retry、reload 後の `expanded_keys` merge、last-write policy の選択、application / database lock の取得を行いません。rescue、retry、競合解決 policy は host app の責務です。

同じ owner と tree instance key の保存済み開閉状態をクリアする例:

```ruby
persisted_state = store.clear!(
  owner: current_user,
  tree_instance_key: "documents:index"
)
```

`clear!` は一致する persisted-state record があれば削除します。record が存在しない場合も例外にせず、指定した key と空の `expanded_keys` を持つ `TreeView::PersistedState` を返します。これは `find` の empty-state behavior と同じ扱いです。

同じ cleanup scope に一致する古い persisted-state row の件数だけを、削除せずに preview する例:

```ruby
matching_count = store.prune_count(
  older_than: 90.days.ago,
  owner: current_user,
  tree_instance_key: "documents:index"
)
```

`prune_count` は `older_than:` を必須にし、Integer の件数だけを返します。条件は `prune!` と同じ `updated_at < older_than`、`owner:`、`tree_instance_key:` を使いますが、row を削除せず、対象 record の内容も返しません。

明示した timestamp より古い persisted-state row を prune する例:

```ruby
deleted_count = store.prune!(
  older_than: 90.days.ago,
  owner: current_user,
  tree_instance_key: "documents:index"
)
```

`prune!` は `older_than:` を必須にし、削除した row 数を返します。`owner:` と `tree_instance_key:` は任意の scope です。host app がより広い cleanup を意図している場合だけ、片方または両方を省略してください。この helper は generated model の `t.timestamps` 由来の `updated_at` を使い、TreeView は default retention period を決めません。

TreeView が提供するのは store API までです。reset route、認可、確認 UI、retry、response shape、削除済み owner の扱い、audit policy、privacy retention rule は引き続き host app 側が持ちます。`prune_count` は host app の cleanup plan のための preview であり、cleanup schedule、retention の選択、authorization、audit policy を TreeView 側へ移すものではありません。

### storage lifecycle と cleanup policy

`StateStore#clear!` は、1つの owner と1つの `tree_instance_key` に対する reset です。`StateStore#prune_count` は `StateStore#prune!` が削除する同じ scope を preview し、`StateStore#prune!` は明示した `older_than:` timestamp より古い row を消す opt-in cleanup helper です。

長く運用する host app では、persisted-state の lifecycle を引き続き host app 自身の storage policy として扱ってください。たとえば、古い行を期限切れにするか、削除済み owner の行を既存の dependent destroy や cleanup job で消すか、audit / privacy rule によって短い retention period が必要かは host app が決めます。

TreeView は cleanup rake task や default TTL を提供しません。scheduled cleanup が必要な場合は、件数だけを確認したいときに `prune_count` を使い、実際の削除は app-owned job や task から `prune!` を呼んで、owner、`tree_instance_key`、timestamp、authorization、retention scope を host app の policy に合わせてください。

## 最小 controller concern

保存 endpoint を小さく保ちたい host app では、controller に `TreeView::PersistedStateController` を include して、raw request values から `StateStore#save!` への橋渡しだけ gem 側へ寄せられます。

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

この concern は責務を広げすぎないよう、次だけを行います。

- `expanded_keys` を array-like param または comma-separated string から正規化する
- owner、認可、route、保存タイミング、response shape の最終判断は引き続き host app 側に残す
- 完成済み controller や Turbo Stream / JSON の固定 response policy は提供しない

## Browser event wiring

利用者の操作に合わせて開閉状態を保存したい場合は、TreeView state controller element で公開 event `tree-view-state:state-changed` を listen し、`event.detail.expandedKeys` を save endpoint へ渡します。

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

実運用では次の点を意識すると扱いやすくなります。

- `viewKey` は `data-tree-view-state-view-key-value` の値です。browser 側で追加 lookup を増やさないため、server-side の `tree_instance_key` とそろえておくのがよくある形です。
- `expandedKeys` は、state controller が connect、`refresh`、expand/collapse 更新後に公開する current expanded node-key snapshot です。
- `reason` は snapshot が公開された理由を示します。値は `connect`, `refresh`, `expanded`, `collapsed` です。利用者操作だけを保存したい host app は `connect` を skip する、または `expanded` / `collapsed` だけを保存する、などの制御を host app 側の保存方針として扱えます。
- TreeView が提供するのは event dispatch までです。route、認可、retry、毎回保存するか明示 checkpoint だけ保存するか、という保存方針は引き続き host app 側が持ちます。

## RenderStateとの連携

読み込んだpersisted stateは `RenderState` に渡せます。

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

明示的に `expanded_keys` を指定した場合は、明示指定が persisted state より優先されます。

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

## tree instance key

`tree_instance_key` は、保存状態を分けるためのkeyです。

例:

- `documents:index`
- `projects:sidebar`
- `workspace:#{workspace.id}:documents`

同じownerでも画面やtreeが異なる場合は、別のkeyを使ってください。

## 1 つの host app で複数 tree instance を使う

同じ owner に対して、sidebar tree と詳細 tree のように複数の persisted tree を並行運用できます。

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

読み込んだ state は、それぞれ対応する render state に渡します。

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

key を決めるときは、次の考え方を使うと整理しやすくなります。

- `sidebar`、`index`、`detail` のように、配置場所や責務ごとに key を分ける
- 詳細 tree がページごとに変わる場合は、record ID や workspace ID を key に含める
- 2 つの描画で本当に同じ展開状態を共有したい場合だけ、同じ key を再利用する

TreeView が保存するのは expanded keys です。保存 request の入口、更新をいつ永続化するか、現在の render scope とどう組み合わせるかは引き続き host app 側で決めます。

## 責務範囲

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
