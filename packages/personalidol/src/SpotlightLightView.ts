import { Color } from "three/src/math/Color";
import { SpotLight } from "three/src/lights/SpotLight";

import { disposeWebGLRenderTarget } from "@personalidol/framework/src/disposeWebGLRenderTarget";
import { generateUUID } from "@personalidol/math/src/generateUUID";
import { onlyOne } from "@personalidol/framework/src/onlyOne";
import { preload as fPreload } from "@personalidol/framework/src/preload";

import { ShadowLightUserSettingsManager } from "./ShadowLightUserSettingsManager";

import type { Logger } from "loglevel";
import type { Scene } from "three/src/scenes/Scene";

import type { View } from "@personalidol/views/src/View.interface";

import type { EntityLightSpotlight } from "./EntityLightSpotlight.type";
import type { EntityView } from "./EntityView.interface";
import type { EntityViewState } from "./EntityViewState.type";
import type { UserSettings } from "./UserSettings.type";

export function SpotlightLightView(
  logger: Logger,
  userSettings: UserSettings,
  scene: Scene,
  entity: EntityLightSpotlight,
  targetedViews: Set<View>
): EntityView<EntityLightSpotlight> {
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
  const _spotLight = new SpotLight(_color, entity.intensity);
  const _target: View = onlyOne(targetedViews, `SpotLight must have exactly 1 target, got: "${targetedViews.size}"`);
  const _userSettingsManager = ShadowLightUserSettingsManager(userSettings, entity, _spotLight);

  function dispose(): void {
    state.isDisposed = true;

    disposeWebGLRenderTarget(_spotLight.shadow.map);
  }

  function mount(): void {
    state.isMounted = true;

    scene.add(_spotLight);
  }

  function pause(): void {
    state.isPaused = true;
  }

  function preload(): void {
    _spotLight.position.set(entity.origin.x, entity.origin.y, entity.origin.z);
    _spotLight.target = _target.object3D;

    const distanceToTarget: number = _spotLight.position.distanceTo(_spotLight.target.position);

    _spotLight.decay = entity.decay;
    _spotLight.distance = 2 * distanceToTarget;
    _spotLight.penumbra = 0.6;
    _spotLight.visible = true;
    _spotLight.shadow.camera.far = _spotLight.distance;

    fPreload(logger, _userSettingsManager);

    state.isPreloading = false;
    state.isPreloaded = true;
  }

  function unmount(): void {
    state.isMounted = false;

    scene.remove(_spotLight);
  }

  function unpause(): void {
    state.isPaused = false;
  }

  return Object.freeze({
    entity: entity,
    id: generateUUID(),
    isDisposable: true,
    isEntityView: true,
    isExpectingTargets: true,
    isMountable: true,
    isPreloadable: true,
    isRaycastable: true,
    isView: true,
    name: `SpotlightLightView("${entity.color}",${entity.decay},${entity.intensity})`,
    object3D: _spotLight,
    raycasterObject3D: _spotLight,
    state: state,

    dispose: dispose,
    mount: mount,
    pause: pause,
    preload: preload,
    unmount: unmount,
    unpause: unpause,
    update: _userSettingsManager.update,
  });
}
