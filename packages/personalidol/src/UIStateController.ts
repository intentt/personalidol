import { createRouter } from "../../framework/src/createRouter";
import { DOMElementViewHandle } from "../../dom-renderer/src/DOMElementViewHandle";
import { generateUUID } from "../../math/src/generateUUID";

import type { Logger } from "loglevel";

import type { DOMElementViewHandle as IDOMElementViewHandle } from "../../dom-renderer/src/DOMElementViewHandle.interface";
import type { MainLoopUpdatableState } from "../../framework/src/MainLoopUpdatableState.type";
import type { TickTimerState } from "../../framework/src/TickTimerState.type";

import type { DOMElementsLookup } from "./DOMElementsLookup.type";
import type { UIState } from "./UIState.type";
import type { UIStateController as IUIStateController } from "./UIStateController.interface";
import type { UIStateControllerInfo } from "./UIStateControllerInfo.type";

export function UIStateController(
  logger: Logger,
  tickTimerState: TickTimerState,
  domMessagePort: MessagePort,
  uiMessagePort: MessagePort,
  uiState: UIState
): IUIStateController {
  const info: UIStateControllerInfo = Object.seal({});

  const state: MainLoopUpdatableState = Object.seal({
    needsUpdates: true,
  });

  const _uiMessageRouter = createRouter({
    isInGameMenuOpened: _onIsInGameMenuOpenedMessage,
    isInGameMenuTriggerVisible: _onIsInGameMenuTriggerVisible,
    isLanguageSettingsScreenOpened: _onIsLanguageSettingsScreenOpened,
    isMousePointerLayerVisible: _onIsMousePointerLayerVisible,
    isUserSettingsScreenOpened: _onIsUserSettingsScreenOpenedMessage,
    isVirtualJoystickLayerVisible: _onIsVirtualJoystickLayerVisible,
  });

  let _inGameMenuHandle: IDOMElementViewHandle = DOMElementViewHandle<DOMElementsLookup>(
    domMessagePort,
    "pi-in-game-menu"
  );
  let _inGameMenuTriggerHandle: IDOMElementViewHandle = DOMElementViewHandle<DOMElementsLookup>(
    domMessagePort,
    "pi-in-game-menu-trigger"
  );
  let _languageSettingsScreenHandle: IDOMElementViewHandle = DOMElementViewHandle<DOMElementsLookup>(
    domMessagePort,
    "pi-language-settings"
  );
  let _mousePointerLayerHandle: IDOMElementViewHandle = DOMElementViewHandle<DOMElementsLookup>(
    domMessagePort,
    "pi-mouse-pointer-layer"
  );
  let _userSettingsScreenHandle: IDOMElementViewHandle = DOMElementViewHandle<DOMElementsLookup>(
    domMessagePort,
    "pi-user-settings"
  );
  let _virtualJoystickLayerHandle: IDOMElementViewHandle = DOMElementViewHandle<DOMElementsLookup>(
    domMessagePort,
    "pi-virtual-joystick-layer"
  );

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

  function _onIsUserSettingsScreenOpenedMessage(isUserSettingsScreenOpened: boolean): void {
    uiState.isUserSettingsScreenOpened = isUserSettingsScreenOpened;
  }

  function _onIsVirtualJoystickLayerVisible(isVirtualJoystickLayerVisible: boolean): void {
    uiState.isVirtualJoystickLayerVisible = isVirtualJoystickLayerVisible;
  }

  function start() {
    uiMessagePort.onmessage = _uiMessageRouter;
  }

  function stop() {
    uiMessagePort.onmessage = null;
  }

  function update(): void {
    _inGameMenuHandle.enable(uiState.isInGameMenuOpened);
    _inGameMenuTriggerHandle.enable(uiState.isInGameMenuTriggerVisible);
    _languageSettingsScreenHandle.enable(uiState.isLanguageSettingsScreenOpened);
    _mousePointerLayerHandle.enable(uiState.isMousePointerLayerVisible);
    _userSettingsScreenHandle.enable(uiState.isUserSettingsScreenOpened);
    _virtualJoystickLayerHandle.enable(uiState.isVirtualJoystickLayerVisible);
  }

  return Object.seal({
    id: generateUUID(),
    info: info,
    name: "UIStateController",
    state: state,
    uiState: uiState,

    start: start,
    stop: stop,
    update: update,
  });
}
