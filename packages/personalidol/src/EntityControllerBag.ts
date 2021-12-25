import { dispose as fDispose } from "../../framework/src/dispose";
import { generateUUID } from "../../math/src/generateUUID";
import { isPollablePreloading } from "../../framework/src/isPollablePreloading";
import { mount as fMount } from "../../framework/src/mount";
import { pause as fPause } from "../../framework/src/pause";
import { preload as fPreload } from "../../framework/src/preload";
import { unmount as fUnmount } from "../../framework/src/unmount";
import { unpause as fUnpause } from "../../framework/src/unpause";

import type { Logger } from "loglevel";

import type { TickTimerState } from "../../framework/src/TickTimerState.type";

import type { AnyEntity } from "./AnyEntity.type";
import type { EntityController } from "./EntityController.interface";
import type { EntityControllerBag as IEntityControllerBag } from "./EntityControllerBag.interface";
import type { EntityControllerBagState } from "./EntityControllerBagState.type";

export function EntityControllerBag(logger: Logger): IEntityControllerBag {
  const state: EntityControllerBagState = Object.seal({
    isDisposed: false,
    isMounted: false,
    isPaused: false,
    isPreloaded: false,
    isPreloading: false,
    needsUpdates: true,
  });

  const entityControllers: Set<EntityController<AnyEntity>> = new Set();

  const _updatableControllers: Set<EntityController<AnyEntity>> = new Set();
  let _entityController: null | EntityController<AnyEntity> = null;

  function dispose(): void {
    entityControllers.forEach(_disposeEntityController);

    // Clear entityControllers references so they can be garbage collected.
    entityControllers.clear();
    _updatableControllers.clear();

    state.isDisposed = true;
  }

  function mount(): void {
    entityControllers.forEach(_mountEntityController);
    state.isMounted = true;
  }

  function pause(): void {
    state.isPaused = true;
    entityControllers.forEach(_pauseEntityController);
  }

  function preload(): void {
    state.isPreloaded = false;
    state.isPreloading = true;

    entityControllers.forEach(_preloadEntityController);
  }

  function unmount(): void {
    entityControllers.forEach(_unmountEntityController);
    state.isMounted = false;
  }

  function unpause(): void {
    state.isPaused = false;
    entityControllers.forEach(_unpauseEntityController);
  }

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    for (_entityController of _updatableControllers) {
      if (_entityController.state.needsUpdates) {
        _entityController.update(delta, elapsedTime, tickTimerState);
      } else {
        _updatableControllers.delete(_entityController);
      }
    }
  }

  function updatePreloadingState(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    state.isPreloading = false;
    state.isPreloaded = true;

    for (_entityController of entityControllers) {
      if (_entityController.state.isPreloading || !_entityController.state.isPreloaded) {
        state.isPreloading = true;
        state.isPreloaded = false;
      }

      if (_entityController.state.isPreloading && isPollablePreloading(_entityController)) {
        _entityController.updatePreloadingState(delta, elapsedTime, tickTimerState);
      }
    }
  }

  function _disposeEntityController(entityController: EntityController<AnyEntity>): void {
    fDispose(logger, entityController);
  }

  function _mountEntityController(entityController: EntityController<AnyEntity>): void {
    fMount(logger, entityController);
  }

  function _pauseEntityController(entityController: EntityController<AnyEntity>): void {
    fPause(logger, entityController);
  }

  function _preloadEntityController(entityController: EntityController<AnyEntity>): void {
    fPreload(logger, entityController);

    if (entityController.state.needsUpdates) {
      _updatableControllers.add(entityController);
    }
  }

  function _unmountEntityController(entityController: EntityController<AnyEntity>): void {
    fUnmount(logger, entityController);
  }

  function _unpauseEntityController(entityController: EntityController<AnyEntity>): void {
    fUnpause(logger, entityController);
  }

  return Object.freeze({
    entityControllers: entityControllers,
    id: generateUUID(),
    isDisposable: true,
    isMountable: true,
    isPollablePreloading: true,
    isPreloadable: true,
    name: "EntityControllerBag",
    state: state,

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
