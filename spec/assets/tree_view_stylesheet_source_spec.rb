# frozen_string_literal: true

require "spec_helper"

RSpec.describe "tree_view stylesheet source" do
  let(:stylesheet_source) { File.read(File.expand_path("../../app/assets/stylesheets/tree_view.css", __dir__)) }
  let(:scss_source) { File.read(File.expand_path("../../app/assets/stylesheets/tree_view.scss", __dir__)) }
  let(:english_styling_docs) { File.read(File.expand_path("../../docs/en/styling-state-cues.md", __dir__)) }
  let(:japanese_styling_docs) { File.read(File.expand_path("../../docs/ja/styling-state-cues.md", __dir__)) }

  def tree_view_tokens(source)
    source.scan(/--tree-view-[a-z0-9-]+/).uniq.sort
  end

  it "keeps the plain CSS asset and Sass-compatible source identical" do
    expect(stylesheet_source).to eq(scss_source)
  end

  it "keeps documented styling token lists aligned with stylesheet token usage" do
    stylesheet_tokens = tree_view_tokens(stylesheet_source)

    aggregate_failures do
      expect(tree_view_tokens(english_styling_docs)).to eq(stylesheet_tokens)
      expect(tree_view_tokens(japanese_styling_docs)).to eq(stylesheet_tokens)
    end
  end

  it "adds a distinct focus-visible state for tree toggle actions" do
    aggregate_failures do
      expect(stylesheet_source).to include(".tree-toggle__action:focus-visible")
      expect(stylesheet_source).to include("outline: 2px solid var(--tree-view-focus-outline-color, rgba(13, 110, 253, 0.75));")
      expect(stylesheet_source).to include("background-color: var(--tree-view-focus-background, rgba(13, 110, 253, 0.12));")
    end
  end

  it "keeps hover styling separate from keyboard focus styling" do
    aggregate_failures do
      expect(stylesheet_source).to include(".tree-toggle__action:hover")
      expect(stylesheet_source).to include("background-color: var(--tree-view-toggle-hover-background, rgba(108, 117, 125, 0.08));")
      expect(stylesheet_source).to include(".tree-toggle__action:focus:not(:focus-visible)")
    end
  end

  it "keeps the LTR branch connector selectors visible for future direction-aware review" do
    aggregate_failures do
      expect(stylesheet_source).to include(<<~CSS.strip)
        .tree-toggle__branch-slot.has-line::before{
          content: "";
          position: absolute;
          top: -0.35rem;
          bottom: -0.35rem;
          left: 50%;
      CSS
      expect(stylesheet_source).to include(<<~CSS.strip)
        .tree-toggle__branch-slot.is-current::after{
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          right: 0;
      CSS
    end
  end

  it "keeps the current-row cue anchored to the first rendered table cell" do
    expect(stylesheet_source).to include(<<~CSS.strip)
      .tree-row[aria-current="page"] > td:first-child{
        box-shadow: inset 3px 0 0 var(--tree-view-current-row-accent-color, rgba(13, 110, 253, 0.45));
      }
    CSS
  end

  it "keeps representative row state cue selectors available for quick-start imports" do
    aggregate_failures do
      expect(stylesheet_source).to include(<<~CSS.strip)
        .tree-row.is-selected,
        .tree-row[aria-selected="true"]{
      CSS
      expect(stylesheet_source).to include(<<~CSS.strip)
        .tree-row.is-collapsed,
        .tree-row[aria-expanded="false"]{
      CSS
      expect(stylesheet_source).to include(<<~CSS.strip)
        .tree-row.is-loading{
      CSS
      expect(stylesheet_source).to include(<<~CSS.strip)
        .tree-row.is-error,
        .tree-row.is-drop-disabled{
      CSS
      expect(stylesheet_source).to include(<<~CSS.strip)
        .tree-row.is-drop-target{
      CSS
    end
  end
end
