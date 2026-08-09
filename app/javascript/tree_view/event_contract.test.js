import { Application } from "@hotwired/stimulus"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  TreeViewRemoteStateController,
  TreeViewSelectionController,
  TreeViewStateController,
  TreeViewTransferController
} from "./index.js"

function nextFrame() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe("TreeView JavaScript public event contract", () => {
  let application

  beforeEach(() => {
    application = Application.start()
    application.register("tree-view-state", TreeViewStateController)
    application.register("tree-view-selection", TreeViewSelectionController)
    application.register("tree-view-remote-state", TreeViewRemoteStateController)
    application.register("tree-view-transfer", TreeViewTransferController)
  })

  afterEach(() => {
    application.stop()
    document.body.innerHTML = ""
  })

  it("dispatches tree-view-state:state-changed with stable view, expansion, and reason detail", async () => {
    document.body.innerHTML = `
      <section id="root">
        <table data-controller="tree-view-state" data-tree-view-state-view-key-value="projects">
          <tbody>
            <tr id="alpha" data-tree-view-state-target="node" data-tree-view-state-node-key="project:1" data-tree-view-state-expanded="true">
              <td><button id="alpha-toggle">Project 1</button></td>
            </tr>
            <tr id="beta" data-tree-view-state-target="node" data-tree-view-state-node-key="project:2" data-tree-view-state-expanded="false">
              <td><button id="beta-toggle">Project 2</button></td>
            </tr>
          </tbody>
        </table>
      </section>
    `
    const stateSpy = vi.fn()
    document.querySelector("#root").addEventListener("tree-view-state:state-changed", stateSpy)
    await nextFrame()

    const initialEvent = stateSpy.mock.calls[0][0]
    expect(initialEvent.bubbles).toBe(true)
    expect(initialEvent.cancelable).toBe(true)
    expect(initialEvent.detail).toEqual({
      viewKey: "projects",
      expandedKeys: ["project:1"],
      reason: "connect"
    })

    const element = document.querySelector("[data-controller='tree-view-state']")
    const controller = application.getControllerForElementAndIdentifier(element, "tree-view-state")
    controller.refresh()
    controller.markCollapsed({ target: document.querySelector("#alpha-toggle") })
    controller.markExpanded({ target: document.querySelector("#beta-toggle") })

    expect(stateSpy.mock.calls.at(-3)[0].detail).toEqual({
      viewKey: "projects",
      expandedKeys: ["project:1"],
      reason: "refresh"
    })
    expect(stateSpy.mock.calls.at(-2)[0].detail).toEqual({
      viewKey: "projects",
      expandedKeys: [],
      reason: "collapsed"
    })
    expect(stateSpy.mock.calls.at(-1)[0].detail).toEqual({
      viewKey: "projects",
      expandedKeys: ["project:2"],
      reason: "expanded"
    })
  })

  it("dispatches tree-view-selection:change with stable selection detail", async () => {
    document.body.innerHTML = `
      <section id="root">
        <table data-controller="tree-view-selection">
          <tbody>
            <tr data-tree-depth="0">
              <td><input id="checkbox" class="tree-selection-checkbox" type="checkbox" value='{"key":"project:1"}'></td>
            </tr>
          </tbody>
        </table>
      </section>
    `
    const rootSpy = vi.fn()
    document.querySelector("#root").addEventListener("tree-view-selection:change", rootSpy)
    await nextFrame()

    const checkbox = document.querySelector("#checkbox")
    checkbox.checked = true
    const element = document.querySelector("[data-controller='tree-view-selection']")
    const controller = application.getControllerForElementAndIdentifier(element, "tree-view-selection")
    controller.toggle({ target: checkbox })

    const event = rootSpy.mock.calls.at(-1)[0]
    expect(event.bubbles).toBe(true)
    expect(event.cancelable).toBe(true)
    expect(event.detail).toMatchObject({
      selectedCount: 1,
      selectedValues: ['{"key":"project:1"}'],
      selectedPayloads: [{ key: "project:1" }]
    })
  })

  it("dispatches tree-view-remote-state events with row, state, URL, and node key", async () => {
    document.body.innerHTML = `
      <section id="root">
        <table data-controller="tree-view-remote-state">
          <tbody>
            <tr id="row" data-tree-view-state-target="node" data-tree-view-state-node-key="project:1" data-tree-children-url="/projects/1/children">
              <td><button id="loaded" data-action="tree-view-remote-state#loaded">Loaded</button></td>
            </tr>
          </tbody>
        </table>
      </section>
    `
    const changeSpy = vi.fn()
    const retrySpy = vi.fn()
    document.querySelector("#root").addEventListener("tree-view-remote-state:change", changeSpy)
    document.querySelector("#root").addEventListener("tree-view-remote-state:retry", retrySpy)
    await nextFrame()

    const element = document.querySelector("[data-controller='tree-view-remote-state']")
    const controller = application.getControllerForElementAndIdentifier(element, "tree-view-remote-state")
    const row = document.querySelector("#row")

    controller.loaded({ target: row, detail: {} })
    controller.retry({ target: row, detail: {} })

    expect(changeSpy.mock.calls[0][0].detail).toMatchObject({
      row,
      state: "loaded",
      childrenUrl: "/projects/1/children",
      nodeKey: "project:1"
    })
    expect(changeSpy.mock.calls[1][0].detail).toMatchObject({
      row,
      state: "loading",
      childrenUrl: "/projects/1/children",
      nodeKey: "project:1"
    })
    expect(row.dataset.remoteState).toBe("loading")
    expect(retrySpy.mock.calls[0][0].detail).toMatchObject({
      row,
      childrenUrl: "/projects/1/children",
      nodeKey: "project:1"
    })
  })

  it("dispatches tree-view-transfer:drop with source payload, target payload, position, and target row", async () => {
    document.body.innerHTML = `
      <section id="root">
        <table data-controller="tree-view-transfer">
          <tbody>
            <tr id="target" data-tree-depth="0" data-tree-transfer-payload='{"key":"project:2"}'></tr>
          </tbody>
        </table>
      </section>
    `
    const dropSpy = vi.fn()
    document.querySelector("#root").addEventListener("tree-view-transfer:drop", dropSpy)
    await nextFrame()

    const element = document.querySelector("[data-controller='tree-view-transfer']")
    const controller = application.getControllerForElementAndIdentifier(element, "tree-view-transfer")
    const targetRow = document.querySelector("#target")
    targetRow.getBoundingClientRect = () => ({ top: 0, height: 90 })

    controller.drop({
      target: targetRow,
      clientY: 80,
      preventDefault: vi.fn(),
      dataTransfer: {
        getData: (type) => (type === "application/json" ? JSON.stringify({ key: "project:1" }) : "")
      }
    })

    const event = dropSpy.mock.calls[0][0]
    expect(event.bubbles).toBe(true)
    expect(event.cancelable).toBe(true)
    expect(event.detail).toMatchObject({
      sourcePayload: { key: "project:1" },
      targetPayload: { key: "project:2" },
      position: "after",
      targetRow
    })
  })

  it("dispatches tree-view-transfer:drop with null source payload when transfer data is unavailable or invalid", async () => {
    document.body.innerHTML = `
      <section id="root">
        <table data-controller="tree-view-transfer">
          <tbody>
            <tr id="target" data-tree-depth="0" data-tree-transfer-payload='{"key":"project:2"}'></tr>
          </tbody>
        </table>
      </section>
    `
    const root = document.querySelector("#root")
    const dropSpy = vi.fn()
    const invalidTransferSpy = vi.fn()
    root.addEventListener("tree-view-transfer:drop", dropSpy)
    root.addEventListener("tree-view-transfer:invalid-transfer", invalidTransferSpy)
    await nextFrame()

    const element = document.querySelector("[data-controller='tree-view-transfer']")
    const controller = application.getControllerForElementAndIdentifier(element, "tree-view-transfer")
    const targetRow = document.querySelector("#target")
    targetRow.getBoundingClientRect = () => ({ top: 0, height: 90 })
    const event = (dataTransfer) => ({
      target: targetRow,
      clientY: 45,
      preventDefault: vi.fn(),
      ...(dataTransfer === undefined ? {} : { dataTransfer })
    })

    controller.drop(event(undefined))
    controller.drop(event({ getData: () => "" }))
    controller.drop(event({ getData: (type) => (type === "application/json" ? "not-json" : "") }))

    expect(dropSpy).toHaveBeenCalledTimes(3)
    for (const [dropEvent] of dropSpy.mock.calls) {
      expect(dropEvent.detail).toEqual({
        sourcePayload: null,
        targetPayload: { key: "project:2" },
        position: "inside",
        targetRow
      })
    }
    expect(invalidTransferSpy).toHaveBeenCalledOnce()
    expect(invalidTransferSpy.mock.calls[0][0].detail).toEqual({ value: "not-json" })
  })
})
