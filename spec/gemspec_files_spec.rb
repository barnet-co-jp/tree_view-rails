# frozen_string_literal: true

require "json"
require "spec_helper"

RSpec.describe "packaged gem files" do
  let(:specification) { Gem::Specification.load("tree_view.gemspec") }

  subject(:files) { specification.files }

  let(:entrypoint_controller_files) do
    %w[
      app/javascript/tree_view/client_controller.js
      app/javascript/tree_view/remote_state_controller.js
      app/javascript/tree_view/selection_controller.js
      app/javascript/tree_view/state_controller.js
      app/javascript/tree_view/transfer_controller.js
    ]
  end

  it "includes runtime files required by Rails integration" do
    expect(files).to include(
      "lib/tree_view.rb",
      "lib/tree_view/engine.rb",
      "app/helpers/tree_view_helper.rb",
      "app/views/tree_view/_tree_row.html.erb",
      "app/views/tree_view/_tree_children.html.erb",
      "app/views/tree_view/_tree_toggle_cell.html.erb",
      "app/views/tree_view/_tree_toggle_content.html.erb",
      "app/views/tree_view/_tree_toggle_content_static.html.erb",
      "app/views/tree_view/_tree_toggle_content_turbo.html.erb",
      "app/views/tree_view/_tree_selection_cell.html.erb",
      "app/assets/stylesheets/tree_view.css",
      "app/assets/stylesheets/tree_view.scss",
      "app/javascript/tree_view/index.js",
      "app/javascript/tree_view/index.d.ts",
      "app/javascript/tree_view/package.json",
      "config/importmap.tree_view.rb"
    )
  end

  it "includes JavaScript controllers referenced by the packaged entrypoint" do
    expect(files).to include(*entrypoint_controller_files)
  end

  it "publishes a package-local JavaScript entrypoint for Vite and TypeScript resolution" do
    package_metadata = JSON.parse(File.read("app/javascript/tree_view/package.json"))

    expect(package_metadata).to include(
      "type" => "module",
      "main" => "./index.js",
      "module" => "./index.js",
      "types" => "./index.d.ts"
    )
    expect(package_metadata.dig("exports", ".", "types")).to eq("./index.d.ts")
    expect(package_metadata.dig("exports", ".", "import")).to eq("./index.js")
  end

  it "includes user-facing documentation and metadata" do
    expect(files).to include(
      "README.md",
      "CHANGELOG.md",
      "tree_view.gemspec"
    )
    expect(files.grep(/\ALICENSE/)).not_to be_empty
    expect(files.grep(%r{\Adocs/})).not_to be_empty
  end

  it "keeps MIT license metadata for RubyGems consumers" do
    expected_license = "MIT"
    actual_license = specification.license

    expect(actual_license).to eq(expected_license),
      "expected gemspec license metadata to be #{expected_license.inspect}, got #{actual_license.inspect}"
  end

  it "keeps summary and description metadata for RubyGems consumers" do
    expected_summary = "Tree rendering primitives for Rails applications"
    actual_summary = specification.summary

    expect(actual_summary).to eq(expected_summary),
      "expected gemspec summary metadata to be #{expected_summary.inspect}, got #{actual_summary.inspect}"

    expected_description = "Reusable tree traversal, render state, helpers, partials, and Rails integration points for tree-style UIs."
    actual_description = specification.description

    expect(actual_description).to eq(expected_description),
      "expected gemspec description metadata to be #{expected_description.inspect}, got #{actual_description.inspect}"
  end

  it "includes bug tracker metadata for RubyGems consumers" do
    expect(specification.metadata).to include(
      "homepage_uri" => specification.homepage,
      "source_code_uri" => specification.homepage,
      "changelog_uri" => "#{specification.homepage}/blob/main/CHANGELOG.md",
      "bug_tracker_uri" => "#{specification.homepage}/issues"
    )
  end

  it "excludes development-only files" do
    expect(files).not_to include(
      ".rspec",
      "Gemfile",
      "Rakefile"
    )
    expect(files.grep(%r{\Aspec/})).to be_empty
  end
end
