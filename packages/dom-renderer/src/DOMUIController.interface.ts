import type { Preloadable } from "../../framework/src/Preloadable.interface";
import type { RegistersMessagePort } from "../../framework/src/RegistersMessagePort.interface";
import type { Service } from "../../framework/src/Service.interface";

import type { DOMElementsLookup } from "./DOMElementsLookup.type";
import type { DOMElementViewContext } from "./DOMElementViewContext.type";
import type { DOMUIControllerState } from "./DOMUIControllerState.type";
import type { MessageDOMUIDispose } from "./MessageDOMUIDispose.type";
import type { MessageDOMUIRender } from "./MessageDOMUIRender.type";

export interface DOMUIController<L extends DOMElementsLookup, C extends DOMElementViewContext>
  extends Preloadable,
    RegistersMessagePort,
    Service {
  readonly state: DOMUIControllerState;

  dispose(message: MessageDOMUIDispose): void;

  render(message: MessageDOMUIRender<L>): void;
}
