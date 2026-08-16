# 導入手順

このページは、Rails host app に `tree_view` を導入するための手順です。

## 必要環境

- Ruby 3.2 以上
- Rails 7.0 以上

この条件は `tree_view.gemspec` の `required_ruby_version` と `railties` dependency に合わせます。

## CIで確認している範囲

GitHub Actions では、Pull Requestで以下を実行します。

- Ruby lint: `bundle exec standardrb`
- Ruby specs: `bundle exec rspec`
- representative Rails compatibility checks: `gemfiles/rails_7_0.gemfile`、`gemfiles/rails_7_2.gemfile`、`gemfiles/rails_8_0.gemfile`。docs-only PR では check name を維持したまま重い Rails lane を skip します
- changed-files policy による JavaScript checks:
  - README、`docs/**`、`CHANGELOG.md` の変更では `npm ci` と `npm run test:docs-entrypoints` を実行します
  - `docs/mockups/**` と `test/browser/**` の変更では Playwright を install し、`npm run test:browser` を実行します
  - docs 以外を含む PR では `npm run test:js:core` を実行します
- README、`CHANGELOG.md`、`docs/**`、runtime files、manifest files、package metadata など package-sensitive path の変更では `gem_package` job を実行します

`main` へのpushでは、重めの互換性確認とrelease向けchecksを実行します。

- Ruby version matrix
- full Rails version matrix
- PR の docs-only shortcut 外で実行される JavaScript tests: `npm ci`、`npm run test:js:core`、必要な browser smoke
- gem package verification

repo には `package-lock.json` を commit しています。CI とローカルセットアップは `npm ci` を使い、検証中に dependency resolution を更新せず、lockfile から JavaScript dependencies を install します。

release tag は、`main` のfull CIが成功したcommitに付けます。

## Gemfile

host app の `Gemfile` に追加します。

公開済み release を使うときは、通常の RubyGems 経路を使います。

```ruby
gem "tree_view"
```

まだ release に入っていない `main` の変更が必要なときだけ、GitHub source を明示します。

```ruby
gem "tree_view", git: "https://github.com/barnet-co-jp/tree_view-rails.git"
```

その後、通常どおり bundle install します。

```bash
bundle install
```

## CSSの読み込み

TreeView は `app/assets/stylesheets/tree_view.css` を plain CSS として同梱します。Rails 8 + Propshaft では Sass 変換を前提にせず、layout から logical asset を直接読み込む方法を推奨します。

```erb
<%= stylesheet_link_tag "tree_view", "data-turbo-track": "reload" %>
```

Sass / cssbundling を使う host app 向けには、互換用の `tree_view.scss` も同じ内容で同梱します。その場合は host app 側の stylesheet から従来どおり import できます。

```scss
@import "tree_view";
```

同梱 stylesheet は、TreeView の再利用可能な構造と軽量な state cue をすぐ確認するための quick-start baseline です。selected、current、collapsed、loading、error、drop target など代表的な row state の見た目は含みますが、最終的な theme、density、brand color、product wording は host app 側の責務です。

host app 側の見た目に合わせる場合は、TreeView stylesheet の後に documented な row / toggle / table selector を上書きしてください。同梱 stylesheet の小さな documented CSS custom property surface は [State cue のスタイリング](styling-state-cues.md) で確認できます。

## JavaScript / importmap

必要に応じて importmap に TreeView 用のpinを追加します。

```ruby
pin "tree_view", to: "tree_view/index.js"
```

Stimulus application をすでに起動している importmap app では、host app の JavaScript entrypoint から bundled controllers を登録します。

```js
import { application } from "controllers/application"
import { registerTreeViewControllers } from "tree_view"

registerTreeViewControllers(application)
```

現在のTreeViewは、static表示だけであれば専用JavaScriptなしでも利用できます。JavaScript controllers は、state tracking、keyboard navigation、selection cascade、transfer events、remote loading stateなどのbrowser-side integration hookで使います。

## JavaScript / Vite + TypeScript

v1.0.1 では `app/javascript/tree_view/package.json` を gem に同梱し、package root から `index.js` と `index.d.ts` を同じ入口として解決できるようにします。Vite では gem の `app/javascript/tree_view` **directory** を alias にしてください。`index.js` の物理パスへ直接 alias すると package metadata と型宣言の解決を迂回するため推奨しません。

```ts
// vite.config.ts
import { execFileSync } from "node:child_process"
import path from "node:path"
import { defineConfig } from "vite"

const treeViewRoot = path.join(
  execFileSync("bundle", ["show", "tree_view"], { encoding: "utf8" }).trim(),
  "app/javascript/tree_view"
)

export default defineConfig({
  resolve: {
    alias: {
      tree_view: treeViewRoot
    }
  }
})
```

application code は importmap と同じ public import を使います。

```ts
import { registerTreeViewControllers } from "tree_view"
```

`package.json` の `types` / `exports` は同梱の `index.d.ts` を指します。Vite の build/transpile はこの package root を使えます。Vite と別に `tsc` を standalone type checker として実行する host app では、TypeScript 自身も同じ directory を解決できるよう `compilerOptions.paths` など host app 側の module-resolution 設定を合わせてください。TreeView API を手書きの `declare module "tree_view"` で再定義すると、gem が同梱する型 surface を隠すため避けてください。

