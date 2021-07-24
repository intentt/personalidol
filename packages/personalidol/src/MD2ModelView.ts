import { AnimationClip } from "three/src/animation/AnimationClip";
import { BoxGeometry } from "three/src/geometries/BoxGeometry";
import { BufferAttribute } from "three/src/core/BufferAttribute";
import { BufferGeometry } from "three/src/core/BufferGeometry";
import { Color } from "three/src/math/Color";
import { Float32BufferAttribute } from "three/src/core/BufferAttribute";
import { Group } from "three/src/objects/Group";
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial";
import { Vector3 } from "three/src/math/Vector3";

import { createEmptyMesh } from "@personalidol/framework/src/createEmptyMesh";
import { CSS2DObject } from "@personalidol/three-css2d-renderer/src/CSS2DObject";
import { damp } from "@personalidol/math/src/damp";
import { disposableGeneric } from "@personalidol/framework/src/disposableGeneric";
import { disposableMaterial } from "@personalidol/framework/src/disposableMaterial";
import { disposeAll } from "@personalidol/framework/src/disposeAll";
import { generateUUID } from "@personalidol/math/src/generateUUID";
import { MorphBlendMesh } from "@personalidol/three-modules/src/misc/MorphBlendMesh";
import { MorphBlendMeshMixer } from "@personalidol/three-morph-blend-mesh-mixer/src/MorphBlendMeshMixer";
import { mountAll } from "@personalidol/framework/src/mountAll";
import { preload as fPreload } from "@personalidol/framework/src/preload";
import { requestTexture } from "@personalidol/texture-loader/src/requestTexture";
import { sendRPCMessage } from "@personalidol/framework/src/sendRPCMessage";
import { unmountAll } from "@personalidol/framework/src/unmountAll";

import { createEntityViewState } from "./createEntityViewState";
import { MeshUserSettingsManager } from "./MeshUserSettingsManager";
import { useObjectLabel } from "./useObjectLabel";

import type { AnimationClip as IAnimationClip } from "three/src/animation/AnimationClip";
import type { Color as IColor } from "three/src/math/Color";
import type { Group as IGroup } from "three/src/objects/Group";
import type { Logger } from "loglevel";
import type { Mesh as IMesh } from "three/src/objects/Mesh";
import type { Scene } from "three/src/scenes/Scene";
import type { Texture as ITexture } from "three/src/textures/Texture";
import type { Vector3 as IVector3 } from "three/src/math/Vector3";

import type { DisposableCallback } from "@personalidol/framework/src/DisposableCallback.type";
import type { MD2LoaderMorphPosition } from "@personalidol/three-modules/src/loaders/MD2LoaderMorphPosition.type";
import type { MD2LoaderParsedGeometryWithParts } from "@personalidol/three-modules/src/loaders/MD2LoaderParsedGeometryWithParts.type";
import type { MorphBlendMesh as IMorphBlendMesh } from "@personalidol/three-modules/src/misc/MorphBlendMesh.interface";
import type { MorphBlendMeshMixer as IMorphBlendMeshMixer } from "@personalidol/three-morph-blend-mesh-mixer/src/MorphBlendMeshMixer.interface";
import type { MountableCallback } from "@personalidol/framework/src/MountableCallback.type";
import type { RPCLookupTable } from "@personalidol/framework/src/RPCLookupTable.type";
import type { TickTimerState } from "@personalidol/framework/src/TickTimerState.type";
import type { UnmountableCallback } from "@personalidol/framework/src/UnmountableCallback.type";
import type { UserSettingsManager } from "@personalidol/framework/src/UserSettingsManager.interface";

import type { CharacterView } from "./CharacterView.interface";
import type { DOMElementsLookup } from "./DOMElementsLookup.type";
import type { CharacterViewState } from "./CharacterViewState.type";
import type { EntityMD2Model } from "./EntityMD2Model.type";
import type { UserSettings } from "./UserSettings.type";

type AnimationClipsCached = {
  animations: Array<IAnimationClip>;
  usage: number;
};

const MOVEMENT_DAMP = 20;

const _animationClipsCache: Map<string, AnimationClipsCached> = new Map();
let _globalAnimationOffset: number = 0;

function _clearCachedAnimations(entity: EntityMD2Model): void {
  const cachedAnimations: undefined | AnimationClipsCached = _animationClipsCache.get(entity.model_name);

  if (!cachedAnimations) {
    throw new Error(`Expected MD2 animation set to be cached: "${entity.model_name}"`);
  }

  cachedAnimations.usage -= 1;

  if (cachedAnimations.usage < 1) {
    _animationClipsCache.delete(entity.model_name);
  }
}

