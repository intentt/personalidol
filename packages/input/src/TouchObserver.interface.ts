import type { MainLoopUpdatable } from "../../framework/src/MainLoopUpdatable.interface";
import type { Service } from "../../framework/src/Service.interface";

import type { TouchObserverState } from "./TouchObserverState.type";

export interface TouchObserver extends MainLoopUpdatable, Service {
  readonly state: TouchObserverState;
  readonly isTouchObserver: true;
}
