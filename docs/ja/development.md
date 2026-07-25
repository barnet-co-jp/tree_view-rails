# Development

このページでは、TreeView gem の開発・保守に必要な基本作業を整理します。

## セットアップ

```bash
bundle install
npm ci
```

Dockerを使う場合:

```bash
cp .env.example .env
docker compose build
docker compose run --rm app bundle install
docker compose run --rm app npm ci
```

開発用 Docker image は Node 22 と npm を含めるため、Docker setup でもローカル開発と同じ JavaScript install path を実行できます。`.nvmrc`、`package.json` の `engines.node`、workflow の `node-version` を変更する場合は、Dockerfile の Node major も同じ方針にそろえてください。

ローカルの JavaScript 作業では Node 22 を使ってください。repository root の `.nvmrc` が CI の JavaScript lane とそろった、推奨 Node major version の source of truth です。`.nvmrc`、`package.json` の `engines.node`、workflow の `node-version` は、どれかを変更するときに同じ Node major を指すように同期してください。自動 drift guard は `script/test_node_version_sources.mjs` です。`npm run test:node-version-sources` として実行でき、`npm run test:entrypoints` にも含まれており、これらの Node version source が Node 22 を指し続けることを lockfile-backed install policy を変えずに確認します。

ローカルの JavaScript setup には `npm ci` を使ってください。commit 済みの `package-lock.json` が repeatable install の source of truth になり、Pull Request CI と Docker setup も同じ lockfile-backed install path を使います。`package.json` の dependency metadata や Node engine metadata を意図的に変更した場合は、`npm install` を実行して root `package-lock.json` の metadata も一緒に更新してから `npm ci` path に戻ってください。現在の CI と install path の整理は [導入手順](installation.md) を参照してください。

## よく使うコマンド

```bash
bundle exec standardrb
bundle exec rspec
bundle exec rake build
gem build tree_view.gemspec
ruby script/check_gem_package_contents.rb tree_view-*.gem
npm run test:js
npm test
npm run test:vitest-ui
npm run test:entrypoints
npm run test:docs-entrypoints
npm run test:development-docs-commands
npm run test:entrypoints-composition
npm run test:ci-policy-license-prelude
npm run test:immutable-package-root-export-signals
npm run test:public-api-manifest-structure
npm run test:css-custom-property-manifest
npm run test:toggle-icons-docs
npm run test:release-docs
npm run test:release-package-contents
npm run test:docs-i18n
npm run test:ci-policy
npm run test:node-version-sources
npm run test:ruby-version-sources
npm run test:browser
```

