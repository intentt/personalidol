import { BufferAttribute } from "three/src/core/BufferAttribute";
import { BufferGeometry } from "three/src/core/BufferGeometry";
import { InstancedMesh } from "three/src/objects/InstancedMesh";
import { MeshStandardMaterial } from "three/src/materials/MeshStandardMaterial";

import { createViewState } from "@personalidol/views/src/createViewState";
import { disposableGeneric } from "@personalidol/framework/src/disposableGeneric";
import { disposableMaterial } from "@personalidol/framework/src/disposableMaterial";
import { disposeAll } from "@personalidol/framework/src/disposeAll";
import { generateUUID } from "@personalidol/math/src/generateUUID";
import { mountAll } from "@personalidol/framework/src/mountAll";
import { must } from "@personalidol/framework/src/must";
import { name } from "@personalidol/framework/src/name";
import { preload as fPreload } from "@personalidol/framework/src/preload";
import { requestTexture } from "@personalidol/texture-loader/src/requestTexture";
import { sendRPCMessage } from "@personalidol/framework/src/sendRPCMessage";
import { unmountAll } from "@personalidol/framework/src/unmountAll";

import { InstancedMeshHandle } from "./InstancedMeshHandle";
import { MeshUserSettingsManager } from "./MeshUserSettingsManager";

import type { BufferGeometry as IBufferGeometry } from "three/src/core/BufferGeometry";
import type { InstancedMesh as IInstancedMesh } from "three/src/objects/InstancedMesh";
import type { Logger } from "loglevel";
import type { MeshStandardMaterial as IMeshStandardMaterial } from "three/src/materials/MeshStandardMaterial";
import type { Object3D } from "three/src/core/Object3D";
import type { Scene } from "three/src/scenes/Scene";

import type { DisposableCallback } from "@personalidol/framework/src/DisposableCallback.type";
import type { GeometryAttributes } from "@personalidol/three-modules/src/loaders/GeometryAttributes.type";
import type { MountableCallback } from "@personalidol/framework/src/MountableCallback.type";
import type { Nameable } from "@personalidol/framework/src/Nameable.interface";
import type { RPCLookupTable } from "@personalidol/framework/src/RPCLookupTable.type";
import type { Texture as ITexture } from "three/src/textures/Texture";
import type { TickTimerState } from "@personalidol/framework/src/TickTimerState.type";
import type { UnmountableCallback } from "@personalidol/framework/src/UnmountableCallback.type";
import type { UserSettingsManager } from "@personalidol/framework/src/UserSettingsManager.interface";
import type { ViewState } from "@personalidol/views/src/ViewState.type";

import type { EntityGLTFModel } from "./EntityGLTFModel.type";
import type { InstancedGLTFModelViewManager as IInstancedGLTFModelViewManager } from "./InstancedGLTFModelViewManager.interface";
import type { InstancedMeshHandle as IInstancedMeshHandle } from "./InstancedMeshHandle.interface";
import type { UserSettings } from "./UserSettings.type";

type GeometryTexture = {
  geometry: Promise<GeometryAttributes>;
  texture: Promise<ITexture>;
};

