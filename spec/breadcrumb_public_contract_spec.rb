# frozen_string_literal: true

require "spec_helper"
require "action_view"
require "yaml"

BreadcrumbPublicContractNode = Struct.new(:id, :parent_id, :name)
BREADCRUMB_PUBLIC_API_MANIFEST_PATH = File.expand_path("../config/public_api_manifest.yml", __dir__)

RSpec.describe "Breadcrumb public contract" do
  def manifest
    @manifest ||= YAML.safe_load_file(BREADCRUMB_PUBLIC_API_MANIFEST_PATH)
  end

  def helper
    view = ActionView::Base.empty
    view.extend(TreeViewBreadcrumbHelper)
    view
  end

  def breadcrumb_helper_keyword_option_keys
    TreeViewBreadcrumbHelper.instance_method(:tree_view_breadcrumb).parameters.filter_map do |parameter_type, parameter_name|
      parameter_name.to_s if %i[key keyreq].include?(parameter_type)
    end
  end

  def records_tree_with_child
    root = BreadcrumbPublicContractNode.new(id: 1, parent_id: nil, name: "Root")
    child = BreadcrumbPublicContractNode.new(id: 2, parent_id: 1, name: "Child")

    [TreeView::Tree.new(records: [root, child], parent_id_method: :parent_id), child]
  end

  it "keeps the manifest-backed breadcrumb option keys aligned with the helper signature" do
    manifest_keys = manifest.fetch("helper_option_keys").fetch("tree_view_breadcrumb")

    expect(manifest_keys).to eq(breadcrumb_helper_keyword_option_keys)
  end

  it "keeps current item semantics and HTML merge hooks available" do
    tree, current_item = records_tree_with_child
    html = helper.tree_view_breadcrumb(
      tree,
      current_item,
      label_builder: ->(item) { item.name },
      path_builder: ->(item) { "/nodes/#{item.id}" },
      html: {data: {controller: "breadcrumb-analytics"}},
      list_html: {data: {breadcrumb_list: true}},
      item_html: ->(item) { {data: {breadcrumb_item_id: item.id}} },
      link_html: ->(item) { {data: {breadcrumb_link_id: item.id}, rel: "up"} },
      current_html: ->(item) { {data: {breadcrumb_current_id: item.id}} },
      separator_html: ->(item) { {data: {breadcrumb_separator_for: item.id}} }
    ).to_s

    expect(html).to include("data-controller=\"breadcrumb-analytics\"")
    expect(html).to include("data-breadcrumb-list=\"true\"")
    expect(html).to include("data-breadcrumb-item-id=\"1\"")
    expect(html).to include("data-breadcrumb-item-id=\"2\"")
    expect(html).to include("href=\"/nodes/1\"")
    expect(html).to include("rel=\"up\"")
    expect(html).to include("data-breadcrumb-link-id=\"1\"")
    expect(html).to include("aria-current=\"page\"")
    expect(html).to include("data-breadcrumb-current-id=\"2\"")
    expect(html).to include("data-breadcrumb-separator-for=\"1\"")
    expect(html).not_to include("href=\"/nodes/2\"")
  end

  it "delegates unsupported path handling to the tree path lookup" do
    tree = instance_double(TreeView::Tree)

    allow(tree).to receive(:path_for).and_raise(TreeView::InvalidTreeError, "breadcrumb path is unsupported")

    expect do
      helper.tree_view_breadcrumb(tree, :item, label_builder: ->(item) { item.to_s })
    end.to raise_error(TreeView::InvalidTreeError, "breadcrumb path is unsupported")
  end
end
