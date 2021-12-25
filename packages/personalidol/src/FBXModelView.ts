import { BufferAttribute } from "three/src/core/BufferAttribute";
import { BufferGeometry } from "three/src/core/BufferGeometry";
import { Group } from "three/src/objects/Group";
import { Mesh } from "three/src/objects/Mesh";
import { MeshStandardMaterial } from "three/src/materials/MeshStandardMaterial";

import { disposableGeneric } from "../../framework/src/disposableGeneric";
import { disposableMaterial } from "../../framework/src/disposableMaterial";
import { disposeAll } from "../../framework/src/disposeAll";
import { preload as fPreload } from "../../framework/src/preload";
import { generateUUID } from "../../math/src/generateUUID";
import { mountAll } from "../../framework/src/mountAll";
import { unmountAll } from "../../framework/src/unmountAll";
import { sendRPCMessage } from "../../framework/src/sendRPCMessage";

import { createEntityViewState } from "./createEntityViewState";
import { MeshUserSettingsManager } from "./MeshUserSettingsManager";
import { useObjectLabel } from "./useObjectLabel";

import type { Group as IGroup } from "three/src/objects/Group";
import type { Logger } from "loglevel";
import type { Scene } from "three/src/scenes/Scene";

import type { DisposableCallback } from "../../framework/src/DisposableCallback.type";
import type { GeometryAttributes } from "../../framework/src/GeometryAttributes.type";
import type { MountableCallback } from "../../framework/src/MountableCallback.type";
import type { RPCLookupTable } from "../../framework/src/RPCLookupTable.type";
import type { TickTimerState } from "../../framework/src/TickTimerState.type";
import type { UnmountableCallback } from "../../framework/src/UnmountableCallback.type";
import type { UserSettingsManager } from "../../framework/src/UserSettingsManager.interface";

import type { EntityFBXModel } from "./EntityFBXModel.type";
import type { EntityView } from "./EntityView.interface";
import type { EntityViewState } from "./EntityViewState.type";
import type { UserSettings } from "./UserSettings.type";

export function FBXModelView(
  logger: Logger,
  userSettings: UserSettings,
  scene: Scene,
  entity: EntityFBXModel,
  domMessagePort: MessagePort,
  fbxMessagePort: MessagePort,
  texturesMessagePort: MessagePort,
  rpcLookupTable: RPCLookupTable
): EntityView<EntityFBXModel> {
  const state: EntityViewState = createEntityViewState({
    needsUpdates: true,
  });

  const _disposables: Set<DisposableCallback> = new Set();
  const _labelContainer: IGroup = new Group();
  const _meshContainer: IGroup = new Group();
  const _mountables: Set<MountableCallback> = new Set();
  const _unmountables: Set<UnmountableCallback> = new Set();

  // const _fbxLoader = new FBXLoader();
  let _meshUserSettingsManager: null | UserSettingsManager = null;

  function dispose(): void {
    state.isDisposed = true;

    disposeAll(_disposables);
  }

  function mount(): void {
    state.isMounted = true;

    mountAll(_mountables);
    scene.add(_labelContainer);
  }

  function pause(): void {
    state.isPaused = true;
  }

  async function preload(): Promise<void> {
    state.isPreloading = true;

    const rpc = generateUUID();

    const {
      load: geometryAttributes,
    }: {
      load: GeometryAttributes;
    } = await sendRPCMessage(rpcLookupTable, fbxMessagePort, {
      load: {
        model_name: entity.model_name,
        model_scale: entity.scale,
        rpc: rpc,
      },
    });

    const bufferGeometry = new BufferGeometry();

    bufferGeometry.setAttribute("normal", new BufferAttribute(geometryAttributes.normal, 3));
    bufferGeometry.setAttribute("position", new BufferAttribute(geometryAttributes.position, 3));
    bufferGeometry.setAttribute("uv", new BufferAttribute(geometryAttributes.uv, 2));

    if (geometryAttributes.index) {
      bufferGeometry.setIndex(new BufferAttribute(geometryAttributes.index, 1));
    }

    _disposables.add(disposableGeneric(bufferGeometry));

    const material = new MeshStandardMaterial({
      color: 0xcccccc,
      flatShading: false,
      // map: await texturePromise,
    });

    _disposables.add(disposableMaterial(material));

    const _mesh = new Mesh(bufferGeometry, material);

    _mesh.position.set(entity.origin.x, entity.origin.y, entity.origin.z);
    _mesh.rotation.set(0, entity.angle, 0);

    _meshUserSettingsManager = MeshUserSettingsManager(logger, userSettings, _mesh);

    _mountables.add(function () {
      scene.add(_mesh);
    });

    _unmountables.add(function () {
      scene.remove(_mesh);
    });

    useObjectLabel(domMessagePort, _labelContainer, entity, _mountables, _unmountables, _disposables);

    fPreload(logger, _meshUserSettingsManager);

    state.isPreloading = false;
    state.isPreloaded = true;
  }

  function unmount(): void {
    state.isMounted = false;

    unmountAll(_unmountables);
    scene.remove(_labelContainer);
  }

  function unpause(): void {
    state.isPaused = false;
  }

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    if (_meshUserSettingsManager) {
      _meshUserSettingsManager.update(delta, elapsedTime, tickTimerState);
    }
  }

  return Object.freeze({
    entity: entity,
    id: generateUUID(),
    interactableObject3D: _meshContainer,
    isDisposable: true,
    isEntityView: true,
    isExpectingTargets: false,
    isInteractable: true,
    isMountable: true,
    isPreloadable: true,
    isRaycastable: true,
    isView: true,
    name: `FBXModelView("${entity.model_name}", "${entity.model_texture}", ${entity.scale})`,
    object3D: _meshContainer,
    raycasterObject3D: _meshContainer,
    state: state,

    dispose: dispose,
    mount: mount,
    pause: pause,
    preload: preload,
    unmount: unmount,
    unpause: unpause,
    update: update,
  });
}
