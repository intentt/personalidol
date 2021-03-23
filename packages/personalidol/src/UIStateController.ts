import { MathUtils } from "three/src/math/MathUtils";

import { createRouter } from "@personalidol/framework/src/createRouter";
import { createSingleThreadMessageChannel } from "@personalidol/framework/src/createSingleThreadMessageChannel";
import { DOMElementViewHandle } from "@personalidol/dom-renderer/src/DOMElementViewHandle";
import { pause } from "@personalidol/framework/src/pause";
import { unpause } from "@personalidol/framework/src/unpause";
import { ViewBag } from "@personalidol/views/src/ViewBag";
import { ViewBagScene } from "@personalidol/views/src/ViewBagScene";

import { isMainMenuScene } from "./isMainMenuScene";
import { MainMenuScene } from "./MainMenuScene";
import { MapScene } from "./MapScene";

import type { Logger } from "loglevel";

import type { CSS2DRenderer } from "@personalidol/three-css2d-renderer/src/CSS2DRenderer.interface";
import type { DirectorState } from "@personalidol/framework/src/DirectorState.type";
import type { DOMElementViewHandle as IDOMElementViewHandle } from "@personalidol/dom-renderer/src/DOMElementViewHandle.interface";
import type { EffectComposer } from "@personalidol/three-modules/src/postprocessing/EffectComposer.interface";
import type { EventBus } from "@personalidol/framework/src/EventBus.interface";
import type { MainLoopUpdatableState } from "@personalidol/framework/src/MainLoopUpdatableState.type";
import type { Scene } from "@personalidol/framework/src/Scene.interface";
import type { ViewBag as IViewBag } from "@personalidol/views/src/ViewBag.interface";
import type { ViewBagScene as IViewBagScene } from "@personalidol/views/src/ViewBagScene.interface";

import type { DOMElementsLookup } from "./DOMElementsLookup.type";
import type { UIState } from "./UIState.type";
import type { UIStateController as IUIStateController } from "./UIStateController.interface";
import type { UserSettings } from "./UserSettings.type";

