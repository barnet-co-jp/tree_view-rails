# Drag and Drop

このページでは、TreeViewのtransfer payloadを使ってdrag-and-drop UIをhost app側に実装するための境界を説明します。

## 概要

TreeView gem は、drag-and-dropの業務処理そのものは実装しません。

TreeView が提供するのは以下です。

- rowごとのtransfer payloadをdata属性として出力するhook
- `tree-view-transfer` controller
- drag start時にpayloadを `DataTransfer` へ入れる補助
- host appがdrop先でpayloadを読むための最低限のtransfer境界

実際のdrop target、並び替え保存、親変更、認可、validation、Turbo Stream更新、エラー表示はhost app側で実装します。

## row transfer payload

`row_event_payload_builder` に、drag/dropで渡したいpayloadを返すcallableを指定します。

歴史的な名前に反して、`row_event_payload_builder` はtransfer専用です。すべてのrow event向けの汎用payload hookではありません。詳細は [Public Name Decisions](public-name-decisions.md) を参照してください。

```ruby
render_state = TreeView::RenderState.new(
  tree: tree,
  root_items: tree.root_items,
  row_partial: "documents/tree_columns",
  ui_config: tree_ui,
  row_event_payload_builder: ->(document) {
    {
      key: tree.node_key_for(document),
      id: document.id,
      type: document.class.name
    }
  }
)
```

戻り値はhash-like objectである必要があります。

TreeView はこの payload を documented な `data-tree-transfer-payload` attribute に描画します。host app が package root をすでに import している場合、JavaScript、browser test、shared helper code では attribute 名を raw string で写経せず `TreeViewTransferDataAttributes.payload` を使えます。`TreeViewTransferDataAttributes.disabled` は transfer boundary state で使う documented な disabled-row transfer hook (`data-tree-transfer-disabled`) を指します。これらの export は DOM wiring attribute 名だけを指します。payload shape、authorization、保存、最終的な drop behavior は引き続き host app 側の責務です。既存 integration が grouped integration-hook object を使っている場合、`TreeViewIntegrationHooks.transfer.payload` も引き続き利用できます。

## viewでの利用例

```erb
<tbody data-controller="tree-view-transfer">
  <%= tree_view_rows(@render_state) %>
</tbody>
```

行側に `draggable` や `dragstart` actionを付けたい場合は、host appのrow partialやrow data builderで必要な属性を追加します。

```ruby
row_data_builder: ->(document) {
  {
    action: "dragstart->tree-view-transfer#start",
    draggable: "true"
  }
}
```

## draggable row内のinteractive control

`draggable` なrowにも、link、button、input、select、textarea、`contenteditable` label などのhost app controlを配置できます。TreeViewはこれらのnative interactive controlから発生したtransfer controllerのdrag start、drag-over、drop eventを無視するため、control操作が誤ってrow transferを開始したりdrop targetになったりすることはありません。

native controlではないcustom widgetでは、row内のwidgetまたはその祖先にTreeView markerを付けます。

```erb
<td>
  <span data-tree-view-interactive="true">Custom picker</span>
</td>
```

drag関連のTreeView動作だけを無視し、他のTreeView動作は残したい場合は `data-tree-view-ignore-drag="true"` を使います。

```erb
<td>
  <span data-tree-view-ignore-drag="true">Drag-safe widget</span>
</td>
```

これらの opt-out marker は documented DOM attribute です。`TreeViewTransferDataAttributes` は transfer payload と disabled-row attribute を指すもので、drag-safe control marker を指すものではありません。

