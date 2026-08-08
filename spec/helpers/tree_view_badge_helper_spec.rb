require "spec_helper"
BadgeNode = Struct.new(:id, :name)

RSpec.describe "TreeView badge helper" do
  let(:helper_host_class) do
    Class.new do
      include TreeViewHelper
    end
  end

  let(:helper) { helper_host_class.new }
  let(:node) { BadgeNode.new(id: 1, name: "root") }

  it "builds badge data from plain text" do
    badge = helper.tree_node_badge(node, ->(_item) { "2" })

    expect(badge).to eq(text: "2", class: [], title: nil, data: {})
  end

  it "builds badge data from a hash-like value" do
    badge = helper.tree_node_badge(
      node,
      ->(_item) { {text: "new", class: "is-new", title: "New"} }
    )

    expect(badge).to eq(text: "new", class: ["is-new"], title: "New", data: {})
  end

  it "returns nil when badge text is blank" do
    expect(helper.tree_node_badge(node, ->(_item) { {text: ""} })).to be_nil
  end
end
