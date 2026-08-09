# frozen_string_literal: true

require "spec_helper"
require_relative "../script/release_note_candidates"

RSpec.describe ReleaseNoteCandidates::MarkdownFormatter do
  def entry(type:, number:, title:, closed_at: nil, merged_at: nil)
    path_segment = (type == :pull_request) ? "pull" : "issues"

    ReleaseNoteCandidates::Entry.new(
      type: type,
      number: number,
      title: title,
      url: "https://github.com/barnet-co-jp/tree_view-rails/#{path_segment}/#{number}",
      closed_at: closed_at,
      merged_at: merged_at
    )
  end

  it "formats merged pull request and closed issue sections with timestamps" do
    output = described_class.new.call(
      repo: "barnet-co-jp/tree_view-rails",
      source: "closed or merged since 2026-06-01",
      merged_prs: [entry(type: :pull_request, number: 12, title: "Add package guard", merged_at: "2026-06-12T01:23:45Z")],
      closed_issues: [entry(type: :issue, number: 9, title: "Document release boundary", closed_at: "2026-06-10T00:00:00Z")]
    )

    expect(output).to include("# Release note candidates for barnet-co-jp/tree_view-rails")
    expect(output).to include("Source: closed or merged since 2026-06-01")
    expect(output).to include("This is a maintainer review aid. It does not rewrite CHANGELOG.md and does not decide the final release notes.")
    expect(output).to include("## Merged pull requests")
    expect(output).to include("- #12 Add package guard (2026-06-12T01:23:45Z)")
    expect(output).to include("  https://github.com/barnet-co-jp/tree_view-rails/pull/12")
    expect(output).to include("## Closed issues")
    expect(output).to include("- #9 Document release boundary (2026-06-10T00:00:00Z)")
    expect(output).to end_with("\n")
  end

  it "keeps empty candidate sections explicit" do
    output = described_class.new.call(
      repo: "barnet-co-jp/tree_view-rails",
      source: "commit references since tag v0.1.0",
      merged_prs: [],
      closed_issues: []
    )

    expect(output.scan("- No candidates found.").length).to eq(2)
    expect(output).to include("## Merged pull requests\n\n- No candidates found.")
    expect(output).to include("## Closed issues\n\n- No candidates found.")
  end
end

RSpec.describe ReleaseNoteCandidates::CLI do
  def expect_parse_abort(argv, message)
    expect do
      expect { described_class.parse_options(argv) }.to raise_error(SystemExit)
    end.to output(/#{Regexp.escape(message)}/).to_stderr
  end

  it "requires a repo option" do
    expect_parse_abort(["--since", "2026-06-01"], "--repo is required")
  end

  it "requires exactly one collection source" do
    expect_parse_abort(["--repo", "barnet-co-jp/tree_view-rails"], "Use exactly one of --since or --since-tag")
    expect_parse_abort(
      ["--repo", "barnet-co-jp/tree_view-rails", "--since", "2026-06-01", "--since-tag", "v0.1.0"],
      "Use exactly one of --since or --since-tag"
    )
  end

  it "parses valid since-date options without network access" do
    options = described_class.parse_options(["--repo", "barnet-co-jp/tree_view-rails", "--since", "2026-06-01"])

    expect(options).to eq(repo: "barnet-co-jp/tree_view-rails", since: "2026-06-01")
  end

  it "parses valid since-tag options without network access" do
    options = described_class.parse_options(["--repo", "barnet-co-jp/tree_view-rails", "--since-tag", "v0.1.0"])

    expect(options).to eq(repo: "barnet-co-jp/tree_view-rails", since_tag: "v0.1.0")
  end
end

RSpec.describe ReleaseNoteCandidates::Collector do
  def fake_client(compare_messages:, issues:)
    Class.new do
      def initialize(compare_messages:, issues:)
        @compare_messages = compare_messages
        @issues = issues
      end

      def compare(_repo, _base_ref)
        {
          "commits" => @compare_messages.map do |message|
            {"commit" => {"message" => message}}
          end
        }
      end

      def issue(_repo, number)
        @issues.fetch(number.to_s)
      end
    end.new(compare_messages: compare_messages, issues: issues)
  end

  it "maps unique commit references since a tag to pull request and issue entries" do
    client = fake_client(
      compare_messages: [
        "Merge pull request #12 from feature/release-notes\n\nRefs #7",
        "Follow-up for #12 and closes #8"
      ],
      issues: {
        "7" => {
          "number" => 7,
          "title" => "Document the release helper",
          "html_url" => "https://github.com/barnet-co-jp/tree_view-rails/issues/7",
          "closed_at" => "2026-06-07T00:00:00Z"
        },
        "8" => {
          "number" => 8,
          "title" => "Tighten release docs",
          "html_url" => "https://github.com/barnet-co-jp/tree_view-rails/issues/8",
          "closed_at" => "2026-06-08T00:00:00Z"
        },
        "12" => {
          "number" => 12,
          "title" => "Add release note candidates helper",
          "html_url" => "https://github.com/barnet-co-jp/tree_view-rails/pull/12",
          "closed_at" => "2026-06-12T00:00:00Z",
          "pull_request" => {"merged_at" => "2026-06-12T01:23:45Z"}
        }
      }
    )

    merged_prs, closed_issues = described_class.new(client: client).by_since_tag(
      repo: "barnet-co-jp/tree_view-rails",
      since_tag: "v0.1.0"
    )

    expect(merged_prs.map(&:number)).to eq([12])
    expect(merged_prs.first).to have_attributes(
      type: :pull_request,
      title: "Add release note candidates helper",
      merged_at: "2026-06-12T01:23:45Z"
    )
    expect(closed_issues.map(&:number)).to eq([7, 8])
    expect(closed_issues.map(&:type)).to eq([:issue, :issue])
  end
end
