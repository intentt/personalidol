import type { MainLoopUpdatable } from "../../framework/src/MainLoopUpdatable.interface";
import type { Service } from "../../framework/src/Service.interface";

import type { WindowFocusObserverState } from "./WindowFocusObserverState.type";

export interface WindowFocusObserver extends MainLoopUpdatable, Service {
  readonly state: WindowFocusObserverState;
  readonly isWindowFocusObserver: true;
}
