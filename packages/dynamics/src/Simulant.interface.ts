import type { Disposable } from "../../framework/src/Disposable.interface";
import type { MainLoopUpdatable } from "../../framework/src/MainLoopUpdatable.interface";
import type { Mountable } from "../../framework/src/Mountable.interface";
import type { Pauseable } from "../../framework/src/Pauseable.interface";
import type { Preloadable } from "../../framework/src/Preloadable.interface";

import type { SimulantState } from "./SimulantState.type";

export interface Simulant extends Disposable, MainLoopUpdatable, Mountable, Pauseable, Preloadable {
  readonly isSimulant: true;
  readonly state: SimulantState;
}
