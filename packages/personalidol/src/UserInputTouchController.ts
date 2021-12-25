import { Vector2 } from "three/src/math/Vector2";
import { Vector3 } from "three/src/math/Vector3";

import { computePrimaryTouchStretchVector } from "../../input/src/computePrimaryTouchStretchVector";
import { generateUUID } from "../../math/src/generateUUID";
import { isPrimaryTouchInitiatedByRootElement } from "../../input/src/isPrimaryTouchInitiatedByRootElement";
import { isPrimaryTouchPressed } from "../../input/src/isPrimaryTouchPressed";

import type { Vector2 as IVector2 } from "three/src/math/Vector2";
import type { Vector3 as IVector3 } from "three/src/math/Vector3";

import type { TickTimerState } from "../../framework/src/TickTimerState.type";
import type { UserInputController } from "../../input/src/UserInputController.interface";
import type { UserInputControllerState } from "../../input/src/UserInputControllerState.type";

import type { UserSettings } from "./UserSettings.type";

const _stretchVector: IVector2 = new Vector2(0, 0);
const _stretchVectorRotationPivot: IVector2 = new Vector2(0, 0);

export function UserInputTouchController(
  userSettings: UserSettings,
  dimensionsState: Uint32Array,
  touchState: Int32Array
): UserInputController {
  const state: UserInputControllerState = Object.seal({
    isMounted: false,
    isPaused: false,
    needsUpdates: true,
  });

  const _cameraTransitionRequest: IVector3 = new Vector3();

  function mount(): void {
    state.isMounted = true;
  }

  function pause(): void {
    state.isPaused = true;
  }

  function unmount(): void {
    state.isMounted = false;
  }

  function unpause(): void {
    state.isPaused = false;
  }

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    _cameraTransitionRequest.set(0, 0, 0);

    if (state.isPaused) {
      return;
    }

    if (!isPrimaryTouchPressed(touchState) || !isPrimaryTouchInitiatedByRootElement(touchState)) {
      return;
    }

    computePrimaryTouchStretchVector(_stretchVector, touchState);

    _stretchVector.rotateAround(_stretchVectorRotationPivot, (3 * Math.PI) / 4);

    _cameraTransitionRequest.x += _stretchVector.y * delta;
    _cameraTransitionRequest.z += _stretchVector.x * delta;
  }

  return Object.freeze({
    cameraTransitionRequest: _cameraTransitionRequest,
    id: generateUUID(),
    isMountable: true,
    isUserInputController: true,
    name: "UserInputTouchController",
    state: state,

    mount: mount,
    pause: pause,
    unmount: unmount,
    unpause: unpause,
    update: update,
  });
}
