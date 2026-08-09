import { Application } from "@hotwired/stimulus"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { TreeViewSelectionController, TreeViewTransferController } from "./index.js"

function nextFrame() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe("TreeViewSelectionController integration contracts", () => {
  let application

  beforeEach(async () => {
    document.body.innerHTML = `
      <form id="selection-form">
        <table
          data-controller="tree-view-selection"
          data-tree-view-selection-cascade-value="true"
          data-tree-view-selection-indeterminate-value="true"
          data-tree-view-selection-max-count-value="2"
          data-tree-view-selection-hidden-input-name-value="selected_projects[]"
        >
          <tbody>
            <tr data-tree-depth="0">
              <td><input class="tree-selection-checkbox" type="checkbox" value='{"key":"project:1"}'></td>
            </tr>
            <tr data-tree-depth="1">
              <td><input class="tree-selection-checkbox" type="checkbox" value='{"key":"project:2"}'></td>
            </tr>
            <tr data-tree-depth="1">
              <td><input class="tree-selection-checkbox" type="checkbox" value='{"key":"project:3"}' disabled></td>
            </tr>
            <tr data-tree-depth="0">
              <td><input class="tree-selection-checkbox" type="checkbox" value='{"key":"project:4"}'></td>
            </tr>
          </tbody>
        </table>
      </form>
    `

    application = Application.start()
    application.register("tree-view-selection", TreeViewSelectionController)
    await nextFrame()
  })

  afterEach(() => {
    application.stop()
    document.body.innerHTML = ""
  })

  it("syncs hidden inputs and dispatches selected payload detail", () => {
    const element = document.querySelector("[data-controller='tree-view-selection']")
    const controller = application.getControllerForElementAndIdentifier(element, "tree-view-selection")
    const eventSpy = vi.fn()
    element.addEventListener("tree-view-selection:change", eventSpy)
    const [parent] = document.querySelectorAll(".tree-selection-checkbox")

    parent.checked = true
    controller.toggle({ target: parent })

    expect(eventSpy).toHaveBeenCalledOnce()
    expect(eventSpy.mock.calls[0][0].detail).toMatchObject({
      selectedCount: 2,
      selectedValues: ['{"key":"project:1"}', '{"key":"project:2"}'],
      selectedPayloads: [{ key: "project:1" }, { key: "project:2" }]
    })

    const hiddenInputs = Array.from(
      document.querySelectorAll("#selection-form input[type='hidden'][name='selected_projects[]']")
    )
    expect(hiddenInputs.map((input) => JSON.parse(input.value))).toEqual([
      { key: "project:1" },
      { key: "project:2" }
    ])
    expect(new Set(hiddenInputs.map((input) => input.dataset.treeViewSelectionSourceId)).size).toBe(1)
  })

  it("keeps selector-sensitive source ids isolated when syncing hidden inputs", () => {
    const element = document.querySelector("[data-controller='tree-view-selection']")
    element.dataset.treeViewSelectionSourceId = 'team "alpha" [owner]'
    const controller = application.getControllerForElementAndIdentifier(element, "tree-view-selection")
    const [checkbox] = document.querySelectorAll(".tree-selection-checkbox")

    const unrelatedInput = document.createElement("input")
    unrelatedInput.type = "hidden"
    unrelatedInput.name = "selected_projects[]"
    unrelatedInput.value = JSON.stringify({ key: "keep-me" })
    unrelatedInput.dataset.treeViewSelectionGeneratedHiddenInput = "true"
    unrelatedInput.dataset.treeViewSelectionSourceId = "other source"
    document.querySelector("#selection-form").appendChild(unrelatedInput)

    checkbox.checked = true
    controller.toggle({ target: checkbox })
    checkbox.checked = false
    controller.toggle({ target: checkbox })

    const hiddenInputs = Array.from(
      document.querySelectorAll("#selection-form input[type='hidden'][name='selected_projects[]']")
    )
    expect(hiddenInputs).toEqual([unrelatedInput])
  })

  it("restores the attempted checkbox and reports max-count boundary detail", () => {
    const element = document.querySelector("[data-controller='tree-view-selection']")
    const controller = application.getControllerForElementAndIdentifier(element, "tree-view-selection")
    const eventSpy = vi.fn()
    element.addEventListener("tree-view-selection:limit-exceeded", eventSpy)
    const checkboxes = document.querySelectorAll(".tree-selection-checkbox:not(:disabled)")

    checkboxes[0].checked = true
    checkboxes[1].checked = true
    checkboxes[2].checked = true
    controller.toggle({ target: checkboxes[2] })

    expect(checkboxes[2].checked).toBe(false)
    expect(checkboxes[2].indeterminate).toBe(false)
    expect(eventSpy).toHaveBeenCalledOnce()
    expect(eventSpy.mock.calls[0][0].detail).toMatchObject({
      maxCount: 2,
      attemptedCount: 3,
      attemptedChecked: true,
      checkbox: checkboxes[2]
    })
  })

  it("dispatches invalid-payload detail for malformed checkbox values", () => {
    const element = document.querySelector("[data-controller='tree-view-selection']")
    const controller = application.getControllerForElementAndIdentifier(element, "tree-view-selection")
    const eventSpy = vi.fn()
    element.addEventListener("tree-view-selection:invalid-payload", eventSpy)
    const [checkbox] = document.querySelectorAll(".tree-selection-checkbox")

    checkbox.checked = true
    checkbox.value = "not-json"

    expect(controller.selectedPayloads()).toEqual([])
    expect(eventSpy).toHaveBeenCalledOnce()
    expect(eventSpy.mock.calls[0][0].detail).toMatchObject({
      value: "not-json",
      checkbox
    })
  })
})

