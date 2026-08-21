import { Application } from "@hotwired/stimulus"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { TreeViewTransferController } from "./index.js"

function nextFrame() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function branchClasses(row) {
  return Array.from(row.querySelectorAll(".tree-toggle__branch-slot"), (slot) => Array.from(slot.classList))
}

describe("TreeViewTransferController#refreshBranches", () => {
  let application
  let controller

  beforeEach(async () => {
    document.body.innerHTML = `
      <table>
        <tbody id="tree" data-controller="tree-view-transfer">
          <tr id="root" data-tree-depth="0"><td><div class="tree-toggle__branches"></div></td></tr>
          <tr id="a" data-tree-depth="1"><td><div class="tree-toggle__branches"><span class="tree-toggle__branch-slot is-current is-middle"></span></div></td></tr>
          <tr id="a1" data-tree-depth="2"><td><div class="tree-toggle__branches"><span class="tree-toggle__branch-slot has-line"></span><span class="tree-toggle__branch-slot is-current is-middle"></span></div></td></tr>
          <tr id="a2" data-tree-depth="2"><td><div class="tree-toggle__branches"><span class="tree-toggle__branch-slot has-line"></span><span class="tree-toggle__branch-slot is-current is-last"></span></div></td></tr>
          <tr id="b" data-tree-depth="1"><td><div class="tree-toggle__branches"><span class="tree-toggle__branch-slot is-current is-last"></span></div></td></tr>
        </tbody>
      </table>
    `

    application = Application.start()
    application.register("tree-view-transfer", TreeViewTransferController)
    await nextFrame()

    controller = application.getControllerForElementAndIdentifier(
      document.querySelector("#tree"),
      "tree-view-transfer"
    )
  })

  afterEach(() => {
    application.stop()
    document.body.innerHTML = ""
  })

  it("rebuilds current and ancestor branch cues from the current DOM order", () => {
    const tree = document.querySelector("#tree")
    const a = document.querySelector("#a")
    const b = document.querySelector("#b")

    tree.insertBefore(b, a)

    expect(controller.refreshBranches()).toBe(5)

    expect(branchClasses(document.querySelector("#root"))).toEqual([])
    expect(branchClasses(b)).toEqual([["tree-toggle__branch-slot", "is-current", "is-middle"]])
    expect(branchClasses(a)).toEqual([["tree-toggle__branch-slot", "is-current", "is-last"]])
    expect(branchClasses(document.querySelector("#a1"))).toEqual([
      ["tree-toggle__branch-slot", "is-empty"],
      ["tree-toggle__branch-slot", "is-current", "is-middle"]
    ])
    expect(branchClasses(document.querySelector("#a2"))).toEqual([
      ["tree-toggle__branch-slot", "is-empty"],
      ["tree-toggle__branch-slot", "is-current", "is-last"]
    ])
  })

  it("does not rewrite rows owned by a nested transfer controller", async () => {
    const nestedRow = document.createElement("tr")
    nestedRow.id = "nested-row"
    nestedRow.dataset.treeDepth = "1"
    nestedRow.innerHTML = `<td><div class="tree-toggle__branches"><span class="tree-toggle__branch-slot nested-sentinel"></span></div></td>`

    const nestedBody = document.createElement("tbody")
    nestedBody.dataset.controller = "tree-view-transfer"
    nestedBody.append(nestedRow)

    const nestedTable = document.createElement("table")
    nestedTable.append(nestedBody)
    document.querySelector("#root td").append(nestedTable)
    await nextFrame()

    controller.refreshBranches()

    expect(branchClasses(nestedRow)).toEqual([["tree-toggle__branch-slot", "nested-sentinel"]])
  })
})
