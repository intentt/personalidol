import type { MainLoopUpdatable } from "../../framework/src/MainLoopUpdatable.interface";
import type { Service } from "../../framework/src/Service.interface";

import type { GameState } from "./GameState.type";

export interface GameStateController extends MainLoopUpdatable, Service {
  gameState: GameState;
}
