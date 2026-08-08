require "spec_helper"
ItemNode = Struct.new(:id, :parent_item_id, :name)
CountryNode = Struct.new(:id, :name, :cities)
CityNode = Struct.new(:id, :name, :recipes)
RecipeNode = Struct.new(:id, :name, :steps)

RSpec.describe TreeView::Tree do
  describe "#descendant_counts" do
    it "counts descendants in records mode" do
      root = ItemNode.new(id: 1, parent_item_id: nil, name: "root")
      child1 = ItemNode.new(id: 2, parent_item_id: 1, name: "child1")
      child2 = ItemNode.new(id: 3, parent_item_id: 1, name: "child2")
      grandchild = ItemNode.new(id: 4, parent_item_id: 2, name: "grandchild")

      tree = described_class.new(records: [root, child1, child2, grandchild], parent_id_method: :parent_item_id)
      counts = tree.descendant_counts

      expect(counts[root.id]).to eq(3)
      expect(counts[child1.id]).to eq(1)
      expect(counts[child2.id]).to eq(0)
      expect(counts[grandchild.id]).to eq(0)
    end

    it "counts descendants across heterogeneous nodes in resolver mode" do
      recipe_step = RecipeNode.new(2, "step-1", [])
      recipe = RecipeNode.new(1, "recipe-1", [recipe_step])
      city = CityNode.new(1, "tokyo", [recipe])
      country = CountryNode.new(1, "japan", [city])

      tree = described_class.new(
        roots: [country],
        children_resolver: ->(node) { node.public_send(node.members.last) }
      )

      counts = tree.descendant_counts
      expect(counts[tree.node_key_for(country)]).to eq(3)
      expect(counts[tree.node_key_for(city)]).to eq(2)
      expect(counts[tree.node_key_for(recipe)]).to eq(1)
      expect(counts[tree.node_key_for(recipe_step)]).to eq(0)
    end

    it "counts descendants in adapter mode" do
      recipe_step = RecipeNode.new(2, "step-1", [])
      recipe = RecipeNode.new(1, "recipe-1", [recipe_step])
      city = CityNode.new(1, "tokyo", [recipe])
      country = CountryNode.new(1, "japan", [city])
      adapter = TreeView::GraphAdapter.new(
        roots: [country],
        children_resolver: ->(node) { node.public_send(node.members.last) }
      )

      tree = described_class.new(adapter: adapter)
      counts = tree.descendant_counts

      expect(counts[tree.node_key_for(country)]).to eq(3)
      expect(counts[tree.node_key_for(city)]).to eq(2)
      expect(counts[tree.node_key_for(recipe)]).to eq(1)
      expect(counts[tree.node_key_for(recipe_step)]).to eq(0)
    end

    it "raises a clear error when a cycle is detected in records mode" do
      node_a = ItemNode.new(id: 1, parent_item_id: 2, name: "a")
      node_b = ItemNode.new(id: 2, parent_item_id: 1, name: "b")
      tree = described_class.new(records: [node_a, node_b], parent_id_method: :parent_item_id)

      expect do
        tree.descendant_counts
      end.to raise_error(ArgumentError, /cycle detected/)
    end
  end

  describe "#root_items" do
    it "sorts roots by descendant counts" do
      small_root = ItemNode.new(id: 1, parent_item_id: nil, name: "small-root")
      large_root = ItemNode.new(id: 2, parent_item_id: nil, name: "large-root")
      child = ItemNode.new(id: 3, parent_item_id: 2, name: "child")

      tree = described_class.new(records: [small_root, large_root, child], parent_id_method: :parent_item_id)

      expect(tree.root_items).to eq([small_root, large_root])
    end

    it "supports a custom sorter for root items" do
      alpha = ItemNode.new(id: 1, parent_item_id: nil, name: "alpha")
      beta = ItemNode.new(id: 2, parent_item_id: nil, name: "beta")
      tree = described_class.new(
        records: [beta, alpha],
        parent_id_method: :parent_item_id,
        sorter: ->(items, _tree) { items.sort_by(&:name).reverse }
      )

      expect(tree.root_items).to eq([beta, alpha])
    end
  end

  describe "#sort_items" do
    it "applies the configured sorter for children as well" do
      root = ItemNode.new(id: 1, parent_item_id: nil, name: "root")
      child_a = ItemNode.new(id: 2, parent_item_id: 1, name: "alpha")
      child_b = ItemNode.new(id: 3, parent_item_id: 1, name: "beta")
      tree = described_class.new(
        records: [root, child_b, child_a],
        parent_id_method: :parent_item_id,
        sorter: ->(items, _tree) { items.sort_by(&:name) }
      )

      expect(tree.sort_items(tree.children_for(root))).to eq([child_a, child_b])
    end

    it "raises a clear error when sorter returns nil" do
      root = ItemNode.new(id: 1, parent_item_id: nil, name: "root")
      tree = described_class.new(
        records: [root],
        parent_id_method: :parent_item_id,
        sorter: ->(_items, _tree) {}
      )

      expect do
        tree.sort_items([root])
      end.to raise_error(ArgumentError, /sorter must return an Array-like object/)
    end

    it "raises clear errors for representative abnormal sorter return patterns" do
      patterns = [
        {
          name: "nil return from root sorting",
          sorter: ->(_items, _tree) {},
          error: /sorter must return an Array-like object, got: NilClass/
        },
        {
          name: "scalar return from root sorting",
          sorter: ->(_items, _tree) { :not_array_like },
          error: /sorter must return an Array-like object, got: Symbol/
        }
      ]

      patterns.each do |pattern|
        root = ItemNode.new(id: 1, parent_item_id: nil, name: pattern.fetch(:name))
        tree = described_class.new(
          records: [root],
          parent_id_method: :parent_item_id,
          sorter: pattern.fetch(:sorter)
        )

        expect do
          tree.root_items
        end.to raise_error(ArgumentError, pattern.fetch(:error)), pattern.fetch(:name)
      end
    end

    it "sorts roots and each child collection independently for representative records" do
      zeta_root = ItemNode.new(id: 1, parent_item_id: nil, name: "zeta-root")
      alpha_root = ItemNode.new(id: 2, parent_item_id: nil, name: "alpha-root")
      zeta_child_b = ItemNode.new(id: 3, parent_item_id: 1, name: "beta-child")
      zeta_child_a = ItemNode.new(id: 4, parent_item_id: 1, name: "alpha-child")
      alpha_child_b = ItemNode.new(id: 5, parent_item_id: 2, name: "delta-child")
      alpha_child_a = ItemNode.new(id: 6, parent_item_id: 2, name: "gamma-child")
      tree = described_class.new(
        records: [zeta_root, alpha_root, zeta_child_b, zeta_child_a, alpha_child_b, alpha_child_a],
        parent_id_method: :parent_item_id,
        sorter: ->(items, _tree) { items.sort_by { |item| [item.name, item.id] } }
      )

      expect(tree.root_items.map(&:id)).to eq([2, 1])
      expect(tree.sort_items(tree.children_for(zeta_root)).map(&:id)).to eq([4, 3])
      expect(tree.sort_items(tree.children_for(alpha_root)).map(&:id)).to eq([5, 6])
    end

    it "accepts array-like sorter return values" do
      root = ItemNode.new(id: 1, parent_item_id: nil, name: "root")
      array_like_items = Struct.new(:items) do
        def to_a
          items
        end
      end
      tree = described_class.new(
        records: [root],
        parent_id_method: :parent_item_id,
        sorter: ->(items, _tree) { array_like_items.new(items) }
      )

      expect(tree.sort_items([root])).to eq([root])
    end
  end

  describe "#node_key_for" do
    it "avoids collisions in resolver mode" do
      country = CountryNode.new(1, "japan", [])
      city = CityNode.new(1, "tokyo", [])
      tree = described_class.new(
        roots: [country],
        children_resolver: ->(node) { node.public_send(node.members.last) }
      )

      expect(tree.node_key_for(country)).not_to eq(tree.node_key_for(city))
    end
  end

  describe "#validate_unique_node_keys!" do
    it "returns true when node keys are unique" do
      root = ItemNode.new(id: 1, parent_item_id: nil, name: "root")
      child = ItemNode.new(id: 2, parent_item_id: 1, name: "child")
      tree = described_class.new(records: [root, child], parent_id_method: :parent_item_id)

      expect(tree.validate_unique_node_keys!).to eq(true)
    end

    it "raises a clear error when records mode has duplicate node keys" do
      root = ItemNode.new(id: 1, parent_item_id: nil, name: "root")
      duplicate_root = ItemNode.new(id: 1, parent_item_id: nil, name: "duplicate-root")
      tree = described_class.new(records: [root, duplicate_root], parent_id_method: :parent_item_id)

      expect do
        tree.validate_unique_node_keys!
      end.to raise_error(ArgumentError, /duplicate node_key detected: 1/)
    end

    it "raises a clear error when resolver mode has duplicate node keys" do
      country = CountryNode.new(1, "japan", [])
      duplicate_country = CountryNode.new(1, "duplicate", [])
      tree = described_class.new(
        roots: [country, duplicate_country],
        children_resolver: ->(node) { node.public_send(node.members.last) }
      )

      expect do
        tree.validate_unique_node_keys!
      end.to raise_error(ArgumentError, /duplicate node_key detected/)
    end

    it "validates node keys during initialization when requested" do
      root = ItemNode.new(id: 1, parent_item_id: nil, name: "root")
      duplicate_root = ItemNode.new(id: 1, parent_item_id: nil, name: "duplicate-root")

      expect do
        described_class.new(records: [root, duplicate_root], parent_id_method: :parent_item_id, validate_node_keys: true)
      end.to raise_error(ArgumentError, /duplicate node_key detected: 1/)
    end

    it "keeps duplicate node keys allowed by default for backward compatibility" do
      root = ItemNode.new(id: 1, parent_item_id: nil, name: "root")
      duplicate_root = ItemNode.new(id: 1, parent_item_id: nil, name: "duplicate-root")

      expect do
        described_class.new(records: [root, duplicate_root], parent_id_method: :parent_item_id)
      end.not_to raise_error
    end
  end

  describe "validation" do
    it "rejects mixing adapter mode with records mode" do
      adapter = TreeView::GraphAdapter.new(
        roots: [CountryNode.new(1, "japan", [])],
        children_resolver: ->(node) { node.public_send(node.members.last) }
      )

      expect do
        described_class.new(adapter: adapter, records: [])
      end.to raise_error(ArgumentError, /adapter mode cannot be combined/)
    end

    it "requires sorter to respond to call" do
      expect do
        described_class.new(records: [], parent_id_method: :parent_item_id, sorter: :name)
      end.to raise_error(ArgumentError, /sorter must respond to call/)
    end
  end
end
