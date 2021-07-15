import { OrthographicCamera } from "three/src/cameras/OrthographicCamera";
import { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera";
import { Vector3 } from "three/src/math/Vector3";

import { CameraParameters } from "./CameraParameters.enum";
import { generateUUID } from "@personalidol/math/src/generateUUID";
import { updateOrthographicCameraAspect } from "@personalidol/framework/src/updateOrthographicCameraAspect";
import { updatePerspectiveCameraAspect } from "@personalidol/framework/src/updatePerspectiveCameraAspect";

import type { Logger } from "loglevel";
import type { Vector3 as IVector3 } from "three/src/math/Vector3";

import type { CameraController as ICameraController } from "@personalidol/framework/src/CameraController.interface";
import type { CameraControllerState } from "@personalidol/framework/src/CameraControllerState.type";
import type { TickTimerState } from "@personalidol/framework/src/TickTimerState.type";

import type { UserSettings } from "./UserSettings.type";

const CAMERA_ORTHOGRAPHIC_FRUSTUM_SIZE_MIN = CameraParameters.ZOOM_MAX + 4 * CameraParameters.ZOOM_STEP;

export function CameraController(
  logger: Logger,
  userSettings: UserSettings,
  dimensionsState: Uint32Array,
  keyboardState: Uint8Array
): ICameraController {
  const state: CameraControllerState = Object.seal({
    isMounted: false,
    isPaused: false,
    lastCameraTypeChange: 0,
    needsUpdates: true,
  });

  const _orthographicCamera = new OrthographicCamera(-1, 1, 1, -1);

  _orthographicCamera.position.y = 3000;
  _orthographicCamera.far = 8000;
  _orthographicCamera.lookAt(0, 0, 0);
  _orthographicCamera.near = -1 * CameraParameters.ZOOM_MIN;

  const _perspectiveCamera = new PerspectiveCamera();

  _perspectiveCamera.far = 4000;
  _perspectiveCamera.lookAt(0, 0, 0);
  _perspectiveCamera.near = 1;

  const _cameraPosition: IVector3 = new Vector3();
  const _cameraResetPosition: IVector3 = new Vector3();

  let _currentCamera: OrthographicCamera | PerspectiveCamera = _perspectiveCamera;
  let _isCameraChanged: boolean = false;
  let _orthographicCameraFrustumSize: number = userSettings.cameraZoomAmount;

  function mount(): void {
    state.isMounted = true;

    resetPosition();
  }

  function pause(): void {
    state.isPaused = true;
  }

  function resetPosition(): void {
    _cameraPosition.copy(_cameraResetPosition);
  }

  function resetZoom(): void {
    userSettings.cameraZoomAmount = CameraParameters.ZOOM_DEFAULT;
    userSettings.version += 1;
  }

  function unmount(): void {
    state.isMounted = false;
  }

  function unpause(): void {
    state.isPaused = false;
  }

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    _isCameraChanged = _currentCamera.type !== userSettings.cameraType;

    if (_isCameraChanged) {
      state.lastCameraTypeChange = tickTimerState.currentTick;
    }

    if (_orthographicCamera.type === userSettings.cameraType) {
      _currentCamera = _orthographicCamera;
    }

    if (_perspectiveCamera.type === userSettings.cameraType) {
      _currentCamera = _perspectiveCamera;
    }

    _orthographicCameraFrustumSize = userSettings.cameraZoomAmount;
    _orthographicCameraFrustumSize = Math.max(_orthographicCameraFrustumSize, CAMERA_ORTHOGRAPHIC_FRUSTUM_SIZE_MIN);

    updateOrthographicCameraAspect(dimensionsState, _orthographicCamera, _orthographicCameraFrustumSize);
    updatePerspectiveCameraAspect(dimensionsState, _perspectiveCamera);

    _currentCamera.position.x = _cameraPosition.x + userSettings.cameraZoomAmount;
    _currentCamera.position.y = _cameraPosition.y + 0.75 * userSettings.cameraZoomAmount;
    _currentCamera.position.z = _cameraPosition.z + 0.5 * userSettings.cameraZoomAmount;

    _currentCamera.lookAt(
      _currentCamera.position.x - userSettings.cameraZoomAmount,
      _currentCamera.position.y - 0.75 * userSettings.cameraZoomAmount,
      _currentCamera.position.z - 0.5 * userSettings.cameraZoomAmount
    );
  }

  function zoomIn(step: number): void {
    userSettings.cameraZoomAmount += step;
    userSettings.cameraZoomAmount = Math.min(CameraParameters.ZOOM_MIN, userSettings.cameraZoomAmount);
    userSettings.version += 1;
  }

  function zoomOut(step: number): void {
    userSettings.cameraZoomAmount -= step;
    userSettings.cameraZoomAmount = Math.max(CameraParameters.ZOOM_MAX, userSettings.cameraZoomAmount);
    userSettings.version += 1;
  }

  return Object.freeze({
    cameraResetPosition: _cameraResetPosition,
    id: generateUUID(),
    isMountable: true,
    name: "CameraController",
    position: _cameraPosition,
    state: state,

    get camera() {
      return _currentCamera;
    },

    mount: mount,
    pause: pause,
    resetPosition: resetPosition,
    resetZoom: resetZoom,
    unmount: unmount,
    unpause: unpause,
    update: update,
    zoomIn: zoomIn,
    zoomOut: zoomOut,
  });
}
