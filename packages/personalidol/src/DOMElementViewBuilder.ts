import type { i18n } from "i18next";
import type { Logger } from "loglevel";

import type { DOMElementView } from "../../dom-renderer/src/DOMElementView.interface";
import type { DOMElementViewBuilder as IDOMElementViewBuilder } from "../../dom-renderer/src/DOMElementViewBuilder.interface";

import type { DOMElementViewContext } from "./DOMElementViewContext.type";

export function DOMElementViewBuilder(context: DOMElementViewContext): IDOMElementViewBuilder<DOMElementViewContext> {
  function initialize(
    domElementView: DOMElementView<DOMElementViewContext>,
    domMessagePort: MessagePort,
    i18next: i18n,
    logger: Logger
  ): void {
    domElementView.context = context;
    domElementView.domMessagePort = domMessagePort;
    domElementView.i18next = i18next;
    domElementView.logger = logger;
  }

  return Object.freeze({
    initialize: initialize,
  });
}
