import { Application } from "@hotwired/stimulus"
import { afterEach, describe, expect, it } from "vitest"
import { TreeViewClientController } from "./client_controller.js"

function nextFrame() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe("TreeViewClientController expansion restore", () => {
  let application

  afterEach(() => {
    application?.stop()
    document.body.innerHTML = ""
  })

  it("applies expanded keys supplied through the public Stimulus value", async () => {
    document.body.innerHTML = `
      <table data-controller="tree-view-client" data-tree-view-client-expanded-keys-value='["root"]'>
        <tbody>
          <tr data-tree-view-client-node-key="root" data-tree-view-client-depth="0" data-tree-view-client-expanded="false" data-tree-view-state-expanded="false" aria-expanded="false">
            <td><button id="root-toggle" data-action="tree-view-client#toggle" data-tree-view-client-node-key="root" aria-expanded="false"></button></td>
          </tr>
          <tr id="child" data-tree-view-client-node-key="child" data-tree-view-client-depth="1" data-tree-view-client-expanded="true" data-tree-view-state-expanded="true" aria-expanded="true">
            <td><button id="child-toggle" data-action="tree-view-client#toggle" data-tree-view-client-node-key="child" aria-expanded="true"></button></td>
          </tr>
        </tbody>
      </table>
    `

    application = Application.start()
    application.register("tree-view-client", TreeViewClientController)
    await nextFrame()

    const root = document.querySelector("[data-tree-view-client-node-key='root']")
    const child = document.querySelector("#child")

    expect(root.dataset.treeViewClientExpanded).toBe("true")
    expect(root.dataset.treeViewStateExpanded).toBe("true")
    expect(document.querySelector("#root-toggle").getAttribute("aria-expanded")).toBe("true")
    expect(child.dataset.treeViewClientExpanded).toBe("false")
    expect(child.hidden).toBe(false)
  })

  it("reapplies expansion when the public value changes", async () => {
    document.body.innerHTML = `
      <table data-controller="tree-view-client" data-tree-view-client-expanded-keys-value='["root"]'>
        <tbody>
          <tr id="root" data-tree-view-client-node-key="root" data-tree-view-client-depth="0" data-tree-view-client-expanded="false" data-tree-view-state-expanded="false" aria-expanded="false">
            <td><button data-action="tree-view-client#toggle" data-tree-view-client-node-key="root" aria-expanded="false"></button></td>
          </tr>
          <tr id="child" data-tree-view-client-node-key="child" data-tree-view-client-depth="1" data-tree-view-client-expanded="false" data-tree-view-state-expanded="false" aria-expanded="false">
            <td><button data-action="tree-view-client#toggle" data-tree-view-client-node-key="child" aria-expanded="false"></button></td>
          </tr>
        </tbody>
      </table>
    `

    application = Application.start()
    application.register("tree-view-client", TreeViewClientController)
    await nextFrame()

    const tree = document.querySelector("[data-controller='tree-view-client']")
    tree.setAttribute("data-tree-view-client-expanded-keys-value", '["root","child"]')
    await nextFrame()

    expect(document.querySelector("#root").dataset.treeViewClientExpanded).toBe("true")
    expect(document.querySelector("#child").dataset.treeViewClientExpanded).toBe("true")
  })
})
