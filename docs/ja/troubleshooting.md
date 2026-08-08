# Troubleshooting

このページは、TreeView 統合時によくある詰まりを症状ベースでたどるための入口です。

「どこで困っているか」は分かるが、どの API 文書から読み直せばよいか迷うときに使ってください。

TreeView は描画プリミティブ、JavaScript hook、validation helper を提供します。routes、controller action、authorization、query、Turbo Stream response、business action、page layout は引き続き host app の責務です。

## localized label が missing translation や想定外の fallback text になる

localized display name は、利用できる場合は Rails / ActiveModel / I18n から解決されます。TreeView が locale の値を解決できない場合、localized-name helper は `default:` が渡されていなければ class 名、attribute 名、node type 名を humanize した fallback を返します。

次を確認してください。

- current locale に対して、host app 側に期待する `activerecord.models`、`activerecord.attributes`、または `tree_view.node_types` の locale key があるか
- missing translation や plain Ruby object に出したい fallback copy を row partial、presenter、helper 側ですでに持っている場合は `default:` を渡す
- 最終的な translation text や product copy は host app 側に置く。TreeView は caller が描画する表示名を解決するだけです
- toolbar action label だけが missing になっている場合は、まず `tree_view.toolbar.labels` の key または明示的な `labels:` override を確認する

次に読む文書:

- [Localized names](localized-names.md)
- [公開 API](public-api.md)
- [Host App 拡張ポイント](host-app-extension-points.md)

## toggle link を押しても展開・折りたたみされない

最初に tree mode を確認してください。

- `build_turbo` / `build` は host app 側の Turbo Stream endpoint を前提にします。
- `build_static` は静的な snapshot です。閉じた descendant は HTML に出ないため、browser 上で開けません。
- `build_client_side` は descendant が初期 HTML に含まれている前提で、TreeView JavaScript が表示・非表示を切り替えます。

次に、その mode に合った wiring を確認します。

- Turbo mode: `show_descendants_path_builder`、`hide_descendants_path_builder`、route、controller action、authorization、Turbo Stream response を host app 側で確認する
- client-side mode: TreeView controller が登録され、tree root に `tree_view_state_data(@render_state)` が出ているか確認する
- lazy loading は client-side toggle mode と同時には使えません

次に読む文書:

- [使い方](usage.md)
- [Turbo Frame option](turbo-frame.md)
- [Lazy Loading](lazy-loading.md)
- [導入手順](installation.md)

## toolbar action が disabled button になる

toolbar action は、TreeView がその action の path を作れないと disabled button として描画されます。多くの場合、toolbar の見た目ではなく host app 側の route または state contract の確認ポイントです。

次を確認してください。

- render state が `toggle_all_path` に対応する `UiConfig` で作られているか
- Turbo mode では `build_turbo` に `toggle_all_path_builder:` を渡し、`UiConfig#toggle_all_path(state:)` が `:expanded`、`:collapsed`、必要なら `:current_path` action の path を返せるか
- 特定 action だけ disabled になる場合、その action の state 値に対して host app builder が `nil` ではない path を返しているか
- `collapse_all_except_current_path` では、host app 側で `:current_path` の policy と、どの branch を開いたままにするかが決まっているか
- route、authorization、Turbo Stream response、expanded keys の保存は host app 側で確認する。TreeView は toolbar action と target state を出すだけです

次に読む文書:

- [Toolbar helper](toolbar.md)
- [Turbo Frame option](turbo-frame.md)
- [使い方](usage.md)

## breadcrumb が失敗する / 親方向の path が見つからない

breadcrumb の path lookup は records mode 専用です。TreeView は、現在 record から root まで `parent_id_method` の関係を辿れる場合に breadcrumb を描画できます。

次を確認してください。

- tree が `records:` と `parent_id_method:` から構築されているか。resolver mode と adapter mode は、bundled breadcrumb helper が使う一意な親方向 path を公開しません。
- error が parent path helpers は records mode 専用だと示している場合は、graph-like data から親を推測しようとせず、mode 境界の signal として扱う。
- data が graph-like、複数の parent 候補を持つ、または `GraphAdapter` 由来の場合は、host app 側で breadcrumb trail を選び、独自の link または label を描画する。
- route、authorization、layout placement、analytics behavior は host app 側で管理する。TreeView が担当するのは records-mode path lookup と helper HTML です。

