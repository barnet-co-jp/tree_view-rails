#!/usr/bin/env ruby
# frozen_string_literal: true

require "rubygems/package"
require "stringio"
require "yaml"
require "zlib"

# Keep representative English and Japanese files in these groups so package
# verification covers the bilingual locale, public API, docs entrypoints,
# release docs, and user-facing mockup entrypoints shipped by the gem. The
# groups are intentionally representative rather than a mirror of the gemspec
# glob; add a path here when a new public-facing surface needs release-package
# evidence beyond inclusion in `spec.files`.
REQUIRED_PACKAGED_PATH_GROUPS = {
  "Rails helpers" => %w[
    app/helpers/tree_view_helper.rb
    app/helpers/tree_view_helper/support.rb
    app/helpers/tree_view_helper/rendering.rb
    app/helpers/tree_view_helper/dom.rb
    app/helpers/tree_view_helper/row_attributes.rb
    app/helpers/tree_view_helper/selection.rb
    app/helpers/tree_view_helper/transfer.rb
    app/helpers/tree_view_helper/visuals.rb
    app/helpers/tree_view_helper/render_scope.rb
    app/helpers/tree_view_helper/lazy_loading.rb
    app/helpers/tree_view_helper/toolbar.rb
    app/helpers/tree_view_breadcrumb_helper.rb
  ],
  "Rails views and assets" => %w[
    app/views/tree_view/_tree_row.html.erb
    app/assets/stylesheets/tree_view.scss
  ],
  "JavaScript entrypoints" => %w[
    app/javascript/tree_view/index.js
    app/javascript/tree_view/index.d.ts
    app/javascript/tree_view/client_controller.js
    app/javascript/tree_view/remote_state_controller.js
    app/javascript/tree_view/selection_controller.js
    app/javascript/tree_view/state_controller.js
    app/javascript/tree_view/transfer_controller.js
  ],
  "Configuration and locales" => %w[
    config/importmap.tree_view.rb
    config/public_api_manifest.yml
    config/locales/tree_view.toolbar.en.yml
    config/locales/tree_view.toolbar.ja.yml
  ],
  "Root docs" => %w[
    CHANGELOG.md
    README.md
    docs/README.md
  ],
  "License files" => %w[
    LICENSE
  ],
  "Mockup entrypoints" => %w[
    docs/mockups/README.md
    docs/mockups/review-gallery.html
    docs/mockups/default-tree.html
    docs/mockups/default-tree.css
    docs/mockups/assets/readme-default-tree.svg
  ],
  "Bilingual setup and public API docs" => %w[
    docs/en/installation.md
    docs/ja/installation.md
    docs/en/public-api.md
    docs/ja/public-api.md
  ],
  "README-linked localized names docs" => %w[
    docs/en/localized-names.md
    docs/ja/localized-names.md
  ],
  "README-linked render log level docs" => %w[
    docs/en/render-log-level.md
    docs/ja/render-log-level.md
  ],
  "Bilingual development docs" => %w[
    docs/en/development.md
    docs/ja/development.md
  ],
  "Dependabot Bundler recovery docs" => %w[
    docs/en/dependabot-bundler-recovery.md
    docs/ja/dependabot-bundler-recovery.md
  ],
  "Bilingual CI policy suite docs" => %w[
    docs/en/ci-policy-suite.md
    docs/ja/ci-policy-suite.md
  ],
  "README-linked public JavaScript docs" => %w[
    docs/en/js-events.md
    docs/ja/js-events.md
    docs/en/controller-registration.md
    docs/ja/controller-registration.md
    docs/en/selection-checkbox-hooks.md
    docs/ja/selection-checkbox-hooks.md
  ],
  "README-linked Turbo Frame docs" => %w[
    docs/en/turbo-frame.md
    docs/ja/turbo-frame.md
  ],
  "README-linked direction-aware styling docs" => %w[
    docs/en/direction-aware-styling.md
    docs/ja/direction-aware-styling.md
  ],
  "README-linked public name decision docs" => %w[
    docs/en/public-name-decisions.md
    docs/ja/public-name-decisions.md
  ],
  "README-linked styling state cue docs" => %w[
    docs/en/styling-state-cues.md
    docs/ja/styling-state-cues.md
  ],
  "README-linked maintainer policy docs" => %w[
    docs/en/design-policy.md
    docs/ja/design-policy.md
    docs/en/code-quality.md
    docs/ja/code-quality.md
  ],
  "README-linked demo application boundary docs" => %w[
    docs/en/demo-application-boundary.md
    docs/ja/demo-application-boundary.md
  ],
  "README-linked host app extension docs" => %w[
    docs/en/host-app-extension-points.md
    docs/ja/host-app-extension-points.md
  ],
  "README-linked accessibility semantics docs" => %w[
    docs/en/accessibility-semantics.md
    docs/ja/accessibility-semantics.md
  ],
  "README-linked decision guide docs" => %w[
    docs/en/decision-guide.md
    docs/ja/decision-guide.md
  ],
  "README-linked FAQ and troubleshooting docs" => %w[
    docs/en/faq.md
    docs/ja/faq.md
    docs/en/troubleshooting.md
    docs/ja/troubleshooting.md
  ],
  "README-linked API overview and diagnostics docs" => %w[
    docs/en/api-overview.md
    docs/ja/api-overview.md
    docs/en/api.md
    docs/ja/api.md
    docs/en/tree-diagnostics.md
    docs/ja/tree-diagnostics.md
  ],
  "README-linked API combination and GraphAdapter docs" => %w[
    docs/en/cookbook.md
    docs/ja/cookbook.md
    docs/en/graph-adapter.md
    docs/ja/graph-adapter.md
  ],
  "README-linked error hierarchy docs" => %w[
    docs/en/errors.md
    docs/ja/errors.md
  ],
  "README-linked path and reverse tree docs" => %w[
    docs/en/path-tree-builder.md
    docs/ja/path-tree-builder.md
    docs/en/reverse-tree.md
    docs/ja/reverse-tree.md
  ],
  "README-linked first-time usage docs" => %w[
    docs/en/minimal-usage.md
    docs/ja/minimal-usage.md
    docs/en/usage.md
    docs/ja/usage.md
  ],
  "README-linked helper-adjacent row docs" => %w[
    docs/en/breadcrumb.md
    docs/ja/breadcrumb.md
    docs/en/depth-labels.md
    docs/ja/depth-labels.md
    docs/en/row-status.md
    docs/ja/row-status.md
  ],
  "README-linked integration boundary docs" => %w[
    docs/en/resource-table-bridge.md
    docs/ja/resource-table-bridge.md
    docs/en/form-editing.md
    docs/ja/form-editing.md
  ],
  "README-linked row partial and identifier docs" => %w[
    docs/en/node-presenter-row-partials.md
    docs/ja/node-presenter-row-partials.md
    docs/en/glossary.md
    docs/ja/glossary.md
    docs/en/node-keys.md
    docs/ja/node-keys.md
  ],
  "README-linked filter and transfer docs" => %w[
    docs/en/filtered-trees.md
    docs/ja/filtered-trees.md
    docs/en/drag-and-drop.md
    docs/ja/drag-and-drop.md
  ],
  "README-linked selection and toolbar docs" => %w[
    docs/en/selection.md
    docs/ja/selection.md
    docs/en/toolbar.md
    docs/ja/toolbar.md
  ],
  "README-linked migration guide docs" => %w[
    docs/en/migration.md
    docs/ja/migration.md
  ],
  "README-linked large-tree and rendering boundary docs" => %w[
    docs/en/render-scale.md
    docs/ja/render-scale.md
    docs/en/rendering-boundaries.md
    docs/ja/rendering-boundaries.md
  ],
  "README-linked large-tree async interaction docs" => %w[
    docs/en/lazy-loading.md
    docs/ja/lazy-loading.md
    docs/en/children-pagination.md
    docs/ja/children-pagination.md
    docs/en/windowed-rendering.md
    docs/ja/windowed-rendering.md
  ],
  "Public setup surface docs" => %w[
    docs/en/public-setup-surface.md
    docs/ja/public-setup-surface.md
  ],
  "README-linked persisted state docs" => %w[
    docs/en/persisted-state.md
    docs/ja/persisted-state.md
  ],
  "Public setup generator files" => %w[
    lib/generators/tree_view/state/install_generator.rb
    lib/generators/tree_view/state/templates/create_tree_view_states.rb
    lib/generators/tree_view/state/templates/tree_view_state.rb
    lib/generators/tree_view/state/templates/tree_view_state_owner.rb
  ],
  "Bilingual release docs" => %w[
    docs/en/release.md
    docs/ja/release.md
  ],
  "Release note candidate docs" => %w[
    docs/en/release-note-candidates.md
    docs/ja/release-note-candidates.md
  ]
}.freeze

