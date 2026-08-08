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

const descriptiveMetadataAndImportmapEvidenceSignals = [
  [
    "tree_view.gemspec",
    [
      "spec.license = \"MIT\"",
      "spec.summary = \"Tree rendering primitives for Rails applications\"",
      "spec.description = \"Reusable tree traversal, render state, helpers, partials, and Rails integration points for tree-style UIs.\""
    ]
  ],
  [
    "config/importmap.tree_view.rb",
    ["pin \"tree_view\", to: \"tree_view/index.js\""]
  ],
  [
    "script/check_gem_package_contents.rb",
    [
      "importmap_pin_missing",
      "importmap_content.include?",
      "Missing TreeView importmap pin in config/importmap.tree_view.rb:",
      "tree_view/index.js"
    ]
  ],
  [
    "docs/en/release.md",
    [
      "descriptive metadata evidence",
      "URI metadata and release metadata remain separate package-checker evidence",
      "spec/gemspec_files_spec.rb",
      "importmap package evidence",
      "runtime package-root export guards",
      "controller registration or behavior guards"
    ]
  ],
  [
    "docs/ja/release.md",
    [
      "descriptive metadata evidence",
      "URI metadata と release metadata は別の package-checker evidence",
      "spec/gemspec_files_spec.rb",
      "importmap package evidence",
      "runtime package-root export guard",
      "controller registration / behavior guard"
    ]
  ]
]

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
    "spec/gemspec_files_spec.rb",
    [
      "keeps MIT license metadata for RubyGems consumers",
      "expected gemspec license metadata",
      "actual_license = specification.license",
      "expected_license = \"MIT\"",
      "keeps summary and description metadata for RubyGems consumers",
      "expected gemspec summary metadata",
      "actual_summary = specification.summary",
      "Tree rendering primitives for Rails applications",
      "expected gemspec description metadata",
      "actual_description = specification.description",
      "Reusable tree traversal, render state, helpers, partials, and Rails integration points for tree-style UIs."
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

descriptiveMetadataAndImportmapEvidenceSignals.forEach(([sourcePath, signals]) => {
  assertSignals(sourcePath, "Descriptive metadata and importmap package evidence", signals)
})

packageContentsVerificationSignals.forEach(([sourcePath, signals]) => {
  assertSignals(sourcePath, "Gem package release docs category signal", signals)
})

console.log("Checked release package contents verification signals.")