export function InstancedGLTFModelViewManager(
  logger: Logger,
  userSettings: UserSettings,
  scene: Scene,
  gltfMessagePort: MessagePort,
  texturesMessagePort: MessagePort,
  rpcLookupTable: RPCLookupTable
): IInstancedGLTFModelViewManager {
  const nameable: Nameable = Object.seal({
    id: generateUUID(),
    name: "InstancedGLTFModelViewManager",
  });
  const state: ViewState = createViewState({
    needsUpdates: true,
  });

  const _disposables: Set<DisposableCallback> = new Set();
  const _expectedEntities: WeakSet<EntityGLTFModel> = new WeakSet();
  const _expectedEntitiesCount: {
    [key: string]: number;
  } = {};
  const _expectedEntitiesUnique: Map<string, GeometryTexture> = new Map();
  const _expectedGemetryAttributes: Map<string, Promise<GeometryAttributes>> = new Map();
  const _expectedTextures: Map<string, Promise<ITexture>> = new Map();
  const _instancedMeshes: Map<string, Promise<IInstancedMesh>> = new Map();
  const _instancedMeshCurrentIndex: WeakMap<IInstancedMesh, number> = new WeakMap();
  const _meshUserSettingsManagers: Set<UserSettingsManager> = new Set();
  const _mountables: Set<MountableCallback> = new Set();
  const _unmountables: Set<UnmountableCallback> = new Set();

  async function _createBufferGeometry(entity: EntityGLTFModel): Promise<IBufferGeometry> {
    const geometryKey = _createGeometryKey(entity);
    const geometryAttributesPromise: undefined | Promise<GeometryAttributes> =
      _expectedGemetryAttributes.get(geometryKey);

    if (!geometryAttributesPromise) {
      throw new Error("Expected geometry attributes to be set.");
    }

    const geometryAttributes = await geometryAttributesPromise;
    const bufferGeometry = new BufferGeometry();

    bufferGeometry.setAttribute("normal", new BufferAttribute(geometryAttributes.normal, 3));
    bufferGeometry.setAttribute("position", new BufferAttribute(geometryAttributes.position, 3));
    bufferGeometry.setAttribute("uv", new BufferAttribute(geometryAttributes.uv, 2));

    if (geometryAttributes.index) {
      bufferGeometry.setIndex(new BufferAttribute(geometryAttributes.index, 1));
    }

    _disposables.add(disposableGeneric(bufferGeometry));

    return bufferGeometry;
  }

  async function _createMaterial(entity: EntityGLTFModel): Promise<IMeshStandardMaterial> {
    const textureUrl = _createTextureUrl(entity);
    const texturePromise: undefined | Promise<ITexture> = _expectedTextures.get(textureUrl);

    if (!texturePromise) {
      throw new Error(`Expected texture to be preloaded: "${textureUrl}"`);
    }

    const material = new MeshStandardMaterial({
      color: 0xcccccc,
      flatShading: false,
      map: await texturePromise,
      // morphTargets: false,
    });

    _disposables.add(disposableMaterial(material));

    return material;
  }

  function _createEntityKey(entity: EntityGLTFModel): string {
    return `${_createGeometryKey(entity)}:${entity.model_texture}`;
  }

  function _createGeometryKey(entity: EntityGLTFModel): string {
    return `${entity.model_name}:${entity.scale}`;
  }

  async function _createInstancedMesh(entity: EntityGLTFModel): Promise<IInstancedMesh> {
    const entityKey = _createEntityKey(entity);

    if (!_expectedEntitiesCount.hasOwnProperty(entityKey)) {
      throw new Error("Entity is not preloaded.");
    }

    const geometry = await _createBufferGeometry(entity);
    const material = await _createMaterial(entity);
    const instancedMesh = new InstancedMesh(geometry, material, _expectedEntitiesCount[entityKey]);
    const meshUserSettingsManager = MeshUserSettingsManager(logger, userSettings, instancedMesh);

    await fPreload(logger, meshUserSettingsManager);

    _meshUserSettingsManagers.add(meshUserSettingsManager);

    _mountables.add(function () {
      scene.add(instancedMesh);
    });

    _unmountables.add(function () {
      scene.remove(instancedMesh);
    });

    return instancedMesh;
  }

  function _createTextureUrl(entity: EntityGLTFModel): string {
    return `${__ASSETS_BASE_PATH}/models/model-glb-${entity.model_name}/${entity.model_texture}?${__CACHE_BUST}`;
  }

  async function _createGeometryAttributes(entity: EntityGLTFModel): Promise<GeometryAttributes> {
    const {
      load: geometry,
    }: {
      load: GeometryAttributes;
    } = await sendRPCMessage(rpcLookupTable, gltfMessagePort, {
      load: {
        model_filename: entity.model_filename,
        model_name: entity.model_name,
        model_scale: entity.scale,
        rpc: generateUUID(),
      },
    });

    return geometry;
  }

  async function _createTexture(textureUrl: string): Promise<ITexture> {
    const texture = await requestTexture<ITexture>(rpcLookupTable, texturesMessagePort, textureUrl);

    _disposables.add(disposableGeneric(texture));

    return texture;
  }

  async function createEntiyMeshHandle(entity: EntityGLTFModel, container: Object3D): Promise<IInstancedMeshHandle> {
    if (!_expectedEntities.has(entity)) {
      throw new Error(
        `Entity is not expected for instancing: "Entity("${entity.classname}", "${entity.model_name}", "${entity.model_texture}")`
      );
    }

    const entityKey = _createEntityKey(entity);

    if (!_instancedMeshes.has(entityKey)) {
      _instancedMeshes.set(entityKey, _createInstancedMesh(entity));
    }

    const instancedMesh = await must(_instancedMeshes.get(entityKey));

    if (!_instancedMeshCurrentIndex.has(instancedMesh)) {
      _instancedMeshCurrentIndex.set(instancedMesh, 0);
    }

    const index: number = must(_instancedMeshCurrentIndex.get(instancedMesh));

    if (index + 1 > _expectedEntitiesCount[entityKey]) {
      throw new Error("There are more entity handles used than entities that has been expected.");
    }

    _instancedMeshCurrentIndex.set(instancedMesh, index + 1);

    return InstancedMeshHandle(logger, userSettings, instancedMesh, index, container);
  }

  function dispose(): void {
    state.isDisposed = true;

    _expectedEntitiesUnique.clear();
    _expectedGemetryAttributes.clear();
    _expectedTextures.clear();
    _meshUserSettingsManagers.clear();

    disposeAll(_disposables);
  }

  function expectEntity(entity: EntityGLTFModel): void {
    if (state.isPreloading) {
      throw new Error(`Instanced view manager is preloading and no new entities can be expected: "${name(nameable)}"`);
    }

    if (state.isPreloaded) {
      throw new Error(
        `Instanced view manager is already preloaded and no new entities can be expected: "${name(nameable)}"`
      );
    }

    const textureUrl = _createTextureUrl(entity);

    _expectedEntities.add(entity);

    if (!_expectedTextures.has(textureUrl)) {
      _expectedTextures.set(textureUrl, _createTexture(textureUrl));
    }

    const geometryKey = _createGeometryKey(entity);

    if (!_expectedGemetryAttributes.has(geometryKey)) {
      _expectedGemetryAttributes.set(geometryKey, _createGeometryAttributes(entity));
    }

    const entityKey = _createEntityKey(entity);

    if (!_expectedEntitiesCount.hasOwnProperty(entityKey)) {
      _expectedEntitiesCount[entityKey] = 0;
    }

    _expectedEntitiesCount[entityKey] += 1;

    if (_expectedEntitiesUnique.has(entityKey)) {
      return;
    }

    _expectedEntitiesUnique.set(entityKey, {
      geometry: must(_expectedGemetryAttributes.get(geometryKey)),
      texture: must(_expectedTextures.get(textureUrl)),
    });
  }

  function mount(): void {
    state.isMounted = true;

    mountAll(_mountables);
  }

  function pause(): void {
    state.isPaused = true;
  }

  async function preload(): Promise<void> {
    state.isPreloading = false;
    state.isPreloaded = true;
  }

  function unmount(): void {
    state.isMounted = false;

    unmountAll(_unmountables);
  }

  function unpause(): void {
    state.isPaused = false;
  }

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    for (let meshUserSettingsManager of _meshUserSettingsManagers) {
      meshUserSettingsManager.update(delta, elapsedTime, tickTimerState);
    }
  }

  return Object.freeze({
    id: nameable.id,
    interactableObject3D: scene,
    isDisposable: true,
    isInstancedGLTFModelViewManager: true,
    isInteractable: true,
    isMountable: true,
    isPreloadable: true,
    isRaycastable: true,
    isView: true,
    name: nameable.name,
    object3D: scene,
    raycasterObject3D: scene,
    scene: scene,
    state: state,

    createEntiyMeshHandle: createEntiyMeshHandle,
    dispose: dispose,
    expectEntity: expectEntity,
    mount: mount,
    pause: pause,
    preload: preload,
    unmount: unmount,
    unpause: unpause,
    update: update,
  });
}