CI の JavaScript lane と同じ entrypoint、unit、browser smoke coverage をまとめて確認したい場合は `npm run test:js` を使います。unit-style JavaScript tests をローカルの Vitest UI で見ながら調査・再実行したい場合は `npm run test:vitest-ui` を使います。これは maintainer 向けの便利コマンドであり、CI 向けの `npm test`、`npm run test:js:core`、`npm run test:js` の代替ではありません。docs-only failure を、docs entrypoints、repository-only maintainer entrypoints、README Quick Start signal、Public API docs signal、i18n parity の範囲で先に切り分けたい場合は `npm run test:docs-entrypoints` を使います。その後、より広い `npm run test:entrypoints` や browser smoke checks に進んでください。Development docs command signal だけを単独で確認したい場合は `npm run test:development-docs-commands` を使います。より広い `npm run test:docs-entrypoints` suite では、この command を `Development docs command signals` group として実行します。`test:entrypoints`、`test:js:core`、`test:js` の package script composition / ordering drift だけを確認したい場合は `npm run test:entrypoints-composition` を使います。個別 guard の内容はそれぞれの script が所有します。CI policy suite の self-test と checks の前に走る standalone の LICENSE package-sensitive prelude だけを確認したい場合は `npm run test:ci-policy-license-prelude` を使います。これは `script/test_ci_policy_suite.mjs` の checks array group ではありません。immutable package-root exports について、README / Public API / immutable export guide の reader-facing docs signal だけを確認したい場合は `npm run test:immutable-package-root-export-signals` を使います。Runtime export existence は引き続き `script/test_entrypoints.mjs` が確認し、literal declaration shape は `script/test_declaration_literal_shapes.mjs` が確認します。manifest structure failure だけを切り分けたい場合は `npm run test:public-api-manifest-structure` を使います。top-level keys、nested JavaScript package-root / event/detail shape、duplicate-key guardrails を、広い docs entrypoint suite なしで確認できます。duplicate YAML key guard は YAML loader が manifest section を silent overwrite する前に検出する source-of-truth drift safety guard であり、public API の採用判断ではありません。CSS custom property manifest や stylesheet signal の failure だけを narrow manifest-to-stylesheet smoke で切り分けたい場合は `npm run test:css-custom-property-manifest` を使います。toggle icon の public surface や docs signal の failure を focused docs smoke で切り分けたい場合は `npm run test:toggle-icons-docs` を使います。release docs signal または release package contents signal だけを確認したい場合は `npm run test:release-docs` または `npm run test:release-package-contents` を使います。これらは docs entrypoint group の narrow triage alias であり、full `npm run test:docs-entrypoints` suite の代替ではありません。英日 docs parity だけを full docs entrypoint suite なしで確認したい場合は `npm run test:docs-i18n` を使います。changed-file classification、workflow detection signal、CI lint job representative signal、workflow action major version signal、CI observation guidance signal、lockfile dependency metadata drift だけを確認したい場合は `npm run test:ci-policy` を使います。この command は CI policy suite の self-test と checks の前に、standalone の LICENSE package-sensitive prelude である `script/test_license_package_sensitive_signal.mjs` から始まります。この prelude は LICENSE package-sensitive routing の代表 signal であり、`script/test_ci_policy_suite.mjs` の checks array group ではなく package script composition として守ります。workflow detection signal は、representative lint job が Ruby 3.3 を使い、`bundle exec standardrb` を実行し続けることも確認するため、lint lane drift を静かな workflow edit ではなく意図的な CI policy change として review できます。workflow permissions guard は、workflow の default `GITHUB_TOKEN` が `contents: read` の read-only 権限に留まり、`contents: write` や `pull-requests: write` を要求しないことを確認するため、token permission drift を静かな権限拡大ではなく意図的な CI trust-boundary change として review できます。workflow action major guard は、代表 CI jobs が期待する `actions/checkout`、`actions/setup-node`、`ruby/setup-ruby` の major version を保っていることを確認し、action major drift を静かな workflow edit ではなく意図的な CI trust-boundary change として review できるようにします。CI observation guidance guard は、`AGENTS.md` と workflow の observation source を同期させ、combined status が空でも GitHub Actions workflow run を確認すること、changed-files routing を踏まえて job の status/conclusion を読むこと、intentionally skipped job を failed / missing checks と区別することを maintainer が追えるようにします。npm lockfile drift guard は、`package-lock.json` の root `engines`、`dependencies`、`devDependencies` metadata が `package.json` と一致することを確認します。そのため dependency や Node engine metadata を変更した場合は、PR CI が `npm ci` に頼る前に両方のファイルを同期してください。Bundler lockfile drift guard は、direct `Gemfile` gem requirements が `Gemfile.lock` の `DEPENDENCIES` metadata と一致することを確認します。そのため Gemfile の dependency metadata を変更した場合は、PR CI が commit 済み lockfile に頼る前に `bundle install` を実行してください。Dependabot Bundler branch が通常の lint を読む前にこの drift で失敗する場合は、`@dependabot recreate`、rebase、maintainer が引き受ける手動 lockfile 更新のどれを使うかを [Dependabot Bundler 復旧手順](dependabot-bundler-recovery.md) で確認してください。`.nvmrc`、`package.json` の `engines.node`、CI workflow の `node-version` が Node 22 でそろっていることだけを確認したい場合は `npm run test:node-version-sources` を使います。README、gemspec、CI workflow、Dockerfile の Ruby base image、Development docs、package script が supported Ruby sources と代表 Ruby version matrix に沿っていることだけを確認したい場合は `npm run test:ruby-version-sources` を使います。`gem_package` job の package contents verification だけを再現したい場合は、`gem build tree_view.gemspec` の後に `ruby script/check_gem_package_contents.rb tree_view-*.gem` を実行します。失敗箇所を切り分ける場合は個別の npm command を使ってください。

