# Release checklist

このページでは、`tree_view` gemをリリースする前に確認する手順と方針をまとめます。

## Versioning policy

`tree_view` は semantic versioning を前提にします。

- patch version: 挙動を変えないbug fixやdocs修正
- minor version: 後方互換なAPI、option、hook、docs追加
- major version: 意図的なbreaking change

`1.0.0` 未満でも、breaking change は意図的に扱い、`CHANGELOG.md` と関連docsにmigration noteを書きます。

## Release branch and tag policy

通常のリリースでは、長期運用する `release/*` branch は作らず、`main` のgreenなcommitに `vX.Y.Z` tag を付けます。

releaseの流れ:

1. `main` 向けにrelease preparation PRを作る。
2. target version がまだ設定されていない場合は `lib/tree_view/version.rb` を更新する。
3. `CHANGELOG.md` の `Unreleased` を日付付きversion sectionへ移す。
4. PRを `main` にmergeする。
5. main-push full CIがgreenであることを確認する。
6. greenな `main` commit に `vX.Y.Z` tag を付ける。
7. 必要に応じてGitHub Releaseを作成する。
8. 必要に応じてgem publishする。

GitHub Release notes を書く前に、[Release note candidate collector](release-note-candidates.md) で merged PR / closed Issue の候補リンクを集め、maintainer review の checklist として確認します。この collector は `CHANGELOG.md` を書き換えず、最終的な release notes、tag 作成、gem publish、GitHub Release 作成を自動判断しません。

`release/x.y` branch は、複数minor lineの並行保守、長期RC検証、security/compatibility patchなどが必要になった時だけ導入します。

## 初回リリースの目標

初回 `0.1.0` release は、すべての予定機能を含めることより、整合したdocumented baselineを優先します。

最低限のリリース条件:

- `TreeView::VERSION` が `0.1.0` になっている
- `CHANGELOG.md` に日付付き `0.1.0` section がある
- core tree construction and rendering helpers がspecでカバーされている
- 専用JavaScriptがなくてもstatic renderingが動作する
- Turbo path-builder integration が文書化されている
- 含まれる場合は、selection params parsing と checkbox rendering が文書化されている
- asset と importmap のセットアップが文書化されている
- public API と compatibility boundary が文書化されている
- package file list に Rails integration files と docs が含まれている
- main-push full CI が green である

## コードとテスト

commit 済みの `package-lock.json` は JavaScript dependency install の source of truth です。ローカルセットアップ、Pull Request CI、Docker setup smoke、main-push JavaScript checks は `npm ci` を使い、release evidence の検証中に dependency resolution を更新しません。

### JavaScript install path

JavaScript dependencies を変更するときは、release-facing な確認点をそろえてください。

- `package.json` と `package-lock.json` を一緒に更新し、関係ない dependency upgrade を同じ PR に混ぜない。
- `README.md`、`docs/en/installation.md`、`docs/ja/installation.md`、`docs/en/development.md`、`docs/ja/development.md` の setup 説明を `npm ci` とそろえる。
- Node 22 source guard とは責務を分ける。`.nvmrc`、`package.json` の `engines.node`、workflow の `node-version`、`script/test_node_version_sources.mjs` は Node major の整合を確認し、lockfile-backed install path は dependency resolution の整合を確認する。
- dependency 変更後は fresh な PR CI または main-push CI を観測し、更新した lockfile が CI の JavaScript lane で動くことを確認する。

この checklist だけを根拠に dependency version、Node major、package manager policy を変更しないでください。実際の切り替えは、その dependency または CI 変更を担当する PR に閉じます。

### Bundler lockfile drift guard

Ruby dependency metadata を変更する場合は、release verification の前に `Gemfile` と `Gemfile.lock` をそろえてください。`npm run test:ci-policy` には `script/test_gemfile_lock_dependency_drift.mjs` が含まれており、direct `Gemfile` gem requirements と `Gemfile.lock` の `DEPENDENCIES` metadata を比較し、commit 済み lockfile が古い場合は maintainer に `bundle install` を促します。

