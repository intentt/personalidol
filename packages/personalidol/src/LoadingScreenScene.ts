import { AmbientLight } from "three/src/lights/AmbientLight";
import { BoxGeometry } from "three/src/geometries/BoxGeometry";
import { Color } from "three/src/math/Color";
import { Mesh } from "three/src/objects/Mesh";
import { MeshStandardMaterial } from "three/src/materials/MeshStandardMaterial";
import { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera";
import { Scene } from "three/src/scenes/Scene";
import { SpotLight } from "three/src/lights/SpotLight";

import { createRouter } from "../../framework/src/createRouter";
import { disposableGeneric } from "../../framework/src/disposableGeneric";
import { disposableMaterial } from "../../framework/src/disposableMaterial";
import { disposeAll } from "../../framework/src/disposeAll";
import { generateUUID } from "../../math/src/generateUUID";
import { GlitchPass } from "../../three-modules/src/postprocessing/GlitchPass";
import { RenderPass } from "../../three-modules/src/postprocessing/RenderPass";
import { unmountAll } from "../../framework/src/unmountAll";
import { unmountPass } from "../../three-modules/src/unmountPass";
import { updatePerspectiveCameraAspect } from "../../framework/src/updatePerspectiveCameraAspect";

import type { Logger } from "loglevel";

import type { DisposableCallback } from "../../framework/src/DisposableCallback.type";
import type { EffectComposer } from "../../three-modules/src/postprocessing/EffectComposer.interface";
import type { MessageProgressError } from "../../framework/src/MessageProgressError.type";
import type { ProgressManagerState } from "../../framework/src/ProgressManagerState.type";
import type { Scene as IScene } from "../../framework/src/Scene.interface";
import type { SceneState } from "../../framework/src/SceneState.type";
import type { TickTimerState } from "../../framework/src/TickTimerState.type";
import type { UnmountableCallback } from "../../framework/src/UnmountableCallback.type";

import type { UserSettings } from "./UserSettings.type";

export function LoadingScreenScene(
  logger: Logger,
  userSettings: UserSettings,
  effectComposer: EffectComposer,
  dimensionsState: Uint32Array,
  domMessagePort: MessagePort,
  progressMessagePort: MessagePort
): IScene {
  const state: SceneState = Object.seal({
    isDisposed: false,
    isMounted: false,
    isPaused: false,
    isPreloaded: false,
    isPreloading: false,
    needsUpdates: true,
  });

  const _ambientLight = new AmbientLight(0xffffff, 0.1);
  const _camera = new PerspectiveCamera();

  _camera.lookAt(0, 0, 0);
  _camera.position.y = 4;
  _camera.position.z = 12;

  const _disposables: Set<DisposableCallback> = new Set();
  const _unmountables: Set<UnmountableCallback> = new Set();
  const _scene = new Scene();
  const _spotLight = new SpotLight(0xffffff);

  _spotLight.angle = Math.PI / 5;
  _spotLight.decay = 1;
  _spotLight.distance = 16;
  _spotLight.intensity = 1;
  _spotLight.penumbra = 1;
  _spotLight.position.y = 8;
  _spotLight.shadow.camera.near = 0.1;
  _spotLight.shadow.camera.far = 100;

  const _boxGeometry = new BoxGeometry();
  const _boxMaterial = new MeshStandardMaterial({
    color: 0x333333,
    flatShading: true,
  });
  const _boxMesh = new Mesh(_boxGeometry, _boxMaterial);

  _boxMesh.position.y = 4;

  _disposables.add(disposableGeneric(_boxGeometry));
  _disposables.add(disposableMaterial(_boxMaterial));

  let _isProgressErrorHandled: boolean = false;

  const _progressRouter = createRouter({
    progress(progressState: ProgressManagerState): void {
      if (progressState.errors.length < 1 || _isProgressErrorHandled) {
        return;
      }

      _onProgressError(progressState.errors);
    },
  });

  function _onProgressError(errors: ReadonlyArray<MessageProgressError>): void {
    _isProgressErrorHandled = true;

    const glitchPass = new GlitchPass();

    _boxMaterial.color = new Color(0xff0000);

    effectComposer.addPass(glitchPass);
    _unmountables.add(unmountPass(effectComposer, glitchPass));
    _disposables.add(disposableGeneric(glitchPass));
  }

  function dispose(): void {
    state.isDisposed = true;

    disposeAll(_disposables);
  }

  function mount(): void {
    state.isMounted = true;

    progressMessagePort.onmessage = _progressRouter;

    const renderPass = new RenderPass(_scene, _camera);

    effectComposer.addPass(renderPass);
    _unmountables.add(unmountPass(effectComposer, renderPass));
    _disposables.add(disposableGeneric(renderPass));

    _scene.add(_ambientLight);
    _scene.add(_boxMesh);
    _scene.add(_spotLight);

    _unmountables.add(function () {
      _scene.remove(_ambientLight);
      _scene.remove(_boxMesh);
      _scene.remove(_spotLight);
    });
  }

  function pause(): void {
    state.isPaused = true;
  }

  function preload(): void {
    state.isPreloaded = true;
  }

  function unmount(): void {
    state.isMounted = false;

    progressMessagePort.onmessage = null;

    unmountAll(_unmountables);
  }

  function unpause(): void {
    state.isPaused = false;
  }

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    updatePerspectiveCameraAspect(dimensionsState, _camera);

    _boxMesh.rotation.x += delta;
    _boxMesh.rotation.z += delta;

    effectComposer.render(delta);
  }

  return Object.freeze({
    id: generateUUID(),
    isDisposable: true,
    isMountable: true,
    isPreloadable: true,
    isScene: true,
    name: "LoadingScreen",
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
