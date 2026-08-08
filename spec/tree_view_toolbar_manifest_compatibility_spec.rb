# frozen_string_literal: true

require "spec_helper"
require "yaml"

TREE_VIEW_TOOLBAR_MANIFEST_COMPATIBILITY_PATH = File.expand_path("../config/public_api_manifest.yml", __dir__)
TreeViewToolbarManifestRenderState = Struct.new(:ui_config)

RSpec.describe "TreeView toolbar manifest compatibility" do
  def public_api_manifest
    @public_api_manifest ||= YAML.safe_load_file(TREE_VIEW_TOOLBAR_MANIFEST_COMPATIBILITY_PATH)
  end

  def toolbar_actions_manifest
    public_api_manifest.fetch("toolbar_actions").transform_keys(&:to_sym).transform_values(&:to_sym)
  end

  def helper
    @helper ||= Class.new do
      include TreeViewHelper
    end.new
  end

  it "keeps toolbar supported actions aligned with the public manifest" do
    expect(helper.tree_view_toolbar_supported_actions).to eq(toolbar_actions_manifest.keys)
  end

  it "keeps toolbar action metadata state and data hooks aligned with the public manifest" do
    path_config = Class.new do
      def toggle_all_path(state:)
        "/tree?state=#{state}"
      end
    end.new
    render_state = TreeViewToolbarManifestRenderState.new(ui_config: path_config)

    toolbar_actions_manifest.each do |action, state|
      metadata = helper.tree_view_toolbar_action_metadata(render_state, action)

      expect(metadata).to include(
        action: action,
        state: state,
        path: "/tree?state=#{state}",
        disabled: false
      )
      expect(metadata.fetch(:data)).to include(tree_view_toolbar_action: action)
      expect(metadata.fetch(:data)).not_to have_key(:tree_view_toolbar_disabled)
    end
  end

  it "keeps disabled toolbar action data hooks stable when no toggle path is available" do
    action = toolbar_actions_manifest.keys.first
    render_state = TreeViewToolbarManifestRenderState.new(ui_config: Object.new)
    metadata = helper.tree_view_toolbar_action_metadata(render_state, action)

    expect(metadata).to include(action: action, path: nil, disabled: true)
    expect(metadata.fetch(:data)).to include(
      tree_view_toolbar_action: action,
      tree_view_toolbar_disabled: true
    )
  end
end