この guard は Bundler metadata の release / package verification confidence として使います。これだけを根拠に dependency version、Bundler policy、Dependabot grouping、CI workflow behavior を変更しないでください。

### Ruby CI dependency cache boundary

Pull Request と main-push の Rails matrix lane は、matrix-specific な `BUNDLE_GEMFILE` で各 dependency set を選び、`ruby/setup-ruby@v1` の `bundler-cache: true` で verification install を行います。この cache は反復 verification を高速化するだけで、dependency や lockfile の更新責務を持ちません。

contributor と dependency-update Pull Request は、対象 Gemfile で `bundle install` を実行し、同期した dependency metadata または lockfile を commit する責務を引き続き持ちます。CI は Bundler policy、dependency version、lockfile を変更せず、cached install path から commit 済み state を検証します。

### Ruby support source guard

Ruby support wording や source files を変更する場合は、`npm run test:ruby-version-sources` が見る source set と release checklist の説明をそろえてください。対象は `README.md`、`tree_view.gemspec`、CI workflow、Dockerfile の Ruby base image、Development docs、package script です。この guard は supported Ruby sources と代表 Ruby version matrix の整合を確認しますが、それ自体で supported Ruby policy を変更するものではありません。

release checklist では tag 前に Ruby support evidence が見えることを確認します。一方で、Ruby major/minor support の変更、Rails matrix の変更、workflow behavior、gemspec metadata 更新は、実際の support-policy change を担当する PR に閉じてください。

### CI policy suite

release preparation や CI-sensitive docs 変更で、CI policy guard の絞り込み証跡が必要な場合は [CI policy suite](ci-policy-suite.md) から確認してください。`node script/test_ci_policy_suite.mjs --list` で guard group を確認し、`node script/test_ci_policy_suite.mjs --only <group-or-index>` で 1つの guard に絞り込み、`node script/test_ci_policy_suite.mjs --self-test` で release evidence に頼る前の registration coverage を確認します。

ローカル確認:

```bash
bundle exec rake release:check
bundle exec standardrb
bundle exec rake
npm run test:js
```

`bundle exec rake release:check` は current `TreeView::VERSION` と日付付き `CHANGELOG.md` section の整合を確認し、gem build、release-facing files の packaging、built gem に対する `ruby script/check_gem_package_contents.rb tree_view-*.gem`、`bundle exec ruby -Ilib -e 'require "tree_view"'` による load check までまとめて実行します。日付付き `CHANGELOG.md` section には、少なくとも1つの許可 category heading（`Added`、`Changed`、`Fixed`、`Deprecated`、`Removed`、`Security`、`Documentation`、`Tests`）と、その category heading 配下の空ではない release note body が必要です。これにより、release preparation が reader-facing note のない version section だけで通らないようにしています。package contents guard は Rails helper / view partial / locale / docs / JavaScript / CSS / importmap / public API manifest / public runtime files / gem metadata URI の代表surfaceを確認します。manifest-listed public Ruby constants については、package verification が `config/public_api_manifest.yml` の `public_constants` と `PUBLIC_CONSTANT_RUNTIME_FILES` を照合し、built gem から runtime file が欠けている場合と、manifest 上の constant に guard mapping がない場合を分けて失敗させます。同じ guard は `tree_view:state:install` public setup generator files も確認し、generator 名、任意 owner 引数、生成先 path の証跡が public setup surface docs とそろっていることを守ります。metadata 部分では gem metadata URI set（`homepage_uri`、`source_code_uri`、`documentation_uri`、`changelog_uri`、`bug_tracker_uri`）と release metadata boundary（required Ruby version、allowed push host、runtime dependency metadata: `required_ruby_version`、`allowed_push_host`、runtime dependency `railties >= 7.0`）も確認し、docs entrypoint、source、changelog、issue tracker、Ruby support、RubyGems push scope、Rails runtime requirements の drift を release prose だけでなく package verification で検出します。packaged docs から repository-only の `Product Profile.md` や `AGENTS.md` へ encoded parent-directory link を追加しないでください。`PACKAGED_DOCS_FORBIDDEN_RELATIVE_ROOT_LINKS` は `Forbidden repository-only root doc links in packaged <path>` として、対象 packaged docs path と link を報告します。main-push の `gem_package` CI job でも、同じ package contents verification を CI で build した gem に対して再実行します。`vX.Y.Z` tag がまだ無い段階では tag alignment は skip し、tag 作成後はその release tag が current `HEAD` を指していることを確認します。

