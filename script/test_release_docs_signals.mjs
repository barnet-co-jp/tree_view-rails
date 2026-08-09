import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8")
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertSignals(sourcePath, feature, signals) {
  const source = read(sourcePath)

  signals.forEach((signal) => {
    assert(
      source.includes(signal),
      `${feature}: ${sourcePath} is missing representative signal ${JSON.stringify(signal)}`
    )
  })
}

const categories = [
  "Added",
  "Changed",
  "Fixed",
  "Deprecated",
  "Removed",
  "Security",
  "Documentation",
  "Tests"
]

assertSignals("CHANGELOG.md", "CHANGELOG release category policy", [
  "## Unreleased",
  "Release preparation notes:",
  "public API manifest",
  "package-root export",
  "migration note"
])

categories.forEach((category) => {
  assertSignals("CHANGELOG.md", "CHANGELOG release category policy", [`${category}`])
})

const releaseDocs = [
  [
    "docs/en/release.md",
    [
      "CHANGELOG.md",
      "config/public_api_manifest.yml",
      "public API manifest change",
      "release-facing trail",
      "breaking changes, removals, or deprecations include migration notes",
      "Record public API manifest changes by their user-visible effect"
    ]
  ],
  [
    "docs/ja/release.md",
    [
      "CHANGELOG.md",
      "config/public_api_manifest.yml",
      "public API manifest",
      "release-facing",
      "breaking change、削除、deprecation",
      "migration note",
      "user-visible な影響"
    ]
  ]
]

releaseDocs.forEach(([sourcePath, signals]) => {
  assertSignals(sourcePath, "Release checklist changelog policy", signals)
})

const releaseCheckChangelogValidationSignals = [
  [
    "lib/tree_view/release_check.rb",
    [
      "CHANGELOG_CATEGORY_HEADINGS = %w[Added Changed Fixed Deprecated Removed Security Documentation Tests]",
      "ensure_changelog_release_section_has_category!",
      "ensure_changelog_release_section_has_body!",
      "must include at least one category heading",
      "must include release notes under a category heading"
    ]
  ],
  [
    "docs/en/release.md",
    [
      "dated `CHANGELOG.md` section",
      "allowed category heading",
      "non-empty release note body under a category heading",
      "reader-facing notes"
    ]
  ],
  [
    "docs/ja/release.md",
    [
      "日付付き `CHANGELOG.md` section",
      "許可 category heading",
      "空ではない release note body",
      "reader-facing note"
    ]
  ]
]

releaseCheckChangelogValidationSignals.forEach(([sourcePath, signals]) => {
  assertSignals(sourcePath, "ReleaseCheck CHANGELOG validation docs signal", signals)
})

const releaseDocsRubyEvidenceSignals = [
  [
    "docs/en/release.md",
    [
      "main-push full CI is green",
      "Ruby version matrix",
      "Rails version matrix",
      "full compatibility matrices",
      "required Ruby version",
      "Ruby support",
      "release evidence"
    ]
  ],
  [
    "docs/ja/release.md",
    [
      "main-push full CI が green",
      "Ruby version matrix",
      "Rails version matrix",
      "full compatibility matrices",
      "required Ruby version",
      "Ruby support",
      "release evidence"
    ]
  ]
]

releaseDocsRubyEvidenceSignals.forEach(([sourcePath, signals]) => {
  assertSignals(sourcePath, "Release docs Ruby and Rails evidence signal", signals)
})

const releaseTagAlignmentSignals = [
  [
    "lib/tree_view/release_check.rb",
    [
      "ENV[\"TREE_VIEW_REQUIRE_RELEASE_TAG\"] == \"1\"",
      "tag_name = \"v#{version}\"",
      "expected git tag #{tag_name} to exist",
      "expected #{head_sha}"
    ]
  ],
  [
    "docs/en/release.md",
    [
      "Tag alignment is skipped until `vX.Y.Z` exists",
      "TREE_VIEW_REQUIRE_RELEASE_TAG=1 bundle exec rake release:check",
      "Use the default command during release preparation PRs",
      "Use the flagged command after tagging",
      "missing or points at a different commit"
    ]
  ],
  [
    "docs/ja/release.md",
    [
      "tag alignment は skip",
      "TREE_VIEW_REQUIRE_RELEASE_TAG=1 bundle exec rake release:check",
      "release preparation PR の段階",
      "tag 後はこの flag 付き command",
      "別の commit を指している場合"
    ]
  ]
]

