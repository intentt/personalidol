import type { MainLoopUpdatable } from "../../framework/src/MainLoopUpdatable.interface";
import type { Service } from "../../framework/src/Service.interface";

export interface HTMLElementResizeObserver extends MainLoopUpdatable, Service {
  isHTMLElementResizeObserver: true;
}
