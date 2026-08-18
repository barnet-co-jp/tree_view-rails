# Public API

このページでは、host Rails app が直接使ってよい公開API、内部API、互換性方針を整理します。

## Public API manifest

`config/public_api_manifest.yml` は、gem package に含める audit artifact であり、互換性 contract です。公開 helper method、grouped option key、JavaScript package-root export、controller identifier、event surface、一部の documented hook を machine-readable に記録し、spec、package check、entrypoint smoke check が docs-facing contract と current code のずれを検出できるようにします。

host app はこの manifest を runtime configuration API として扱わないでください。通常は documented Ruby class、helper、option、JavaScript export、feature guide を使います。manifest は release verification で file 欠落や contract drift を見つけるために package へ含める保守用 artifact であり、documented public surface の互換性を保つ限り schema は変わる可能性があります。

## 安定した公開入口

host app が直接使ってよい主な入口は以下です。

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

`TreeView::ResourceTableRenderState.call` は、別の table layer が列推論や table state を持っていて、TreeView には階層 render state の組み立てだけを任せたい場合の公開入口です。詳細は [Resource table bridge](resource-table-bridge.md) を参照してください。

`TreeView::FilteredTree` は filtered tree result 用の安定した公開入口です。mode set も `config/public_api_manifest.yml` の `filtered_tree_modes` contract として追跡されています。documented mode table と、search query、ranking、authorization、highlighting を host app 側に置く責務境界は [Filtered Trees: mode](filtered-trees.md#mode) を参照してください。

`TreeView::GraphAdapter` は、単一の parent-id column では表せない heterogeneous / graph-like nodes のための adapter-mode 入口です。host app 側の traversal、authorization、query planning、node-key 境界は [GraphAdapter](graph-adapter.md) と [API概要: adapter mode](api-overview.md#adapter-mode) を参照してください。

`TreeView::Diagnostics` は、node key、DOM ID、orphan、cycle をまとめて確認する pre-render validation 入口です。`TreeView::Diagnostics.run` の流れ、`Result` surface、host-app data correction boundary は [Tree diagnostics](tree-diagnostics.md) を参照してください。

## Public error surface

host app は `TreeView::Error` を rescue することで、documented された TreeView の validation / configuration failure を、他の application error と分けて扱えます。

`TreeView::Error` は既存 integration との互換性のため `ArgumentError` を継承します。新しい integration では、TreeView 固有の失敗を扱うとき `TreeView::Error` または documented subclass を優先してください。

documented public subclass は [Error hierarchy](errors.md) に整理しています。

## Public helper surface

サポート対象の helper surface は、`TreeViewHelper` と関連 helper module から公開される documented helper method names です。machine-readable な helper-method contract は `config/public_api_manifest.yml` で管理します。

host app は `TreeViewHelper::Rendering` や `TreeViewHelper::Selection` などの内部 module を直接 include せず、`TreeViewHelper` と documented helper method に依存してください。

この公開 helper surface に含まれる documented な non-toolbar helper には次があります。

- `tree_view_rows(render_state, window: nil)` は TreeView rows を描画し、opt-in の windowed rendering も扱います。
- `tree_view_window(render_state, offset:, limit:)` は visible rows 用の documented な window metadata を返します。
- `tree_view_state_data(render_state)` は、TreeView state と設定済みの client-side / selection / transfer / remote-state controller 用のルート `data-*` 配線を返します。
- `tree_node_dom_id(item_or_id, ui: @tree_ui)` は、解決された `UiConfig` を通して node DOM ID を組み立てます。
- `tree_children_container_dom_id(item, ui: @tree_ui)` は、lazy-loading で host app が持つ children container 用の安定した DOM ID を組み立てます。
- `tree_remote_state_placeholder_dom_id(item, ui: @tree_ui)` は、1 行ぶんの remote-state placeholder 用 DOM ID を組み立てます。
- `tree_remote_state_placeholder_attributes(item, state: nil, ui: @tree_ui)` は、host app の lazy-loading response で使う documented な placeholder `id` と、必要なら `data-tree-remote-state` を返します。
- `tree_selection_value(item, tree, builder = nil)` は、host app 側の selection wiring や assertion に使える documented checkbox payload contract を JSON 化します。
- `tree_view_breadcrumb(tree, item, ...)` は node の breadcrumb path を描画します。

lazy-loading の placeholder region を host app 側で持つ場合、上の 3 helper も [Lazy Loading](lazy-loading.md) で案内しているのと同じ stable helper surface に含まれます。placeholder ID や `data-tree-remote-state` attribute を手組みせず、これらの helper を使ってください。

lazy-loading helper には、その placeholder を所有する parent item を渡してください。`tree_node_dom_id(item_or_id, ...)` は item-like / id-like value を扱うより広い DOM ID helper のままです。一方、placeholder helper は row と Turbo Stream の例に合わせて、item-based lazy-loading region 用の公開 surface として document します。

`config/public_api_manifest.yml` に存在しない DOM / path helper は、bundled partial から呼ばれていても内部 composition helper のままです。たとえば `tree_button_dom_id`、`tree_show_button_dom_id`、`tree_selection_checkbox_dom_id`、toggle / lazy-loading path helper 群は TreeView 自身の partial / helper composition 用に予約されています。host app はそれらの内部 helper 名ではなく、上記の manifest-backed な node、children container、remote-state placeholder helper に依存してください。

app-owned toolbar builder では、internal constant を直接参照せず、`tree_view_toolbar_supported_actions`、`tree_view_toolbar_actions`、`tree_view_toolbar_action_metadata` を使ってください。
toolbar helper もこの公開 helper surface に含まれます。

- `tree_view_toolbar(render_state, actions: ..., labels: ..., class_name: ..., button_class_name: ..., html: ..., action_html: ...)` は TreeView bundled toolbar の HTML を描画し、toolbar container と action element へ documented な追加 HTML attribute を渡せます。
- `tree_view_toolbar_supported_actions` は app-owned toolbar builder が使ってよい supported toolbar action symbol を返します。
- `tree_view_toolbar_actions(render_state, actions: ..., labels: {})` は host app が独自 toolbar markup を組み立てるための action hash 配列を返します。
- `tree_view_toolbar_action_metadata(render_state, action, label: nil)` は 1 つの supported action 用 metadata を返します。

`html:` は `class`、`data`、`aria` などの container attribute を追加しつつ、TreeView 必須の toolbar data hook を維持します。`action_html:` は action-aware Proc、action-keyed Hash、または flat Hash で各 action link / disabled button に attribute を追加しつつ、TreeView 必須の action / disabled data hook を維持します。markup、authorization copy、追加 control を変える必要がある場合は custom rendering helper を使ってください。

公開されている toolbar action symbol は `:expand_all`、`:collapse_all`、`:collapse_all_except_current_path` です。

これらはそれぞれ tree-wide toggle state `:expanded`、`:collapsed`、`:current_path` を要求します。現在の UI mode が `toggle_all_path_builder` を持たない場合、metadata は `path: nil` と `disabled: true` を返し、fallback UI の扱いは host app 側に残ります。

`TREE_VIEW_TOOLBAR_ACTIONS`、`TREE_VIEW_TOOLBAR_LABELS`、`TREE_VIEW_TOOLBAR_STATES` のような内部 constant は実装詳細です。host app はそれらを直接参照せず、documented helper method と戻り値の metadata shape に依存してください。

`config/public_api_manifest.yml` に documented helper として載っていない method は、bundled partial から内部的に呼ばれていても public compatibility contract には含みません。

内部 module 名は、documented helper behavior を維持する限り変更される可能性があります。

## Public option surface

公開 option surface は、以下の object で documented された keyword arguments / grouped options です。

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

公開 configuration option には以下を含めます。

- `initial_state`
- `render_log_level`

`TreeView.configure`、`TreeView.configuration`、`TreeView.reset_configuration!` は安定した configuration entry point です。configuration object の内部形状ではなく、documented option name と documented behavior に依存してください。manifest が追跡するのはこれらの option 名であり、accepted value set ではありません。`initial_state` は `:expanded` / `:collapsed` を受け取り、`render_log_level` は documented な Ruby logger level または TreeView render log 抑制を無効化する `nil` を受け取ります。これらの accepted value は、manifest に別の value schema を増やすのではなく compatibility spec と feature docs で守ります。`render_log_level` の値、既定値、無効化方法、host app logging との責務境界は [render log level](render-log-level.md) を参照してください。

公開 localized display-name helper には以下を含めます。

- `TreeView.model_name_for(item_or_class, count: 1, default: nil)`
- `TreeView.attribute_name_for(item_or_class, attribute, default: nil)`
- `TreeView.type_name_for(item, count: 1, default: nil)`

localized display-name helper は、利用できる場合に host app の Rails / ActiveModel / I18n locale data から表示名を解決し、その後 humanize した名前または明示的な `default:` 値へ fallback します。これらは表示名を返すだけで、UI のどこに表示するかは host app の row partial、helper、presenter が決めます。fallback behavior と row rendering 例は [Localized names](localized-names.md) を参照してください。

公開 Turbo UI option には以下を含めます。

- `UiConfig#turbo_frame`
- `UiConfigBuilder#build_turbo(turbo_frame:)`
- `UiConfigBuilder#build(..., turbo_frame:)`

詳細は [API仕様](api.md)、[Localized names](localized-names.md)、[Turbo Frame option](turbo-frame.md) を参照してください。

### RenderState grouped option keys

`TreeView::RenderState` の grouped options も public option surface の一部です。exact key set の machine-readable source of truth は `config/public_api_manifest.yml` にあり、`spec/public_api_compatibility_spec.rb` が current `TreeView::RenderState` constant と representative behavior に対してその manifest を照合します。

| Group | documented public keys | 補足 |
|---|---|---|
| `initial_expansion` | `default`, `max_depth`, `expanded_keys`, `collapsed_keys`, `current_item`, `current_key`, `auto_expand_ancestors` | 個別 keyword option と `initial_expansion:` を併用した場合でも、優先されるのは個別 keyword option です。 |
| `render_scope` | `max_depth`, `max_leaf_distance` | `TreeView::RenderState` の documented render-depth / leaf-distance control に対応します。 |
| `toggle_scope` | `max_depth_from_root`, `max_leaf_distance` | tree-wide toggle の documented depth / leaf-distance control に対応します。 |
| `toggle_icons` | `by_state`, `by_depth`, `by_type` | documented な宣言的 toggle icon map に対応します。`toggle_icon_builder` は callable escape hatch のままで、manifest-backed grouped option には含めません。 |
| `selection` | `enabled`, `visibility`, `payload_builder`, `checkbox_name`, `disabled_builder`, `disabled_reason_builder`, `selected_keys`, `cascade`, `indeterminate`, `max_count` | `TreeView::RenderState::SelectionConfig` と同じ grouped key を machine-readable に追跡し、documented な flat selection keyword との対応も崩れないようにします。 |
| `lazy_loading` | `enabled`, `loaded_keys`, `scope` | documented lazy-loading row-state hook と optional な host-app scope passthrough に対応します。 |
| `row_status` | `row_disabled_builder`, `row_readonly_builder`, `row_disabled_reason_builder` | documented row disabled / readonly state hook と disabled reason surface に対応します。 |

### RenderState flat callback builder keys

`TreeView::RenderState` は、host app の描画拡張用に flat callback builder keyword も公開しています。この key list は `config/public_api_manifest.yml` の `render_state_callback_builder_keys` に置かれ、focused compatibility spec が各 key を initializer keyword かつ public reader として確認します。

対象 key は `row_class_builder`、`row_data_builder`、`row_event_payload_builder`、`loading_builder`、`error_builder`、`depth_label_builder`、`badge_builder`、`icon_builder`、`toggle_icon_builder` です。これは key surface の contract であり、grouped option hash、個別 scalar option、宣言的な `toggle_icons` map とは別の surface です。callback arity、return value validation、row rendering、`NodePresenter` fallback、toggle icon lookup priority は変更しません。

`loading_builder` と `error_builder` は、host app が documented な loading / error row を描画するための row-level callback surface です。request lifecycle、retry UI、authorization-safe error copy、response handling は host app が所有します。request-state boundary と関連する interaction-state reference は [Lazy Loading](lazy-loading.md) を参照してください。

`row_data_builder` もこの key-surface contract に留まります。host app の data hash shape、merge 後の row data attribute、TreeView-owned row status key との境界は [Row status](row-status.md) の docs/spec-level guidance で扱い、manifest-backed return-shape schema には昇格しません。

## Host app extension points

host app が提供する主な拡張点は以下です。

- records or adapter data
- `PathTreeBuilder` で生成 folder tree を作るための path resolver
- localized model / attribute / node type display name 用の I18n translations
- `row_partial`
- Turbo mode path builders
- `turbo_frame:` による任意の Turbo Frame target
- row class / data builders
- row event payload builders
- selection payload / disabled builders
- hidden message / breadcrumb / depth label / row status builders
- lazy loading path builders and remote-state handling
- persisted state storage model

## JavaScript surface

公開 JavaScript entrypoint は `tree_view/index.js` です。bundled された `app/javascript/tree_view/index.d.ts` declaration は TypeScript 対応 tooling 用に package-root export 名を写すものですが、runtime behavior を変えたり、別の public surface を追加したりするものではありません。正本は `tree_view/index.js`、`config/public_api_manifest.yml`、entrypoint smoke check です。declaration は npm-style tooling 向けの compile-time aid であり、importmap-only の host app はこれに追加の runtime setup をする必要はありません。

`TreeViewEventNames`、`TreeViewEventDetailKeys`、data hook objects などの package-root literal export は、host app の JavaScript、browser test、shared helper 向けの immutable reference constants です。runtime の `Object.freeze` check、TypeScript の `Readonly` / `readonly` declaration shape、reader-facing docs guidance の責務境界は [JavaScript package-root export の immutable contract](public-api-immutable-exports.md) を参照してください。

host app が使ってよい入口:

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

`registerTreeViewControllers(application)` は、上記 5 つの controller export を bundled entrypoint の documented identifier 順に登録します。

`TreeViewEventNames` は documented event names を machine-readable に参照するための package-root export です。host app 側で listener を配線するとき、`TreeViewEventNames.selection.change` や `TreeViewEventNames.transfer.drop` のように使うことで event name string の写経を避けられます。
`TreeViewEventDetailKeys` は documented `event.detail` key list を machine-readable に参照するための package-root export です。host app の test や listener が documented key name と照合したい場合に使えますが、payload shape 自体は変えません。各 field の意味は [JavaScript event contract](js-events.md) を正本にしてください。
`TreeViewStateChangeReasons` は documented state snapshot publish reason (`connect`、`refresh`、`expanded`、`collapsed`) を、host app の listener / test 向けimmutable package-root valueとして公開します。state controllerのdispatch behaviorは変更しません。
`TreeViewTransferDropPositions` は transfer event の粗い drop-position value として、`before`、`inside`、`after` を公開します。`TreeViewEventNames.transfer.*` は transfer event 名、`TreeViewEventDetailKeys.transfer.*` は documented な `event.detail` key、`TreeViewTransferDropPositions` は [Drag and Drop](drag-and-drop.md#drop処理) で説明している position value を表します。
`TreeViewTransferDataAttributes` は documented な transfer payload / disabled-row DOM attribute 名を公開します。host app の JavaScript、browser test、shared helper が transfer wiring attribute を raw string で写経したくない場合は、`data-tree-transfer-payload` に `TreeViewTransferDataAttributes.payload`、`data-tree-transfer-disabled` に `TreeViewTransferDataAttributes.disabled` を使ってください。これらの export は DOM wiring attribute 名だけを指します。payload shape、authorization、保存、最終的な drop behavior は引き続き [Drag and Drop](drag-and-drop.md#drop処理) を正本にしてください。
`TreeViewTransferDataMimeTypes` は documented な TreeView transfer MIME type value として、primary JSON payload 用の `application/json` と browser compatibility fallback 用の `text/plain` を公開します。host app の JavaScript や test が MIME string を写経せずに TreeView transfer data を読み取ったり assert したりしたい場合に使えます。drag/drop behavior、payload shape、最終的な業務処理は引き続き [Drag and Drop](drag-and-drop.md#drop処理) を正本にしてください。
`TreeViewRemoteStateValues` は lazy-loading row の documented remote-state value set として、`loading`、`loaded`、`error` を公開します。host app の JavaScript や test が `data-tree-remote-state` の値を string の写経なしに照合したい場合に使えます。controller が emit する remote-state event 名は引き続き `TreeViewEventNames.remoteState.*`、その `event.detail` key は `TreeViewEventDetailKeys.remoteState.*` で扱います。
`TreeViewRemoteStateDataHooks` は、documented された lazy-loading / remote-state data attribute names を machine-readable に参照するための package-root export です。custom lazy-loading markup、test、copied host-app partial が `data-tree-lazy`、`data-tree-children-url`、`data-tree-loaded`、`data-tree-remote-state` を写経せず参照したい場合に使えます。request dispatch、response handling、retry UI、authorization-safe copy は [Lazy Loading](lazy-loading.md) に沿って host app 側に残ります。
`TreeViewControllerIdentifiers` は、同じ documented identifier を machine-readable な object として公開します。controller を部分登録したい host app や custom boot order を組みたい host app は、identifier string を写経せずこの export を使ってください。
`TreeViewControllerEntries` は、documented identifier と controller export の対応を bundled registration order で公開します。custom registration、boot-order review、test で identifier / controller tuple を写経したくない場合に使ってください。標準の登録入口は引き続き `registerTreeViewControllers(application)` であり、この entries list は selective wiring 用の manifest-backed convenience であって、新しい registration policy ではありません。default / custom registration path の全体は [Controller registration](controller-registration.md) を参照してください。
`TreeViewIntegrationHooks` は、documented integration hook attribute name を machine-readable object として公開します。host app の JavaScript や test が TreeView-owned wiring を query / assert するとき、raw string の写経を避けるために使えます。代表 key は state row identity、remote-state children URL、transfer payload hook を扱います。詳細な挙動は feature docs と [JavaScript event contract](js-events.md) を正本にしてください。

`TreeViewRemoteStateDataHooks.childrenUrlAttribute` と `TreeViewIntegrationHooks.remoteState.childrenUrl` は、どちらも同じ `data-tree-children-url` attribute を指します。lazy-loading / remote-state data hook の inventory として読む場合は `TreeViewRemoteStateDataHooks` を優先し、複数機能をまたぐ TreeView-owned wiring を integration surface や test fixture で確認する場合は `TreeViewIntegrationHooks` を使ってください。

`TreeViewToolbarDataHooks` は、documented された toolbar container、action、disabled data hook attribute names を machine-readable に参照するための package-root export です。custom toolbar markup や test が TreeView-owned toolbar hook を写経せず参照したい場合に使えます。supported action と metadata は toolbar helper から取得し、action policy、label、authorization copy、最終 UI は [Toolbar](toolbar.md) で説明している host app 側の責務です。
`TreeViewSelectionDataHooks` は、documented された `tree-view-selection` host-element value attributes を machine-readable object として公開します。JavaScript が host-owned attribute を author / query するとき、`TreeViewSelectionDataHooks.hiddenInputNameValue` のように使うことで string の写経を避けられます。
`TreeViewSelectionCheckboxHooks` は、TreeView の selection cell partial が出力する rendered selection checkbox class と disabled-reason attribute を公開します。TreeView-rendered checkbox element を探す browser-level test や host-app JavaScript 向けであり、host-authored な `tree-view-selection` controller value には使いません。詳細は [Selection checkbox hooks](selection-checkbox-hooks.md) を参照してください。
`TreeViewEmptyStateHooks` は、documented された empty-state wrapper attribute と baseline row class を machine-readable object として公開します。host app の JavaScript、test、copied styling が shipped empty-state reference pattern を target するとき、`data-tree-view-empty-state`、`.tree-view-empty-row__content`、`.tree-view-empty-row__message` の写経を避けられます。最終的な empty-state copy、CTA、permission message、filter-reset behavior は host app 側の責務です。

`TreeViewEventNames` のうち、lazy-loading の request lifecycle 名は `hostLifecycle` にまとめています。

- `loading`
- `loaded`
- `error`
- `retry`

`TreeViewEventNames.hostLifecycle.*` は [Lazy Loading](lazy-loading.md) で説明している host app 側の request-state dispatch surface 専用です。TreeView controller 自身が emit する remote-state event は引き続き `TreeViewEventNames.remoteState.*` に置きます。

`TreeViewTransferDataAttributes` の documented key:

- `payload`
- `disabled`

`TreeViewTransferDataMimeTypes` の documented key:

- `applicationJson`
- `textPlain`

`TreeViewRemoteStateValues` の documented key:

- `loading`
- `loaded`
- `error`

`TreeViewRemoteStateDataHooks` の documented key:

- `lazyAttribute`
- `childrenUrlAttribute`
- `loadedAttribute`
- `remoteStateAttribute`

`TreeViewControllerIdentifiers` の documented key:

- `state`
- `client`
- `selection`
- `transfer`
- `remoteState`

`TreeViewControllerEntries` の documented mapping:

| Key | Stimulus identifier | Controller export |
|---|---|---|
| `state` | `tree-view-state` | `TreeViewStateController` |
| `client` | `tree-view-client` | `TreeViewClientController` |
| `selection` | `tree-view-selection` | `TreeViewSelectionController` |
| `transfer` | `tree-view-transfer` | `TreeViewTransferController` |
| `remoteState` | `tree-view-remote-state` | `TreeViewRemoteStateController` |

標準の full registration では引き続き `registerTreeViewControllers(application)` を使います。`TreeViewControllerEntries` は selective / custom registration の場合だけ使い、filter と boot order は host app 側で管理してください。

`TreeViewIntegrationHooks` の documented key:

- `state.viewKeyValue`
- `state.nodeKey`
- `remoteState.childrenUrl`
- `transfer.payload`

`TreeViewToolbarDataHooks` の documented key:

- `toolbarAttribute`
- `actionAttribute`
- `disabledAttribute`

`TreeViewSelectionDataHooks` の documented key:

- `hiddenInputNameValue`
- `maxCountValue`
- `cascadeValue`
- `indeterminateValue`

`TreeViewSelectionCheckboxHooks` の documented key:

- `checkboxClass`
- `disabledReasonAttribute`

`TreeViewEmptyStateHooks` の documented key:

- `wrapperAttribute`
- `contentClass`
- `messageClass`

`tree-view-selection` controller の documented host-element value attribute も、stable な host-app wiring surface の一部です。

- `data-tree-view-selection-hidden-input-name-value`
- `data-tree-view-selection-max-count-value`
- `data-tree-view-selection-cascade-value`
- `data-tree-view-selection-indeterminate-value`

これらの attribute は host element 上で controller を設定するときに使います。row ごとの payload 生成、disabled-state 判定、checkbox visibility は `selection:` render-state builder 側の責務です。generated hidden input marker attribute と source-id attribute は TreeView が生成・管理する内部寄りの属性であり、host app が authoring する public hook ではありません。詳しくは [Selection](selection.md) と [Host app extension points](host-app-extension-points.md#selection-builders) を参照してください。

package-root の JavaScript export、bundled controller identifier、controller entry list、transfer drop-position value、transfer data attribute value、transfer data MIME type value、remote-state value、remote-state data hook value、toolbar data hook value、integration hook value、selection data hook value、selection checkbox hook value、empty-state hook value の machine-readable な source of truth は `config/public_api_manifest.yml` に置きます。compatibility spec と entrypoint smoke check はその contract を参照して drift を検知します。

内部扱い:

- private controller methods
- `app/javascript/tree_view/` 以下の file layout
- documented host-app wiring surface に含まれない undocumented `data-*` attributes
- controller 内部の DOM traversal details

## CSS and DOM surface

host app が依存してよい browser-facing surface は、documented された CSS class、data attribute、JavaScript event に限定します。

設定済みの Turbo toggle link から出力される `data-turbo-frame` は documented host-app integration surface です。

代表的な documented hook は、それぞれの feature behavior を説明している場所で追跡します。

| hook area | 代表 hook | contract boundary |
|---|---|---|
| Toolbar | `data-tree-view-toolbar`, `data-tree-view-toolbar-action`, `data-tree-view-toolbar-disabled` | [Toolbar](toolbar.md) で説明している TreeView-owned hook です。supported action や metadata は internal constant ではなく helper method から取得してください。 |
| Selection | `data-tree-view-selection-hidden-input-name-value`, `data-tree-view-selection-max-count-value`, `data-tree-view-selection-cascade-value`, `data-tree-view-selection-indeterminate-value`, `.tree-selection-checkbox`, `data-tree-selection-disabled-reason` | host-element controller value は [Selection](selection.md) で説明している stable hook であり、`TreeViewSelectionDataHooks` からも参照できます。rendered checkbox class と disabled-reason attribute は [Selection checkbox hooks](selection-checkbox-hooks.md) で説明し、`TreeViewSelectionCheckboxHooks` から参照できます。row payload や disabled 判定は `selection:` render-state builder 側に残ります。generated hidden input marker attribute と source-id attribute は TreeView-managed internal です。 |
| Lazy loading | `data-tree-remote-state`, remote placeholder ID, lazy-loading lifecycle events | [Lazy Loading](lazy-loading.md) で説明している stable placeholder / event hook です。request dispatch と response handling は引き続き host app 側の責務です。placeholder ID と state attribute には `tree_children_container_dom_id`、`tree_remote_state_placeholder_dom_id`、`tree_remote_state_placeholder_attributes` を使い、internal path / toggle helper には依存しないでください。 |
| Empty state | `data-tree-view-empty-state`, `.tree-view-empty-row__content`, `.tree-view-empty-row__message` | [mockup inventory](../mockups/README.md) で説明している reusable baseline hook であり、`TreeViewEmptyStateHooks` からも参照できます。shipped empty-state reference pattern を示すもので、すべての internal row class や host app の最終 copy / CTA workflow を公開するものではありません。 |
| Interaction markers | focused mockup に出てくる marker row classes / `data-*` hooks | review / adoption 用の reference hook として [mockups](../mockups/README.md) で説明し、package-root export に昇格したものは `TreeViewIntegrationHooks` からも参照できます。compatibility check が必要な hook だけを `config/public_api_manifest.yml` の machine-readable contract へ昇格してください。 |
| Direction-aware styling | current-row cue、hierarchy connector、toggle spacing、RTL / vertical writing override reference | 責務境界と host-app stylesheet override guidance は [Direction-aware styling boundary](direction-aware-styling.md) を参照してください。これらの cue は、明示的に manifest-backed check へ昇格されるまでは machine-readable public styling hook ではありません。 |

この inventory は代表例であり、網羅一覧ではありません。`config/public_api_manifest.yml` は helper method、JavaScript package-root export、controller identifier、integration hook、selection data hook、selection checkbox hook、empty-state hook、RenderState grouped option key の machine-readable source of truth です。docs-only の hook inventory は feature guide と mockup への導線を示すもので、出力されるすべての class や `data-*` attribute を compatibility contract にするものではありません。

manifest に載っていない DOM helper 名は、生成される DOM ID や attribute が bundled markup に現れても内部扱いです。特に button、selection checkbox、toggle path、lazy-loading path helper 名は、manifest に昇格されこのページで document されるまでは host app の公開依存先ではありません。

undocumented な CSS helper class、data attribute、DOM 構造詳細、gem partial 内部 locals は内部実装です。

## Breaking change criteria

以下は breaking change として扱います。

- documented class / module / helper / method の削除・rename
- documented option の削除・rename
- rendered output や parsed params に影響する documented default 変更
- flat options と grouped options の documented priority 変更
- documented JavaScript event name / payload key 変更
- documented CSS/data hooks の削除
- `tree_view_rows(render_state)` の documented behavior 変更
- selection / row event payload shape 変更
- persisted state semantics 変更
- documented public error class の削除、または documented error を `TreeView::Error` hierarchy の外へ移すこと

以下は通常 breaking change ではありません。

- backward-compatible default を持つ optional keyword 追加
- documented class を維持した CSS class 追加
- data attribute 追加
- event detail key 追加
- 新しく documented した validation / configuration failure 向けの `TreeView::Error` subclass 追加
- internal helper module refactor
- `tree_view/index.js` exports を維持した controller file 移動
- README / docs 導線を維持した docs 構造変更

## Deprecation policy

breaking change が必要だが急がない場合:

1. 既存 API を動かし続ける。
2. replacement API を追加して document する。
3. `CHANGELOG.md` と関連 docs に deprecation note を書く。
4. 可能なら次 minor release まで compatibility path を維持する。

pre-`1.0` でも breaking change は意図的に扱い、migration note を残します。