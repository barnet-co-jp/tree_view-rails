import { TreeViewClientController } from "./client_controller.js"
import { TreeViewRemoteStateController } from "./remote_state_controller.js"
import { TreeViewSelectionController } from "./selection_controller.js"
import { TreeViewStateController } from "./state_controller.js"
import { TreeViewTransferController } from "./transfer_controller.js"

export { TreeViewClientController } from "./client_controller.js"
export { TreeViewRemoteStateController } from "./remote_state_controller.js"
export { TreeViewSelectionController } from "./selection_controller.js"
export { TreeViewStateController } from "./state_controller.js"
export { TreeViewTransferController } from "./transfer_controller.js"

export const TreeViewEventNames = Object.freeze({
  state: Object.freeze({
    stateChanged: "tree-view-state:state-changed"
  }),
  selection: Object.freeze({
    change: "tree-view-selection:change",
    selected: "tree-view-selection:selected",
    limitExceeded: "tree-view-selection:limit-exceeded",
    invalidPayload: "tree-view-selection:invalid-payload"
  }),
  remoteState: Object.freeze({
    change: "tree-view-remote-state:change",
    retry: "tree-view-remote-state:retry"
  }),
  hostLifecycle: Object.freeze({
    loading: "tree-view:loading",
    loaded: "tree-view:loaded",
    error: "tree-view:error",
    retry: "tree-view:retry"
  }),
  transfer: Object.freeze({
    dragStart: "tree-view-transfer:drag-start",
    dragOver: "tree-view-transfer:drag-over",
    drop: "tree-view-transfer:drop",
    invalidPayload: "tree-view-transfer:invalid-payload",
    invalidTransfer: "tree-view-transfer:invalid-transfer"
  })
})

export const TreeViewEventDetailKeys = Object.freeze({
  state: Object.freeze({
    stateChanged: Object.freeze(["viewKey", "expandedKeys", "reason"])
  }),
  selection: Object.freeze({
    change: Object.freeze(["selectedCount", "selectedValues", "selectedPayloads", "sourceCheckbox", "attemptedChecked"]),
    selected: Object.freeze(["payloads"]),
    limitExceeded: Object.freeze(["maxCount", "attemptedCount", "attemptedChecked", "checkbox"]),
    invalidPayload: Object.freeze(["value", "checkbox"])
  }),
  remoteState: Object.freeze({
    change: Object.freeze(["row", "state", "childrenUrl", "nodeKey"]),
    retry: Object.freeze(["row", "childrenUrl", "nodeKey"])
  }),
  transfer: Object.freeze({
    dragStart: Object.freeze(["sourcePayload", "sourceRow"]),
    dragOver: Object.freeze(["targetPayload", "targetRow", "position"]),
    drop: Object.freeze(["sourcePayload", "targetPayload", "position", "targetRow"]),
    invalidPayload: Object.freeze(["value", "row"]),
    invalidTransfer: Object.freeze(["value"])
  })
})

export const TreeViewStateChangeReasons = Object.freeze({
  connect: "connect",
  refresh: "refresh",
  expanded: "expanded",
  collapsed: "collapsed"
})

export const TreeViewRemoteStateValues = Object.freeze({
  loading: "loading",
  loaded: "loaded",
  error: "error"
})

export const TreeViewRemoteStateDataHooks = Object.freeze({
  lazyAttribute: "data-tree-lazy",
  childrenUrlAttribute: "data-tree-children-url",
  loadedAttribute: "data-tree-loaded",
  remoteStateAttribute: "data-tree-remote-state"
})

export const TreeViewToolbarDataHooks = Object.freeze({
  toolbarAttribute: "data-tree-view-toolbar",
  actionAttribute: "data-tree-view-toolbar-action",
  disabledAttribute: "data-tree-view-toolbar-disabled"
})

export const TreeViewTransferDropPositions = Object.freeze({
  before: "before",
  inside: "inside",
  after: "after"
})

export const TreeViewTransferDataAttributes = Object.freeze({
  payload: "data-tree-transfer-payload",
  disabled: "data-tree-transfer-disabled"
})

export const TreeViewTransferDataMimeTypes = Object.freeze({
  applicationJson: "application/json",
  textPlain: "text/plain"
})

export const TreeViewControllerIdentifiers = Object.freeze({
  state: "tree-view-state",
  client: "tree-view-client",
  selection: "tree-view-selection",
  transfer: "tree-view-transfer",
  remoteState: "tree-view-remote-state"
})

export const TreeViewControllerEntries = Object.freeze([
  Object.freeze({
    key: "state",
    identifier: TreeViewControllerIdentifiers.state,
    controller: TreeViewStateController
  }),
  Object.freeze({
    key: "client",
    identifier: TreeViewControllerIdentifiers.client,
    controller: TreeViewClientController
  }),
  Object.freeze({
    key: "selection",
    identifier: TreeViewControllerIdentifiers.selection,
    controller: TreeViewSelectionController
  }),
  Object.freeze({
    key: "transfer",
    identifier: TreeViewControllerIdentifiers.transfer,
    controller: TreeViewTransferController
  }),
  Object.freeze({
    key: "remoteState",
    identifier: TreeViewControllerIdentifiers.remoteState,
    controller: TreeViewRemoteStateController
  })
])

export const TreeViewIntegrationHooks = Object.freeze({
  state: Object.freeze({
    viewKeyValue: "data-tree-view-state-view-key-value",
    nodeKey: "data-tree-view-state-node-key"
  }),
  client: Object.freeze({
    expandedKeysValue: "data-tree-view-client-expanded-keys-value"
  }),
  remoteState: Object.freeze({
    childrenUrl: "data-tree-children-url"
  }),
  transfer: Object.freeze({
    payload: "data-tree-transfer-payload"
  })
})

export const TreeViewSelectionDataHooks = Object.freeze({
  hiddenInputNameValue: "data-tree-view-selection-hidden-input-name-value",
  maxCountValue: "data-tree-view-selection-max-count-value",
  cascadeValue: "data-tree-view-selection-cascade-value",
  indeterminateValue: "data-tree-view-selection-indeterminate-value"
})

export const TreeViewSelectionCheckboxHooks = Object.freeze({
  checkboxClass: "tree-selection-checkbox",
  disabledReasonAttribute: "data-tree-selection-disabled-reason"
})

export const TreeViewEmptyStateHooks = Object.freeze({
  wrapperAttribute: "data-tree-view-empty-state",
  contentClass: "tree-view-empty-row__content",
  messageClass: "tree-view-empty-row__message"
})

export function registerTreeViewControllers(application) {
  application.register("tree-view-state", TreeViewStateController)
  application.register("tree-view-client", TreeViewClientController)
  application.register("tree-view-selection", TreeViewSelectionController)
  application.register("tree-view-transfer", TreeViewTransferController)
  application.register("tree-view-remote-state", TreeViewRemoteStateController)
}