releaseTagAlignmentSignals.forEach(([sourcePath, signals]) => {
  assertSignals(sourcePath, "Release docs tag alignment signal", signals)
})

const changelogTestsEvidenceSignals = [
  [
    "CHANGELOG.md",
    [
      "## Unreleased",
      "Keep `Documentation` and `Tests` entries available as release evidence",
      "### Tests",
      "docs smoke",
      "package verification"
    ]
  ],
  [
    "docs/en/release.md",
    [
      "- Tests",
      "Record test, CI, docs smoke, and package verification changes under Tests."
    ]
  ],
  [
    "docs/ja/release.md",
    [
      "- Tests",
      "test、CI、docs smoke、package verification の変更は Tests に記録します。"
    ]
  ]
]

changelogTestsEvidenceSignals.forEach(([sourcePath, signals]) => {
  assertSignals(sourcePath, "Release docs and CHANGELOG Tests evidence signal", signals)
})

const mainPushFullCiSignals = [
  [
    ".github/workflows/ci.yml",
    [
      "ruby_matrix:",
      "rails_matrix:",
      "javascript:",
      "gem_package:"
    ]
  ],
  [
    "docs/en/release.md",
    [
      "main-push full CI is green",
      "Ruby version matrix",
      "Rails version matrix",
      "JavaScript tests through `npm ci` and `npm run test:js`",
      "Gem package verification",
      "Use the broader `main` CI for release decisions"
    ]
  ],
  [
    "docs/ja/release.md",
    [
      "main-push full CI が green",
      "Ruby version matrix",
      "Rails version matrix",
      "`npm ci` と `npm run test:js` による JavaScript tests",
      "Gem package verification",
      "release判定には"
    ]
  ]
]

mainPushFullCiSignals.forEach(([sourcePath, signals]) => {
  assertSignals(sourcePath, "Release docs main-push full CI matrix signal", signals)
})

const downstreamHostAppEvidenceSignals = [
  [
    "docs/en/release.md",
    [
      "Downstream host-app evidence",
      "TreeView release evidence lives in this repository",
      "host-app adoption evidence",
      "not as TreeView's source of truth or a TreeView-only release requirement",
      "upstream TreeView contract/package issue",
      "host-app wiring, query, route, authorization, copy, or rollback policy",
      "downstream pinned SHA",
      "unmerged downstream pull request"
    ]
  ],
  [
    "docs/ja/release.md",
    [
      "downstream host app evidence",
      "TreeView の release evidence はこの repository 側にあります",
      "host app 側の採用証跡",
      "TreeView の source of truth や TreeView 単体 release の必須条件ではありません",
      "upstream TreeView の contract / package の問題",
      "host app 側の wiring、query、route、authorization、copy、rollback policy",
      "downstream の pinned SHA",
      "未merge の downstream PR"
    ]
  ]
]

downstreamHostAppEvidenceSignals.forEach(([sourcePath, signals]) => {
  assertSignals(sourcePath, "Release docs downstream host-app evidence boundary signal", signals)
})

