import { Vector3 } from "three/src/math/Vector3";

import { CameraParameters } from "./CameraParameters.enum";
import { generateUUID } from "../../math/src/generateUUID";
import { noop } from "../../framework/src/noop";

import type { Vector3 as IVector3 } from "three/src/math/Vector3";

import type { CameraController } from "../../framework/src/CameraController.interface";
import type { EventBus } from "../../framework/src/EventBus.interface";
import type { TickTimerState } from "../../framework/src/TickTimerState.type";
import type { UserInputController } from "../../input/src/UserInputController.interface";
import type { UserInputControllerState } from "../../input/src/UserInputControllerState.type";

import type { UserSettings } from "./UserSettings.type";

export function UserInputEventBusController(
  userSettings: UserSettings,
  eventBus: EventBus,
  cameraController: CameraController,
  tickTimerState: TickTimerState
): UserInputController {
  const state: UserInputControllerState = Object.seal({
    isMounted: false,
    isPaused: false,
    needsUpdates: false,
  });

  const _cameraTransitionRequest: IVector3 = new Vector3();

  function _onPointerZoomRequest(zoomAmount: number, scale: number = 1): void {
    if (state.isPaused) {
      return;
    }

    if (zoomAmount < 0) {
      cameraController.zoomOut(CameraParameters.ZOOM_STEP);
    } else {
      cameraController.zoomIn(CameraParameters.ZOOM_STEP);
    }
  }

  function mount(): void {
    state.isMounted = true;
    eventBus.POINTER_ZOOM_REQUEST.add(_onPointerZoomRequest);
  }

  function pause(): void {
    state.isPaused = true;
  }

  function unmount(): void {
    state.isMounted = false;
    eventBus.POINTER_ZOOM_REQUEST.delete(_onPointerZoomRequest);
  }

  function unpause(): void {
    state.isPaused = false;
  }

  return Object.freeze({
    cameraTransitionRequest: _cameraTransitionRequest,
    id: generateUUID(),
    isMountable: true,
    isUserInputController: true,
    name: "UserInputEventBusController",
    state: state,

    mount: mount,
    pause: pause,
    unmount: unmount,
    unpause: unpause,
    update: noop,
  });
}
