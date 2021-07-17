import { Color } from "three/src/math/Color";
import { PointLight } from "three/src/lights/PointLight";

import { disposeWebGLRenderTarget } from "@personalidol/framework/src/disposeWebGLRenderTarget";
import { generateUUID } from "@personalidol/math/src/generateUUID";
import { preload as fPreload } from "@personalidol/framework/src/preload";

import { ShadowLightUserSettingsManager } from "./ShadowLightUserSettingsManager";

import type { Logger } from "loglevel";
import type { Scene } from "three/src/scenes/Scene";

import type { EntityLightPoint } from "./EntityLightPoint.type";
import type { EntityView } from "./EntityView.interface";
import type { EntityViewState } from "./EntityViewState.type";
import type { UserSettings } from "./UserSettings.type";

export function PointLightView(
  logger: Logger,
  userSettings: UserSettings,
  scene: Scene,
  entity: EntityLightPoint
): EntityView<EntityLightPoint> {
  const state: EntityViewState = Object.seal({
    isDisposed: false,
    isMounted: false,
    isObscuring: false,
    isPaused: false,
    isPreloaded: false,
    isPreloading: false,
    isRayIntersecting: false,
    needsRaycast: false,
    needsUpdates: true,
  });

  const _color = new Color(parseInt(entity.color, 16));
  const _pointLight = new PointLight(_color, entity.intensity, 1024);
  const _userSetingsManager = ShadowLightUserSettingsManager(userSettings, entity, _pointLight);

  function dispose(): void {
    state.isDisposed = true;

    disposeWebGLRenderTarget(_pointLight.shadow.map);
  }

  function mount(): void {
    state.isMounted = true;

    scene.add(_pointLight);
  }

  function pause(): void {
    state.isPaused = true;
  }

  function preload(): void {
    _pointLight.position.set(entity.origin.x, entity.origin.y, entity.origin.z);
    _pointLight.decay = entity.decay;
    _pointLight.shadow.camera.far = 1024;

    fPreload(logger, _userSetingsManager);

    state.isPreloading = false;
    state.isPreloaded = true;
  }

  function unmount(): void {
    state.isMounted = false;

    scene.remove(_pointLight);
  }

  function unpause(): void {
    state.isPaused = false;
  }

  return Object.freeze({
    entity: entity,
    id: generateUUID(),
    isDisposable: true,
    isEntityView: true,
    isExpectingTargets: false,
    isMountable: true,
    isPreloadable: true,
    isRaycastable: true,
    isView: true,
    name: `PointLightView("${entity.color}",${entity.decay},${entity.intensity})`,
    object3D: _pointLight,
    raycasterObject3D: _pointLight,
    state: state,

    dispose: dispose,
    mount: mount,
    pause: pause,
    preload: preload,
    unmount: unmount,
    unpause: unpause,
    update: _userSetingsManager.update,
  });
}
