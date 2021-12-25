import { Vector3 } from "three/src/math/Vector3";

import { createRouter } from "../../framework/src/createRouter";
import { generateUUID } from "../../math/src/generateUUID";
import { name } from "../../framework/src/name";
import { RigidBodyRemoteHandle } from "../../dynamics/src/RigidBodyRemoteHandle";

import { createEntityControllerState } from "./createEntityControllerState";

import type { Logger } from "loglevel";
import type { Vector3 as IVector3 } from "three/src/math/Vector3";

import type { MessageSimulantDispose } from "../../dynamics/src/MessageSimulantDispose.type";
import type { MessageSimulantRegister } from "../../dynamics/src/MessageSimulantRegister.type";
import type { TickTimerState } from "../../framework/src/TickTimerState.type";
import type { Vector3Simple } from "../../quakemaps/src/Vector3Simple.type";

import type { CharacterView } from "./CharacterView.interface";
import type { EntityControllerState } from "./EntityControllerState.type";
import type { NPCEntity } from "./NPCEntity.type";
import type { NPCEntityController } from "./NPCEntityController.interface";
import type { SimulantsLookup } from "./SimulantsLookup.type";

export function NPCEntityController<E extends NPCEntity>(
  logger: Logger,
  view: CharacterView<E>,
  dynamicsMessagePort: MessagePort
): NPCEntityController<E> {
  const state: EntityControllerState = createEntityControllerState({
    needsUpdates: true,
  });

  const _simulantFeedbackMessageRouter = createRouter({
    origin: _onSimulantOriginChange,
    preloaded: _onSimulantPreloaded,
  });

  const _transitionVector: IVector3 = new Vector3();

  let _internalDynamicsMessageChannel: MessageChannel = new MessageChannel();
  let _simulantId: string = generateUUID();

  function _onSimulantOriginChange(origin: Vector3Simple): void {
    _transitionVector.set(origin.x, origin.y, origin.z);
    view.transitionTo(_transitionVector);
  }

  function _onSimulantPreloaded(): void {
    if (!state.isPreloading) {
      throw new Error("Controller is not preloading, but simulant reported preloaded state.");
    }

    state.isPreloading = false;
    state.isPreloaded = true;
  }

  function dispose(): void {
    state.isDisposed = true;

    dynamicsMessagePort.postMessage({
      disposeSimulant: <MessageSimulantDispose>[_simulantId],
    });

    _internalDynamicsMessageChannel.port1.close();
    // _internalDynamicsMessageChannel.port2.close();
  }

  function mount(): void {
    state.isMounted = true;
  }

  function pause(): void {
    state.isPaused = true;
  }

  function preload(): void {
    state.isPreloading = true;
    state.isPreloaded = false;

    _internalDynamicsMessageChannel.port1.onmessage = _simulantFeedbackMessageRouter;

    dynamicsMessagePort.postMessage(
      {
        registerSimulant: <MessageSimulantRegister<SimulantsLookup, "npc">>{
          id: _simulantId,
          simulant: "npc",
          simulantFeedbackMessagePort: _internalDynamicsMessageChannel.port2,
        },
      },
      [_internalDynamicsMessageChannel.port2]
    );

    _internalDynamicsMessageChannel.port1.postMessage({
      entity: view.entity,
    });
  }

  function unmount(): void {
    state.isMounted = false;
  }

  function unpause(): void {
    state.isPaused = false;
  }

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {}

  return Object.freeze({
    id: generateUUID(),
    isDisposable: true,
    isEntityController: true,
    isMountable: true,
    isPreloadable: true,
    name: `NPCEntityController(${name(view)})`,
    rigidBody: RigidBodyRemoteHandle(_internalDynamicsMessageChannel.port1),
    state: state,
    view: view,

    dispose: dispose,
    mount: mount,
    pause: pause,
    preload: preload,
    unmount: unmount,
    unpause: unpause,
    update: update,
  });
}
