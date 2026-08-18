# DOM 並び替え後の枝線 refresh

TreeView の middle / last sibling などの枝線情報は、サーバー描画時に計算されます。出力 HTML は CSS の `:last-child` だけに依存せず、`.tree-toggle__branch-slot` に `is-middle`、`is-last`、`has-line`、`is-empty` などの class を付けて枝を描画します。

そのため、host app が browser 上で既に描画済みの TreeView row を直接並び替えた場合、サーバー描画時の branch class は新しい DOM 順へ自動追従しません。

v1.1.0 では bundled `tree-view-transfer` controller に、明示的な再計算 primitive として `TreeViewTransferController#refreshBranches()` を追加します。

## DOM 上で row を並び替える場合

host app が対象の `<tr>` を最終的な DOM 順へ移動した後、controller instance の `refreshBranches()` を呼びます。

```js
const element = document.querySelector("[data-controller~='tree-view-transfer']")
const controller = application.getControllerForElementAndIdentifier(
  element,
  "tree-view-transfer"
)

// 先に host app 側で DOM 順を変更する。
moveRows()

controller.refreshBranches()
```

refresh は TreeView が所有する `tr[data-tree-depth]` を DOM 順に走査し、各 row の branch slot を再構築します。再計算するのは次の両方です。

- current row が sibling の末尾かどうか (`is-last` / `is-middle`)
- 各 ancestor level の縦線が継続するかどうか (`has-line` / `is-empty`)

nested `tree-view-transfer` controller に属する row は対象外です。

`refreshBranches()` は処理した TreeView row 数を返します。

## 責務境界

この method が更新するのは枝線の表示だけです。以下は行いません。

- row の並び替え
- `parent_id` の変更
- `data-tree-depth` の更新
- 新しい順序の保存
- move 可否の validation
- authorization state の更新
- server-side `TreeView::Tree` の再計算

同一 parent 内の並び替えであれば、row / subtree の DOM block を正しい位置へ移動してから `refreshBranches()` を呼ぶことで、通常は枝線表示を更新できます。

parent を変更する場合は、host app が対象 row と descendant の `data-tree-depth` も更新してから `refreshBranches()` を呼ぶ必要があります。host app 側でこれらの構造属性を確実に維持していない場合は、server render の Turbo Stream replacement を優先してください。

## 部分 tree の境界

branch refresh は、DOM 順から visible hierarchy を復元できるだけの sibling / ancestor context が揃った、完全な rendered tree region を対象にします。

次のように DOM が構造的に不完全な場合は server re-render を優先してください。

- windowed rendering
- lazy loading で一部 branch が未ロード
- children pagination により sibling context が現在の DOM 外にある
- 実際の root より下から始まる fragment で、枝線に必要な ancestor context が DOM にない

これらでは、対象 tbody または tree region を Turbo Stream で差し替える方が server-side traversal と枝線を確実に一致させられます。

## Drag-and-drop との組み合わせ

transfer controller は引き続き transfer intent (`before`, `inside`, `after`) と payload 情報を通知するところまでを担当します。業務 move の適用、保存、DOM を更新してよいタイミングの判断は host app の責務です。

単一ユーザー操作の典型的な流れは次のとおりです。

```text
drop
 -> host app が validation / 保存
 -> host app が DOM row を並び替え
 -> refreshBranches()
```

保存結果を Turbo Stream HTML で返している場合、server-rendered replacement に新しい branch 情報が含まれるため、client 側の branch refresh は不要です。
