import { expect, test } from "@playwright/test"

const keyboardNavigationFixture = `
  <table
    data-controller="tree-view-state"
    data-tree-view-state-keyboard-value="true"
    data-action="keydown->tree-view-state#keydown"
  >
    <tbody>
      <tr id="row-1" data-tree-view-state-target="node" data-tree-view-state-node-key="project:1" data-tree-view-state-expanded="true">
        <td><button class="remove-button" type="button" data-action="click->tree-view-state#markCollapsed">Collapse</button></td>
      </tr>
      <tr id="row-2" data-tree-view-state-target="node" data-tree-view-state-node-key="project:2" data-tree-view-state-expanded="false">
        <td><button class="show-button" type="button" data-action="click->tree-view-state#markExpanded">Expand</button></td>
      </tr>
    </tbody>
  </table>
`

const rowFormControlsFixture = `
  <table
    data-controller="tree-view-state"
    data-tree-view-state-keyboard-value="true"
    data-action="keydown->tree-view-state#keydown"
  >
    <tbody>
      <tr id="row-1" data-tree-view-state-target="node" data-tree-view-state-node-key="project:1" data-tree-view-state-expanded="false">
        <td>
          <button class="show-button" type="button" data-action="click->tree-view-state#markExpanded">Expand</button>
          <input id="row-input" value="Editable row text">
          <a id="row-link" href="#inside-row">Inline link</a>
        </td>
      </tr>
    </tbody>
  </table>
`

const selectionCascadeFixture = `
  <table data-controller="tree-view-selection" data-tree-view-selection-cascade-value="true" data-tree-view-selection-indeterminate-value="true">
    <tbody>
      <tr data-tree-depth="0">
        <td><input id="parent" class="tree-selection-checkbox" type="checkbox" value='{"key":"project:1"}' data-action="change->tree-view-selection#toggle"></td>
      </tr>
      <tr data-tree-depth="1">
        <td><input id="enabled-child" class="tree-selection-checkbox" type="checkbox" value='{"key":"project:2"}' data-action="change->tree-view-selection#toggle"></td>
      </tr>
      <tr data-tree-depth="1">
        <td><input id="disabled-child" class="tree-selection-checkbox" type="checkbox" value='{"key":"project:3"}' disabled data-action="change->tree-view-selection#toggle"></td>
      </tr>
    </tbody>
  </table>
`

const remoteStateFixture = `
  <table data-controller="tree-view-remote-state">
    <tbody>
      <tr id="remote-row" data-tree-view-state-target="node" data-tree-view-state-node-key="project:1" data-tree-children-url="/projects/1/children">
        <td>
          <button id="loading" data-action="click->tree-view-remote-state#loading">Loading</button>
          <button id="loaded" data-action="click->tree-view-remote-state#loaded">Loaded</button>
          <button id="error" data-action="click->tree-view-remote-state#error">Error</button>
          <button id="retry" data-action="click->tree-view-remote-state#retry">Retry</button>
        </td>
      </tr>
    </tbody>
  </table>
`

const transferFixture = `
  <table data-controller="tree-view-transfer">
    <tbody>
      <tr id="source-row" draggable="true" data-tree-depth="0" data-tree-transfer-payload='{"key":"project:1"}' data-action="dragstart->tree-view-transfer#start">
        <td>Source</td>
      </tr>
      <tr id="target-row" data-tree-depth="0" data-tree-transfer-payload='{"key":"project:2"}' data-action="dragover->tree-view-transfer#over drop->tree-view-transfer#drop">
        <td>Target</td>
      </tr>
    </tbody>
  </table>
`

async function openFixture(page, markup) {
  await page.goto("/browser_smoke.html")
  await page.evaluate((html) => window.treeViewSmoke.mount(html), markup)
}

