import { MathUtils } from "three/src/math/MathUtils";
import { OrthographicCamera } from "three/src/cameras/OrthographicCamera";
import { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera";
import { Vector3 } from "three/src/math/Vector3";

import type { Logger } from "loglevel";

import { damp } from "@personalidol/framework/src/damp";
import { KeyboardIndices } from "@personalidol/framework/src/KeyboardIndices.enum";
import { updateOrthographicCameraAspect } from "@personalidol/three-renderer/src/updateOrthographicCameraAspect";
import { updatePerspectiveCameraAspect } from "@personalidol/three-renderer/src/updatePerspectiveCameraAspect";

import type { EventBus } from "@personalidol/framework/src/EventBus.interface";

import type { CameraControllerState } from "./CameraControllerState.type";
import type { CameraController as ICameraController } from "./CameraController.interface";
import type { UserSettings } from "./UserSettings.type";

const CAMERA_DAMP = 10;
const CAMERA_ZOOM_INITIAL = 401;
const CAMERA_ZOOM_MAX = 1;
const CAMERA_ZOOM_MIN = 1401;
const CAMERA_ZOOM_STEP = 50;
const CAMERA_ORTHOGRAPHIC_FRUSTUM_SIZE_MIN = CAMERA_ZOOM_MAX + 4 * CAMERA_ZOOM_STEP;

// const _cameraDirection = new Vector3();

export function CameraController(logger: Logger, userSettings: UserSettings, dimensionsState: Uint32Array, keyboardState: Uint8Array, eventBus: EventBus): ICameraController {
  const state: CameraControllerState = Object.seal({
    isDisposed: false,
    isMounted: false,
    isPaused: false,
    isPreloaded: false,
    isPreloading: false,
    needsUpdates: true,
  });

  const _cameraPosition = new Vector3();

  const _orthographicCamera = new OrthographicCamera(-1, 1, 1, -1);

  _orthographicCamera.position.y = 3000;
  _orthographicCamera.far = 8000;
  _orthographicCamera.lookAt(0, 0, 0);
  _orthographicCamera.near = -1 * CAMERA_ZOOM_MIN;

  const _perspectiveCamera = new PerspectiveCamera();

  _perspectiveCamera.far = 4000;
  _perspectiveCamera.lookAt(0, 0, 0);
  _perspectiveCamera.near = 1;

  let _currentCamera: OrthographicCamera | PerspectiveCamera = _perspectiveCamera;
  let _cameraZoomAmount = 0;
  let _orthographicCameraFrustumSize: number = _cameraZoomAmount;
  let _needsImmediateMove: boolean = false;

  // setTimeout(function () {
  //   _currentCamera = _orthographicCamera;
  //   _needsImmediateMove = true;
  // }, 3000);

  function _onPointerZoomRequest(zoomAmount: number, scale: number = 1): void {
    if (state.isPaused) {
      return;
    }

    _cameraZoomAmount += (zoomAmount < 0 ? -1 * CAMERA_ZOOM_STEP : CAMERA_ZOOM_STEP) * scale;
    _cameraZoomAmount = Math.max(CAMERA_ZOOM_MAX, _cameraZoomAmount);
    _cameraZoomAmount = Math.min(CAMERA_ZOOM_MIN, _cameraZoomAmount);
  }

  function dispose(): void {
    state.isDisposed = true;
  }

  function mount(): void {
    state.isMounted = true;

    _cameraZoomAmount = CAMERA_ZOOM_INITIAL;
    eventBus.POINTER_ZOOM_REQUEST.add(_onPointerZoomRequest);
  }

  function pause(): void {
    state.isPaused = true;
  }

  function preload(): void {
    state.isPreloading = true;

    state.isPreloading = false;
    state.isPreloaded = true;
  }

  function unmount(): void {
    state.isMounted = false;

    eventBus.POINTER_ZOOM_REQUEST.delete(_onPointerZoomRequest);
  }

  function unpause(): void {
    state.isPaused = false;
  }

  function update(delta: number): void {
    if (_orthographicCamera.type === userSettings.cameraType) {
      _needsImmediateMove = _needsImmediateMove || _currentCamera.type !== _orthographicCamera.type;
      _currentCamera = _orthographicCamera;
    }

    if (_needsImmediateMove) {
      _orthographicCameraFrustumSize = _cameraZoomAmount;
    } else {
      _orthographicCameraFrustumSize = damp(_orthographicCameraFrustumSize, _cameraZoomAmount, CAMERA_DAMP, delta);
    }

    _orthographicCameraFrustumSize = Math.max(_orthographicCameraFrustumSize, CAMERA_ORTHOGRAPHIC_FRUSTUM_SIZE_MIN);

    updateOrthographicCameraAspect(dimensionsState, _orthographicCamera, _orthographicCameraFrustumSize);
    updatePerspectiveCameraAspect(dimensionsState, _perspectiveCamera);

    if (_perspectiveCamera.type === userSettings.cameraType) {
      _needsImmediateMove = _needsImmediateMove || _currentCamera.type !== _perspectiveCamera.type;
      _currentCamera = _perspectiveCamera;
    }

    if (!state.isPaused && keyboardState[KeyboardIndices.PageDown]) {
      _onPointerZoomRequest(-1, 0.1);
    }

    if (!state.isPaused && keyboardState[KeyboardIndices.PageUp]) {
      _onPointerZoomRequest(+1, 0.1);
    }

    if (!state.isPaused && (keyboardState[KeyboardIndices.ArrowUp] || keyboardState[KeyboardIndices.KeyW])) {
      _cameraPosition.x -= 600 * delta;
      _cameraPosition.z -= 600 * delta;
    }

    if (!state.isPaused && (keyboardState[KeyboardIndices.ArrowLeft] || keyboardState[KeyboardIndices.KeyA])) {
      _cameraPosition.x -= 600 * delta;
      _cameraPosition.z += 600 * delta;
    }

    if (!state.isPaused && (keyboardState[KeyboardIndices.ArrowRight] || keyboardState[KeyboardIndices.KeyD])) {
      _cameraPosition.x += 600 * delta;
      _cameraPosition.z -= 600 * delta;
    }

    if (!state.isPaused && (keyboardState[KeyboardIndices.ArrowDown] || keyboardState[KeyboardIndices.KeyS])) {
      _cameraPosition.x += 600 * delta;
      _cameraPosition.z += 600 * delta;
    }

    // prettier-ignore
    if (_needsImmediateMove) {
      _needsImmediateMove = false;

      _currentCamera.position.x = _cameraPosition.x + _cameraZoomAmount;
      _currentCamera.position.z = _cameraPosition.z + _cameraZoomAmount;
      _currentCamera.position.y = _cameraPosition.y + _cameraZoomAmount;
    } else {
      _currentCamera.position.x = damp(_currentCamera.position.x, _cameraPosition.x + _cameraZoomAmount, CAMERA_DAMP, delta),
      _currentCamera.position.z = damp(_currentCamera.position.z, _cameraPosition.z + _cameraZoomAmount, CAMERA_DAMP, delta),
      _currentCamera.position.y = damp(_currentCamera.position.y, _cameraPosition.y + _cameraZoomAmount, CAMERA_DAMP, delta);
    }

    _currentCamera.lookAt(_currentCamera.position.x - _cameraZoomAmount, _currentCamera.position.y - _cameraZoomAmount, _currentCamera.position.z - _cameraZoomAmount);
  }

  return Object.freeze({
    id: MathUtils.generateUUID(),
    name: "CameraController",
    position: _cameraPosition,
    state: state,

    get camera() {
      return _currentCamera;
    },

    set needsImmediateMove(needsImmediateMove: boolean) {
      _needsImmediateMove = needsImmediateMove;
    },

    dispose: dispose,
    mount: mount,
    pause: pause,
    preload: preload,
    unmount: unmount,
    unpause: unpause,
    update: update,
  });
}
