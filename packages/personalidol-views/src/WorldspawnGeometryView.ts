import { BufferAttribute } from "three/src/core/BufferAttribute";
import { BufferGeometry } from "three/src/core/BufferGeometry";
import { FrontSide } from "three/src/constants";
import { MathUtils } from "three/src/math/MathUtils";
import { Mesh } from "three/src/objects/Mesh";
import { MeshStandardMaterial } from "three/src/materials/MeshStandardMaterial";
import { Vector3 } from "three/src/math/Vector3";

import { attachAtlasSamplerToStandardShader } from "@personalidol/texture-loader/src/attachAtlasSamplerToStandardShader";
import { disposableGeneric } from "@personalidol/framework/src/disposableGeneric";
import { disposableMaterial } from "@personalidol/framework/src/disposableMaterial";
import { dispose as fDispose } from "@personalidol/framework/src/dispose";
import { mount as fMount } from "@personalidol/framework/src/mount";
import { noop } from "@personalidol/framework/src/noop";
import { unmount as fUnmount } from "@personalidol/framework/src/unmount";

import type { Box3 } from "three/src/math/Box3";
import type { Logger } from "loglevel";
import type { Scene } from "three/src/scenes/Scene";
import type { Texture as ITexture } from "three/src/textures/Texture";

import type { DisposableCallback } from "@personalidol/framework/src/DisposableCallback.type";
import type { Geometry } from "@personalidol/quakemaps/src/Geometry.type";
import type { MountableCallback } from "@personalidol/framework/src/MountableCallback.type";
import type { MountState } from "@personalidol/framework/src/MountState.type";
import type { UnmountableCallback } from "@personalidol/framework/src/UnmountableCallback.type";

import type { WorldspawnGeometryView as IWorldspawnGeometryView } from "./WorldspawnGeometryView.interface";
import type { WorldspawnGeometryViewTHREE } from "./WorldspawnGeometryViewTHREE.type";

const _geometryOffset = new Vector3();

export function WorldspawnGeometryView(logger: Logger, scene: Scene, entity: Geometry, worldspawnTexture: ITexture, matrixAutoUpdate: boolean = false): IWorldspawnGeometryView {
  const id: string = MathUtils.generateUUID();
  const state: MountState = Object.seal({
    isDisposed: false,
    isMounted: false,
    isPreloaded: false,
    isPreloading: false,
  });

  const three: WorldspawnGeometryViewTHREE = Object.seal({
    mesh: null,
  });

  const _disposables: Set<DisposableCallback> = new Set();
  const _mountables: Set<MountableCallback> = new Set();
  const _unmountables: Set<UnmountableCallback> = new Set();

  function dispose(): void {
    state.isDisposed = true;

    fDispose(_disposables);
  }

  function mount(): void {
    state.isMounted = true;

    fMount(_mountables);
  }

  function preload(): void {
    state.isPreloading = true;

    logger.debug(`LOADED_MAP_TRIS("${id}", ${entity.vertices.length / 3})`);

    // Geometry

    const bufferGeometry = new BufferGeometry();

    bufferGeometry.setAttribute("atlas_uv_start", new BufferAttribute(entity.atlasUVStart, 2));
    bufferGeometry.setAttribute("atlas_uv_stop", new BufferAttribute(entity.atlasUVStop, 2));
    bufferGeometry.setAttribute("normal", new BufferAttribute(entity.normals, 3));
    bufferGeometry.setAttribute("position", new BufferAttribute(entity.vertices, 3));
    bufferGeometry.setAttribute("uv", new BufferAttribute(entity.uvs, 2));
    bufferGeometry.setIndex(new BufferAttribute(entity.indices, 1));

    // Material

    const meshStandardMaterial = new MeshStandardMaterial({
      flatShading: true,
      map: worldspawnTexture,
      side: FrontSide,
    });

    // Texture atlas is used here, so texture sampling fragment needs to
    // be changed.
    meshStandardMaterial.onBeforeCompile = attachAtlasSamplerToStandardShader;

    // Mesh

    const mesh = new Mesh(bufferGeometry, meshStandardMaterial);

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
    mesh.position.set(_geometryOffset.x, _geometryOffset.y, _geometryOffset.z);

    mesh.castShadow = mesh.receiveShadow = false;
    mesh.matrixAutoUpdate = matrixAutoUpdate;

    if (!matrixAutoUpdate) {
      // This one update is necessary to set offsets correctly.
      mesh.updateMatrix();
    }

    three.mesh = mesh;

    _mountables.add(function () {
      scene.add(mesh);
    });

    _unmountables.add(function () {
      scene.remove(mesh);
    });

    _disposables.add(disposableGeneric(bufferGeometry));
    _disposables.add(disposableMaterial(meshStandardMaterial));
    _disposables.add(function () {
      // Remove mesh reference so it can be garbage collected.
      three.mesh = null;
    });

    state.isPreloading = false;
    state.isPreloaded = true;
  }

  function unmount(): void {
    state.isMounted = false;

    fUnmount(_unmountables);
  }

  return Object.freeze({
    id: id,
    isScene: false,
    isView: true,
    name: `WorldspawnGeometryView`,
    needsUpdates: false,
    state: state,
    three: three,

    dispose: dispose,
    mount: mount,
    preload: preload,
    unmount: unmount,
    update: noop,
  });
}