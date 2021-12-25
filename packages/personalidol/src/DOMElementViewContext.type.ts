import type { DOMElementViewContext as BaseDOMElementViewContext } from "../../dom-renderer/src/DOMElementViewContext.type";

import type { UserSettings } from "./UserSettings.type";

export type DOMElementViewContext = BaseDOMElementViewContext & {
  dimensionsState: Uint32Array;
  gameMessagePort: MessagePort;
  keyboardState: Uint8Array;
  mouseState: Int32Array;
  touchState: Int32Array;
  uiMessagePort: MessagePort;
  userSettings: UserSettings;
};
