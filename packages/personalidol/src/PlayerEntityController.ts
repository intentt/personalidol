import { Vector3 } from "three/src/math/Vector3";

import { dispose as fDispose } from "@personalidol/framework/src/dispose";
import { generateUUID } from "@personalidol/math/src/generateUUID";
import { longestVector3 } from "@personalidol/framework/src/longestVector3";
import { mount as fMount } from "@personalidol/framework/src/mount";
import { name } from "@personalidol/framework/src/name";
import { pause as fPause } from "@personalidol/framework/src/pause";
import { preload as fPreload } from "@personalidol/framework/src/preload";
import { unmount as fUnmount } from "@personalidol/framework/src/unmount";
import { unpause as fUnpause } from "@personalidol/framework/src/unpause";

import { NPCEntityController } from "./NPCEntityController";

import type { Logger } from "loglevel";

import type { CameraController } from "@personalidol/framework/src/CameraController.interface";
import type { TickTimerState } from "@personalidol/framework/src/TickTimerState.type";
import type { UserInputController } from "@personalidol/input/src/UserInputController.interface";
import type { UserInputMouseController } from "@personalidol/input/src/UserInputMouseController.interface";

import type { CharacterView } from "./CharacterView.interface";
import type { EntityControllerState } from "./EntityControllerState.type";
import type { EntityPlayer } from "./EntityPlayer.type";
import type { PlayerEntityController } from "./PlayerEntityController.interface";

export function PlayerEntityController(
  logger: Logger,
  view: CharacterView<EntityPlayer>,
  cameraController: CameraController,
  userInputEventBusController: UserInputController,
  userInputKeyboardController: UserInputController,
  userInputMouseController: UserInputMouseController,
  userInputTouchController: UserInputController,
  dynamicsMessagePort: MessagePort
): PlayerEntityController {
  const state: EntityControllerState = Object.seal({
    isDisposed: false,
    isMounted: false,
    isPaused: false,
    isPreloading: false,
    isPreloaded: false,
    needsUpdates: true,
  });

  const _npcEntityController = NPCEntityController(logger, view, dynamicsMessagePort);

  function dispose(): void {
    state.isDisposed = true;

    fDispose(logger, _npcEntityController);
  }

  function mount(): void {
    state.isMounted = true;

    fMount(logger, _npcEntityController);

    cameraController.cameraResetPosition.copy(view.object3D.position);
    cameraController.resetPosition();
  }

  function pause(): void {
    state.isPaused = true;

    fPause(logger, _npcEntityController);
  }

  function preload(): void {
    state.isPreloaded = true;
    state.isPreloading = false;

    fPreload(logger, _npcEntityController);
  }

  function unmount(): void {
    state.isMounted = false;

    fUnmount(logger, _npcEntityController);
  }

  function unpause(): void {
    state.isPaused = false;

    fUnpause(logger, _npcEntityController);
  }

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    const transitionVector = longestVector3(
      userInputEventBusController.cameraTransitionRequest,
      userInputKeyboardController.cameraTransitionRequest,
      userInputMouseController.cameraTransitionRequest,
      userInputTouchController.cameraTransitionRequest
    );

    const movementVector = transitionVector.clone().applyAxisAngle(new Vector3(0, 1, 0), Math.PI / 11).normalize().multiplyScalar(300);

    _npcEntityController.rigidBody.setLinearVelocity(movementVector);
    // _npcEntityController.rigidBody.applyCentralImpulse(movementVector);

    cameraController.cameraResetPosition.copy(view.object3D.position);
    cameraController.resetPosition();

    _npcEntityController.update(delta, elapsedTime, tickTimerState);
  }

  function updatePreloadingState(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    if (_npcEntityController.state.isPreloading) {
      return;
    }

    state.isPreloading = false;
    state.isPreloaded = true;
  }

  return Object.freeze({
    id: generateUUID(),
    isDisposable: true,
    isEntityController: true,
    isMountable: true,
    isPollablePreloading: true,
    isPreloadable: true,
    name: `PlayerEntityController(${name(view)})`,
    state: state,
    view: view,

    dispose: dispose,
    mount: mount,
    pause: pause,
    preload: preload,
    unmount: unmount,
    unpause: unpause,
    update: update,
    updatePreloadingState: updatePreloadingState,
  });
}