keyboardやrow interaction向けのmarkerは [使い方](usage.md#行内のinteractive-control) を参照してください。

静的な見比べ用リファレンスとして、native control と `data-tree-view-interactive` / `data-tree-view-ignore-drag` の共存は [drag-interactive-controls.html](../mockups/drag-interactive-controls.html) を参照し、keyboard・row-click・drag marker まで含めた広い比較が必要なときは [interactive-marker-behaviors.html](../mockups/interactive-marker-behaviors.html) を参照してください。

## drop処理

drop先はhost app側で実装します。

```js
function onDrop(event) {
  const payload = JSON.parse(event.dataTransfer.getData("application/json"))
  // payload.id, payload.key, payload.type を使ってhost app側の処理を行う
}
```

`application/json` は、host app が通常読む primary な TreeView transfer MIME type です。TreeView は browser compatibility fallback として、同じ JSON payload を `text/plain` にも書き込みます。machine-readable な文字列を使いたい host app は package root から `TreeViewTransferDataMimeTypes` を import し、まず `TreeViewTransferDataMimeTypes.applicationJson` を読み、必要な場合だけ `TreeViewTransferDataMimeTypes.textPlain` を fallback として使ってください。

host appは controller 内部に直接依存せず、`tree-view-transfer` controller がdispatchする公開transfer eventをlistenできます。

```js
document.addEventListener("tree-view-transfer:drop", (event) => {
  const { sourcePayload, targetPayload, position } = event.detail
  // 認可、並び替え、保存、エラー表示などのhost app側処理をここで行う
})
```

transfer controller が読者向けに公開する主なdetailは次のとおりです。

| Event | Main `event.detail` fields | Meaning |
|---|---|---|
| `tree-view-transfer:drag-start` | `sourcePayload`, `sourceRow` | draggable な TreeView row のtransferが開始され、可能な場合はpayloadが `DataTransfer` にコピーされた。 |
| `tree-view-transfer:drag-over` | `targetPayload`, `targetRow`, `position` | pointer がvalidなtarget row上にある。TreeView はtarget payloadと粗いdrop位置を返す。 |
| `tree-view-transfer:drop` | `sourcePayload`, `targetPayload`, `position`, `targetRow` | payloadがtarget rowへdropされた。host app がそのmoveを許可するか、どう保存するかを決める。 |
| `tree-view-transfer:invalid-payload` | `value`, `row` | target row の `data-tree-transfer-payload` をJSONとしてparseできなかった。 |
| `tree-view-transfer:invalid-transfer` | `value` | `DataTransfer` から取得したJSON値をparseできなかった。 |

`position` は、target row内でpointerがどこにあるかを示すTreeView側の粗いcueです。上 1/3 は `before`、中央 1/3 は `inside`、下 1/3 は `after` になります。これはhost appの業務ルールへの入力として扱い、最終的な許可・保存方針として扱わないでください。たとえば、leaf-only treeでは `inside` を無視したり、projectをまたぐdropを拒否したり、`before` / `after` を並び順更新へ変換したりできます。

`before` / `inside` / `after` のcueと、transfer disabled / invalid transfer 境界状態を静的に見比べたい場合は [drop-positions.html](../mockups/drop-positions.html) を参照してください。

host app の JavaScript で raw な drop-position string を写経したくない場合は、package-root の `TreeViewTransferDropPositions` export を使えます。`TreeViewEventNames.transfer.*` は transfer event 名、`TreeViewEventDetailKeys.transfer.*` は documented detail key、`TreeViewTransferDropPositions` は粗い `before` / `inside` / `after` position value を表します。

### transfer operation と outcome の境界

TreeView は drag start 時の `DataTransfer.effectAllowed` と、valid row 上で hover している間の `DataTransfer.dropEffect` を `move` に設定します。この cue は、現在の TreeView helper が row transfer 向けであることを示すだけで、host app の業務上の operation を決めるものではありません。

| Question | TreeView boundary | Host app boundary |
|---|---|---|
| これは TreeView 由来の row transfer か | 可能な場合に row payload を `DataTransfer` へコピーし、transfer event を通知する | その target で TreeView row transfer を受け入れるか決める |
| 業務上は reorder、parent move、copy、attach、link のどれか | browser の `move` cue と `sourcePayload` / `targetPayload` / `position` を返す | detail を業務 operation に対応づけるか、非対応 operation として拒否する |
| drop 後に何を表示・保存するか | drop event と parse / integration signal を dispatch する | pending、accepted、rejected、retry、undo などのUIを表示し、保存や失敗記録を行う |

製品上の意味として drop を copy、attach、link、または別の operation として扱う場合、その方針は host app 側に置いてください。TreeView は現在 transfer operation kind を公開していません。また `move` cue を、保存成功や認可結果の保証として読まないでください。

pending、accepted、rejected、retry、undo などの drop 後状態は、host app の UI / workflow 判断です。TreeView が担当するのは transfer 境界の通知までであり、それらの状態の runtime state model や最終的な表示文言は定義しません。

### source payload がない、または壊れている場合

source payload が取れるかどうかと、host app の move validation は別の論点です。

`DataTransfer` がない、または `application/json` / `text/plain` に値がない場合、TreeView は `tree-view-transfer:drop` event の `sourcePayload` を `null` にします。これは external drag source、empty transfer value、TreeView row payload を持たない browser event などを含みます。host app は `sourcePayload: null` を untrusted または unsupported な move として扱い、最終的な拒否文言、logging、UI response を決めてください。

`DataTransfer` に空ではない値があるものの JSON として parse できない場合、TreeView は raw `value` を含む `tree-view-transfer:invalid-transfer` を dispatch し、source payload は利用不可のままにします。この event は integration signal であり、business-level authorization result ではありません。

source payload が有効な場合でも、最終的な validation は host app の責務です。たとえば、現在ユーザーに権限がない、target project が違う、target row が children を受け付けない、`before` / `after` / `inside` の position がその画面では許可されない、といった理由で drop を拒否できます。

JavaScript event contract全体は [JavaScript event contract](js-events.md#transfer-events) を参照してください。

## 責務範囲

| Area | TreeView | Host app |
|---|---|---|
| row transfer payload builder validation | yes | provides builder |
| transfer data attributes | yes | consumes them |
| dragstart helper | yes | wires action |
| browser transfer cue | 現在の helper cue を `move` にする | 業務 operation と最終UXを決める |
| interactive-control transfer guard | transfer controllerのdrag start、drag-over、dropを無視する | 必要に応じてcustom widgetをmarkする |
| transfer event detail | yes | listens and applies business behavior |
| source payload parse failure | 空ではない invalid JSON では `invalid-transfer` を通知する | user-facing rejection、logging、recovery を決める |
| missing source payload | drop event で `sourcePayload: null` を返す | unsupported drop を reject / handle する policy を決める |
| coarse drop position | `before`, `inside`, `after` を返す | そのpositionを許可するか、どう保存するかを決める |
| drop target | no | yes |
| operation kind | no | reorder、move、copy、attach、link、rejection などに対応づける |
| post-drop outcome UI | no | pending、accepted、rejected、retry、undo などの product-specific state を表示する |
| reorder / move persistence | no | yes |
| authorization | no | yes |
| validation | no | yes |
| Turbo Stream update | no | yes |
| error handling | no | yes |

## 設計方針

TreeViewは「どのnodeがdragされたか」を安全に渡すところまでを担当します。

「どこにdropできるか」「drop後にどのような親子関係・並び順にするか」は、業務仕様ごとに異なるためhost app側の責務です。