describe("TreeViewTransferController integration contracts", () => {
  let application

  beforeEach(async () => {
    document.body.innerHTML = `
      <table data-controller="tree-view-transfer">
        <tbody>
          <tr id="source-row" data-tree-depth="0" data-tree-transfer-payload='{"key":"project:1"}'>
            <td><button class="action-button" type="button">Edit</button></td>
          </tr>
          <tr id="target-row" data-tree-depth="0" data-tree-transfer-payload='{"key":"project:2"}'></tr>
          <tr id="disabled-row" data-tree-depth="0" data-tree-transfer-disabled="true" data-tree-transfer-payload='{"key":"project:3"}'></tr>
        </tbody>
      </table>
    `

    application = Application.start()
    application.register("tree-view-transfer", TreeViewTransferController)
    await nextFrame()
  })

  afterEach(() => {
    application.stop()
    document.body.innerHTML = ""
  })

  it("does not emit transfer events for disabled rows", () => {
    const element = document.querySelector("[data-controller='tree-view-transfer']")
    const controller = application.getControllerForElementAndIdentifier(element, "tree-view-transfer")
    const dragStartSpy = vi.fn()
    const dragOverSpy = vi.fn()
    const dropSpy = vi.fn()
    element.addEventListener("tree-view-transfer:drag-start", dragStartSpy)
    element.addEventListener("tree-view-transfer:drag-over", dragOverSpy)
    element.addEventListener("tree-view-transfer:drop", dropSpy)
    const disabledRow = document.querySelector("#disabled-row")
    const dataTransfer = {
      dropEffect: null,
      effectAllowed: null,
      getData: vi.fn(),
      setData: vi.fn()
    }
    const preventDefault = vi.fn()

    controller.start({ target: disabledRow, dataTransfer })
    controller.over({ target: disabledRow, dataTransfer, preventDefault })
    controller.drop({ target: disabledRow, dataTransfer, preventDefault })

    expect(dataTransfer.effectAllowed).toBeNull()
    expect(dataTransfer.dropEffect).toBeNull()
    expect(dataTransfer.setData).not.toHaveBeenCalled()
    expect(dataTransfer.getData).not.toHaveBeenCalled()
    expect(preventDefault).not.toHaveBeenCalled()
    expect(dragStartSpy).not.toHaveBeenCalled()
    expect(dragOverSpy).not.toHaveBeenCalled()
    expect(dropSpy).not.toHaveBeenCalled()
  })

  it("ignores drag-over and drop from interactive targets", () => {
    const element = document.querySelector("[data-controller='tree-view-transfer']")
    const controller = application.getControllerForElementAndIdentifier(element, "tree-view-transfer")
    const targetRow = document.querySelector("#target-row")
    targetRow.insertAdjacentHTML(
      "beforeend",
      `
        <button id="interactive-button" type="button">Edit</button>
        <span id="interactive-marker" data-tree-view-interactive="true">Picker</span>
        <span id="ignore-drag-marker" data-tree-view-ignore-drag="true">Drag-safe</span>
      `
    )
    const interactiveTargets = [
      document.querySelector("#interactive-button"),
      document.querySelector("#interactive-marker"),
      document.querySelector("#ignore-drag-marker")
    ]

    const dragOverSpy = vi.fn()
    const dropSpy = vi.fn()
    const invalidTransferSpy = vi.fn()
    element.addEventListener("tree-view-transfer:drag-over", dragOverSpy)
    element.addEventListener("tree-view-transfer:drop", dropSpy)
    element.addEventListener("tree-view-transfer:invalid-transfer", invalidTransferSpy)

    for (const target of interactiveTargets) {
      const dataTransfer = { dropEffect: null, getData: vi.fn(() => "not-json") }
      const preventDefault = vi.fn()

      controller.over({ target, dataTransfer, preventDefault })
      controller.drop({ target, dataTransfer, preventDefault })

      expect(dataTransfer.dropEffect).toBeNull()
      expect(dataTransfer.getData).not.toHaveBeenCalled()
      expect(preventDefault).not.toHaveBeenCalled()
    }
    expect(dragOverSpy).not.toHaveBeenCalled()
    expect(dropSpy).not.toHaveBeenCalled()
    expect(invalidTransferSpy).not.toHaveBeenCalled()
  })

  it("reports malformed source row payloads", () => {
    const element = document.querySelector("[data-controller='tree-view-transfer']")
    const controller = application.getControllerForElementAndIdentifier(element, "tree-view-transfer")
    const eventSpy = vi.fn()
    element.addEventListener("tree-view-transfer:invalid-payload", eventSpy)
    const sourceRow = document.querySelector("#source-row")
    sourceRow.dataset.treeTransferPayload = "not-json"

    controller.start({
      target: sourceRow,
      dataTransfer: {
        effectAllowed: null,
        setData: vi.fn()
      }
    })

    expect(eventSpy).toHaveBeenCalledOnce()
    expect(eventSpy.mock.calls[0][0].detail).toMatchObject({
      value: "not-json",
      row: sourceRow
    })
  })

  it("reports malformed transfer data during drop", () => {
    const element = document.querySelector("[data-controller='tree-view-transfer']")
    const controller = application.getControllerForElementAndIdentifier(element, "tree-view-transfer")
    const eventSpy = vi.fn()
    element.addEventListener("tree-view-transfer:invalid-transfer", eventSpy)

    controller.drop({
      target: document.querySelector("#target-row"),
      clientY: 45,
      preventDefault: vi.fn(),
      dataTransfer: {
        getData: (type) => (type === "application/json" ? "not-json" : "")
      }
    })

    expect(eventSpy).toHaveBeenCalledOnce()
    expect(eventSpy.mock.calls[0][0].detail).toMatchObject({ value: "not-json" })
  })

  it("dispatches drag-over detail and marks the transfer as move", () => {
    const element = document.querySelector("[data-controller='tree-view-transfer']")
    const controller = application.getControllerForElementAndIdentifier(element, "tree-view-transfer")
    const targetRow = document.querySelector("#target-row")
    targetRow.getBoundingClientRect = () => ({ top: 0, height: 90 })
    const eventSpy = vi.fn()
    element.addEventListener("tree-view-transfer:drag-over", eventSpy)
    const dataTransfer = { dropEffect: null }
    const preventDefault = vi.fn()

    controller.over({
      target: targetRow,
      clientY: 10,
      preventDefault,
      dataTransfer
    })

    expect(preventDefault).toHaveBeenCalledOnce()
    expect(dataTransfer.dropEffect).toBe("move")
    expect(eventSpy).toHaveBeenCalledOnce()
    expect(eventSpy.mock.calls[0][0].detail).toMatchObject({
      targetPayload: { key: "project:2" },
      targetRow,
      position: "before"
    })
  })
})