function _getSetCachedAnimations(
  entity: EntityMD2Model,
  geometry: MD2LoaderParsedGeometryWithParts
): Array<IAnimationClip> {
  const cachedAnimations: undefined | AnimationClipsCached = _animationClipsCache.get(entity.model_name);

  if (cachedAnimations) {
    cachedAnimations.usage += 1;

    return cachedAnimations.animations;
  }

  // @ts-ignore morph targets are incorrectly typed in THREE
  const animations = AnimationClip.CreateClipsFromMorphTargetSequences(geometry.frames, 10, false);

  _animationClipsCache.set(entity.model_name, {
    animations: animations,
    usage: 1,
  });

  return animations;
}

// function _morphNormalToBufferAttribute(morphNormal: MD2LoaderMorphNormal) {
//   const bufferAttribute = new Float32BufferAttribute(morphNormal.normals, 3, true);

//   bufferAttribute.name = morphNormal.name;

//   return bufferAttribute;
// }

function _morphPositionToBufferAttribute(morphPosition: MD2LoaderMorphPosition) {
  const bufferAttribute = new Float32BufferAttribute(morphPosition.positions, 3, true);

  bufferAttribute.name = morphPosition.name;

  return bufferAttribute;
}

export function MD2ModelView(
  logger: Logger,
  userSettings: UserSettings,
  scene: Scene,
  entity: EntityMD2Model,
  domMessagePort: MessagePort,
  md2MessagePort: MessagePort,
  texturesMessagePort: MessagePort,
  rpcLookupTable: RPCLookupTable
): CharacterView<EntityMD2Model> {
  const id: string = generateUUID();
  const name: string = `MD2ModelView("${entity.model_name}", ${entity.skin})`;
  const state: CharacterViewState = Object.seal(
    Object.assign(
      {},
      createEntityViewState({
        needsInteractions: true,
        needsUpdates: true,
      }),
      {
        animation: "stand" as "stand",
      }
    )
  );

  _globalAnimationOffset += 0.3;

  const _animationOffset: number = _globalAnimationOffset;
  const _disposables: Set<DisposableCallback> = new Set();
  const _labelContainer: IGroup = new Group();
  const _materialColor: IColor = new Color();
  const _meshContainer: IGroup = new Group();
  const _raycastMesh: IMesh = createEmptyMesh();
  const _mountables: Set<MountableCallback> = new Set();
  const _unmountables: Set<UnmountableCallback> = new Set();

  const _interactions2DObject = new CSS2DObject<DOMElementsLookup>(domMessagePort, "pi-object-interactions", {
    version: 0,
  });

  let _mesh: null | IMorphBlendMesh = null;
  let _meshLookAt: IVector3 = new Vector3();
  let _meshUserSettingsManager: null | UserSettingsManager = null;
  let _morphBlendMeshMixer: null | IMorphBlendMeshMixer = null;
  let _transitionTarget: IVector3 = new Vector3();

  async function _loadTexture(textureUrl: string): Promise<ITexture> {
    const texture = await requestTexture<ITexture>(rpcLookupTable, texturesMessagePort, textureUrl);

    _disposables.add(disposableGeneric(texture));

    return texture;
  }

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

  async function preload(): Promise<void> {
    state.isPreloading = true;

    const {
      load: geometry,
    }: {
      load: MD2LoaderParsedGeometryWithParts;
    } = await sendRPCMessage(rpcLookupTable, md2MessagePort, {
      load: {
        model_name: entity.model_name,
        rpc: generateUUID(),
      },
    });

    // Geometry

    const bufferGeometry = new BufferGeometry();

    bufferGeometry.setAttribute("normal", new BufferAttribute(geometry.normals, 3));
    bufferGeometry.setAttribute("position", new BufferAttribute(geometry.vertices, 3));
    bufferGeometry.setAttribute("uv", new BufferAttribute(geometry.uvs, 2));

    // MorphNormals does not exist in basic material since it's not reflective.
    // bufferGeometry.morphAttributes.normal = geometry.morphNormals.map(_morphNormalToBufferAttribute);

    bufferGeometry.morphAttributes.position = geometry.morphPositions.map(_morphPositionToBufferAttribute);
    bufferGeometry.morphTargetsRelative = false;

    // @ts-ignore
    bufferGeometry.animations = _getSetCachedAnimations(entity, geometry);

    // Material

    const material = new MeshBasicMaterial({
      map: await _loadTexture(
        `${__ASSETS_BASE_PATH}/models/model-md2-${entity.model_name}/skins/${
          geometry.parts.skins[entity.skin]
        }?${__CACHE_BUST}`
      ),
      morphTargets: true,
      // morphNormals: true,
    });

    material.color = _materialColor;

    // Mesh

    _mesh = new MorphBlendMesh(bufferGeometry, material);
    _mesh.updateMorphTargets();
    _mesh.autoCreateAnimations(10);

    _morphBlendMeshMixer = MorphBlendMeshMixer(_mesh);
    state.animation = "stand";

    _mesh.setAnimationTime("stand", _animationOffset);
    _mesh.position.set(0, 0, 0);
    _mesh.rotation.set(0, entity.angle, 0);

    _meshContainer.add(_mesh);
    _meshUserSettingsManager = MeshUserSettingsManager(logger, userSettings, _mesh);

    _meshContainer.position.set(entity.origin.x, entity.origin.y, entity.origin.z);

    // Raycaster mesh

    const _raycastGeometry = new BoxGeometry(
      Math.abs(geometry.boundingBoxes.stand.min.x - geometry.boundingBoxes.stand.max.x),
      Math.abs(geometry.boundingBoxes.stand.min.y - geometry.boundingBoxes.stand.max.y),
      Math.abs(geometry.boundingBoxes.stand.min.z - geometry.boundingBoxes.stand.max.z)
    );

    _disposables.add(disposableGeneric(_raycastGeometry));

    const _raycastMaterial = new MeshBasicMaterial();

    _disposables.add(disposableMaterial(_raycastMaterial));

    _raycastMesh.geometry = _raycastGeometry;
    _raycastMesh.material = _raycastMaterial;
    _raycastMesh.position.y += 5;
    _raycastMesh.visible = false;
    _raycastMesh.updateMorphTargets();

    _meshContainer.add(_raycastMesh);

    // Object label

    _meshContainer.add(_labelContainer);

    // Only use standing animation to offset the bounding box.
    _labelContainer.position.set(0, geometry.boundingBoxes.stand.max.y + 10, 0);

    useObjectLabel(domMessagePort, _labelContainer, entity, _mountables, _unmountables, _disposables);

    // Object interactions

    _mountables.add(function () {
      _meshContainer.add(_interactions2DObject);
    });

    _unmountables.add(function () {
      _meshContainer.remove(_interactions2DObject);
    });

    // Animations

    _disposables.add(function () {
      _clearCachedAnimations(entity);
    });

    // User settings

    fPreload(logger, _meshUserSettingsManager);

    _mountables.add(function () {
      scene.add(_meshContainer);
    });

    _disposables.add(disposableGeneric(bufferGeometry));
    _disposables.add(disposableMaterial(material));

    _unmountables.add(function () {
      scene.remove(_meshContainer);
    });

    state.isPreloading = false;
    state.isPreloaded = true;
  }

  function transitionBy(vec: IVector3): void {
    if (vec.length() <= 0) {
      state.animation = "stand";

      return;
    }

    if (Math.abs(vec.x) > 0.1 || Math.abs(vec.z) > 0.1) {
      state.animation = "run";
    } else {
      state.animation = "stand";
    }

    if (Math.abs(vec.y) > 16) {
      state.animation = "jump";
    }

    if (_mesh) {
      _mesh.rotation.set(0, (-1 * Math.PI) / 2, 0);
    }

    _transitionTarget.copy(_meshContainer.position).add(vec);
    _meshLookAt.set(_transitionTarget.x, _meshContainer.position.y, _transitionTarget.z);
    _meshContainer.lookAt(_meshLookAt);
  }

  function transitionTo(vec: IVector3): void {
    return transitionBy(vec.clone().sub(_meshContainer.position));
  }

  function unmount(): void {
    state.isMounted = false;

    unmountAll(_unmountables);
  }

  function unpause(): void {
    state.isPaused = false;
  }

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState) {
    if (_meshUserSettingsManager) {
      _meshUserSettingsManager.update(delta, elapsedTime, tickTimerState);
    }

    // if (state.isPaused || !(state.isInteracting || state.isRayIntersecting)) {
    //   _materialColor.set(0xffffff);
    // }

    _interactions2DObject.visible = false;

    if (state.isPaused) {
      return;
    }

    if (state.isInteracting) {
      // _materialColor.set(0x00ff00);
      _interactions2DObject.visible = true;
    }

    // if (state.isRayIntersecting) {
    //   _materialColor.set(0xff0000);
    // }

    // if (state.isInteracting && state.isRayIntersecting) {
    //   _materialColor.set(0xffff00);
    // }

    if (!_morphBlendMeshMixer) {
      return;
    }

    _meshContainer.position.x = damp(_meshContainer.position.x, _transitionTarget.x, MOVEMENT_DAMP, delta);
    _meshContainer.position.y = damp(_meshContainer.position.y, _transitionTarget.y, MOVEMENT_DAMP, delta);
    _meshContainer.position.z = damp(_meshContainer.position.z, _transitionTarget.z, MOVEMENT_DAMP, delta);

    _morphBlendMeshMixer.setAnimation(state.animation);
    _morphBlendMeshMixer.update(delta, elapsedTime, tickTimerState);
  }

  return Object.freeze({
    entity: entity,
    id: id,
    interactableObject3D: _meshContainer,
    isCharacterView: true,
    isDisposable: true,
    isEntityView: true,
    isExpectingTargets: false,
    isInteractable: true,
    isMountable: true,
    isPreloadable: true,
    isRaycastable: true,
    isView: true,
    name: name,
    object3D: _meshContainer,
    raycasterObject3D: _raycastMesh,
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