JavaScript-powered な TreeView 機能を使う場合は、quick-start として `registerTreeViewControllers(application)` を使ってください。controller を部分登録したい場合や custom boot order が必要な場合は、public JavaScript surface の `TreeViewControllerIdentifiers` を使えます。詳しくは [Public API](public-api.md#javascript-surface) を参照してください。

## persisted-state setup generator

persisted expansion state を有効にする host app では、gem の導入後に persisted-state install generator を実行します。

```bash
bin/rails generate tree_view:state:install
```

既存の owner model に generated concern を include したい場合は、owner model 名を渡します。

```bash
bin/rails generate tree_view:state:install User
```

generator 名、任意の owner 引数、生成先 path は [Public Setup Surface](public-setup-surface.md) に documented setup surface としてまとめています。この path-level contract は `db/migrate/*_create_tree_view_states.rb`、`app/models/tree_view_state.rb`、`app/models/concerns/tree_view_state_owner.rb` を追跡しますが、migration schema や生成 template 内容そのものを固定するものではありません。生成後のファイルは host app 側で確認し、storage ownership、認可、保存タイミング、cleanup policy、controller action、UI wiring の責務境界は [Persisted State](persisted-state.md) で確認してください。

## Packaged files

TreeView gem package には、Rails host app で必要になる以下を含めます。

- `app/assets/stylesheets/tree_view.css`
- `app/assets/stylesheets/tree_view.scss`
- `app/helpers/tree_view_helper.rb`
- `app/helpers/tree_view_helper/**/*`
- `app/javascript/tree_view/index.js`
- `app/javascript/tree_view/index.d.ts`
- `app/javascript/tree_view/package.json`
- `app/javascript/tree_view/**/*`
- `app/views/tree_view/**/*`
- `config/importmap.tree_view.rb`
- `config/locales/**/*`
- `config/public_api_manifest.yml`
- `lib/**/*`
- `README.md`
- `CHANGELOG.md`
- `docs/**/*`

`config/public_api_manifest.yml` は、documented public surface の machine-readable audit artifact として package に含めます。Rails host app が TreeView を表示するために runtime で読み込む必要はありません。

導入手順を変更した場合は、`tree_view.gemspec` の packaged file list と package verification とこの一覧が食い違わないようにします。

## Propshaft

Rails 8 + Propshaft では、同梱の plain CSS asset を logical asset として直接読み込む構成を推奨します。

```erb
<%= stylesheet_link_tag "tree_view", "data-turbo-track": "reload" %>
```

Propshaft 自体に Sass compile を期待しないでください。host app が Sass / cssbundling を明示的に使っている場合だけ、互換用 `tree_view.scss` をその pipeline から import します。

JavaScript を importmap で使う場合は従来どおり次を使えます。

```ruby
pin "tree_view", to: "tree_view/index.js"
```

Vite を使う場合は前節の package-root alias を使います。

## Sprockets

Engine側にはSprockets互換のasset hookを残しています。

- `app/javascript` を asset paths に追加
- `tree_view.css` / `tree_view/index.js` を precompile 対象に追加

Sass pipeline を利用する既存 host app 向けに `tree_view.scss` も残します。

## Asset / importmap audit checklist

asset または JavaScript の配置を変更した場合は、release 前に以下を確認します。

- `tree_view.gemspec` が plain CSS、SCSS compatibility source、JavaScript、type declarations、package metadata、importmapファイルを含んでいる
- README の導入例がこのファイルと矛盾しない
- `docs/ja/release.md` の package checklist が更新されている
- static表示がJavaScriptなしでも利用できる、という前提を壊していない
- JavaScriptが必要な機能は、必要なimportmap pinまたはVite aliasとdata属性をdocsに書いている

## 開発環境

ローカルRubyで実行する場合:

```bash
bundle install
bundle exec standardrb
bundle exec rspec
bundle exec rake build
npm ci
npm run test:js
```

ローカル手順も CI と同じく `npm ci` を使います。commit 済みの `package-lock.json` を repeatable install の source として使うためです。

Rails互換性確認用のGemfileは `gemfiles/` 配下にあります。

```bash
BUNDLE_GEMFILE=gemfiles/rails_7_0.gemfile bundle install
BUNDLE_GEMFILE=gemfiles/rails_7_0.gemfile bundle exec rake
```

Dockerで実行する場合:

```bash
cp .env.example .env
docker compose build
docker compose run --rm app bundle install
docker compose run --rm app bundle exec rspec
docker compose run --rm app bundle exec rake build
```

VS Code Dev Containersを使う場合は `.devcontainer/devcontainer.json` を利用できます。

## CI

GitHub Actions では、Pull Requestで以下を実行します。

- `bundle exec standardrb`
- `bundle exec rspec`
- representative Rails compatibility checks: `gemfiles/rails_7_0.gemfile`、`gemfiles/rails_7_2.gemfile`、`gemfiles/rails_8_0.gemfile`
- changed-files policy で選ばれる JavaScript checks
- package-sensitive path の変更では gem package verification

`main` へのpushでは、Ruby version matrix、full Rails version matrix、JavaScript tests、gem package verificationを実行します。
