# frozen_string_literal: true

require_relative "lib/tree_view/version"

Gem::Specification.new do |spec|
  spec.name = "tree_view"
  spec.version = TreeView::VERSION
  spec.authors = ["Haruhito Matsuo"]
  spec.email = ["matsuo-haruhito@users.noreply.github.com"]

  spec.summary = "Tree rendering primitives for Rails applications"
  spec.description = "Reusable tree traversal, render state, helpers, partials, and Rails integration points for tree-style UIs."
  spec.homepage = "https://github.com/barnet-co-jp/tree_view-rails"
  spec.license = "MIT"
  spec.required_ruby_version = ">= 3.2"

  spec.metadata["allowed_push_host"] = "https://rubygems.org"
  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = spec.homepage
  spec.metadata["documentation_uri"] = "#{spec.homepage}/blob/main/docs/README.md"
  spec.metadata["changelog_uri"] = "#{spec.homepage}/blob/main/CHANGELOG.md"
  spec.metadata["bug_tracker_uri"] = "#{spec.homepage}/issues"

  spec.files = Dir.chdir(__dir__) do
    Dir[
      "app/assets/**/*",
      "app/helpers/**/*",
      "app/javascript/tree_view/**/*",
      "app/views/tree_view/**/*",
      "config/importmap.tree_view.rb",
      "config/public_api_manifest.yml",
      "config/locales/**/*",
      "docs/**/*",
      "lib/**/*",
      "CHANGELOG.md",
      "README.md",
      "LICENSE*",
      "tree_view.gemspec"
    ]
  end

  spec.require_paths = ["lib"]

  spec.add_dependency "railties", ">= 7.0"

  spec.add_development_dependency "rake"
  spec.add_development_dependency "rspec"
  spec.add_development_dependency "standard"
end