const releaseDocsPrJavaScriptConditionalLaneSignals = [
  [
    "docs/en/release.md",
    [
      "JavaScript checks through the changed-files policy",
      "docs-entrypoint-sensitive docs-only PRs run `npm run test:docs-entrypoints`",
      "CI-policy-sensitive docs-only PRs run `npm run test:ci-policy`",
      "non-docs PRs run `npm run test:js:core`",
      "mockup or browser-smoke-sensitive PRs install Playwright Chromium and run `npm run test:browser`",
      "Docs-only PRs that are not docs-entrypoint-sensitive and do not touch mockups, CI-policy-sensitive, or browser-smoke-sensitive paths can skip JavaScript checks entirely"
    ]
  ],
  [
    "docs/ja/release.md",
    [
      "JavaScript checks: changed-files policy",
      "docs-entrypoint-sensitive な docs-only PR では `npm run test:docs-entrypoints`",
      "CI-policy-sensitive な docs-only PR では `npm run test:ci-policy`",
      "docs-only ではない PR では `npm run test:js:core`",
      "mockup / browser-smoke sensitive な PR では Playwright Chromium setup と `npm run test:browser`",
      "docs-entrypoint-sensitive でも CI-policy-sensitive でもなく、mockup / browser-smoke path も触らない docs-only PR は JavaScript checks を完全に skip できます"
    ]
  ],
  [
    ".github/workflows/ci.yml",
    [
      "Docs-only PR without package-facing docs, CI-policy, mockup, or browser-smoke changes: skipping JavaScript checks.",
      "npm run test:docs-entrypoints",
      "npm run test:ci-policy",
      "npm run test:js:core",
      "npm run test:browser",
      "npx playwright install --with-deps chromium"
    ]
  ]
]

releaseDocsPrJavaScriptConditionalLaneSignals.forEach(([sourcePath, signals]) => {
  assertSignals(sourcePath, "Release docs PR JavaScript conditional lane signal", signals)
})

const releaseDocsBundlerCacheBoundarySignals = [
  [
    "docs/en/release.md",
    [
      "Ruby CI dependency cache boundary",
      "matrix-specific `BUNDLE_GEMFILE`",
      "`ruby/setup-ruby@v1`",
      "`bundler-cache: true`",
      "cache speeds repeated verification",
      "Contributors and dependency-update pull requests still own running `bundle install`",
      "committing synchronized dependency metadata or lockfiles"
    ]
  ],
  [
    "docs/ja/release.md",
    [
      "Ruby CI dependency cache boundary",
      "matrix-specific な `BUNDLE_GEMFILE`",
      "`ruby/setup-ruby@v1`",
      "`bundler-cache: true`",
      "cache は反復 verification を高速化するだけ",
      "dependency-update Pull Request",
      "`bundle install`",
      "同期した dependency metadata または lockfile"
    ]
  ],
  [
    ".github/workflows/ci.yml",
    [
      "pr_rails_matrix:",
      "rails_matrix:",
      "BUNDLE_GEMFILE: ${{ matrix.gemfile }}",
      "uses: ruby/setup-ruby@v1",
      "bundler-cache: true"
    ]
  ]
]

releaseDocsBundlerCacheBoundarySignals.forEach(([sourcePath, signals]) => {
  assertSignals(sourcePath, "Ruby CI Bundler cache and BUNDLE_GEMFILE boundary signal", signals)
})

const releaseDocsRepresentativeRailsSkipSignals = [
  [
    "docs/en/release.md",
    [
      "These representative Rails lanes run for non-docs PRs",
      "Docs-only PR: skipping representative Rails compatibility lane.",
      "skips checkout, Ruby setup, and `bundle exec rake`"
    ]
  ],
  [
    "docs/ja/release.md",
    [
      "representative Rails lane は docs-only ではない PR で実行します",
      "Docs-only PR: skipping representative Rails compatibility lane.",
      "checkout、Ruby setup、`bundle exec rake` を skip"
    ]
  ],
  [
    ".github/workflows/ci.yml",
    [
      "pr_rails_matrix:",
      "needs.changes.outputs.docs_only == 'true'",
      "Docs-only PR: skipping representative Rails compatibility lane.",
      "needs.changes.outputs.docs_only != 'true'",
      "run: bundle exec rake"
    ]
  ]
]

releaseDocsRepresentativeRailsSkipSignals.forEach(([sourcePath, signals]) => {
  assertSignals(sourcePath, "Release docs representative Rails docs-only skip signal", signals)
})