REQUIRED_PACKAGED_PATHS = REQUIRED_PACKAGED_PATH_GROUPS.values.flatten.freeze

EXPECTED_GEM_METADATA = {
  "homepage_uri" => "https://github.com/barnet-co-jp/tree_view-rails",
  "source_code_uri" => "https://github.com/barnet-co-jp/tree_view-rails",
  "documentation_uri" => "https://github.com/barnet-co-jp/tree_view-rails/blob/main/docs/README.md",
  "changelog_uri" => "https://github.com/barnet-co-jp/tree_view-rails/blob/main/CHANGELOG.md",
  "bug_tracker_uri" => "https://github.com/barnet-co-jp/tree_view-rails/issues"
}.freeze

EXPECTED_RELEASE_METADATA = {
  required_ruby_version: ">= 3.2",
  allowed_push_host: "https://rubygems.org",
  runtime_dependencies: {
    "railties" => ">= 7.0"
  }
}.freeze

PUBLIC_CONSTANT_RUNTIME_FILES = {
  "Error" => "lib/tree_view/errors.rb",
  "ConfigurationError" => "lib/tree_view/errors.rb",
  "InvalidTreeError" => "lib/tree_view/errors.rb",
  "DuplicateNodeKeyError" => "lib/tree_view/errors.rb",
  "CycleDetectedError" => "lib/tree_view/errors.rb",
  "InvalidRenderWindowError" => "lib/tree_view/errors.rb",
  "Configuration" => "lib/tree_view/configuration.rb",
  "LocalizedNames" => "lib/tree_view/localized_names.rb",
  "Tree" => "lib/tree_view/tree.rb",
  "RenderState" => "lib/tree_view/render_state.rb",
  "ResourceTableRenderState" => "lib/tree_view/resource_table_render_state.rb",
  "VisibleRows" => "lib/tree_view/visible_rows.rb",
  "RenderWindow" => "lib/tree_view/render_window.rb",
  "FilteredTree" => "lib/tree_view/filtered_tree.rb",
  "UiConfig" => "lib/tree_view/ui_config.rb",
  "UiConfigBuilder" => "lib/tree_view/ui_config_builder.rb",
  "GraphAdapter" => "lib/tree_view/graph_adapter.rb",
  "NodePresenter" => "lib/tree_view/node_presenter.rb",
  "PathTree" => "lib/tree_view/path_tree.rb",
  "PathTreeBuilder" => "lib/tree_view/path_tree_builder.rb",
  "ReverseTree" => "lib/tree_view/reverse_tree.rb",
  "PersistedState" => "lib/tree_view/persisted_state.rb",
  "StateStore" => "lib/tree_view/state_store.rb",
  "Diagnostics" => "lib/tree_view/diagnostics.rb"
}.freeze

