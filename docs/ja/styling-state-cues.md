# State cue のスタイリング

TreeView は quick-start 用 stylesheet として `tree_view.scss` を同梱しています。この stylesheet は、再利用可能な row 構造と、selected / current / collapsed / loading / error / drop target などの軽量な見た目を提供します。

host app は TreeView を import した後に CSS custom properties を指定することで、同梱 cue color と基本的な tree density / hierarchy spacing を上書きできます。

```scss
@import "tree_view";

:root {
  --tree-view-selected-row-background: color-mix(in srgb, var(--brand-primary) 12%, transparent);
  --tree-view-current-row-accent-color: var(--brand-primary);
  --tree-view-drop-target-row-background: color-mix(in srgb, var(--brand-success) 14%, transparent);
  --tree-view-branch-slot-width: 0.75rem;
  --tree-view-control-min-width: 1.8rem;
  --tree-view-control-padding: 0.02rem 0.15rem;
}
```

## Documented tokens

host app の stylesheet から上書きできる token は次のとおりです。

| Token | 対象 |
|---|---|
| `--tree-view-selected-row-background` | selected row |
| `--tree-view-current-row-accent-color` | current row の左 accent |
| `--tree-view-collapsed-row-background` | collapsed row |
| `--tree-view-loading-row-background` | loading row |
| `--tree-view-loading-action-color` | loading row の toggle action text |
| `--tree-view-error-row-background` | error / drop-disabled row |
| `--tree-view-drop-target-row-background` | active drop target row |
| `--tree-view-focus-outline-color` | toggle focus-visible outline |
| `--tree-view-focus-background` | toggle focus-visible background |
| `--tree-view-focus-ring-contrast-color` | toggle focus-visible contrast ring |
| `--tree-view-toggle-hover-background` | toggle hover background |
| `--tree-view-branch-line-color` | 通常の hierarchy branch line |
| `--tree-view-current-branch-line-color` | current hierarchy branch line |
| `--tree-view-level-background` | depth label background |
| `--tree-view-level-color` | depth label text |
| `--tree-view-hidden-count-background` | hidden descendant count background |
| `--tree-view-hidden-count-color` | hidden descendant count text |
| `--tree-view-toggle-gap` | toggle 内の主 gap |
| `--tree-view-toggle-min-height` | toggle row の最小高さ |
| `--tree-view-branches-min-height` | hierarchy branch area の最小高さ |
| `--tree-view-branch-slot-width` | depth 1段分の branch slot 幅 |
| `--tree-view-branch-line-width` | branch line の太さ |
| `--tree-view-control-gap` | toggle control 内の gap |
| `--tree-view-control-min-width` | action / level control の最小幅 |
| `--tree-view-control-padding` | action / level control の padding |
| `--tree-view-hidden-count-min-width` | hidden-count badge の最小幅 |
| `--tree-view-hidden-count-padding` | hidden-count badge の padding |

各 token には、token 追加前と同じ fallback 値があります。そのため、host app が上書きしない場合は既存の quick-start appearance を維持します。

`config/public_api_manifest.yml` はこの一覧を `css_custom_property_tokens` として追跡します。manifest-backed contract が扱うのは packaged stylesheet とこのページで document された token 名（token names）であり、fallback 値を host app 向け configuration や theme API にするものではありません。fallback values の安定性は manifest contract の対象外です。

## Boundary

TreeView が持つのは、同梱 stylesheet 向けの小さな state-cue と hierarchy density の surface です。complete theme system、dark-mode policy、product copy、host app design tokens は TreeView の責務ではありません。

row の business column spacing、application-specific な visual language、画面全体の density policy は、引き続き host app 側の CSS で管理してください。