const releaseDocsBundlerLockfileDriftSignals = [
  [
    "docs/en/release.md",
    [
      "Bundler lockfile drift guard",
      "script/test_gemfile_lock_dependency_drift.mjs",
      "direct `Gemfile` gem requirements",
      "`Gemfile.lock` `DEPENDENCIES` metadata",
      "`bundle install`",
      "release/package verification confidence"
    ]
  ],
  [
    "docs/ja/release.md",
    [
      "Bundler lockfile drift guard",
      "script/test_gemfile_lock_dependency_drift.mjs",
      "direct `Gemfile` gem requirements",
      "`Gemfile.lock` の `DEPENDENCIES` metadata",
      "`bundle install`",
      "release / package verification confidence"
    ]
  ],
  [
    "script/test_gemfile_lock_dependency_drift.mjs",
    [
      "DEPENDENCIES must match direct ${gemfilePath} gem requirements",
      "run bundle install after changing Gemfile dependency metadata"
    ]
  ]
]

releaseDocsBundlerLockfileDriftSignals.forEach(([sourcePath, signals]) => {
  assertSignals(sourcePath, "Release docs Bundler lockfile drift signal", signals)
})

const gemPackageWorkflowSignals = [
  [
    ".github/workflows/ci.yml",
    [
      "gem_package:",
      "gem build tree_view.gemspec",
      "ruby script/check_gem_package_contents.rb tree_view-*.gem",
      "gem install tree_view-*.gem",
      "ruby -e \"require 'tree_view'\""
    ]
  ],
  [
    "docs/en/release.md",
    [
      "gem build tree_view.gemspec",
      "ruby script/check_gem_package_contents.rb tree_view-*.gem",
      "gem install tree_view-*.gem",
      "ruby -e \"require 'tree_view'\""
    ]
  ],
  [
    "docs/ja/release.md",
    [
      "gem build tree_view.gemspec",
      "ruby script/check_gem_package_contents.rb tree_view-*.gem",
      "gem install tree_view-*.gem",
      "ruby -e \"require 'tree_view'\""
    ]
  ]
]

gemPackageWorkflowSignals.forEach(([sourcePath, signals]) => {
  assertSignals(sourcePath, "Gem package install and require workflow signal", signals)
})

