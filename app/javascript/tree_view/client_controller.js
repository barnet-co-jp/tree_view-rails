import { Controller } from "@hotwired/stimulus"

export class TreeViewClientController extends Controller {
  static values = {
    expandedKeys: Array
  }

  toggle(event) {
    const button = event.currentTarget
    const row = this.rowForButton(button)
    if (!row) return

    const nextExpanded = !this.expanded(row)
    this.setExpanded(row, button, nextExpanded)
    this.refreshRows()
  }

  connect() {
    if (this.hasExpandedKeysValue) {
      this.applyExpandedKeys(this.expandedKeysValue)
    } else {
      this.refreshRows()
    }
  }

  expandedKeysValueChanged(value) {
    if (!this.hasExpandedKeysValue) return

    this.applyExpandedKeys(value)
  }

  applyExpandedKeys(keys) {
    const expandedKeys = new Set(Array.from(keys || [], (key) => String(key)))

    this.rows().forEach((row) => {
      const button = this.toggleButtonForRow(row)
      if (!button) return

      this.setExpanded(row, button, expandedKeys.has(String(row.dataset.treeViewClientNodeKey)))
    })

    this.refreshRows()
  }

  rowForButton(button) {
    if (!this.ownsElement(button)) return null

    const key = button.dataset.treeViewClientNodeKey
    if (!key) return button.closest("[data-tree-view-client-depth][data-tree-view-client-node-key]")

    return this.rows().find((row) => row.dataset.treeViewClientNodeKey === key)
  }

  toggleButtonForRow(row) {
    const key = row.dataset.treeViewClientNodeKey
    if (!key) return null

    return Array.from(this.element.querySelectorAll("[data-action~='tree-view-client#toggle']")).find((button) => (
      this.ownsElement(button) && button.dataset.treeViewClientNodeKey === key
    )) || null
  }

  rows() {
    return Array.from(this.element.querySelectorAll("[data-tree-view-client-depth][data-tree-view-client-node-key]")).filter((row) => this.ownsElement(row))
  }

  ownsElement(element) {
    return element?.closest("[data-controller~='tree-view-client']") === this.element
  }

  expanded(row) {
    return row.dataset.treeViewClientExpanded === "true"
  }

  setExpanded(row, button, expanded) {
    const value = expanded ? "true" : "false"
    row.dataset.treeViewClientExpanded = value
    row.dataset.treeViewStateExpanded = value
    row.setAttribute("aria-expanded", value)
    if (button) button.setAttribute("aria-expanded", value)
    this.setHiddenCountVisible(row.dataset.treeViewClientNodeKey, !expanded)
  }

  setHiddenCountVisible(nodeKey, visible) {
    if (!nodeKey) return

    this.element
      .querySelectorAll("[data-tree-view-client-hidden-count-for]")
      .forEach((element) => {
        if (this.ownsElement(element) && element.dataset.treeViewClientHiddenCountFor === String(nodeKey)) {
          element.hidden = !visible
        }
      })
  }

  refreshRows() {
    const collapsedDepths = []

    this.rows().forEach((row) => {
      const depth = Number.parseInt(row.dataset.treeViewClientDepth || "0", 10)

      while (collapsedDepths.length > 0 && collapsedDepths[collapsedDepths.length - 1] >= depth) {
        collapsedDepths.pop()
      }

      const hiddenByAncestor = collapsedDepths.length > 0
      row.hidden = hiddenByAncestor
      this.setHiddenCountVisible(row.dataset.treeViewClientNodeKey, !this.expanded(row))

      if (!this.expanded(row)) {
        collapsedDepths.push(depth)
      }
    })
  }
}