async function latestEventDetail(page, eventType) {
  return page.evaluate((type) => {
    const event = window.treeViewSmoke.events.findLast((candidate) => candidate.type === type)
    if (!event) throw new Error(`No captured TreeView event: ${type}`)

    return Object.fromEntries(Object.entries(event.detail).map(([key, value]) => {
      return value instanceof Element ? [`${key}Id`, value.id] : [key, value]
    }))
  }, eventType)
}

async function capturedEventTypes(page) {
  return page.evaluate(() => window.treeViewSmoke.events.map((event) => event.type))
}

test.afterEach(async ({ page }) => {
  await page.evaluate(() => window.treeViewSmoke.reset())
})

test("keyboard navigation moves focus and expands or collapses rows", async ({ page }) => {
  await openFixture(page, keyboardNavigationFixture)

  await page.locator("#row-1").focus()
  await page.keyboard.press("ArrowDown")
  await expect(page.locator("#row-2")).toBeFocused()

  await page.keyboard.press("ArrowRight")
  await expect(page.locator("#row-2")).toHaveAttribute("data-tree-view-state-expanded", "true")

  await page.locator("#row-1").focus()
  await page.keyboard.press("ArrowLeft")
  await expect(page.locator("#row-1")).toHaveAttribute("data-tree-view-state-expanded", "false")
})

test("row form controls do not trigger tree keyboard behavior", async ({ page }) => {
  await openFixture(page, rowFormControlsFixture)

  await page.locator("#row-input").focus()
  await page.keyboard.press("ArrowRight")
  await expect(page.locator("#row-1")).toHaveAttribute("data-tree-view-state-expanded", "false")

  await page.locator("#row-link").focus()
  await page.keyboard.press("Enter")
  await expect(page.locator("#row-1")).toHaveAttribute("data-tree-view-state-expanded", "false")
})

test("checkbox selection cascades to enabled descendants only", async ({ page }) => {
  await openFixture(page, selectionCascadeFixture)

  await page.locator("#parent").check()
  await expect(page.locator("#enabled-child")).toBeChecked()
  await expect(page.locator("#disabled-child")).not.toBeChecked()

  const latestSelection = await latestEventDetail(page, "tree-view-selection:change")
  expect(latestSelection.selectedPayloads).toEqual([{ key: "project:1" }, { key: "project:2" }])
})

test("lazy-loading state actions mark rows as loading, loaded, error, and retry", async ({ page }) => {
  await openFixture(page, remoteStateFixture)

  await page.locator("#loading").click()
  await expect(page.locator("#remote-row")).toHaveAttribute("data-remote-state", "loading")

  await page.locator("#loaded").click()
  await expect(page.locator("#remote-row")).toHaveAttribute("data-remote-state", "loaded")
  await expect(page.locator("#remote-row")).toHaveAttribute("data-tree-loaded", "true")

  await page.locator("#error").click()
  await expect(page.locator("#remote-row")).toHaveAttribute("data-remote-state", "error")

  await page.locator("#retry").click()
  await expect(page.locator("#remote-row")).toHaveAttribute("data-remote-state", "loading")

  const eventTypes = await capturedEventTypes(page)
  expect(eventTypes).toContain("tree-view-remote-state:change")
  expect(eventTypes).toContain("tree-view-remote-state:retry")
})

test("drag and drop emits source payload, target payload, and target position", async ({ page }) => {
  await openFixture(page, transferFixture)

  await page.evaluate(() => {
    const dataTransfer = new DataTransfer()
    const source = document.querySelector("#source-row")
    const target = document.querySelector("#target-row")
    target.getBoundingClientRect = () => ({ top: 0, height: 90, left: 0, right: 100, bottom: 90, width: 100 })

    source.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer }))
    target.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, clientY: 80, dataTransfer }))
  })

  const detail = await latestEventDetail(page, "tree-view-transfer:drop")
  expect(detail).toEqual({
    sourcePayload: { key: "project:1" },
    targetPayload: { key: "project:2" },
    position: "after",
    targetRowId: "target-row"
  })
})