tag 作成後は、tag alignment を必須にして release check を再実行します。

```bash
TREE_VIEW_REQUIRE_RELEASE_TAG=1 bundle exec rake release:check
```

release preparation PR の段階では tag がまだ無いことが多いため、通常の command を使います。tag 後はこの flag 付き command を使い、`vX.Y.Z` が存在しない場合や current `HEAD` とは別の commit を指している場合に失敗させます。

Pull Request CI の確認項目:

- Ruby lint: `bundle exec standardrb`
- Ruby specs: `bundle exec rspec`
- representative Rails compatibility checks: `gemfiles/rails_7_0.gemfile`、`gemfiles/rails_7_2.gemfile`、`gemfiles/rails_8_0.gemfile`。これらの representative Rails lane は docs-only ではない PR で実行します。changed-files policy が PR を docs-only と判定した場合、各 lane は `Docs-only PR: skipping representative Rails compatibility lane.` を出し、checkout、Ruby setup、`bundle exec rake` を skip して docs-only 変更では runtime-heavy な Rails compatibility work を避けます。
- JavaScript checks: changed-files policy に従い、docs-entrypoint-sensitive な docs-only PR では `npm run test:docs-entrypoints`、CI-policy-sensitive な docs-only PR では `npm run test:ci-policy`、docs-only ではない PR では `npm run test:js:core`、mockup / browser-smoke sensitive な PR では Playwright Chromium setup と `npm run test:browser` を実行する
- package-sensitive path を触るPRでの Gem package verification

package-sensitive path には、`tree_view.gemspec`、`Rakefile`、root / packaged docs である `README.md`、`CHANGELOG.md`、`docs/**`、JavaScript install / Node source files である `package.json`、`package-lock.json`、`.nvmrc`、Bundler source files である `Gemfile` と `Gemfile.lock`、`script/check_gem_package_contents.rb`、`.github/workflows/ci.yml`、`.github/dependabot.yml`、`lib/**`、Rails integration files である `app/helpers/**`、`app/views/**`、`app/assets/**`、`app/javascript/**`、さらに `config/importmap.tree_view.rb`、`config/public_api_manifest.yml`、`config/locales/**` が含まれます。Dependabot 設定の変更は dependency automation routing が package verification confidence に影響するため package-sensitive ですが、この分類は Dependabot の schedule、grouping、dependency version を変更するものではありません。これらを触るPRでは `gem build tree_view.gemspec`、`ruby script/check_gem_package_contents.rb tree_view-*.gem`、`gem install tree_view-*.gem`、`ruby -e "require 'tree_view'"` を実行します。docs-only PR は docs path だけを触る場合 runtime-heavy lane を避けますが、README、CHANGELOG、packaged docs の変更は built gem に release-facing docs が含まれ、整合していることを確認するため package-sensitive として扱います。この `package_sensitive` 分類は `docs_entrypoint_sensitive` とは別責務です。`README.md`、`CHANGELOG.md`、`docs/**`、`config/public_api_manifest.yml` だけを触る docs-only 変更でも docs entrypoint smoke を実行し、reader-facing docs と machine-readable public API guidance のずれを runtime test matrix 変更なしで検出します。docs-entrypoint-sensitive でも CI-policy-sensitive でもなく、mockup / browser-smoke path も触らない docs-only PR は JavaScript checks を完全に skip できます。一方で mockup / browser-smoke sensitive な PR は、内容が docs-only でも browser smoke を実行します。

Signal guard 用に、package-sensitive path には、`tree_view.gemspec` という代表フレーズを維持します。

`main` push CI の確認項目:

- Ruby version matrix
- Rails version matrix
- `npm ci` と `npm run test:js` による JavaScript tests
- Rails helper / view partial / locale / docs / JavaScript / CSS / importmap / public API manifest / public runtime files / public setup generator files / gem metadata URI の代表ファイルとmetadataを含む Gem package verification

