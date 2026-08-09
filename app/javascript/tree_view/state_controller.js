import { Controller } from "@hotwired/stimulus"
import { isTreeViewInteractiveTarget } from "./interactive.js"

export class TreeViewStateController extends Controller {
  static targets = ["node"]
  static values = {
    viewKey: String,
    keyboard: Boolean
  }

  connect() {
    if (this.keyboardValue) this.prepareKeyboardNavigation()
    this.dispatchStateChanged("connect")
  }

  expandedKeys() {
    return this.nodeTargets
      .filter((node) => node.dataset.treeViewStateExpanded === "true")
      .map((node) => node.dataset.treeViewStateNodeKey)
      .filter((key) => key && key.length > 0)
  }

  markExpanded(event) {
    this.setExpandedFromEvent(event, true)
  }

  markCollapsed(event) {
    this.setExpandedFromEvent(event, false)
  }

  refresh() {
    if (this.keyboardValue) this.prepareKeyboardNavigation()
    this.dispatchStateChanged("refresh")
  }

  keydown(event) {
    if (!this.keyboardValue) return
    if (isTreeViewInteractiveTarget(event.target, "keyboard", this.element)) return

    const row = this.currentNode(event)
    if (!row) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      this.focusRelativeNode(row, 1)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      this.focusRelativeNode(row, -1)
    } else if (event.key === "Home") {
      event.preventDefault()
      this.focusBoundaryNode("first")
    } else if (event.key === "End") {
      event.preventDefault()
      this.focusBoundaryNode("last")
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      this.activateToggle(row, "show")
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      this.activateToggle(row, "hide")
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      this.activateToggle(row)
    }
  }

  setExpandedFromEvent(event, expanded) {
    const node = this.findNodeFromEvent(event)
    if (!node) return

    node.dataset.treeViewStateExpanded = expanded ? "true" : "false"
    this.dispatchStateChanged(expanded ? "expanded" : "collapsed")
  }

  findNodeFromEvent(event) {
    const target = event.target
    if (!target || !target.closest) return null

    return target.closest("[data-tree-view-state-target~='node']")
  }

  dispatchStateChanged(reason) {
    this.dispatch("state-changed", {
      detail: {
        viewKey: this.hasViewKeyValue ? this.viewKeyValue : null,
        expandedKeys: this.expandedKeys(),
        reason
      }
    })
  }

  prepareKeyboardNavigation() {
    if (!this.element.hasAttribute("tabindex")) this.element.tabIndex = 0
    this.nodeTargets.forEach((node) => {
      if (!node.hasAttribute("tabindex")) node.tabIndex = -1
    })
  }

  currentNode(event) {
    const target = event.target
    if (target && target.closest) {
      const row = target.closest("[data-tree-view-state-target~='node']")
      if (row) return row
    }

    return this.visibleNodes()[0] || null
  }

  visibleNodes() {
    return this.nodeTargets.filter((node) => node.offsetParent !== null)
  }

  focusRelativeNode(row, offset) {
    const nodes = this.visibleNodes()
    const index = nodes.indexOf(row)
    if (index === -1) return

    const next = nodes[index + offset]
    if (next) next.focus()
  }

  focusBoundaryNode(position) {
    const nodes = this.visibleNodes()
    const node = position === "first" ? nodes[0] : nodes[nodes.length - 1]
    if (node) node.focus()
  }

  activateToggle(row, preferredAction = null) {
    const clientButton = row.querySelector(".tree-toggle__client-action")
    if (clientButton) {
      const expanded = row.dataset.treeViewStateExpanded === "true"
      if (preferredAction === "show" && expanded) return
      if (preferredAction === "hide" && !expanded) return

      clientButton.click()
      return
    }

    // Preserve legacy static/turbo row markup as a private DOM compatibility fallback.
    // The client action selector remains authoritative and the legacy classes are not public hooks.
    const showButton = row.querySelector(".show-button")
    const hideButton = row.querySelector(".remove-button")
    const button = preferredAction === "show" ? showButton : preferredAction === "hide" ? hideButton : showButton || hideButton
    if (button) button.click()
  }
}
