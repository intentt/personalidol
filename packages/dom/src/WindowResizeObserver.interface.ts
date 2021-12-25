import type { MainLoopUpdatable } from "../../framework/src/MainLoopUpdatable.interface";
import type { Service } from "../../framework/src/Service.interface";

export interface WindowResizeObserver extends MainLoopUpdatable, Service {
  isWindowResizeObserver: true;
}