docs i18n parity exception は、まれで一時的なものに限定してください。`parityExceptions` entry は、一方の言語だけが意図的に先行し、peer page を review 中または段階的に追加する間の mismatch を見える化する場合だけ使います。exception key は `en:temporary-page.md` のように既に存在する source page を指します。`affectedLanguage` は不足している peer language、`reason` は mismatch を意図的に許している理由、`review` は見直し時期または削除条件を残す欄です。恒久的に片言語だけの docs を維持する逃げ道として exception を使わないでください。checker 自体が exception key、metadata、source page、affected language、空でない `reason` / `review` を検証するため、その validation rule を変えない限り docs guidance は prose-only に留めます。

Docs entrypoint suite を切り分ける場合は、`npm run test:docs-entrypoints -- --list` で番号付きの group と command を表示します。その後、`npm run test:docs-entrypoints -- --only <group-or-index>` に `--list` の 1-based 番号、完全一致の group 名、大文字小文字を問わない group 名、または一意に絞れる部分一致の名前から 1 group だけを実行できます。unknown、ambiguous、範囲外の値は非 0 終了し、available groups と `--list` の案内を表示します。

Docs smoke / signal script を追加または rename した場合は、`node script/test_docs_entrypoint_suite.mjs --self-test` を実行し、suite registration が欠けていないことを確認します。この self-test は `npm run test:docs-entrypoints` 内の `Docs entrypoint suite option contract` group としても登録されています。candidate docs entrypoint script が suite の `checks` array または明示的な exclusion に入っているかを確認する registration guard です。明示的な exclusion は silent skip ではありません。excluded script は別の npm script または suite 経由で登録されている必要があり、新しい docs smoke / signal script は `checks` array に追加するか、登録経路と理由を持つ明示的な exclusion として文書化してください。candidate pattern や CI workflow を再設計するための入口ではありません。

`npm run test:entrypoints` の中では、`script/test_entrypoints.mjs` が runtime の package-root exports、controller registration helper、manifest loader、`.d.ts` の export-name inventory を確認します。その後 `script/test_declaration_literal_shapes.mjs` が、event names、detail keys、remote-state values、transfer values、controller identifiers、selection data hooks、empty-state hooks などの manifest-backed JavaScript constants について、`app/javascript/tree_view/index.d.ts` の literal shape を確認します。package-root export が足りない、または余分な場合は export-name guard を見ます。export は存在するが key、tuple、代表 literal value が `config/public_api_manifest.yml` とずれた場合は literal-shape guard を見ます。これは smoke guard であり、TypeScript compiler や declaration generator ではありません。

Rails version matrixを確認する場合:

```bash
BUNDLE_GEMFILE=gemfiles/rails_7_0.gemfile bundle install
BUNDLE_GEMFILE=gemfiles/rails_7_0.gemfile bundle exec rake
BUNDLE_GEMFILE=gemfiles/rails_7_1.gemfile bundle install
BUNDLE_GEMFILE=gemfiles/rails_7_1.gemfile bundle exec rake
BUNDLE_GEMFILE=gemfiles/rails_7_2.gemfile bundle install
BUNDLE_GEMFILE=gemfiles/rails_7_2.gemfile bundle exec rake
BUNDLE_GEMFILE=gemfiles/rails_8_0.gemfile bundle install
BUNDLE_GEMFILE=gemfiles/rails_8_0.gemfile bundle exec rake
```

## Public API compatibility specs

Public API compatibility specsは、documented Ruby entry points、helper methods、helper option keys、grouped options、JavaScript package-root exportsが意図せず削除・renameされることを防ぐためのtestsです。JavaScript entrypoint smoke では、manifest-backed な controller registrations、public event names、documented `event.detail` key groups も確認します。これらのspecは、実装詳細を網羅するのではなく、APIの存在と代表的な互換挙動に絞ります。

