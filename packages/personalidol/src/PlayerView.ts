import { Object3D } from "three/src/core/Object3D";

import { generateUUID } from "@personalidol/math/src/generateUUID";

import { createEntityViewState } from "./createEntityViewState";

import type { Logger } from "loglevel";
import type { Scene } from "three/src/scenes/Scene";
import type { Vector3 as IVector3 } from "three/src/math/Vector3";

import type { RPCLookupTable } from "@personalidol/framework/src/RPCLookupTable.type";

import type { CharacterView } from "./CharacterView.interface";
import type { EntityPlayer } from "./EntityPlayer.type";
import type { CharacterViewState } from "./CharacterViewState.type";
import type { UserSettings } from "./UserSettings.type";

export function PlayerView(
  logger: Logger,
  userSettings: UserSettings,
  scene: Scene,
  entity: EntityPlayer,
  domMessagePort: MessagePort,
  texturesMessagePort: MessagePort,
  rpcLookupTable: RPCLookupTable
): CharacterView<EntityPlayer> {
  const state: CharacterViewState = Object.assign(
    {},
    createEntityViewState({
      needsUpdates: true,
    }),
    {
      animation: "stand",
    } as const
  );

  const _object3D = new Object3D();

  function dispose(): void {
    state.isDisposed = true;
  }

  function mount(): void {
    state.isMounted = true;
  }

  function pause(): void {
    state.isPaused = true;
  }

  function preload(): void {
    state.isPreloading = true;

    state.isPreloading = false;
    state.isPreloaded = true;
  }

  function transitionBy(vec: IVector3): void {
    _object3D.position.add(vec);
  }

  function transitionTo(vec: IVector3): void {
    return transitionBy(vec.clone().sub(_object3D.position));
  }

  function unmount(): void {
    state.isMounted = false;
  }

  function unpause(): void {
    state.isPaused = false;
  }

  function update(): void {}

  return Object.freeze({
    entity: entity,
    id: generateUUID(),
    interactableObject3D: _object3D,
    isCharacterView: true,
    isDisposable: true,
    isEntityView: true,
    isExpectingTargets: false,
    isInteractable: true,
    isMountable: true,
    isPreloadable: true,
    isRaycastable: true,
    isView: true,
    name: `PlayerView()`,
    object3D: _object3D,
    raycasterObject3D: _object3D,
    state: state,

    dispose: dispose,
    mount: mount,
    pause: pause,
    preload: preload,
    transitionBy: transitionBy,
    transitionTo: transitionTo,
    unmount: unmount,
    unpause: unpause,
    update: update,
  });
}