export function UIStateController(
  logger: Logger,
  userSettings: UserSettings,
  effectComposer: EffectComposer,
  css2DRenderer: CSS2DRenderer,
  directorState: DirectorState,
  eventBus: EventBus,
  dimensionsState: Uint32Array,
  keyboardState: Uint8Array,
  mouseState: Int32Array,
  touchState: Int32Array,
  domMessagePort: MessagePort,
  fontPreloadMessagePort: MessagePort,
  gltfMessagePort: MessagePort,
  internationalizationMessagePort: MessagePort,
  md2MessagePort: MessagePort,
  progressMessagePort: MessagePort,
  quakeMapsMessagePort: MessagePort,
  texturesMessagePort: MessagePort,
  uiMessagePort: MessagePort,
  uiState: UIState
): IUIStateController {
  const state: MainLoopUpdatableState = Object.seal({
    needsUpdates: true,
  });

  const _domMessageRouter = createRouter({
    currentMap: _onCurrentMapMessage,
    isInGameMenuOpened: _onIsInGameMenuOpenedMessage,
    isInGameMenuTriggerVisible: _onIsInGameMenuTriggerVisible,
    isLanguageSettingsScreenOpened: _onIsLanguageSettingsScreenOpened,
    isMousePointerLayerVisible: _onIsMousePointerLayerVisible,
    isScenePaused: _onIsScenePausedMessage,
    isUserSettingsScreenOpened: _onIsUserSettingsScreenOpenedMessage,
    isVirtualJoystickLayerVisible: _onIsVirtualJoystickLayerVisible,
  });

  let _currentScene: null | Scene = null;
  let _dirtyCurrentMap: null | string = null;
  let _internalUIMessageChannel: MessageChannel = createSingleThreadMessageChannel();
  let _transitioningViewBagScene: null | IViewBagScene = null;
  let _uiStateCurrentMap: null | string = uiState.currentMap;

  let _inGameMenuHandle: IDOMElementViewHandle = DOMElementViewHandle<DOMElementsLookup>(domMessagePort, "pi-in-game-menu");
  let _inGameMenuTriggerHandle: IDOMElementViewHandle = DOMElementViewHandle<DOMElementsLookup>(domMessagePort, "pi-in-game-menu-trigger");
  let _languageSettingsScreenHandle: IDOMElementViewHandle = DOMElementViewHandle<DOMElementsLookup>(domMessagePort, "pi-language-settings");
  let _mousePointerLayerHandle: IDOMElementViewHandle = DOMElementViewHandle<DOMElementsLookup>(domMessagePort, "pi-mouse-pointer-layer");
  let _userSettingsScreenHandle: IDOMElementViewHandle = DOMElementViewHandle<DOMElementsLookup>(domMessagePort, "pi-user-settings");
  let _virtualJoystickLayerHandle: IDOMElementViewHandle = DOMElementViewHandle<DOMElementsLookup>(domMessagePort, "pi-virtual-joystick-layer");

  function start() {
    _internalUIMessageChannel.port1.onmessage = _domMessageRouter;
    uiMessagePort.onmessage = _domMessageRouter;
  }

  function stop() {
    _internalUIMessageChannel.port1.onmessage = null;
    uiMessagePort.onmessage = null;
  }

  function update(delta: number, elapsedTime: number): void {
    _updateTransitioningViewBagScene();
    _updateUIState();
  }

  function _onCurrentMapMessage(mapName: null | string): void {
    uiState.currentMap = mapName;
  }

  function _onIsInGameMenuOpenedMessage(isInGameMenuOpened: boolean): void {
    uiState.isInGameMenuOpened = isInGameMenuOpened;
  }

  function _onIsInGameMenuTriggerVisible(isInGameMenuTriggerVisible: boolean): void {
    uiState.isInGameMenuTriggerVisible = isInGameMenuTriggerVisible;
  }

  function _onIsLanguageSettingsScreenOpened(isLanguageSettingsScreenOpened: boolean): void {
    uiState.isLanguageSettingsScreenOpened = isLanguageSettingsScreenOpened;
  }

  function _onIsMousePointerLayerVisible(isMousePointerLayerVisible: boolean): void {
    uiState.isMousePointerLayerVisible = isMousePointerLayerVisible;
  }

  function _onIsScenePausedMessage(isScenePaused: boolean): void {
    uiState.isScenePaused = isScenePaused;
  }

  function _onIsUserSettingsScreenOpenedMessage(isUserSettingsScreenOpened: boolean): void {
    uiState.isUserSettingsScreenOpened = isUserSettingsScreenOpened;
  }

  function _onIsVirtualJoystickLayerVisible(isVirtualJoystickLayerVisible: boolean): void {
    uiState.isVirtualJoystickLayerVisible = isVirtualJoystickLayerVisible;
  }

  function _transitionToMainMenuScene(): void {
    if (isMainMenuScene(directorState.current)) {
      throw new Error("Already at the main menu.");
    }

    // prettier-ignore
    directorState.next = MainMenuScene(
      logger,
      effectComposer,
      domMessagePort,
      fontPreloadMessagePort,
      progressMessagePort,
    );

    _dirtyCurrentMap = null;
    uiState.currentMap = null;
  }

  function _transitionToaMapScene(targetMap: string): void {
    const viewBag: IViewBag = ViewBag(logger);

    // prettier-ignore
    const mapScene = MapScene(
      logger,
      userSettings,
      effectComposer,
      css2DRenderer,
      eventBus,
      viewBag.views,
      dimensionsState,
      keyboardState,
      mouseState,
      touchState,
      domMessagePort,
      gltfMessagePort,
      internationalizationMessagePort,
      md2MessagePort,
      progressMessagePort,
      quakeMapsMessagePort,
      texturesMessagePort,
      _internalUIMessageChannel.port2,
      targetMap,
      `${__ASSETS_BASE_PATH}/maps/${targetMap}.map?${__CACHE_BUST}`,
    );

    _transitioningViewBagScene = ViewBagScene(logger, viewBag, mapScene);
    directorState.next = _transitioningViewBagScene;

    uiState.currentMap = targetMap;
    _dirtyCurrentMap = targetMap;
  }

  function _updateTransitioningViewBagScene(): void {
    if (!_transitioningViewBagScene) {
      return;
    }

    if (_transitioningViewBagScene.state.isPreloading) {
      // Polling for updates is necessary only when a scene is actually
      // preloading.
      _transitioningViewBagScene.updatePreloadingState();
    }

    if (_transitioningViewBagScene.state.isPreloaded && !_transitioningViewBagScene.state.isPreloading) {
      _transitioningViewBagScene = null;
    }
  }

  function _updateUIState(): void {
    _inGameMenuHandle.enable(uiState.isInGameMenuOpened);
    _inGameMenuTriggerHandle.enable(uiState.isInGameMenuTriggerVisible);
    _languageSettingsScreenHandle.enable(uiState.isLanguageSettingsScreenOpened);
    _mousePointerLayerHandle.enable(uiState.isMousePointerLayerVisible);
    _userSettingsScreenHandle.enable(uiState.isUserSettingsScreenOpened);
    _virtualJoystickLayerHandle.enable(uiState.isVirtualJoystickLayerVisible);

    if (directorState.isTransitioning) {
      // Don't do any more transitioning while the Director is transitioning.
      return;
    }

    _uiStateCurrentMap = uiState.currentMap;

    if (!_uiStateCurrentMap && !isMainMenuScene(directorState.current)) {
      // Default to the main menu in any case.
      _transitionToMainMenuScene();
      return;
    }

    if (_uiStateCurrentMap && _uiStateCurrentMap !== _dirtyCurrentMap) {
      _transitionToaMapScene(_uiStateCurrentMap);
      return;
    }

    _currentScene = directorState.current;

    if (_currentScene && _currentScene.state.isPaused !== uiState.isScenePaused) {
      if (!uiState.isScenePaused) {
        unpause(logger, _currentScene);
      }
      if (uiState.isScenePaused) {
        pause(logger, _currentScene);
      }
    }
  }

  return Object.seal({
    id: MathUtils.generateUUID(),
    name: "UIStateController",
    state: state,

    start: start,
    stop: stop,
    update: update,
  });
}