docs entrypoint smoke と public API docs signal smoke は、`npm run test:docs-entrypoints` の中で別の責務を持ちます。`script/test_docs_entrypoints.mjs` は docs の入口、link、広い feature-guide signal を守り、`script/test_repository_only_maintainer_entrypoints.mjs` は `Product Profile.md`、`AGENTS.md`、`CHANGELOG.md`、`docs/i18n-audit.md` などの repository-only maintainer entry points が root docs map や言語別 README から消えないことを守ります。`script/test_public_api_docs_signals.mjs` は Public API docs と feature docs の代表 signal を守ります。public API manifest entry、package-root export、public helper surface、または docs signal を追加・rename する場合は、影響する英日 docs と一緒に public API docs signal smoke も見直して更新してください。

意図的なbreaking changeを受け入れる場合は、public API docsとcompatibility specsを同時に更新し、documented contractとtest coverageを同期させます。

`config/public_api_manifest.yml` は、compatibility checks が守る public surface の machine-readable source of truth です。現在は Ruby module methods、public constants、configuration options、LocalizedNames の I18n key groups、filtered-tree modes、VisibleRows row metadata、NodePresenter builder names、GraphAdapter initializer keywords、helper names、helper option keys、toolbar actions、toolbar action metadata、grouped option keys、setup generator output paths、PathTreeBuilder node shapes、RenderWindow metadata、ResourceTableRenderState call keywords、RenderState callback builder keys、diagnostics accepted checks / run options / Result surface、JavaScript package-root named exports、transfer drop positions、transfer data MIME types、remote-state values / data hooks、controller registrations、public event names、intentional no-detail event names、documented `event.detail` keys、integration hooks、toolbar data hooks、selection data / checkbox hooks、empty-state hooks を追跡しています。

manifest structure の top-level sections、nested public JavaScript groups、event/detail shape、duplicate YAML keys だけを確認したい場合は `npm run test:public-api-manifest-structure` を使います。duplicate YAML key guard は YAML loader が manifest section を silent overwrite する前に検出する source-of-truth drift safety guard であり、public API の採用判断ではありません。より広い `npm run test:docs-entrypoints` でも同じ manifest structure group を実行するため、この guard を変更するときは単体 command と suite 側の入口をそろえてください。

`event_names_without_detail` は、public な `event.detail` fields を持たない host lifecycle events の意図的な分類です。この一覧を根拠に host lifecycle payload shape を追加・固定しないでください。payload を持つ events は documented `event.detail` key groups 側で扱います。

NodePresenter builder names は manifest-backed な name surface です。`node_presenter_builder_names` を変更する場合は、manifest、focused compatibility spec、NodePresenter row partial patterns guide、そして同じ builder surface を public API overview で扱う場合は `docs/en/public-api.md` / `docs/ja/public-api.md` を同期します。manifest tracking summary では presenter return value、authorization、route policy、action semantics、host-app column formatting を定義しないでください。

RenderState callback builder keys は manifest-backed な key surface であり、callback behavior 全体の contract ではありません。`render_state_callback_builder_keys` を変更する場合は、manifest、focused compatibility spec、`docs/en/public-api.md` / `docs/ja/public-api.md` の flat callback builder section、同じ key を名前で案内している feature docs を同期します。manifest tracking summary では callback arity、return-value validation、row rendering semantics、fallback behavior を定義しないでください。

Public constants も package verification の対象です。`public_constants` を変更する場合は、`config/public_api_manifest.yml`、`spec/public_api_compatibility_spec.rb`、public API docs、`script/check_gem_package_contents.rb` をそろえてください。package verifier の `PUBLIC_CONSTANT_RUNTIME_FILES` mapping には、manifest-listed constant ごとに packaged gem 内で確認すべき runtime file を含めます。この mapping は constant の採用、rename、public API 方針を決める source of truth ではなく、manifest-backed public surface に追従する release package evidence です。

これらの entry を追加・rename・削除する場合は、docs sync の導線を小さく明示します。

