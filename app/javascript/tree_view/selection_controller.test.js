import { Application } from "@hotwired/stimulus"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { TreeViewSelectionController } from "./selection_controller.js"

const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

const hiddenInputs = (form) =>
  Array.from(form.querySelectorAll('input[type="hidden"][data-tree-view-selection-generated-hidden-input="true"]'))

const hiddenInputValues = (form) => hiddenInputs(form).map((input) => input.value)

const selectionChangeDetails = (element) => {
  const details = []
  element.addEventListener("tree-view-selection:change", (event) => details.push(event.detail))
  return details
}

describe("TreeViewSelectionController", () => {
  let application

  beforeEach(() => {
    document.body.innerHTML = ""
    application = Application.start()
    application.register("tree-view-selection", TreeViewSelectionController)
  })

  afterEach(() => {
    application.stop()
    document.body.innerHTML = ""
  })

  const mountSelectionFixture = async (
    nodes,
    { cascade = false, indeterminate = false } = {}
  ) => {
    document.body.innerHTML = `
      <table>
        <tbody
          id="selection-fixture"
          data-controller="tree-view-selection"
          ${cascade ? 'data-tree-view-selection-cascade-value="true"' : ""}
          ${indeterminate ? 'data-tree-view-selection-indeterminate-value="true"' : ""}>
          ${nodes.map(({ id, depth, checked, disabled }) => `
            <tr data-tree-depth="${depth}">
              <td>
                <input
                  id="${id}"
                  class="tree-selection-checkbox"
                  type="checkbox"
                  value='${JSON.stringify({ id })}'
                  ${checked ? "checked" : ""}
                  ${disabled ? "disabled" : ""}>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `

    await flush()

    const element = document.getElementById("selection-fixture")
    return application.getControllerForElementAndIdentifier(element, "tree-view-selection")
  }

  const selectionSnapshot = () =>
    Array.from(document.querySelectorAll(".tree-selection-checkbox")).map((checkbox) => ({
      id: checkbox.id,
      depth: Number.parseInt(checkbox.closest("tr").dataset.treeDepth, 10),
      checked: checkbox.checked,
      indeterminate: checkbox.indeterminate,
      disabled: checkbox.disabled
    }))

  it("mirrors checked payloads into hidden inputs on the nearest form", async () => {
    document.body.innerHTML = `
      <form id="bulk-form">
        <table>
          <tbody
            data-controller="tree-view-selection"
            data-action="change->tree-view-selection#toggle"
            data-tree-view-selection-hidden-input-name-value="selected_nodes[]">
            <tr data-tree-depth="0">
              <td>
                <input
                  id="node-1"
                  class="tree-selection-checkbox"
                  type="checkbox"
                  checked
                  value='{"id":1,"kind":"document"}'>
              </td>
            </tr>
            <tr data-tree-depth="0">
              <td>
                <input
                  id="node-2"
                  class="tree-selection-checkbox"
                  type="checkbox"
                  value='{"id":2,"kind":"document"}'>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    `

    await flush()

    const form = document.getElementById("bulk-form")
    expect(hiddenInputValues(form)).toEqual(['{"id":1,"kind":"document"}'])

    const second = document.getElementById("node-2")
    second.checked = true
    second.dispatchEvent(new Event("change", { bubbles: true }))

    await flush()

    expect(hiddenInputValues(form)).toEqual([
      '{"id":1,"kind":"document"}',
      '{"id":2,"kind":"document"}'
    ])
  })

  it("syncs selected count targets on connect and checkbox changes", async () => {
    document.body.innerHTML = `
      <table>
        <tbody
          data-controller="tree-view-selection"
          data-action="change->tree-view-selection#toggle">
          <tr data-tree-depth="0">
            <td>
              <span id="count" data-tree-view-selection-target="selectedCount">pending</span>
              <span id="toolbar-count" data-tree-view-selection-target="selectedCount">pending</span>
            </td>
            <td>
              <input
                id="node-1"
                class="tree-selection-checkbox"
                type="checkbox"
                checked
                value='{"id":1}'>
            </td>
          </tr>
          <tr data-tree-depth="0">
            <td></td>
            <td>
              <input
                id="node-2"
                class="tree-selection-checkbox"
                type="checkbox"
                value='{"id":2}'>
            </td>
          </tr>
        </tbody>
      </table>
    `

    await flush()

    expect(document.getElementById("count").textContent).toBe("1")
    expect(document.getElementById("toolbar-count").textContent).toBe("1")

    const second = document.getElementById("node-2")
    second.checked = true
    second.dispatchEvent(new Event("change", { bubbles: true }))

    await flush()

    expect(document.getElementById("count").textContent).toBe("2")
    expect(document.getElementById("toolbar-count").textContent).toBe("2")
  })

  it("keeps selected count targets aligned after max-count rollback", async () => {
    document.body.innerHTML = `
      <table>
        <tbody
          data-controller="tree-view-selection"
          data-action="change->tree-view-selection#toggle"
          data-tree-view-selection-max-count-value="1">
          <tr data-tree-depth="0">
            <td><span id="count" data-tree-view-selection-target="selectedCount">pending</span></td>
            <td>
              <input
                id="node-1"
                class="tree-selection-checkbox"
                type="checkbox"
                checked
                value='{"id":1}'>
            </td>
          </tr>
          <tr data-tree-depth="0">
            <td></td>
            <td>
              <input
                id="node-2"
                class="tree-selection-checkbox"
                type="checkbox"
                value='{"id":2}'>
            </td>
          </tr>
        </tbody>
      </table>
    `

    await flush()

    const second = document.getElementById("node-2")
    second.checked = true
    second.dispatchEvent(new Event("change", { bubbles: true }))

    await flush()

    expect(second.checked).toBe(false)
    expect(document.getElementById("count").textContent).toBe("1")
  })

  it("skips disabled and invalid payloads when syncing hidden inputs", async () => {
    document.body.innerHTML = `
      <form id="bulk-form">
        <table>
          <tbody
            data-controller="tree-view-selection"
            data-tree-view-selection-hidden-input-name-value="selected_nodes[]">
            <tr data-tree-depth="0">
              <td>
                <input
                  class="tree-selection-checkbox"
                  type="checkbox"
                  checked
                  value='{"id":1}'>
              </td>
            </tr>
            <tr data-tree-depth="0">
              <td>
                <input
                  class="tree-selection-checkbox"
                  type="checkbox"
                  checked
                  value='not-json'>
              </td>
            </tr>
            <tr data-tree-depth="0">
              <td>
                <input
                  class="tree-selection-checkbox"
                  type="checkbox"
                  checked
                  disabled
                  value='{"id":3}'>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    `

    await flush()

    const form = document.getElementById("bulk-form")
    expect(hiddenInputValues(form)).toEqual(['{"id":1}'])
  })

  it("removes only its own generated hidden inputs when disconnected", async () => {
    document.body.innerHTML = `
      <form id="bulk-form">
        <table>
          <tbody
            id="first-selection"
            data-controller="tree-view-selection"
            data-tree-view-selection-hidden-input-name-value="selected_nodes[]">
            <tr data-tree-depth="0">
              <td>
                <input
                  class="tree-selection-checkbox"
                  type="checkbox"
                  checked
                  value='{"id":1}'>
              </td>
            </tr>
          </tbody>
          <tbody
            id="second-selection"
            data-controller="tree-view-selection"
            data-tree-view-selection-hidden-input-name-value="selected_nodes[]">
            <tr data-tree-depth="0">
              <td>
                <input
                  class="tree-selection-checkbox"
                  type="checkbox"
                  checked
                  value='{"id":2}'>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    `

    await flush()

    const form = document.getElementById("bulk-form")
    expect(hiddenInputValues(form)).toEqual(['{"id":1}', '{"id":2}'])

    document.getElementById("first-selection").remove()
    await flush()

    expect(hiddenInputValues(form)).toEqual(['{"id":2}'])
    expect(hiddenInputs(form)[0].dataset.treeViewSelectionSourceId).toBe(
      document.getElementById("second-selection").dataset.treeViewSelectionSourceId
    )
  })

  it("does not raise on disconnect when hidden input sync is disabled", async () => {
    document.body.innerHTML = `
      <form id="bulk-form">
        <table>
          <tbody id="selection" data-controller="tree-view-selection">
            <tr data-tree-depth="0">
              <td>
                <input
                  class="tree-selection-checkbox"
                  type="checkbox"
                  checked
                  value='{"id":1}'>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    `

    await flush()

    const selection = document.getElementById("selection")
    expect(() => selection.remove()).not.toThrow()
    await flush()

    expect(hiddenInputValues(document.getElementById("bulk-form"))).toEqual([])
  })

  it("marks initial and explicit refresh selection changes as source-less", async () => {
    document.body.innerHTML = `
      <table>
        <tbody id="selection" data-controller="tree-view-selection">
          <tr data-tree-depth="0">
            <td>
              <input
                class="tree-selection-checkbox"
                type="checkbox"
                checked
                value='{"id":1}'>
            </td>
          </tr>
        </tbody>
      </table>
    `

    const selection = document.getElementById("selection")
    const changes = selectionChangeDetails(selection)

    await flush()

    expect(changes[0]).toMatchObject({
      selectedCount: 1,
      selectedValues: ['{"id":1}'],
      selectedPayloads: [{ id: 1 }],
      sourceCheckbox: null,
      attemptedChecked: null
    })

    const controller = application.getControllerForElementAndIdentifier(selection, "tree-view-selection")
    controller.refresh()

    expect(changes.at(-1)).toMatchObject({
      selectedCount: 1,
      sourceCheckbox: null,
      attemptedChecked: null
    })
  })

  it("includes the source checkbox and attempted checked state on toggle changes", async () => {
    document.body.innerHTML = `
      <table>
        <tbody
          id="selection"
          data-controller="tree-view-selection"
          data-action="change->tree-view-selection#toggle">
          <tr data-tree-depth="0">
            <td>
              <input
                id="node-1"
                class="tree-selection-checkbox"
                type="checkbox"
                value='{"id":1}'>
            </td>
          </tr>
          <tr data-tree-depth="0">
            <td>
              <input
                id="node-2"
                class="tree-selection-checkbox"
                type="checkbox"
                checked
                value='{"id":2}'>
            </td>
          </tr>
        </tbody>
      </table>
    `

    const selection = document.getElementById("selection")
    const changes = selectionChangeDetails(selection)

    await flush()
    changes.length = 0

    const first = document.getElementById("node-1")
    first.checked = true
    first.dispatchEvent(new Event("change", { bubbles: true }))

    expect(changes.at(-1)).toMatchObject({
      selectedCount: 2,
      selectedValues: ['{"id":1}', '{"id":2}'],
      selectedPayloads: [{ id: 1 }, { id: 2 }],
      sourceCheckbox: first,
      attemptedChecked: true
    })
  })

  it("keeps cascade selection changes tied to the checkbox the user toggled", async () => {
    document.body.innerHTML = `
      <table>
        <tbody
          id="selection"
          data-controller="tree-view-selection"
          data-action="change->tree-view-selection#toggle"
          data-tree-view-selection-cascade-value="true">
          <tr data-tree-depth="0">
            <td>
              <input
                id="parent"
                class="tree-selection-checkbox"
                type="checkbox"
                value='{"id":"parent"}'>
            </td>
          </tr>
          <tr data-tree-depth="1">
            <td>
              <input
                id="child"
                class="tree-selection-checkbox"
                type="checkbox"
                value='{"id":"child"}'>
            </td>
          </tr>
        </tbody>
      </table>
    `

    const selection = document.getElementById("selection")
    const changes = selectionChangeDetails(selection)

    await flush()
    changes.length = 0

    const parent = document.getElementById("parent")
    parent.checked = true
    parent.dispatchEvent(new Event("change", { bubbles: true }))

    expect(document.getElementById("child").checked).toBe(true)
    expect(changes.at(-1)).toMatchObject({
      selectedCount: 2,
      sourceCheckbox: parent,
      attemptedChecked: true
    })
  })

  it("cascades through deep enabled descendants without changing disabled nodes or the next root", async () => {
    const controller = await mountSelectionFixture([
      { id: "root", depth: 0, checked: false, disabled: false },
      { id: "disabled-intermediate", depth: 1, checked: false, disabled: true },
      { id: "enabled-grandchild", depth: 2, checked: false, disabled: false },
      { id: "disabled-child", depth: 3, checked: false, disabled: true },
      { id: "deep-leaf", depth: 4, checked: false, disabled: false },
      { id: "next-root", depth: 0, checked: true, disabled: false },
      { id: "next-root-child", depth: 1, checked: false, disabled: false }
    ], { cascade: true })
    const root = document.getElementById("root")

    root.checked = true
    controller.toggle({ target: root })

    expect(selectionSnapshot()).toEqual([
      { id: "root", depth: 0, checked: true, indeterminate: false, disabled: false },
      { id: "disabled-intermediate", depth: 1, checked: false, indeterminate: false, disabled: true },
      { id: "enabled-grandchild", depth: 2, checked: true, indeterminate: false, disabled: false },
      { id: "disabled-child", depth: 3, checked: false, indeterminate: false, disabled: true },
      { id: "deep-leaf", depth: 4, checked: true, indeterminate: false, disabled: false },
      { id: "next-root", depth: 0, checked: true, indeterminate: false, disabled: false },
      { id: "next-root-child", depth: 1, checked: false, indeterminate: false, disabled: false }
    ])
  })

  it("calculates mixed descendant states bottom-up while excluding disabled descendants", async () => {
    await mountSelectionFixture([
      { id: "root", depth: 0, checked: false, disabled: false },
      { id: "complete-branch", depth: 1, checked: false, disabled: false },
      { id: "selected-leaf", depth: 2, checked: true, disabled: false },
      { id: "disabled-unselected-leaf", depth: 2, checked: false, disabled: true },
      { id: "mixed-branch", depth: 1, checked: false, disabled: false },
      { id: "mixed-selected-leaf", depth: 2, checked: true, disabled: false },
      { id: "mixed-unselected-leaf", depth: 2, checked: false, disabled: false }
    ], { indeterminate: true })

    expect(selectionSnapshot()).toEqual([
      { id: "root", depth: 0, checked: false, indeterminate: true, disabled: false },
      { id: "complete-branch", depth: 1, checked: true, indeterminate: false, disabled: false },
      { id: "selected-leaf", depth: 2, checked: true, indeterminate: false, disabled: false },
      { id: "disabled-unselected-leaf", depth: 2, checked: false, indeterminate: false, disabled: true },
      { id: "mixed-branch", depth: 1, checked: false, indeterminate: true, disabled: false },
      { id: "mixed-selected-leaf", depth: 2, checked: true, indeterminate: false, disabled: false },
      { id: "mixed-unselected-leaf", depth: 2, checked: false, indeterminate: false, disabled: false }
    ])
  })

  it("stops cascade at sibling and next-root subtree boundaries", async () => {
    const controller = await mountSelectionFixture([
      { id: "root", depth: 0, checked: false, disabled: false },
      { id: "source-branch", depth: 1, checked: false, disabled: false },
      { id: "source-deep-leaf", depth: 2, checked: false, disabled: false },
      { id: "sibling-branch", depth: 1, checked: true, disabled: false },
      { id: "sibling-child", depth: 2, checked: false, disabled: false },
      { id: "next-root", depth: 0, checked: true, disabled: false },
      { id: "next-root-child", depth: 1, checked: false, disabled: false }
    ], { cascade: true })
    const source = document.getElementById("source-branch")

    source.checked = true
    controller.toggle({ target: source })

    expect(selectionSnapshot()).toEqual([
      { id: "root", depth: 0, checked: false, indeterminate: false, disabled: false },
      { id: "source-branch", depth: 1, checked: true, indeterminate: false, disabled: false },
      { id: "source-deep-leaf", depth: 2, checked: true, indeterminate: false, disabled: false },
      { id: "sibling-branch", depth: 1, checked: true, indeterminate: false, disabled: false },
      { id: "sibling-child", depth: 2, checked: false, indeterminate: false, disabled: false },
      { id: "next-root", depth: 0, checked: true, indeterminate: false, disabled: false },
      { id: "next-root-child", depth: 1, checked: false, indeterminate: false, disabled: false }
    ])
  })
})