JAVASCRIPT_PACKAGE_ROOT_PATH = "app/javascript/tree_view/index.js"
TYPESCRIPT_PACKAGE_ROOT_PATH = "app/javascript/tree_view/index.d.ts"

INSTALLATION_DOC_PATHS = %w[
  docs/en/installation.md
  docs/ja/installation.md
].freeze

INSTALLATION_REQUIRED_SIGNALS = [
  "app/assets/stylesheets/tree_view.scss",
  "app/helpers/tree_view_helper.rb",
  "app/javascript/tree_view/**/*",
  "app/views/tree_view/**/*",
  "config/importmap.tree_view.rb",
  "config/locales/**/*",
  "config/public_api_manifest.yml",
  "README.md",
  "CHANGELOG.md",
  "docs/**/*",
  "@import \"tree_view\";",
  "pin \"tree_view\", to: \"tree_view/index.js\""
].freeze

EXPECTED_PUBLIC_SETUP_GENERATOR = {
  "name" => "tree_view:state:install",
  "class_name" => "TreeView::Generators::State::InstallGenerator",
  "optional_arguments" => [
    {"name" => "owner_model_name", "banner" => "OWNER_MODEL"}
  ],
  "generated_paths" => [
    "db/migrate/*_create_tree_view_states.rb",
    "app/models/tree_view_state.rb",
    "app/models/concerns/tree_view_state_owner.rb"
  ]
}.freeze