- manifest と、その surface を守る compatibility spec、entrypoint smoke、package guard のいずれかを同期する
- documented public API に含まれる surface なら `docs/en/public-api.md` と `docs/ja/public-api.md` をそろえる
- 同じ surface を名前で案内している README、usage page、feature doc、configuration option doc、JavaScript event doc、mockup inventory、release doc を確認する
- adopter が気づく必要のある変更は `CHANGELOG.md` に user-facing effect として残す。runtime behavior を変えない docs-only guidance だけなら Documentation として扱う
- release notes、migration expectation、package verification、tag-time evidence に影響する場合は `docs/en/release.md` と `docs/ja/release.md` を見直す

## JavaScript browser smoke tests

Unit-style JavaScript testsはVitestとjsdomで実行します。

```bash
npm test
```

`app/javascript/tree_view/index.js` を直接読む entrypoint smoke check は次で実行します。

```bash
npm run test:entrypoints
```

このcheckで、documented controller exports と `registerTreeViewControllers` helper が importmap entrypoint とずれないようにします。Node 側の assertions を実行する前に Ruby で `config/public_api_manifest.yml` を読み、`javascript_package_root` section を JSON として出力します。manifest loader failure を調べる場合は、repository root から Ruby が使える状態で実行してください。

entrypoint command は `script/test_declaration_literal_shapes.mjs` も実行します。この2つ目の guard は `script/test_entrypoints.mjs` と一緒に保守してください。entrypoint smoke は runtime exports と `.d.ts` export names の存在を確認し、declaration literal guard は `index.d.ts` の exported literal object shapes が `config/public_api_manifest.yml` と一致することを確認します。

docs-only の entrypoint / signal checks は次で個別に確認できます。

```bash
npm run test:docs-entrypoints
```

この command は、docs entrypoint smoke、repository-only maintainer entrypoint smoke、docs entrypoint signal smoke、README Quick Start signal、Public API docs signal、i18n parity checks を実行し、より広い entrypoint / CI policy checks は含めません。`npm run test:docs-entrypoints -- --list` で番号付きの group を確認し、`npm run test:docs-entrypoints -- --only <group-or-index>` で 1-based 番号、完全一致の名前、大文字小文字を問わない名前、または一意に絞れる部分一致の名前から 1 group だけを実行できます。repository-only maintainer entrypoint smoke は、`Product Profile.md`、`AGENTS.md`、`CHANGELOG.md`、`docs/i18n-audit.md` など checkout 専用のファイルが `docs/README.md` と言語別 README から辿れることを守りますが、それらを gem 同梱の host-app API guide として扱うものではありません。docs-only change が失敗したときは、`npm run test:entrypoints` や `npm run test:browser` に進む前の切り分けに使ってください。

Browser-level smoke testsはPlaywrightで実行します。

```bash
npm run test:browser
```

Browser smoke suiteは、実ブラウザのevent loop、focus handling、drag/drop APIで差が出やすい代表的なinteraction flowを確認するために使います。Keyboard navigation、expand/collapse、checkbox cascade、lazy-loading state changes、transfer payloads、row form controlsとtree behaviorの共存を、小さく安定したtestsで守ります。

browser-level の accessibility smoke を追加するときは、tree や treegrid 前提の指摘を無言で suppress しないでください。TreeView の documented な table-first policy に基づいて意図的に許容する fixture がある場合は、近くの comment や suppression note から `docs/en/accessibility-semantics.md` または `docs/ja/accessibility-semantics.md` を参照し、row-level ARIA on table rows、`aria-controls` 非採用、host app 側 keyboard flow など、どの policy を根拠にしているかを短く明記します。

## CI方針

Pull Requestでは、日常的な変更を守る高速なRuby checksとJavaScript checksを実行します。