const packageContentsVerificationSignals = [
  [
    "script/check_gem_package_contents.rb",
    [
      "REQUIRED_PACKAGED_PATHS",
      "INSTALLATION_REQUIRED_SIGNALS",
      "app/helpers/tree_view_helper.rb",
      "app/views/tree_view/_tree_row.html.erb",
      "app/assets/stylesheets/tree_view.scss",
      "app/javascript/tree_view/index.js",
      "config/importmap.tree_view.rb",
      "config/locales/tree_view.toolbar.en.yml",
      "config/locales/tree_view.toolbar.ja.yml",
      "config/public_api_manifest.yml",
      "docs/en/release.md",
      "docs/ja/release.md",
      "docs/mockups/review-gallery.html",
      "EXPECTED_RELEASE_METADATA",
      "EXPECTED_GEM_METADATA",
      "homepage_uri",
      "source_code_uri",
      "changelog_uri",
      "bug_tracker_uri",
      "EXPECTED_PUBLIC_SETUP_GENERATOR",
      "PUBLIC_SETUP_GENERATOR_SOURCE_SIGNALS",
      "lib/generators/tree_view/state/install_generator.rb",
      "lib/generators/tree_view/state/templates/create_tree_view_states.rb",
      "lib/generators/tree_view/state/templates/tree_view_state.rb",
      "lib/generators/tree_view/state/templates/tree_view_state_owner.rb",
      "required_ruby_version",
      "allowed_push_host",
      "runtime_dependencies",
      "Gem package contents verification failed"
    ]
  ],
  [
    "docs/en/release.md",
    [
      "ruby script/check_gem_package_contents.rb tree_view-*.gem",
      "representative Rails helper, view partial, locale, docs, JavaScript, CSS, importmap, public API manifest, public runtime files, and gem metadata URI surfaces",
      "required Ruby version, allowed push host, and runtime dependency metadata",
      "public setup generator files for `tree_view:state:install`",
      "lib/generators/tree_view/state/install_generator.rb",
      "lib/generators/tree_view/state/templates/create_tree_view_states.rb",
      "lib/generators/tree_view/state/templates/tree_view_state.rb",
      "lib/generators/tree_view/state/templates/tree_view_state_owner.rb",
      "Public Setup Surface",
      "Package-sensitive PR paths include `tree_view.gemspec`",
      ".github/dependabot.yml",
      "Dependabot configuration changes are package-sensitive",
      "Rails integration files under `app/helpers/**`, `app/views/**`, `app/assets/**`, and `app/javascript/**`",
      "`docs_entrypoint_sensitive`",
      "`package_sensitive`",
      "`README.md`, `CHANGELOG.md`, `docs/**`, and `config/public_api_manifest.yml`",
      "docs entrypoint smoke",
      "config/importmap.tree_view.rb",
      "config/public_api_manifest.yml",
      "config/locales/**",
      "docs/en/release.md",
      "docs/ja/release.md"
    ]
  ],
  [
    "docs/ja/release.md",
    [
      "ruby script/check_gem_package_contents.rb tree_view-*.gem",
      "Rails helper / view partial / locale / docs / JavaScript / CSS / importmap / public API manifest / public runtime files / gem metadata URI",
      "required Ruby version、allowed push host、runtime dependency metadata",
      "`tree_view:state:install` public setup generator files",
      "lib/generators/tree_view/state/install_generator.rb",
      "lib/generators/tree_view/state/templates/create_tree_view_states.rb",
      "lib/generators/tree_view/state/templates/tree_view_state.rb",
      "lib/generators/tree_view/state/templates/tree_view_state_owner.rb",
      "Public Setup Surface",
      "package-sensitive path には、`tree_view.gemspec`",
      ".github/dependabot.yml",
      "Dependabot 設定の変更は dependency automation routing",
      "Rails integration files である `app/helpers/**`、`app/views/**`、`app/assets/**`、`app/javascript/**`",
      "`docs_entrypoint_sensitive`",
      "`package_sensitive`",
      "`README.md`、`CHANGELOG.md`、`docs/**`、`config/public_api_manifest.yml`",
      "docs entrypoint smoke",
      "config/importmap.tree_view.rb",
      "config/public_api_manifest.yml",
      "config/locales/**",
      "docs/en/release.md",
      "docs/ja/release.md"
    ]
  ]
]

packageContentsVerificationSignals.forEach(([sourcePath, signals]) => {
  assertSignals(sourcePath, "Gem package release docs category signal", signals)
})

const releaseNoteCandidatePackageGuardSignals = [
  [
    "script/check_gem_package_contents.rb",
    [
      "Release note candidate docs",
      "docs/en/release-note-candidates.md",
      "docs/ja/release-note-candidates.md"
    ]
  ],
  [
    "docs/en/release.md",
    [
      "Release note candidate collector",
      "release-note-candidates.md",
      "package-sensitive",
      "docs/**"
    ]
  ],
  [
    "docs/ja/release.md",
    [
      "Release note candidate collector",
      "release-note-candidates.md",
      "package-sensitive",
      "docs/**"
    ]
  ]
]

releaseNoteCandidatePackageGuardSignals.forEach(([sourcePath, signals]) => {
  assertSignals(sourcePath, "Release note candidate package guard signal", signals)
})

const controllerRegistrationDocsSignals = [
  [
    "config/public_api_manifest.yml",
    [
      "controller_registrations:",
      "TreeViewControllerEntries",
      "tree-view-state",
      "TreeViewStateController",
      "tree-view-remote-state",
      "TreeViewRemoteStateController"
    ]
  ],
  [
    "docs/en/controller-registration.md",
    [
      "TreeViewControllerEntries",
      "registerTreeViewControllers(application)",
      "identifier",
      "controller",
      "state",
      "client",
      "selection",
      "transfer",
      "remote state"
    ]
  ],
  [
    "docs/ja/controller-registration.md",
    [
      "TreeViewControllerEntries",
      "registerTreeViewControllers(application)",
      "identifier",
      "controller",
      "state",
      "client",
      "selection",
      "transfer",
      "remote state"
    ]
  ],
  [
    "docs/en/troubleshooting.md",
    [
      "TreeViewControllerIdentifiers",
      "TreeViewControllerEntries",
      "registerTreeViewControllers(application)",
      "selective registration or boot-order tests"
    ]
  ],
  [
    "docs/ja/troubleshooting.md",
    [
      "TreeViewControllerIdentifiers",
      "TreeViewControllerEntries",
      "registerTreeViewControllers(application)",
      "部分登録や boot-order test"
    ]
  ]
]

