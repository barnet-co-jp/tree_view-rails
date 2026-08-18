require "spec_helper"
require "yaml"

RSpec.describe "tree_view_state_data public API contract" do
  let(:manifest_path) { File.expand_path("../config/public_api_manifest.yml", __dir__) }

  it "tracks tree_view_state_data as a public helper" do
    manifest = YAML.safe_load_file(manifest_path)

    expect(manifest.fetch("helper_methods")).to include("tree_view_state_data")
    expect(TreeViewHelper.public_instance_methods).to include(:tree_view_state_data)
  end
end