- Ruby lint: `bundle exec standardrb`
- Ruby specs: `bundle exec rspec`
- representative Rails compatibility checks: `gemfiles/rails_7_0.gemfile`、`gemfiles/rails_7_2.gemfile`、`gemfiles/rails_8_0.gemfile`
- JavaScript checks: changed-files policy に従い、docs-entrypoint-sensitive な docs-only PR では `npm run test:docs-entrypoints`、CI-policy-sensitive な docs-only PR では `npm run test:ci-policy`、docs-only ではない PR では `npm run test:js:core`、mockup / browser-smoke sensitive な PR では Playwright Chromium setup と `npm run test:browser` を実行します。docs-entrypoint-sensitive でも CI-policy-sensitive でもなく、mockup / browser-smoke path も触らない docs-only PR は JavaScript checks を skip できます。

Pull Request の Rails lanes では、lower / current / next-major の代表範囲に絞るため Rails 7.1 は意図的に含めていません。Rails 7.1 は `main` push の full Rails matrix で確認する最終互換ゲートです。

`changes` job は `script/ci_changed_files_policy.mjs` で Pull Request の changed files を分類します。主な output は `docs_only`、`mockups_changed`、`browser_smoke_changed`、`package_sensitive`、`docker_setup_sensitive`、`docs_entrypoint_sensitive`、`ci_policy_sensitive` です。CLI は `.github/workflows/ci.yml` が `jobs.changes.outputs.*` として公開するものと同じ output key を出力します。missing CLI output は `script/ci_changed_files_policy.mjs` が workflow output の発行を止めた状態を指し、stale workflow reference は workflow が CLI から出力されなくなった output をまだ参照している状態を指します。workflow や path 分類を変える場合は、代表 file set が意図した guard behavior を説明し続けるように `script/test_ci_changed_files_policy.mjs` も同期してください。

`README.md`、`docs/**`、`Product Profile.md`、`CHANGELOG.md`、`AGENTS.md` だけに触れる docs-only Pull Request では、`lint` と `pr_specs` はそのまま残しつつ、representative Rails job を short-circuit します。branch protection のため、check 名はそのまま維持します。JavaScript job はさらに細かい path 分類で決まります。`README.md`、mockup 以外の `docs/**`、`CHANGELOG.md`、`config/public_api_manifest.yml` は `docs_entrypoint_sensitive` として `npm run test:docs-entrypoints` を実行します。`AGENTS.md` は `ci_policy_sensitive` として、単独変更でも maintainer CI observation guidance を持つため `npm run test:ci-policy` を実行します。`Product Profile.md` だけの場合は、package-facing docs signal でも CI-policy docs signal でもない repository-maintainer docs なので JavaScript を skip します。`docs/mockups/**` の変更は browser smoke path を実行します。`test/browser/**` の変更は docs-only shortcut の候補ではなく、browser smoke suite 自体を変えるため、明示的な browser smoke coverage も実行します。`.github/workflows/**` も変更する Pull Request では docs-only shortcut を使わず、通常の PR lanes を確認します。

`package_sensitive` な変更、つまり `README.md`、`CHANGELOG.md`、`docs/**`、`Gemfile`、`Gemfile.lock`、`tree_view.gemspec`、package metadata、importmap、manifest、runtime files、helpers、views、assets、JavaScript、locale files などは gem package verification job を実行します。そのため Bundler dependency update も、packaged gem の build / verification 環境に影響し得る package-sensitive 変更として扱います。`Product Profile.md` と `AGENTS.md` は、他の package-facing path と一緒に変わらない限り package-sensitive set の外側に置きます。`docker_setup_sensitive` は Dockerfile、compose、Node version、package install-source の変更に限定し、Docker development setup job を実行します。

`main` が進んで branch が `diverged` になった後は、green checks だけでは merge ready と判断しません。`mergeable`、changed files、risk、behind の大きさを確認します。GitHub が `mergeable: false` を返す場合、behind が大きい場合、または workflow 定義、public API、spec、shared docs inventory に触れる Pull Request では、branch refresh 後に fresh CI を観測することを優先します。小さく少しだけ behind している docs-only 変更では、changed files が clean に適用でき、`mergeable` が true で、同じ check 名が green のままなら、過度に重い refresh を必須にしなくてかまいません。

### 既知 drift の recovery