PUBLIC_SETUP_GENERATOR_SOURCE_SIGNALS = [
  "argument :owner_model_name, type: :string, required: false, banner: \"OWNER_MODEL\"",
  "template \"create_tree_view_states.rb\", migration_path",
  "template \"tree_view_state.rb\", \"app/models/tree_view_state.rb\"",
  "template \"tree_view_state_owner.rb\", \"app/models/concerns/tree_view_state_owner.rb\""
].freeze

PUBLIC_SETUP_GENERATOR_REQUIRED_PACKAGED_PATHS = REQUIRED_PACKAGED_PATH_GROUPS.fetch("Public setup generator files").freeze

PACKAGED_DOCS_FORBIDDEN_RELATIVE_ROOT_LINKS = [
  "../Product%20Profile.md",
  "../AGENTS.md"
].freeze

def packaged_file_content(gem_path, target_path)
  data_tar_gz = nil

  File.open(gem_path, "rb") do |gem_io|
    Gem::Package::TarReader.new(gem_io) do |gem_tar|
      gem_tar.each do |entry|
        data_tar_gz = entry.read if entry.full_name == "data.tar.gz"
      end
    end
  end

  return nil unless data_tar_gz

  Zlib::GzipReader.wrap(StringIO.new(data_tar_gz)) do |gzip|
    Gem::Package::TarReader.new(gzip) do |data_tar|
      data_tar.each do |entry|
        return entry.read if entry.full_name == target_path
      end
    end
  end

  nil
end

