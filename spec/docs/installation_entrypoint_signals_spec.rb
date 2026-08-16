# frozen_string_literal: true

require "spec_helper"

RSpec.describe "installation entrypoint signal docs" do
  def read_repo_file(path)
    File.read(File.expand_path("../../#{path}", __dir__))
  end

  let(:english_installation) { read_repo_file("docs/en/installation.md") }
  let(:japanese_installation) { read_repo_file("docs/ja/installation.md") }

  it "keeps CSS, importmap, controller registration, and Vite signals visible" do
    {
      "docs/en/installation.md" => english_installation,
      "docs/ja/installation.md" => japanese_installation
    }.each do |path, document|
      expect(document).to include(
        'stylesheet_link_tag "tree_view"',
        '@import "tree_view";',
        'pin "tree_view", to: "tree_view/index.js"',
        'import { registerTreeViewControllers } from "tree_view"',
        "registerTreeViewControllers(application)",
        'execFileSync("bundle", ["show", "tree_view"]',
        '"app/javascript/tree_view"',
        'app/javascript/tree_view/package.json',
        'app/javascript/tree_view/index.d.ts'
      ), "#{path} lost one of the representative installation entrypoint signals"
    end
  end

  it "keeps Propshaft and Sprockets setup signals separate from the quick-start path" do
    expect(english_installation).to include(
      "## Propshaft",
      "packaged plain CSS asset directly by logical asset name",
      "Do not rely on Propshaft itself to compile Sass",
      "## Sprockets",
      "Sprockets-compatible asset hooks"
    )

    expect(japanese_installation).to include(
      "## Propshaft",
      "同梱の plain CSS asset を logical asset として直接読み込む構成を推奨します",
      "Propshaft 自体に Sass compile を期待しないでください",
      "## Sprockets",
      "Sprockets互換のasset hook"
    )
  end
end
