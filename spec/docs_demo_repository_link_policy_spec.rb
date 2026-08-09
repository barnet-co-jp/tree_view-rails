# frozen_string_literal: true

require "pathname"
require "spec_helper"

module DocsDemoRepositoryLinkPolicySpec
  ROOT = Pathname.new(File.expand_path("..", __dir__))
  PUBLIC_ENTRYPOINTS = [
    "README.md",
    "docs/README.md",
    "docs/en/README.md",
    "docs/ja/README.md"
  ].freeze
  BOUNDARY_DOCS = [
    "docs/en/demo-application-boundary.md",
    "docs/ja/demo-application-boundary.md"
  ].freeze
  MOCKUPS_README = "docs/mockups/README.md"
  DIRECT_DEMO_REPOSITORY_PATTERN = %r{
    (?:https?://|git://|git@)github\.com[:/]
    barnet-co-jp/tree_view-rails-demo(?:\.git)?(?:[/?#][^\s)\]]*)?
  }ix
  MARKDOWN_LINK_HREF_PATTERN = /\[[^\]]+\]\(([^)]+)\)/

  module_function

  def read(relative_path)
    ROOT.join(relative_path).read
  end

  def markdown_hrefs(relative_path)
    read(relative_path).scan(MARKDOWN_LINK_HREF_PATTERN).map do |match|
      match.first.split(/\s+/, 2).first.delete_prefix("<").delete_suffix(">")
    end
  end

  def direct_demo_repository_links(relative_path)
    content = read(relative_path)
    markdown_links = markdown_hrefs(relative_path).select do |href|
      href.match?(DIRECT_DEMO_REPOSITORY_PATTERN)
    end
    inline_links = content.scan(DIRECT_DEMO_REPOSITORY_PATTERN)

    (markdown_links + inline_links).uniq
  end
end

RSpec.describe "demo repository link policy" do
  it "keeps public docs free of direct demo repository links until the demo repo is public" do
    checked_paths = DocsDemoRepositoryLinkPolicySpec::PUBLIC_ENTRYPOINTS +
      DocsDemoRepositoryLinkPolicySpec::BOUNDARY_DOCS +
      [DocsDemoRepositoryLinkPolicySpec::MOCKUPS_README]

    direct_links_by_path = checked_paths.to_h do |relative_path|
      [relative_path, DocsDemoRepositoryLinkPolicySpec.direct_demo_repository_links(relative_path)]
    end.reject { |_relative_path, links| links.empty? }

    expect(direct_links_by_path).to eq({})
  end

  it "keeps public entry points routed through the demo application boundary docs" do
    aggregate_failures do
      expect(DocsDemoRepositoryLinkPolicySpec.markdown_hrefs("README.md")).to include(
        "docs/en/demo-application-boundary.md",
        "docs/ja/demo-application-boundary.md"
      )
      expect(DocsDemoRepositoryLinkPolicySpec.markdown_hrefs("docs/README.md")).to include(
        "en/demo-application-boundary.md",
        "ja/demo-application-boundary.md"
      )
      expect(DocsDemoRepositoryLinkPolicySpec.markdown_hrefs("docs/en/README.md")).to include(
        "demo-application-boundary.md"
      )
      expect(DocsDemoRepositoryLinkPolicySpec.markdown_hrefs("docs/ja/README.md")).to include(
        "demo-application-boundary.md"
      )
    end
  end

  it "keeps the publication handoff policy explicit in both language boundary docs" do
    english = DocsDemoRepositoryLinkPolicySpec.read("docs/en/demo-application-boundary.md")
    japanese = DocsDemoRepositoryLinkPolicySpec.read("docs/ja/demo-application-boundary.md")

    aggregate_failures do
      expect(english).to include("Do not add a direct demo repository link")
      expect(english).to include("When a public demo repository is available")
      expect(english).to include("Before adding links, confirm the repository is public")
      expect(japanese).to include("直接 link しません")
      expect(japanese).to include("Public demo repository が利用できる状態")
      expect(japanese).to include("repository が public")
    end
  end

  it "keeps mockups documented as static review assets, not the demo app entry point" do
    mockups_readme = DocsDemoRepositoryLinkPolicySpec.read(DocsDemoRepositoryLinkPolicySpec::MOCKUPS_README)

    aggregate_failures do
      expect(mockups_readme).to include("static HTML/CSS mockups")
      expect(mockups_readme).to include("They are **not** a complete Rails application")
      expect(mockups_readme).to include("tree_view-rails-demo")
      expect(mockups_readme).to include("playground app rather than this directory")
    end
  end
end