def javascript_named_export?(source, export_name)
  escaped_name = Regexp.escape(export_name)
  source.match?(/export\s+(?:const|function|class)\s+#{escaped_name}\b/) ||
    source.match?(/export\s*\{[^}]*\b#{escaped_name}\b[^}]*\}/m)
end

def typescript_named_export?(source, export_name)
  escaped_name = Regexp.escape(export_name)
  source.match?(/export\s+declare\s+(?:const|function|class)\s+#{escaped_name}\b/)
end

root = File.expand_path("..", __dir__)
gem_path = ARGV.first || Dir[File.join(root, "tree_view-*.gem")].max_by { |path| File.mtime(path) }

abort "No built gem found. Run `gem build tree_view.gemspec` first." unless gem_path

package_spec = Gem::Package.new(gem_path).spec
files = package_spec.files
manifest = YAML.load_file(File.join(root, "config/public_api_manifest.yml"))
missing_by_group = REQUIRED_PACKAGED_PATH_GROUPS.transform_values do |paths|
  paths.reject { |path| files.include?(path) }
end.reject { |_group, paths| paths.empty? }
missing = missing_by_group.values.flatten
missing_gem_metadata = EXPECTED_GEM_METADATA.reject do |key, expected_value|
  package_spec.metadata[key] == expected_value
end
unexpected_release_metadata = {}
if package_spec.required_ruby_version.to_s != EXPECTED_RELEASE_METADATA.fetch(:required_ruby_version)
  unexpected_release_metadata["required_ruby_version"] = {
    expected: EXPECTED_RELEASE_METADATA.fetch(:required_ruby_version),
    actual: package_spec.required_ruby_version.to_s
  }
end
if package_spec.metadata["allowed_push_host"] != EXPECTED_RELEASE_METADATA.fetch(:allowed_push_host)
  unexpected_release_metadata["allowed_push_host"] = {
    expected: EXPECTED_RELEASE_METADATA.fetch(:allowed_push_host),
    actual: package_spec.metadata["allowed_push_host"]
  }
end
EXPECTED_RELEASE_METADATA.fetch(:runtime_dependencies).each do |dependency_name, expected_requirement|
  dependency = package_spec.dependencies.find do |candidate|
    candidate.type == :runtime && candidate.name == dependency_name
  end
  actual_requirement = dependency&.requirement&.to_s
  next if actual_requirement == expected_requirement

  unexpected_release_metadata["runtime dependency #{dependency_name}"] = {
    expected: expected_requirement,
    actual: actual_requirement
  }
end
missing_manifest_constant_paths = manifest.fetch("public_constants").each_with_object({}) do |constant, missing_paths|
  expected_path = PUBLIC_CONSTANT_RUNTIME_FILES[constant]
  missing_paths[constant] = expected_path unless expected_path && files.include?(expected_path)
end
unknown_manifest_constants = manifest.fetch("public_constants") - PUBLIC_CONSTANT_RUNTIME_FILES.keys

named_exports = manifest.fetch("javascript_package_root").fetch("named_exports")
packaged_javascript_entrypoint = packaged_file_content(gem_path, JAVASCRIPT_PACKAGE_ROOT_PATH)
packaged_typescript_entrypoint = packaged_file_content(gem_path, TYPESCRIPT_PACKAGE_ROOT_PATH)
missing_package_root_named_exports = {}
if packaged_javascript_entrypoint
  missing_javascript_exports = named_exports.reject do |export_name|
    javascript_named_export?(packaged_javascript_entrypoint, export_name)
  end
  missing_package_root_named_exports[JAVASCRIPT_PACKAGE_ROOT_PATH] = missing_javascript_exports unless missing_javascript_exports.empty?
else
  missing_package_root_named_exports[JAVASCRIPT_PACKAGE_ROOT_PATH] = named_exports
end
if packaged_typescript_entrypoint
  missing_typescript_exports = named_exports.reject do |export_name|
    typescript_named_export?(packaged_typescript_entrypoint, export_name)
  end
  missing_package_root_named_exports[TYPESCRIPT_PACKAGE_ROOT_PATH] = missing_typescript_exports unless missing_typescript_exports.empty?
else
  missing_package_root_named_exports[TYPESCRIPT_PACKAGE_ROOT_PATH] = named_exports
end

missing_installation_signals = INSTALLATION_DOC_PATHS.to_h do |path|
  content = File.read(File.join(root, path))
  [path, INSTALLATION_REQUIRED_SIGNALS.reject { |signal| content.include?(signal) }]
end.reject { |_path, missing_signals| missing_signals.empty? }

public_setup_generator = manifest.fetch("setup_generators").fetch("persisted_state_install")
unexpected_public_setup_generator = EXPECTED_PUBLIC_SETUP_GENERATOR.filter_map do |key, expected_value|
  actual_value = public_setup_generator[key]
  next if actual_value == expected_value

  [key, {expected: expected_value, actual: actual_value}]
end.to_h
public_setup_generator_source = File.read(File.join(root, "lib/generators/tree_view/state/install_generator.rb"))
missing_public_setup_generator_source_signals = PUBLIC_SETUP_GENERATOR_SOURCE_SIGNALS.reject do |signal|
  public_setup_generator_source.include?(signal)
end
missing_public_setup_generator_package_paths = PUBLIC_SETUP_GENERATOR_REQUIRED_PACKAGED_PATHS.reject do |path|
  files.include?(path)
end

packaged_doc_paths = files.grep(/\Adocs\/.*\.(?:md|html)\z/).sort
forbidden_packaged_doc_links = packaged_doc_paths.to_h do |path|
  content = File.read(File.join(root, path))
  [path, PACKAGED_DOCS_FORBIDDEN_RELATIVE_ROOT_LINKS.select { |link| content.include?(link) }]
end.reject { |_path, links| links.empty? }

importmap_path = File.join(root, "config/importmap.tree_view.rb")
importmap_content = File.read(importmap_path)
importmap_pin_missing = !importmap_content.include?("pin \"tree_view\", to: \"tree_view/index.js\"")

if missing.empty? && missing_gem_metadata.empty? && unexpected_release_metadata.empty? && missing_manifest_constant_paths.empty? && unknown_manifest_constants.empty? && missing_package_root_named_exports.empty? && missing_installation_signals.empty? && unexpected_public_setup_generator.empty? && missing_public_setup_generator_source_signals.empty? && missing_public_setup_generator_package_paths.empty? && forbidden_packaged_doc_links.empty? && !importmap_pin_missing
  puts "Gem package contents verified: #{File.basename(gem_path)}"
else
  warn "Gem package contents verification failed: #{File.basename(gem_path)}"

  missing_by_group.each do |group, paths|
    warn "Missing packaged files for #{group}:"
    paths.each { |path| warn "  - #{path}" }
  end

  unless missing_gem_metadata.empty?
    warn "Missing or unexpected gem metadata URI values:"
    missing_gem_metadata.each do |key, expected_value|
      actual_value = package_spec.metadata[key]
      warn "  - #{key}: expected #{expected_value.inspect}, got #{actual_value.inspect}"
    end
  end

  unless unexpected_release_metadata.empty?
    warn "Missing or unexpected release metadata values:"
    unexpected_release_metadata.each do |key, values|
      warn "  - #{key}: expected #{values.fetch(:expected).inspect}, got #{values.fetch(:actual).inspect}"
    end
  end

  unless missing_manifest_constant_paths.empty?
    warn "Missing manifest-listed public Ruby runtime files:"
    missing_manifest_constant_paths.each do |constant, expected_path|
      warn "  - #{constant}: expected packaged file #{expected_path || "<no mapping>"}"
    end
  end

  unless unknown_manifest_constants.empty?
    warn "Public constants missing package guard mappings:"
    unknown_manifest_constants.each { |constant| warn "  - #{constant}" }
  end

  missing_package_root_named_exports.each do |path, export_names|
    warn "Missing manifest-listed JavaScript package-root named exports in packaged #{path}:"
    export_names.each { |export_name| warn "  - #{export_name}" }
  end

  missing_installation_signals.each do |path, signals|
    warn "Missing installation docs signals in #{path}:"
    signals.each { |signal| warn "  - #{signal}" }
  end

  unless unexpected_public_setup_generator.empty?
    warn "Missing or unexpected public setup generator manifest values:"
    unexpected_public_setup_generator.each do |key, values|
      warn "  - setup_generators.persisted_state_install.#{key}: expected #{values.fetch(:expected).inspect}, got #{values.fetch(:actual).inspect}"
    end
  end

  unless missing_public_setup_generator_source_signals.empty?
    warn "Missing public setup generator implementation signals in lib/generators/tree_view/state/install_generator.rb:"
    missing_public_setup_generator_source_signals.each { |signal| warn "  - #{signal}" }
  end

  unless missing_public_setup_generator_package_paths.empty?
    warn "Missing manifest-backed public setup generator package guard files:"
    missing_public_setup_generator_package_paths.each { |path| warn "  - #{path}" }
  end

  forbidden_packaged_doc_links.each do |path, links|
    warn "Forbidden repository-only root doc links in packaged #{path}:"
    links.each { |link| warn "  - #{link}" }
  end

  if importmap_pin_missing
    warn "Missing TreeView importmap pin in config/importmap.tree_view.rb:"
    warn "  - pin \"tree_view\", to: \"tree_view/index.js\""
  end

  abort "Gem package contents verification failed."
end