次に読む文書:

- [Breadcrumb](breadcrumb.md#対応mode)
- [GraphAdapter](graph-adapter.md)
- [Host App 拡張ポイント](host-app-extension-points.md)
- [Rendering Boundaries](rendering-boundaries.md)

## row partial の表示が崩れる / table cell 数が合わない

TreeView は row wrapper と共通 tree UI cell を担当し、`row_partial` の中身、action cell、周囲の table layout は host app が担当します。

次の順で確認してください。

- page 全体の table wrapper が host app 側で意図どおり定義されているか
- row partial がその画面で必要な business column を描画しているか
- selection や resource-table bridge など optional cell を有効にした場合、host app 側 layout もその列数を前提にしているか
- 特定 record だけで崩れる場合、partial を直す前に tree node key と UI DOM ID を分けて確認する。開閉状態、persisted state、diagnostics は tree node key 側を使うため、UI 専用の DOM ID builder を変えても `expanded_keys`、`collapsed_keys`、保存済み state は変わりません。症状が特定 record に紐づく場合は `tree.node_key_for(item)` を確認してください。

次に読む文書:

- [Rendering Boundaries](rendering-boundaries.md)
- [Resource table bridge](resource-table-bridge.md)
- [Selection](selection.md)
- [Accessibility Semantics](accessibility-semantics.md)
- [Tree diagnostics](tree-diagnostics.md)
- [Node keys](node-keys.md)

## empty / no-results row が出ない、狭い、または copy が合わない

empty-state の症状は、多くの場合 host app 側の page state、search / filter policy、最終的な product copy の問題です。TreeView は再利用可能な empty-row wrapper と message slot を提供しますが、なぜ空なのか、次にユーザーへ何を促すかは決めません。

次を確認してください。

- その画面が no root items なのか、filter 後の no matching results なのか、permission policy によって record が隠れているのかを分ける。多くの場合、それぞれ copy や次 action が変わります。
- default empty row で十分な場合は、partial を置き換える前に documented wrapper hook を装飾・target してください: `data-tree-view-empty-state="true"`、`.tree-view-empty-row__content`、`.tree-view-empty-row__message`。
- 最終的な empty copy、CTA text、filter reset behavior、permission messaging、analytics は host app 側に置く。
- empty row が狭い、または周囲の table を横断していないように見える場合は、TreeView 内部を変える前に host app 側の table wrapper、caption、column、resource-table bridge layout を確認する。
- static empty-state mockup は hook と責務境界の visual reference として扱い、Rails controller、query、demo app 実装として扱わない。

次に読む文書:

- [Accessibility Semantics](accessibility-semantics.md)
- [使い方](usage.md)
- [empty-state mockup](../mockups/empty-state.html)
- [Mockup Empty-state guidance](../mockups/README.md#empty-state-guidance)

## tree rendering 中に query が繰り返される / ActiveRecord time が大きい

まず host app 側の data loading と row partial の問題として切り分けます。TreeView は tree traversal と row rendering を担いますが、application record の eager loading、authorization、caching、derived value の作り方は決めません。

tree を描画しているときの Rails log で次を確認します。

- `Views:` に比べて `ActiveRecord:` が大きい。
- row render 中に `Document Load`、`DocumentVersion Load`、または host app 固有の query が同じ形で繰り返される。
- 繰り返し出る query が `CACHE` になっていない。
- row partial から呼ぶ helper や association access が row ごとに DB work を発生させている。

高コストな処理は render loop の外へ移してください。

- tree 構築前に親 record を確定する。
- `GraphAdapter` の `children_resolver` から lazy な ActiveRecord relation ではなく配列を返す。
- parent id ごとの children cache を host app 側で作る。
- authorization、version、表示用 metadata は row partial の描画前に事前計算する。

次に読む文書:

- [Cookbook: GraphAdapter と ActiveRecord の性能](cookbook.md#graphadapter-と-activerecord-の性能)
- [Rendering Boundaries](rendering-boundaries.md)
- [Tree diagnostics](tree-diagnostics.md)

## 大きな tree で HTML が重い / virtual scroll が欲しい

まず HTML 出力量の問題と host app 側 data fetching の問題を分けてください。TreeView は描画対象を制限できますが、database query を減らすこと、scroll 位置に応じた DOM virtualization、host app の pagination strategy の選択は行いません。

次を確認してください。

- 初期表示で開く node が多すぎる場合は、pagination や custom JavaScript を足す前に `max_initial_depth` で初期展開を制限する。
- 画面に必要な範囲より深い descendant が描画されている場合は、`max_render_depth` または `max_leaf_distance` で描画範囲を減らす。
- data はすでに読み込まれていて HTML 出力量だけが大きい場合は、`TreeView::RenderWindow` または `tree_view_rows(..., window:)` で現在 visible な row を slice する。
- 全 descendant の取得や準備が重い場合は lazy loading に移し、host app がユーザー操作時に children を取得する。
- 1つの親に大量の children がある場合は host app 側で children pagination を使い、cursor、limit、ordering、authorization、次 page 判定を host app に置く。
- product 要件として scroll 位置に応じた virtual scrolling が必要な場合は、host app 側で実装する。TreeView の windowed rendering は HTML 出力の slice であり、full virtual scroll engine ではありません。

次に読む文書:

- [Render scale](render-scale.md)
- [Windowed Rendering](windowed-rendering.md)
- [Lazy Loading](lazy-loading.md)
- [Children Pagination](children-pagination.md)

## children pagination の placeholder や unloaded descendants が想定どおりにならない

children pagination は lazy loading の上に host app が作る pattern です。TreeView は children URL hook と row data を提供しますが、page query、next-page placeholder、bulk action intent、server-side validation は host app の責務です。

次を確認してください。

- next-page placeholder が出ない場合は、host app が次 page の存在を判定し、次の request を始めたい場所に placeholder を描画し、期待する Turbo Stream response を返しているか確認する。
- loaded page は追加されるが古い placeholder が残る場合は、TreeView row partial を変える前に host app 側の `children_more` replacement または removal target を確認する。
- checkbox selection、cascade、drag/drop、bulk action が unloaded descendants を無視しているように見える場合は、その action が loaded DOM rows だけに作用するのか、filtered child set 全体に作用するのかを決める。
- DOM から送られる checkbox 値は、action を loaded rows に限定する場合だけ使う。unloaded children も含めるなら query-backed action または server-side intent を使う。
- ordering、cursor validation、authorization、move validation、最終的なユーザー向け copy は host app 側に置く。

次に読む文書:

- [Children Pagination](children-pagination.md#selection--drag-drop-との相互作用)
- [Lazy Loading](lazy-loading.md)
- [Selection](selection.md)
- [children-pagination-selection-boundary mockup](../mockups/children-pagination-selection-boundary.html)

## GraphAdapter の行が重複する / 足りない / 想定と違う形になる

GraphAdapter で起きる症状は、多くの場合 host app 側の resolver 出力または node key strategy から来ます。TreeView は行を描画できるよう resolver 結果を正規化しますが、graph-like data の traversal policy、authorization、cycle handling、query planning は決めません。

row partial や TreeView 内部を変える前に次を確認してください。

- `children_resolver` の各 branch が、その画面で本当に描画したい child collection を返しているか。予測しやすい描画と性能のため、配列を返してください。
- `nil` は空の child list になり、単一 object は 1 child として包まれます。その挙動が画面の期待と違う場合は resolver branch を明示してください。
- 同じ logical node が複数 parent の下に出る場合、それを意図した duplicate path として扱うか、tree 構築前に host app 側で絞るかを決めてください。
- heterogeneous node では、type や source system で namespace した `node_key_resolver:` を渡してください。
- cycle や duplicate key が見える場合、GraphAdapter 固有の validation behavior を足す前に diagnostics を使ってください。
- authorization、eager loading、cache、pagination、cycle policy は host app 側に置いてください。GraphAdapter は roots と child arrays を `TreeView::Tree` に渡すだけです。

次に読む文書:

- [GraphAdapter](graph-adapter.md)
- [Cookbook: GraphAdapter と ActiveRecord の性能](cookbook.md#graphadapter-と-activerecord-の性能)
- [Tree diagnostics](tree-diagnostics.md)
- [Node keys](node-keys.md)

## CSS や JavaScript の統合が効いていないように見える

まず導入 wiring を確認してください。

- stylesheet で `@import "tree_view";` を読み込む
- JavaScript を使うなら `pin "tree_view", to: "tree_view/index.js"` を追加する
- client-side toggle、selection、transfer hook、remote loading state など browser 側機能を使う場合は、host app 側で TreeView controller を登録する
- host app が controller を部分登録したり custom boot order を組んだりする場合は、identifier string を写経せず `tree_view/index.js` の `TreeViewControllerIdentifiers` を使う
- 部分登録や boot-order test で documented identifier / controller の組が必要な場合は、identifier string と controller import を写経せず `tree_view/index.js` の `TreeViewControllerEntries` を使う
- 最小の `registerTreeViewControllers(application)` 例は [導入手順: JavaScript / importmap](installation.md#javascript--importmap)、default / custom registration path の全体は [Controller registration](controller-registration.md)、export contract は [公開 API: JavaScript surface](public-api.md#javascript-surface) で確認する

次に、CSS 読み込みの症状と JavaScript 登録の症状を分けて確認してください。

- Propshaft app で CSS が当たらない場合は、`tree_view` を import している host app stylesheet が layout から実際に読み込まれているか確認します。Propshaft では、host app が読み込む / import することを選ばない限り、gem stylesheet は画面に現れません。
- Sprockets app で CSS が当たらない場合は、host app stylesheet が `tree_view` を import しているか、engine 側 asset に依存する構成なら Sprockets の asset paths / precompile targets に TreeView stylesheet が残っているか確認します。
- CSS は当たるが JavaScript の挙動がない場合は、importmap pin と Stimulus / controller registration を別に確認してください。stylesheet import は TreeView controller を登録しません。
- JavaScript event は発火するが CSS が当たらない場合は、controller 登録ではなく host app の asset pipeline を先に確認します。

責務境界も合わせて確認してください。

- static rendering 自体は TreeView JavaScript なしでも動きます
- selection cascade、client-side expand/collapse、transfer event、remote loading state は JavaScript controller が必要です
- CSS が当たらない場合は、host app 側 asset pipeline で gem stylesheet を読み込めていない可能性を先に見ます
- asset pipeline の選択、precompile target、stylesheet load order、importmap pin、controller boot order は host app の責務です

次に読む文書:

- [導入手順: CSSの読み込み](installation.md#cssの読み込み)
- [導入手順: Propshaft](installation.md#propshaft)
- [導入手順: Sprockets](installation.md#sprockets)
- [導入手順: JavaScript / importmap](installation.md#javascript--importmap)
- [公開 API: JavaScript surface](public-api.md#javascript-surface)
- [使い方](usage.md)
- [JavaScript event contract](js-events.md)

## drag/drop event が invalid payload を示す / `sourcePayload` が `null` になる

まず integration signal として切り分けます。TreeView は transfer payload の parse 境界を通知しますが、最終的な拒否文言、logging、authorization、recovery は host app の責務です。

次を確認してください。

- `tree-view-transfer:drop` の `sourcePayload` が `null` の場合、browser の `DataTransfer` に TreeView row payload が `application/json` または `text/plain` として入っていたか確認する。external drag、empty transfer value、TreeView row payload を持たない browser event では source payload は利用できません。
- `tree-view-transfer:invalid-transfer` が出る場合、転送された空ではない値を JSON として parse できません。drag source と、`DataTransfer` へ値を書き込む host app code を確認してください。
- `tree-view-transfer:invalid-payload` が出る場合、target row の `data-tree-transfer-payload` を parse できません。drop handling を変える前に `row_event_payload_builder`、`row_data_builder`、描画済み row attributes を確認してください。
- 有効な `sourcePayload` があることは、move が受け入れられたことを意味しません。permission、target compatibility、`before` / `inside` / `after` policy、保存、ユーザー向け retry / rejection message は引き続き host app が決めます。

次に読む文書:

- [Drag and Drop: source payload がない、または壊れている場合](drag-and-drop.md#source-payload-がないまたは壊れている場合)
- [JavaScript event contract: Transfer events](js-events.md#transfer-events)
- [Host App 拡張ポイント](host-app-extension-points.md)

## TreeView partial の render log が見えない / 多すぎる

TreeView は helper-rendered partial の周辺だけ、既定で log level を下げて描画します。これは意図した挙動で、TreeView helper を通る partial render だけに効きます。

次を確認してください。

- `TreeView.configuration.render_log_level` の既定値は `:warn`
- row partial の wiring や render flow を追いたいときは `TreeView.configure { |config| config.render_log_level = :info }` または `:debug` を試す
- Rails の render log をそのまま見たいときは `TreeView.configure { |config| config.render_log_level = nil }` を使う
- `render_log_level` を変えても効かない場合は、host app の logger が `silence` に対応しているか確認する。対応していなければ TreeView は logger wrapper を使わず通常描画に戻る
- 足りない / 多すぎる log が controller、SQL、business log 側の話なら、TreeView ではなく host app の logger policy を調整する

次に読む文書:

- [render log level](render-log-level.md)
- [使い方](usage.md)
- [Rendering Boundaries](rendering-boundaries.md)

## lazy loading で children が置き換わらない / remote state が戻らない

lazy loading は Turbo / server-driven 前提です。

次を確認してください。

- `UiConfig` に `load_children_path_builder` があるか
- `RenderState` に `lazy_loading: { enabled: true }` が入っているか
- host app endpoint が、自分で責任を持つ subtree または placeholder region を返しているか
- 一度読み込んだ row を次回 response で loaded として描画できるよう、host app 側で `loaded_keys` を維持しているか
- `build_client_side` と lazy loading を同時に使っていないか

loading や error の見た目だけは出るのに完了しない場合は、row partial より先に host app の request / response lifecycle を確認してください。

host app が retry event や remote-state event を購読している場合は、browser 側の detail と row wiring も確認します。

- `tree-view-remote-state:retry` の `event.detail` には `row`、`childrenUrl`、`nodeKey` が入ります。
- `childrenUrl` は row の `data-tree-children-url` から来ます。
- `nodeKey` は row の `data-tree-view-state-node-key` から来ます。
- どちらかが `null` の場合は、retry handler を直す前に描画済み row の data attribute を確認してください。

次に読む文書:

- [Lazy Loading](lazy-loading.md)
- [Children Pagination](children-pagination.md)
- [JavaScript event contract](js-events.md#tree-view-remote-stateretry)

## selection payload が足りない / 想定と違う

selection checkbox の送信値は plain ID ではなく JSON string です。

次を確認してください。

- server side では `TreeView.parse_selection_params` で parse する
- JavaScript では checked かつ enabled な checkbox だけが対象になる
- JSON が壊れている値は selected payload array から除外され、`tree-view-selection:invalid-payload` で通知される
- 通常 form submit 後に `ArgumentError` が出る場合は、parser を変える前に送信された checkbox value を確認する。`TreeView.parse_selection_params` は `nil` と空文字列を skip し、hash-like entry と JSON object を受け付け、空でない値が不正な JSON または JSON object 以外に parse された場合に raise します
- malformed submitted value を rescue するか、request を reject するか、記録するか、validation copy を表示するかは host app 側で決める。TreeView はその request policy を選びません
- row payload 生成、disabled-state 判定、checkbox visibility は grouped `selection:` option 側で設定する
- checkbox は見えているのに通常 form submit で selection params が送られない場合は、`tree-view-selection` host element に `data-tree-view-selection-hidden-input-name-value` を設定する。`tree-view-selection:selected` や `tree-view-selection:change` を listen するだけでは form params は作られません
- hidden input 同期は、valid な checked payload ごとに hidden input を 1 つずつ最寄りの form に書き込みます。tree が form の外にある場合、TreeView は selection event だけを dispatch し、hidden input は生成しません
- disabled checkbox と不正な JSON payload は、JavaScript event payload と同じく hidden input でも skip されます
- 1つの form に複数 tree がある場合、server 側で別々の params として受け取りたいなら hidden input name を分ける。同じ name を使うのは、host app が1つの配列としてまとめて受け取る設計のときだけです。TreeView の source id は、各 controller が他 controller の generated input を消さないために使われます
- client-side の最大選択数制限や連動 checkbox 挙動を使う場合は、同じ host element に `data-tree-view-selection-max-count-value`、`data-tree-view-selection-cascade-value`、`data-tree-view-selection-indeterminate-value` を設定する
- cascade と indeterminate は、現在 DOM に描画されている row にだけ効く
- max-count、multi-tree、unloaded descendant の挙動が product action の期待とまだ合わない場合、最終的な params grouping、bulk action semantics、server-side validation、ユーザー向け business copy は host app 側に置く

次に読む文書:

- [Selection](selection.md)
- [selection max-count mockup](../mockups/selection-max-count.html)
- [selection multi-tree form mockup](../mockups/selection-multi-tree-form.html)
- [children-pagination-selection-boundary mockup](../mockups/children-pagination-selection-boundary.html)
- [Host App 拡張ポイント](host-app-extension-points.md)
- [公開 API](public-api.md)
- [JavaScript event contract](js-events.md)

## persisted state が保存・復元されない

persisted state は gem helper と host app policy の分担で成り立ちます。

次を確認してください。

- install generator を実行し、生成された model / migration を見直しているか
- 必要な owner model に generated concern を含めているか
- screen や tree placement ごとに安定した `tree_instance_key` を使っているか
- host app 側 save endpoint が owner を選び、authorization し、`StateStore` または `TreeView::PersistedStateController` を正しく呼んでいるか
- `RenderState` に explicit `expanded_keys` を渡している場合、それが persisted state より優先されることを理解しているか
- 復元した開閉状態が違う row に効く、または期待する row に効かない場合は、保存済み key と `tree.node_key_for(item)` を照合する。persisted expansion は tree node key 側に属し、UI 専用 DOM ID や Turbo target builder とは別です
- browser listener が画面表示直後に保存する場合は、`tree-view-state:state-changed` が初回 connect 時にも dispatch されることを確認する。最初の event は現在の展開状態の snapshot として扱い、ユーザー操作による変更だけを保存したい場合は、debounce、最初の event の無視、host app 側 dirty-state policy のいずれかで save を制御する
- 同じ `expandedKeys` snapshot が繰り返し保存される場合は、TreeView を変更する前に host app の listener を確認する。TreeView は state change を通知し、autosave timing、duplicate suppression、retry behavior、authorization、endpoint response は host app が所有します
- `StateStore#save!` が backing model から例外を出す場合は、生成 model の validation、owner lookup、同じ owner / `tree_instance_key` に対する uniqueness constraint、database constraint を確認してください。TreeView は backing model の `save!` を呼び、validation failure や retry behavior は host app 側に残します
- `StateStore#clear!` が例外を出す場合は、該当 persisted-state record の `destroy!` path を確認してください。host app 側 callback、constraint、transaction、reset endpoint 周辺の authorization が原因になっていないかを先に見ます。TreeView は matching record に対して `destroy!` を呼び、failure handling は host app に残します
- record が存在しない `clear!` が empty state を返す場合、それは no-op 境界です。その owner / key はすでに clear 済みと扱ってください。UI に古い展開状態が残るなら、`clear!` の挙動ではなく描画時の `expanded_keys`、browser event listener、host app response を確認します
- StateStore の詳しい責務境界は [Persisted State](persisted-state.md#statestore-による-server-side-storage) の save / clear 例を確認してください
- browser wiring の詳しい責務境界は [Persisted State](persisted-state.md#browser-event-wiring) の practical notes を確認してください

次に読む文書:

- [Persisted State](persisted-state.md)
- [JavaScript event contract](js-events.md)
- [Tree diagnostics](tree-diagnostics.md)
- [Node keys](node-keys.md)

## duplicate node key / orphan / DOM ID collision / cycle が出る

これはまず data shape または identifier の問題として見ます。

次を確認してください。

- tree 構築時に `validate_node_keys: true` を有効にする
- filter や permission scope が絡む dataset では `orphan_strategy:` を意図的に選ぶ
- development / test / pre-release check では `render_state.validate_unique_dom_ids!` を呼ぶ
- parent relationship に不正 loop が入りうる場合は `TreeView::CycleDiagnostics.new(tree).report` を使う

次に読む文書:

- [Tree diagnostics](tree-diagnostics.md)
- [Error hierarchy](errors.md)
- [Node keys](node-keys.md)

## 問題の本体が host app 側にあるとき

次の論点が絡む場合は、先に host app のコードを開いて確認してください。

- query や filtering policy
- authorization
- controller action や route
- Turbo Stream response shape
- selection や drag/drop の後に行う business action
- table design、caption、page layout

TreeView docs が責務境界を細かく書いているのは、gem を再利用可能なまま保つためです。

次に読む文書:

- [Rendering Boundaries](rendering-boundaries.md)
- [FAQ](faq.md)
- [設計思想と責務範囲](design-policy.md)