merge前にPR CIを通します。release判定には、full compatibility matrices、JavaScript coverage、unconditional package verificationを含む、より広い `main` CIを使います。

## downstream host app evidence

TreeView の release evidence はこの repository 側にあります。tag を打つ前は、public API manifest、package-root export、public API docs / feature docs、mockup README / review gallery、browser smoke target、package verification を upstream の確認対象として扱います。

docs-portal のような downstream Rails application は、sidebar tree、detail tree、persisted state、selection、window offset、route、permission、icon、business row action など、app 固有 flow の adoption smoke と rollback note を自分の docs に残してください。それらは host app 側の採用証跡であり、TreeView の source of truth や TreeView 単体 release の必須条件ではありません。

downstream smoke が失敗した場合は、まず upstream TreeView の contract / package の問題なのか、host app 側の wiring、query、route、authorization、copy、rollback policy の問題なのかを分類します。downstream の pinned SHA、app 固有の rollback note、未merge の downstream PR を、TreeView の release-facing source of truth として扱わないでください。

## ドキュメント

Public usageや公開optionを変えた場合は、関連docsとCHANGELOGを更新します。

documented な host-app wiring surface または machine-readable public contract surface、たとえば package-root JavaScript export、controller identifier、grouped option key、documented event name / detail key、documented `data-tree-view-*` integration hook、selection controller の host-element value attribute を変更する場合は、public API docs や関連feature page と一緒に `config/public_api_manifest.yml` も見直してください。

`config/public_api_manifest.yml` は、package-root export、controller identifier、grouped option key、documented event detail key の machine-readable source of truth です。一方で、そこに export していない documented wiring attribute や hook については、public API docs と feature docs を source of truth として扱います。

public setup surface を変更する場合は、[Public Setup Surface](public-setup-surface.md) と `config/public_api_manifest.yml` を一緒に確認します。persisted-state setup generator の generator 名、任意 owner 引数、生成先 path は public setup compatibility surface です。release verification では package contents guard がそれらの setup files を追跡していることを確認しますが、この checklist だけを根拠に generator implementation、generated template、migration schema は変更しません。

public API manifest を変更する場合は、tag を打つ前に release-facing な導線も確認してください。

- manifest の変更が `docs/en/public-api.md`、`docs/ja/public-api.md`、影響する feature page に反映されている
- `CHANGELOG.md` が、user-visible な compatibility surface を適切な release category で説明している
- breaking change、削除、deprecation には、manifest や spec の説明だけでなく migration note がある
- docs-only の manifest guidance 変更は Documentation entry として扱い、runtime behavior の変更を示唆しない

Pull Request CI は、この focused review のために `node script/ci_public_contract_release_trail.mjs` を実行します。`config/public_api_manifest.yml`、`app/javascript/tree_view/index.js`、`app/javascript/tree_view/index.d.ts` の変更には `CHANGELOG.md` が必要です。英日 Public API guidance だけの変更には changelog entry を要求しません。breaking、deprecation、removal、rename を示す文言がある場合は、changelog または同期した migration guide に具体的な移行 action も必要です。代表的な manifest-only、docs-only、changelog あり、migration note の fixture は `npm run test:public-contract-release-trail` で確認できます。

public behavior や public compatibility surface が変わるときに確認する docs:

- `README.md`
- `docs/ja/README.md`
- `docs/en/README.md`
- `docs/ja/api.md`
- `docs/en/api.md`
- `docs/ja/public-api.md`
- `docs/en/public-api.md`
- setup generator 名、任意引数、生成先 path を変える場合は `docs/ja/public-setup-surface.md`
- 変更した contract surface の source of truth になっている場合は `config/public_api_manifest.yml`
- feature-specific docs
- `docs/i18n-audit.md`（documentation maintenance checklist）
- `CHANGELOG.md`

## CHANGELOG方針

releaseごとに `CHANGELOG.md` へ日付付きentryを追加します。

使うcategory:

- Added
- Changed
- Fixed
- Deprecated
- Removed
- Security
- Documentation
- Tests