狭い Pull Request でも、`main` または未 merge の base Pull Request 側に既知の public contract drift があると CI が赤くなることがあります。たとえば manifest structure spec が新しい top-level key に追従していない、TypeScript declaration が package-root exports に追従していない、などです。この場合は CI triage として扱い、Pull Request scope を自動で広げないでください。

手順:

- 失敗した jobs、file paths、error messages を確認し、同じ drift を所有する Issue / Pull Request があるか照合する
- Pull Request の changed files が本当にその failing surface に触れているか確認する。触れていない場合は、元の Issue scope に閉じる
- drift を所有する Pull Request がある場合は、そちらの merge 後に narrow Pull Request を refresh / rerun する。必要なら ready 済みの dedicated follow-up Pull Request として扱う
- drift fix を narrow Pull Request に含めるのは、その public surface が Issue scope に含まれる場合、または maintainer が明示的に bundle を承認した場合だけにする
- Pull Request comment には head SHA、failed run number、failing jobs、drift owner Issue / Pull Request、選んだ next action を残す

例: docs-only parity Pull Request が `spec/public_api_manifest_structure_spec.rb` の manifest key 不足と `app/javascript/tree_view/index.d.ts` の package-root exports 不足で失敗している場合、その public API drift が明示的に scope に含まれていない限り、parity Pull Request は docs-only のままにしてください。

`main` へのpushでは、より広い互換性確認とrelease向けのchecksも実行します。

- Ruby version matrix
- Full Rails version matrix（Rails 7.1 を含む）
- gem package verification

## 変更時の確認ポイント

### Ruby APIを変更した場合

- specを追加または更新する
- Ruby file や Ruby spec を変更した後は `bundle exec standardrb` を確認する。connector や GitHub API 経由の編集では、ローカル editor の final newline handling を通らないことがあるため特に確認する。
- final newline missing や trailing whitespace のような機械的な整形漏れが出た場合は、PR を開く前に formatter または最小の file rewrite で直す。
- `docs/ja/api-overview.md` / `docs/en/api-overview.md` を確認する
- documented entry points、helpers、optionsを意図的に変更する場合はpublic API compatibility specsを更新する
- `config/public_api_manifest.yml` を更新した場合は、`docs/en/public-api.md` / `docs/ja/public-api.md` をそろえたうえで、関連する README、usage docs、feature docs、JavaScript event docs、`CHANGELOG.md`、`docs/en/release.md` / `docs/ja/release.md` も見直す
- 必要に応じて `docs/en/api.md` / `docs/ja/api.md` を更新する
- CHANGELOGを更新する

### JavaScriptを変更した場合

- `npm test` を確認する
- documented controller exports や entrypoint wiring を変える場合は `npm run test:entrypoints` を確認する
- Browser interaction、focus、drag/drop、実際のform controlsに影響する場合は `npm run test:browser` coverage が走る前提で確認する
- importmap / packaged files に影響がないか確認する
- JavaScript entrypointの互換性を確認し、documented exportsを意図的に変更する場合はcompatibility specsを更新する

### docsを変更した場合

Docs PR を開く前に、`docs/i18n-audit.md` を cross-language checklist として短く見返します。

- 変更が共有の user-facing guidance に影響するかを確認し、日本語・英語を対応させる必要があるか判断する
- `CHANGELOG.md`、release docs、README / docs index link、root-level docs policy の更新が必要か判断する
- public API、compatibility、installation、release、migration docs に触れる場合は、PR scope を狭める前に `docs/i18n-audit.md` の update matrix を確認する
- `docs/mockups/` の focused mockup を追加・rename・削除する場合は、`docs/mockups/README.md` の Files table、`docs/mockups/review-gallery.html`、focused smoke target definitions が同じ inventory を説明しているか確認する。browser smoke は README Files table から expected files を導出し、focused target definitions と比較したうえで、review-gallery links を別に確認します。手で保守する別の target list として扱わないでください
- 片方の言語や関連 doc を意図的に後回しにする場合は、docs-only CI shortcut に黙って頼らず、PR 本文または follow-up issue で mismatch を見える状態にする

