# Dependabot Bundler 復旧手順

Dependabot の Bundler pull request が `Gemfile.lock` を変更し、通常の lint baseline を読む前に失敗した場合は、このメモを使います。

## lockfile metadata drift として見分ける

CI policy command には `script/test_gemfile_lock_dependency_drift.mjs` が含まれています。この smoke は direct `Gemfile` requirements と `Gemfile.lock` の `DEPENDENCIES` metadata を比較し、lockfile metadata が古い場合は次の message で失敗します。

```text
Gemfile.lock DEPENDENCIES must match direct Gemfile gem requirements; run bundle install after changing Gemfile dependency metadata
```

Bundler の frozen install でも、Ruby lint が repository source を読む前に同じ種類の failure が出ることがあります。これは lockfile metadata drift として扱い、#2150 で追っている Standard / RuboCop baseline drift とは分けてください。

## 復旧方法を選ぶ

- Dependabot branch が dependency update だけを含み、current base branch から Dependabot に lockfile metadata を作り直してほしい場合は `@dependabot recreate` を使います。
- Dependabot branch が人間や agent に編集されておらず、Dependabot が安全に更新できる場合だけ、通常の rebase を使います。
- maintainer が branch を意図的に引き受けている場合、または追加の review 済み変更を保つ必要がある場合は、手動で lockfile を更新します。`bundle install` を実行し、生成された `Gemfile.lock` を commit してから、frozen mode の `bundle install` に頼る前に CI policy smoke を再確認します。

## exact-head failure evidence を記録する

修復方法を選ぶ前に、Pull Request の head SHA と一致する GitHub Actions workflow run number を記録します。`ruby/setup-ruby@v1` step、Bundler lockfile drift guard、`npm run test:js:core` を別々の failure surface として確認してください。複数の Dependabot Pull Request が同じ pattern を示す場合は原因候補を一度まとめて triage し、各 dependency branch に同じ broad cleanup を重複して積まないでください。

これは failure-recovery lane です。green な Bundler security update では、代わりに [Development](development.md) の security-review lane を使い、lockfile-only diff、mergeability、exact-head run、upstream advisory / release notes、package-sensitive evidence を確認します。成功している security review を不要な lockfile refresh に広げないでください。

## review point

まず失敗した job と exact mismatch を確認します。Pull Request が `Gemfile.lock` metadata の古さだけで失敗しているなら、復旧は lockfile に閉じ、広い lint cleanup、dependency grouping 変更、CI workflow redesign は混ぜないでください。

復旧後は Pull Request の head SHA を再確認します。その後に `bundle exec standardrb` が `Style/RedundantStructKeywordInit` を報告する場合は、Bundler 復旧ではなく、#2150 の lint baseline issue として扱い続けます。
