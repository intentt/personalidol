import { generateUUID } from "../../math/src/generateUUID";

import type { DOMElementsLookup } from "./DOMElementsLookup.type";
import type { DOMElementViewHandle as IDOMElementViewHandle } from "./DOMElementViewHandle.interface";
import type { MessageDOMUIDispose } from "./MessageDOMUIDispose.type";
import type { MessageDOMUIRender } from "./MessageDOMUIRender.type";

export function DOMElementViewHandle<T extends DOMElementsLookup>(
  domMessagePort: MessagePort,
  elementName: keyof T
): IDOMElementViewHandle {
  let _domElementId: null | string = null;

  function enable(isEnabled: boolean) {
    if (Boolean(_domElementId) === isEnabled) {
      return;
    }

    if (_domElementId && !isEnabled) {
      domMessagePort.postMessage({
        dispose: <MessageDOMUIDispose>[_domElementId],
      });
      _domElementId = null;

      return;
    }

    if (!_domElementId) {
      _domElementId = generateUUID();
    }

    domMessagePort.postMessage({
      render: <MessageDOMUIRender<T>>{
        element: elementName,
        id: _domElementId,
        props: {},
      },
    });
  }

  return Object.freeze({
    enable: enable,
  });
}