Security は vulnerability fix や security hardening note に使います。test、CI、docs smoke、package verification の変更は Tests に記録します。public API manifest の変更は、user-visible な影響に合わせて記録します。後方互換な public surface 追加や変更は Added / Changed、migration note が必要な互換性変更は Deprecated / Removed、runtime contract を変えない manifest や docs guidance の変更は Documentation に入れてください。

breaking changeやdeprecationにはmigration noteを書きます。

## gem package

release前に確認すること:

- `TreeView::VERSION` がrelease versionと一致することを確認する
- `gem build tree_view.gemspec` を実行する
- built gem に対して `ruby script/check_gem_package_contents.rb tree_view-*.gem` を実行する
- 生成gemをローカルinstallして `require "tree_view"` を確認する
- packaged filesに以下が含まれることを確認する
  - `lib/**/*`
  - Rails helpers, views, stylesheets, JavaScript, and importmap files
  - `tree_view:state:install` の public setup generator files
  - `app/helpers/tree_view_helper.rb`
  - `app/views/tree_view/_tree_row.html.erb`
  - `app/javascript/tree_view/index.js`
  - `app/javascript/tree_view/index.d.ts`（runtime entrypoint と一緒に配布する compile-time declaration）
  - `app/assets/stylesheets/tree_view.scss`
  - `config/importmap.tree_view.rb`
  - `config/public_api_manifest.yml`
  - `config/locales/tree_view.toolbar.en.yml`
  - `config/locales/tree_view.toolbar.ja.yml`
  - `lib/generators/tree_view/state/install_generator.rb`
  - `lib/generators/tree_view/state/templates/create_tree_view_states.rb`
  - `lib/generators/tree_view/state/templates/tree_view_state.rb`
  - `lib/generators/tree_view/state/templates/tree_view_state_owner.rb`
  - `README.md`
  - `CHANGELOG.md`
  - `docs/**/*`
  - `docs/en/release.md`
  - `docs/ja/release.md`
  - `LICENSE*`

`docs/**/*` は packaged docs としてgemに含まれるため、package-facing docs は repository-only maintainer docs から独立させます。`Product Profile.md` と `AGENTS.md` は repository-only のまま扱い、packaged docs から repository root 専用文書へ戻る encoded parent-directory link を追加しないでください。この境界が崩れると、package contents guard は `Forbidden repository-only root doc links in packaged <path>` として対象 path を報告します。

## Package verification signals

package contents guard は package-root JavaScript entrypoint と importmap の代表 signal も確認します。`config/public_api_manifest.yml` の `javascript_package_root.named_exports` を、packaged `app/javascript/tree_view/index.js` と `app/javascript/tree_view/index.d.ts` にそろえてください。manifest-listed export が欠けた場合、guard は `Missing manifest-listed JavaScript package-root named exports in packaged <path>` を報告します。これは release evidence の確認だけなので、この checklist だけを根拠に public JavaScript export を追加・rename しないでください。

RubyGems consumer-facing な descriptive metadata は、URI metadata や release metadata とは別に guard されています。`spec/gemspec_files_spec.rb` は packaged gemspec の license を `MIT`、summary を `Tree rendering primitives for Rails applications`、description を `Reusable tree traversal, render state, helpers, partials, and Rails integration points for tree-style UIs.` として守ります。これは registry-facing identity の descriptive metadata evidence です。URI metadata と release metadata は別の package-checker evidence のまま扱い、この checklist だけを根拠にそれらの値、dependency、release policy を変更しません。

package verifier は、built gem に `config/importmap.tree_view.rb` が含まれ、その source が importmap host app 向けの `pin "tree_view", to: "tree_view/index.js"` を維持することも確認します。これは importmap package evidence であり、runtime package-root export guard や controller registration / behavior guard とは別責務です。importmap setup behavior、public export、controller semantics の変更は、その surface を意図的に変更する PR に閉じます。

## Repository

- `main` がgreenであることを確認する
- released versionのtagを `main` に付ける
- 必要に応じてGitHub Releaseを作る
- release notesから主なclosed issues / merged PRsへリンクする
