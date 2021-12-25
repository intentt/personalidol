import type { MainLoopUpdatable } from "../../framework/src/MainLoopUpdatable.interface";
import type { Service } from "../../framework/src/Service.interface";

import type { MouseObserverState } from "./MouseObserverState.type";

export interface MouseObserver extends MainLoopUpdatable, Service {
  readonly state: MouseObserverState;
  readonly isMouseObserver: true;
}