- 日本語・英語の対応関係を確認する
- `docs/i18n-audit.md` を更新する
- root互換docを残すか、言語別docへ誘導するかを判断する
- `README.md`、`docs/**`、`Product Profile.md`、`CHANGELOG.md`、`AGENTS.md` だけのPRでは、docs-only CI short-circuit が今回も妥当かを確認してから使う
- `.github/workflows/**` も含むPRは、docs-only shortcut の候補ではなく full CI change として扱う
- `test/browser/**` を変更する Pull Request では、browser smoke spec の保守だけが目的でも、通常の JavaScript setup と明示的な `npm run test:browser` coverage が走る前提で確認する
- Pull Request で `docs/mockups/` の focused mockup を追加・rename・削除する場合は、mockup inventory の導線もそろえる。`docs/mockups/README.md` の Files table を更新し、`docs/mockups/review-gallery.html` のcardを追加または調整し、recommended review flow が変わるなら root README と言語別 README の入口を見直し、browser smoke の対象にする mockup なら代表 selector と minimum count を持つ focused smoke target definition も追加または更新する。
- docs-only CI が JavaScript を skip するのは、`docs/mockups/**` が変わっていない場合だけです。focused mockup files が変わると、CI は README-derived focused smoke targets に対して `npm run test:browser` を実行します。ただし、この smoke は README Files table、review gallery、既存 mockup inventory、visual correctness がすべて同期していることまでは保証しません。既存の mockup files と docs index がすでに食い違っている場合は、gallery redesign や mockup HTML/CSS 変更を checklist-only PR に混ぜず、別の docs follow-up として扱う。

## release前の確認

この section は短い maintainer checklist として保ちます。`bundle exec rake release:check`、gem package verification、tag alignment、main-push full CI の詳細な release evidence は [Release checklist](release.md) を確認してください。

- `bundle exec standardrb`
- `bundle exec rspec`
- `npm test`
- `npm run test:entrypoints`
- `npm run test:browser`
- `bundle exec rake build`
- `bundle exec rake release:check`
- gem package contents（`gem build tree_view.gemspec` と `ruby script/check_gem_package_contents.rb tree_view-*.gem`）
- release CI evidence: PR CI、その後 merge 後の main-push full CI（gem package verification を含む）
- 変更ファイルが必要とする場合は docs-entrypoint / CI-policy / browser smoke evidence
- `config/public_api_manifest.yml` が public API docs で扱う Ruby、helper、option、JavaScript export、event surface に追従していることを確認する
- CHANGELOG
- docs index / i18n audit

## branch / PR方針

- 小さな機能変更は小さなPRにする
- docs-onlyで単純な分割や棚卸しは大きめのPRでもよい
- Pull Request を作成する前に、同じ Issue を close する open Pull Request が既にないか確認する。`Closes #NNN`、linked Issue、changed files の重なりを見ます。
- duplicate close-check で既存候補が見つかった場合は、新規 PR 作成を止め、既存 PR に review / follow-up / supersede の文脈を寄せるか、maintainer に採用方針の判断を依頼する。
- Dependabot の Pull Request branch を人間または agent が編集した後は、`@dependabot rebase` が使えなくなる可能性がある前提で扱う。その branch に refresh commit を重ね続けるのではなく、`@dependabot recreate` または replacement Pull Request を選ぶ。
- lint rewrite のような広い機械的 baseline cleanup が複数の dependency update に影響する場合は、dedicated baseline Pull Request に分ける。同じ cleanup を複数の Dependabot branch に重複投入して、それぞれを green にしようとしない。
- merge前にPR CIを通す
- docs-only PR では representative Rails / JavaScript job を short-circuit できるが、merge は同じ check 名が green のままで待つ
- workflow 定義を変えるPRは、merge前に fresh な head SHA で Checks を観測する
- PR が `main` から `diverged` している場合は、古い green CI だけに頼らず、refresh するかを決める前に mergeability、changed files、risk、behind count を確認する
- release判定前に `main` でfull compatibility / package verificationを確認する
