import type { Vector3 } from "three/src/math/Vector3";

import type { MainLoopUpdatable } from "../../framework/src/MainLoopUpdatable.interface";
import type { Mountable } from "../../framework/src/Mountable.interface";
import type { Pauseable } from "../../framework/src/Pauseable.interface";

import type { UserInputControllerState } from "./UserInputControllerState.type";

export interface UserInputController extends MainLoopUpdatable, Mountable, Pauseable {
  readonly cameraTransitionRequest: Vector3;
  readonly isUserInputController: true;
  readonly state: UserInputControllerState;
}