controllerRegistrationDocsSignals.forEach(([sourcePath, signals]) => {
  assertSignals(sourcePath, "Controller registration docs signal", signals)
})

assertSignals("script/release_note_candidates.rb", "Release note candidate helper output", [
  "# Release note candidates for #{repo}",
  "Source: #{source}",
  "This is a maintainer review aid. It does not rewrite CHANGELOG.md and does not decide the final release notes.",
  "Merged pull requests",
  "Closed issues",
  "--since DATE",
  "--since-tag TAG"
])

const releaseNoteCandidateDocs = [
  [
    "docs/en/release-note-candidates.md",
    [
      "script/release_note_candidates.rb",
      "candidate collector only",
      "It does not edit `CHANGELOG.md`.",
      "It does not decide the final release notes.",
      "--since 2026-06-01",
      "--since-tag v0.1.0",
      "# Release note candidates for barnet-co-jp/tree_view-rails",
      "## Merged pull requests",
      "## Closed issues",
      "release preparation notes, not committed as the final release text"
    ]
  ],
  [
    "docs/ja/release-note-candidates.md",
    [
      "script/release_note_candidates.rb",
      "candidate collector に限定します",
      "`CHANGELOG.md` は編集しません。",
      "最終的な release notes を自動判断しません。",
      "--since 2026-06-01",
      "--since-tag v0.1.0",
      "# Release note candidates for barnet-co-jp/tree_view-rails",
      "## Merged pull requests",
      "## Closed issues",
      "release preparation の確認メモへ貼るためのもの"
    ]
  ]
]

assertSignals("docs/README.md", "Release note candidate docs entrypoint", [
  "en/release-note-candidates.md",
  "ja/release-note-candidates.md"
])

releaseNoteCandidateDocs.forEach(([sourcePath, signals]) => {
  assertSignals(sourcePath, "Release note candidate docs", signals)
})

const packageVerificationEntrypointSignals = [
  [
    "script/check_gem_package_contents.rb",
    [
      "JAVASCRIPT_PACKAGE_ROOT_PATH",
      "TYPESCRIPT_PACKAGE_ROOT_PATH",
      "javascript_package_root",
      "named_exports",
      "Missing manifest-listed JavaScript package-root named exports in packaged",
      "importmap_pin_missing",
      "Missing TreeView importmap pin in config/importmap.tree_view.rb:",
      "pin \\\"tree_view\\\", to: \\\"tree_view/index.js\\\""
    ]
  ],
  [
    "docs/en/release.md",
    [
      "Package verification signals",
      "config/public_api_manifest.yml",
      "javascript_package_root.named_exports",
      "app/javascript/tree_view/index.js",
      "app/javascript/tree_view/index.d.ts",
      "Missing manifest-listed JavaScript package-root named exports in packaged <path>",
      "do not add or rename public JavaScript exports from this checklist alone",
      "config/importmap.tree_view.rb",
      "pin \"tree_view\", to: \"tree_view/index.js\""
    ]
  ],
  [
    "docs/ja/release.md",
    [
      "Package verification signals",
      "config/public_api_manifest.yml",
      "javascript_package_root.named_exports",
      "app/javascript/tree_view/index.js",
      "app/javascript/tree_view/index.d.ts",
      "Missing manifest-listed JavaScript package-root named exports in packaged <path>",
      "public JavaScript export を追加・rename しないでください",
      "config/importmap.tree_view.rb",
      "pin \"tree_view\", to: \"tree_view/index.js\""
    ]
  ]
]

packageVerificationEntrypointSignals.forEach(([sourcePath, signals]) => {
  assertSignals(sourcePath, "Package verification entrypoint release signal", signals)
})
