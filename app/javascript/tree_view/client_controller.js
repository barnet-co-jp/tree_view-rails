import { Controller } from "@hotwired/stimulus"

export class TreeViewClientController extends Controller {
  toggle(event) {
    const button = event.currentTarget
    const row = this.rowForButton(button)
    if (!row) return

    const nextExpanded = !this.expanded(row)
    this.setExpanded(row, button, nextExpanded)
    this.refreshRows()
    this.publishStateChange(row, nextExpanded)
  }

  // `tree-view-state:state-changed` は開閉のたびに state controller が発火する契約になっている。
  // client-side の開閉は行の state data を直接書き換えるため、同じ tree 要素の state controller へ通知する。
  // 通知しないと、開閉状態を保存している host app に変更が伝わらない。
  publishStateChange(row, expanded) {
    const state = this.application.getControllerForElementAndIdentifier(this.element, "tree-view-state")
    if (!state) return

    if (expanded) {
      state.markExpanded({ target: row })
    } else {
      state.markCollapsed({ target: row })
    }
  }

  connect() {
    this.refreshRows()
  }

  rowForButton(button) {
    if (!this.ownsElement(button)) return null

    const key = button.dataset.treeViewClientNodeKey
    if (!key) return button.closest("[data-tree-view-client-depth][data-tree-view-client-node-key]")

    return this.rows().find((row) => row.dataset.treeViewClientNodeKey === key)
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
