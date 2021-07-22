import { BufferAttribute } from "three/src/core/BufferAttribute";
import { BufferGeometry } from "three/src/core/BufferGeometry";
import { BoxGeometry } from "three/src/geometries/BoxGeometry";
import { FrontSide } from "three/src/constants";
import { Group } from "three/src/objects/Group";
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial";
import { MeshStandardMaterial } from "three/src/materials/MeshStandardMaterial";
import { Vector3 } from "three/src/math/Vector3";

import { attachAtlasSamplerToStandardShader } from "@personalidol/texture-loader/src/attachAtlasSamplerToStandardShader";
import { createEmptyMesh } from "@personalidol/framework/src/createEmptyMesh";
import { disposableGeneric } from "@personalidol/framework/src/disposableGeneric";
import { disposableMaterial } from "@personalidol/framework/src/disposableMaterial";
import { disposeAll } from "@personalidol/framework/src/disposeAll";
import { generateUUID } from "@personalidol/math/src/generateUUID";
import { mountAll } from "@personalidol/framework/src/mountAll";
import { preload as fPreload } from "@personalidol/framework/src/preload";
import { unmountAll } from "@personalidol/framework/src/unmountAll";

import { createEntityViewState } from "./createEntityViewState";
import { MeshUserSettingsManager } from "./MeshUserSettingsManager";

import type { Box3 } from "three/src/math/Box3";
import type { Group as IGroup } from "three/src/objects/Group";
import type { Logger } from "loglevel";
import type { Mesh as IMesh } from "three/src/objects/Mesh";
import type { Scene } from "three/src/scenes/Scene";
import type { Texture as ITexture } from "three/src/textures/Texture";

import type { DisposableCallback } from "@personalidol/framework/src/DisposableCallback.type";
import type { MountableCallback } from "@personalidol/framework/src/MountableCallback.type";
import type { TickTimerState } from "@personalidol/framework/src/TickTimerState.type";
import type { UnmountableCallback } from "@personalidol/framework/src/UnmountableCallback.type";

import type { AnyEntity } from "./AnyEntity.type";
import type { EntityView } from "./EntityView.interface";
import type { EntityViewState } from "./EntityViewState.type";
import type { GeometryWithBrushesEntity } from "./GeometryWithBrushesEntity.type";
import type { UserSettings } from "./UserSettings.type";

const _geometryOffset = new Vector3();

export function WorldspawnGeometryView<E extends AnyEntity & GeometryWithBrushesEntity>(
  logger: Logger,
  userSettings: UserSettings,
  scene: Scene,
  entity: E,
  worldspawnTexture: ITexture,
  matrixAutoUpdate: boolean = false
): EntityView<E> {
  const id: string = generateUUID();
  const state: EntityViewState = createEntityViewState({
    needsUpdates: true,
  });

  const _disposables: Set<DisposableCallback> = new Set();
  const _mesh: IMesh = createEmptyMesh();
  const _meshContainer: IGroup = new Group();
  const _meshUserSettingsManager = MeshUserSettingsManager(logger, userSettings, _mesh);
  const _mountables: Set<MountableCallback> = new Set();
  const _raycastMesh: IMesh = createEmptyMesh();
  const _unmountables: Set<UnmountableCallback> = new Set();

  function dispose(): void {
    state.isDisposed = true;

    disposeAll(_disposables);
  }

  function mount(): void {
    state.isMounted = true;

    mountAll(_mountables);
  }

  function pause(): void {
    state.isPaused = true;
  }

  function preload(): void {
    state.isPreloading = true;

    // Geometry

    const bufferGeometry = new BufferGeometry();

    bufferGeometry.setAttribute("atlas_uv_start", new BufferAttribute(entity.atlasUVStart, 2));
    bufferGeometry.setAttribute("atlas_uv_stop", new BufferAttribute(entity.atlasUVStop, 2));
    bufferGeometry.setAttribute("normal", new BufferAttribute(entity.normal, 3));
    bufferGeometry.setAttribute("position", new BufferAttribute(entity.position, 3));
    bufferGeometry.setAttribute("uv", new BufferAttribute(entity.uv, 2));
    bufferGeometry.setIndex(new BufferAttribute(entity.index, 1));

    _disposables.add(disposableGeneric(bufferGeometry));

    // Material

    const meshStandardMaterial = new MeshStandardMaterial({
      flatShading: true,
      map: worldspawnTexture,
      opacity: 0.2,
      side: FrontSide,
    });

    // Texture atlas is used here, so texture sampling fragment needs to
    // be changed.
    meshStandardMaterial.onBeforeCompile = attachAtlasSamplerToStandardShader;

    _disposables.add(disposableMaterial(meshStandardMaterial));

    // Mesh

    _mesh.geometry = bufferGeometry;
    _mesh.material = meshStandardMaterial;

    // Offset geometry back to its origin, then move the mesh to the place
    // where geometry was expected to be in the map editor. This helps with
    // rotations and other operations like that.

    bufferGeometry.computeBoundingBox();

    const geometryBoundingBox: null | Box3 = bufferGeometry.boundingBox;

    if (!geometryBoundingBox) {
      throw new Error("Unable to compute geometry bounding box");
    }

    geometryBoundingBox.getCenter(_geometryOffset);

    bufferGeometry.translate(-1 * _geometryOffset.x, -1 * _geometryOffset.y, -1 * _geometryOffset.z);

    _mesh.matrixAutoUpdate = matrixAutoUpdate;

    // Raycaster mesh

    const _raycastGeometry = new BoxGeometry(
      Math.abs(geometryBoundingBox.min.x - geometryBoundingBox.max.x),
      Math.abs(geometryBoundingBox.min.y - geometryBoundingBox.max.y),
      Math.abs(geometryBoundingBox.min.z - geometryBoundingBox.max.z)
    );

    _disposables.add(disposableGeneric(_raycastGeometry));

    const _raycastMaterial = new MeshBasicMaterial();

    _disposables.add(disposableMaterial(_raycastMaterial));

    _raycastMesh.geometry = _raycastGeometry;
    _raycastMesh.material = _raycastMaterial;
    _raycastMesh.visible = false;
    _raycastMesh.updateMorphTargets();

    _meshContainer.add(_raycastMesh);

    // Apply user settings before updating mesh matrix.
    fPreload(logger, _meshUserSettingsManager);

    if (!matrixAutoUpdate) {
      // This one update is necessary to set offsets correctly.
      _mesh.updateMatrix();
    }

    // Mesh container

    _meshContainer.position.set(_geometryOffset.x, _geometryOffset.y, _geometryOffset.z);
    _meshContainer.add(_mesh);

    _mountables.add(function () {
      scene.add(_meshContainer);
    });

    _unmountables.add(function () {
      scene.remove(_meshContainer);
    });

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
    _meshUserSettingsManager.update(delta, elapsedTime, tickTimerState);

    if (Array.isArray(_mesh.material)) {
      throw new Error("WorldspawnGeometryView unexpectedly has multimaterial geometry.");
    }

    _mesh.material.transparent = state.isObscuring;
  }

  return Object.freeze({
    entity: entity,
    id: id,
    interactableObject3D: _raycastMesh,
    isDisposable: true,
    isEntityView: true,
    isExpectingTargets: false,
    isInteractable: true,
    isMountable: true,
    isPreloadable: true,
    isRaycastable: true,
    isView: true,
    name: `WorldspawnGeometryView`,
    object3D: _meshContainer,
    raycasterObject3D: _raycastMesh,
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
