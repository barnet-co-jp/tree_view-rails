# JavaScript CI cache boundary

このページでは、JavaScript CI lane が npm cache を使いながら、dependency resolution の source of truth を変えない境界を説明します。

## Source of truth

commit 済みの `package-lock.json` が dependency resolution の source of truth です。local setup、Docker setup smoke、Pull Request の JavaScript checks、main-push の JavaScript checks は `npm ci` を使い、commit 済み lockfile からそのまま install して検証します。

CI workflow の JavaScript job は `actions/setup-node@v7` と `cache: npm` を使います。この cache は install speed と CI reuse のための最適化として扱ってください。dependency、package manager policy、lockfile が変わった証拠として扱ってはいけません。

## Dependencies を変更する場合

`package.json` の dependency metadata や Node engine metadata を変更した場合は、`npm ci` path に戻る前に `npm install` で `package-lock.json` も更新してください。`npm run test:ci-policy` に含まれる npm lockfile drift guard は、CI が `npm ci` に頼る前に、commit 済み lockfile metadata が `package.json` と一致していることを確認します。

この cache boundary だけを根拠に dependency version、Node major、`actions/setup-node` policy、package manager policy を変更しないでください。実際の方針変更は、その dependency または CI 変更を担当する Pull Request に閉じます。

## 関連 checks

- `.github/workflows/ci.yml` は JavaScript job を Node 22、`actions/setup-node@v7`、`cache: npm`、`npm ci` に保ちます。
- `npm run test:node-version-sources` は `.nvmrc`、`package.json` の `engines.node`、workflow の `node-version` を同期確認します。
- `npm run test:ci-policy` は workflow action / version signal と lockfile drift signal を maintainer が見える状態に保ちます。
- [Release checklist](release.md) は release-facing な `npm ci` と package-lock boundary を記録します。
- [Development](development.md) は local setup path と triage commands を記録します。
