import { Controller } from "@hotwired/stimulus"
import { isTreeViewInteractiveTarget } from "./interactive.js"

export class TreeViewTransferController extends Controller {
  start(event) {
    if (isTreeViewInteractiveTarget(event.target, "drag", this.element)) return

    const row = this.rowFromEvent(event)
    if (!row || row.dataset.treeTransferDisabled === "true") return

    const sourcePayload = this.payloadFromRow(row)
    if (event.dataTransfer && sourcePayload) {
      event.dataTransfer.effectAllowed = "move"
      event.dataTransfer.setData("application/json", JSON.stringify(sourcePayload))
      event.dataTransfer.setData("text/plain", JSON.stringify(sourcePayload))
    }

    this.dispatchTransferEvent("drag-start", {
      sourcePayload,
      sourceRow: row
    })
  }

  over(event) {
    if (isTreeViewInteractiveTarget(event.target, "drag", this.element)) return

    const row = this.rowFromEvent(event)
    if (!row || row.dataset.treeTransferDisabled === "true") return

    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move"

    this.dispatchTransferEvent("drag-over", {
      targetPayload: this.payloadFromRow(row),
      targetRow: row,
      position: this.dropPosition(event, row)
    })
  }

  drop(event) {
    if (isTreeViewInteractiveTarget(event.target, "drag", this.element)) return

    const targetRow = this.rowFromEvent(event)
    if (!targetRow || targetRow.dataset.treeTransferDisabled === "true") return

    event.preventDefault()
    const sourcePayload = this.payloadFromEvent(event)
    const targetPayload = this.payloadFromRow(targetRow)
    const position = this.dropPosition(event, targetRow)

    this.dispatchTransferEvent("drop", {
      sourcePayload,
      targetPayload,
      position,
      targetRow
    })
  }

  dispatchTransferEvent(name, detail) {
    this.dispatch(name, { detail })
  }

  rowFromEvent(event) {
    const target = event.target
    if (!target || !target.closest) return null

    return target.closest("tr[data-tree-depth]")
  }

  payloadFromRow(row) {
    if (!row || !row.dataset.treeTransferPayload) return null

    try {
      return JSON.parse(row.dataset.treeTransferPayload)
    } catch (_error) {
      this.dispatch("invalid-payload", { detail: { value: row.dataset.treeTransferPayload, row } })
      return null
    }
  }

  payloadFromEvent(event) {
    if (!event.dataTransfer) return null

    const value = event.dataTransfer.getData("application/json") || event.dataTransfer.getData("text/plain")
    if (!value) return null

    try {
      return JSON.parse(value)
    } catch (_error) {
      this.dispatch("invalid-transfer", { detail: { value } })
      return null
    }
  }

  dropPosition(event, row) {
    if (!row || typeof row.getBoundingClientRect !== "function") return "inside"

    const rect = row.getBoundingClientRect()
    if (!rect || rect.height === 0) return "inside"

    const offset = event.clientY - rect.top
    if (offset < rect.height / 3) return "before"
    if (offset > (rect.height * 2) / 3) return "after"

    return "inside"
  }
}
