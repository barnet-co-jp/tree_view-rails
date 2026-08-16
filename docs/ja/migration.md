# Migration guide

このページでは、TreeView を upgrade するときに確認したい互換性方針をまとめます。

[Public API](public-api.md)、[JavaScript event contract](js-events.md)、[Release checklist](release.md) に分かれている方針を、移行判断の観点で読み直せるようにした補助ガイドです。

## Versioning policy

`tree_view` は semantic versioning を前提にします。

- patch version: 挙動を変えないbug fixやdocs修正
- minor version: 後方互換なAPI、option、hook、docs追加
- major version: 意図的なbreaking change

`1.0.0` 未満でも、breaking change は意図的に扱い、`CHANGELOG.md` と関連docsにmigration noteを書きます。

### v1.0.1に限定したintegration repairの扱い

`v1.0.1` は、optionalな `GraphAdapter#parent_resolver` と `PathTreeBuilder#folder_key_resolver` を追加しますが、例外的にpatch-levelのintegration repairとして扱います。これらは `v1.0.0` 直後のdownstream導入で判明した統合不足を補うためのもので、既存callのdefaultや既存挙動は変えず、parent path traversalやhost定義のstable folder keyが必要な利用側だけがopt-inします。

これは `v1.0.1` に限定したrelease判断であり、versioning policy全体を緩めるものではありません。このintegration repairと無関係な後方互換public API / option追加は、以後通常どおりminor versionで扱います。

## `0.1.x` で安定しているとみなすもの

`0.1.x` 系では、少なくとも次の documented integration point は、明示的な案内なしに壊さない前提で扱います。

- [Public API](public-api.md) に載っている documented Ruby class / module / helper / method
- documented keyword arguments、grouped options、documented option priority
- documented `tree_view/index.js` exports と documented Stimulus event name / payload key
- documented CSS class、data attribute、browser-facing integration hook
- documented selection payload shape と persisted-state semantics

実装上は小さく見える変更でも、ここに含まれる契約を変えるなら互換性影響ありとして扱います。

## Deprecation policy

breaking change が有用でも急がない場合は、まず deprecation path を優先します。

1. 既存APIを動かし続ける。
2. replacement APIを追加してdocumentする。
3. `CHANGELOG.md` と関連feature docsにdeprecation noteを書く。
4. 可能なら次minor releaseまでcompatibility pathを維持する。

deprecation では、何に置き換えるのか、挙動・payload・名前のどこが変わるのかを明示します。

## rename や entry point 移動の扱い

documented API をより良い名前に変える必要がある場合は、次の順序で扱います。

- 可能なら deprecation 期間中も旧名を動かす
- 関連するAPI / feature page に新しい名前を記載する
- example は新しいintegrationが先に新名を使う形へ更新する
- `CHANGELOG.md` と release note に rename を明記する
- 旧名を削除する前に focused migration note を残す

この考え方は helper name、option name、JavaScript export、grouped-option key にも同様に適用します。

## Ruby public API の互換性

Ruby API では、次の変更を migration が必要な変更として扱います。

- documented class / module / helper / method の削除・rename
- documented option の削除・rename
- rendered output や parsed params に影響する documented default の変更
- flat options と grouped options の documented priority 変更
- documented persisted-state semantics の変更
- documented public error class の削除、または `TreeView::Error` hierarchy の外への移動

一方で、後方互換な option 追加や API 追加は minor release に含めやすい変更ですが、利用者が追えるよう docs への反映は必要です。

## JavaScript event の互換性

公開されている TreeView event name と documented `event.detail` fields は public integration point です。

upgrade 時の見方:

- additive な `detail` field 追加は minor release で許容
- event の削除、rename、documented field rename、documented field meaning の変更は互換性影響あり
- private controller method、内部file layout、undocumented `data-*` attribute、DOM traversal details は内部実装扱い

現在の event surface は [JavaScript event contract](js-events.md) を参照してください。

## CSS / data attribute の互換性

host app が依存してよいのは、documented CSS class、documented data attribute、documented browser-facing hook です。

upgrade 時の見方:

- class や data attribute の追加は通常 backward-compatible
- documented hook の削除や documented meaning の変更は breaking change として扱う
- undocumented helper class、undocumented attribute、DOM structure detail、gem partial local は内部詳細として変更されうる

現在の境界は [Public API](public-api.md) を参照してください。

## release note と migration note

互換性影響のある変更や deprecation を含む release では、少なくとも次を行います。

- `CHANGELOG.md` に記載する
- `Changed` / `Deprecated` / `Removed` など適切な category を使う
- 何が変わったか、何が互換のままか、利用者が何を直すべきかを focused migration note として書く
- 案内が日英で共通な場合は、関連する API / feature / setup docs を両言語で更新する

docs-only release の場合は、導入判断や upgrade guidance を大きく変えない限り、短い `Documentation` note で十分です。

## maintainer 向けの確認順

互換性影響のある変更を release する前に、次を確認します。

- 変更対象が本当に documented public surface に含まれるか
- documented entry point を意図的に変える場合は compatibility spec を更新したか
- [Public API](public-api.md)、[Release checklist](release.md)、関連feature docs を同時に更新したか
- `CHANGELOG.md` に migration / deprecation note を追加したか
- user-facing guidance がある場合、日英docsがそろっているか

## 関連ドキュメント

- [Public API](public-api.md)
- [JavaScript event contract](js-events.md)
- [Release checklist](release.md)
- [Documentation maintenance checklist](../i18n-audit.md)
