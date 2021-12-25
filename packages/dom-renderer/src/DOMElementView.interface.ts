import type { i18n, TFunction } from "i18next";
import type { Logger } from "loglevel";
import type { VNode } from "preact";

import type { MainLoopUpdatable } from "../../framework/src/MainLoopUpdatable.interface";
import type { TickTimerState } from "../../framework/src/TickTimerState.type";

import type { DOMElementViewContext } from "./DOMElementViewContext.type";

export interface DOMElementView<C extends DOMElementViewContext> extends HTMLElement, MainLoopUpdatable {
  readonly t: TFunction;

  context: DOMElementViewContext;
  domMessagePort: MessagePort;
  i18next: i18n;
  lastRenderedLanguage: string;
  logger: Logger;
  needsRender: boolean;
  version: number;

  beforeRender(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void;

  render(delta: number, elapsedTime: number, tickTimerState: TickTimerState): null | VNode<any>;
}
