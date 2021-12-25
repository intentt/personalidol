import { Vector3 } from "three/src/math/Vector3";

import { CameraParameters } from "./CameraParameters.enum";
import { generateUUID } from "../../math/src/generateUUID";
import { KeyboardIndices } from "../../input/src/KeyboardIndices.enum";

import type { Vector3 as IVector3 } from "three/src/math/Vector3";

import type { CameraController } from "../../framework/src/CameraController.interface";
import type { TickTimerState } from "../../framework/src/TickTimerState.type";
import type { UserInputController } from "../../input/src/UserInputController.interface";
import type { UserInputControllerState } from "../../input/src/UserInputControllerState.type";

import type { UserSettings } from "./UserSettings.type";

export function UserInputKeyboardController(
  userSettings: UserSettings,
  keyboardState: Uint8Array,
  cameraController: CameraController
): UserInputController {
  const state: UserInputControllerState = Object.seal({
    isMounted: false,
    isPaused: false,
    isPreloaded: false,
    isPreloading: false,
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

    if (keyboardState[KeyboardIndices.Home]) {
      cameraController.resetPosition();
      cameraController.resetZoom();

      return;
    }

    if (keyboardState[KeyboardIndices.PageDown]) {
      cameraController.zoomIn(CameraParameters.ZOOM_VELOCITY * delta);
    }

    if (keyboardState[KeyboardIndices.PageUp]) {
      cameraController.zoomOut(CameraParameters.ZOOM_VELOCITY * delta);
    }

    if (keyboardState[KeyboardIndices.ArrowUp] || keyboardState[KeyboardIndices.KeyW]) {
      _cameraTransitionRequest.x -= 1;
      _cameraTransitionRequest.z -= 1;
    }

    if (keyboardState[KeyboardIndices.ArrowLeft] || keyboardState[KeyboardIndices.KeyA]) {
      _cameraTransitionRequest.x -= 1;
      _cameraTransitionRequest.z += 1;
    }

    if (keyboardState[KeyboardIndices.ArrowRight] || keyboardState[KeyboardIndices.KeyD]) {
      _cameraTransitionRequest.x += 1;
      _cameraTransitionRequest.z -= 1;
    }

    if (keyboardState[KeyboardIndices.ArrowDown] || keyboardState[KeyboardIndices.KeyS]) {
      _cameraTransitionRequest.x += 1;
      _cameraTransitionRequest.z += 1;
    }

    _cameraTransitionRequest.normalize();
    _cameraTransitionRequest.multiplyScalar(delta);
  }

  return Object.freeze({
    cameraTransitionRequest: _cameraTransitionRequest,
    id: generateUUID(),
    isMountable: true,
    isUserInputController: true,
    name: "UserInputKeyboardController",
    state: state,

    mount: mount,
    pause: pause,
    unmount: unmount,
    unpause: unpause,
    update: update,
  });
}
