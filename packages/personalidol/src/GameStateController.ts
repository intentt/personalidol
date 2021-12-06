import { createRouter } from "@personalidol/framework/src/createRouter";
import { generateUUID } from "@personalidol/math/src/generateUUID";
import { pause } from "@personalidol/framework/src/pause";
import { unpause } from "@personalidol/framework/src/unpause";

import { GameState } from "./GameState";
import { isMainMenuScene } from "./isMainMenuScene";
import { MainMenuScene } from "./MainMenuScene";
import { LocationMapScene } from "./LocationMapScene";
import { WorldMapScene } from "./WorldMapScene";

import type { Logger } from "loglevel";

import type { CSS2DRenderer } from "@personalidol/three-css2d-renderer/src/CSS2DRenderer.interface";
import type { DirectorState } from "@personalidol/framework/src/DirectorState.type";
import type { EffectComposer } from "@personalidol/three-modules/src/postprocessing/EffectComposer.interface";
import type { Evaluator } from "@personalidol/expression-language/src/Evaluator.interface";
import type { EventBus } from "@personalidol/framework/src/EventBus.interface";
import type { MainLoopUpdatableState } from "@personalidol/framework/src/MainLoopUpdatableState.type";
import type { Scene } from "@personalidol/framework/src/Scene.interface";
import type { TickTimerState } from "@personalidol/framework/src/TickTimerState.type";

import type { GameState as IGameState } from "./GameState.type";
import type { GameStateController as IGameStateController } from "./GameStateController.interface";
import type { UIState } from "./UIState.type";
import type { UserSettings } from "./UserSettings.type";

/**
 * The aim of this class is to make the wished game state the actual game
 * state.
 */
export function GameStateController(
  logger: Logger,
  userSettings: UserSettings,
  effectComposer: EffectComposer,
  css2DRenderer: CSS2DRenderer,
  directorState: DirectorState,
  evaluator: Evaluator,
  eventBus: EventBus,
  tickTimerState: TickTimerState,
  dimensionsState: Uint32Array,
  keyboardState: Uint8Array,
  mouseState: Int32Array,
  touchState: Int32Array,
  domMessagePort: MessagePort,
  dynamicsMessagePort: MessagePort,
  fontPreloadMessagePort: MessagePort,
  gameMessagePort: MessagePort,
  gltfMessagePort: MessagePort,
  internationalizationMessagePort: MessagePort,
  progressMessagePort: MessagePort,
  quakeMapsMessagePort: MessagePort,
  texturesMessagePort: MessagePort,
  gameState: IGameState,
  uiState: UIState
): IGameStateController {
  const state: MainLoopUpdatableState = Object.seal({
    needsUpdates: true,
  });

  const _actualGameState = GameState.createEmptyState();

  const _gameMessageRouter = createRouter({
    currentLocationMap: _onCurrentLocationMapMessage,
    currentWorldMap: _onCurrentWorldMapMessage,
    isScenePaused: _onIsScenePausedMessage,
  });

  let _currentScene: null | Scene = null;

  function _onCurrentLocationMapMessage(mapName: null | string): void {
    gameState.currentLocationMap = mapName;
  }

  function _onCurrentWorldMapMessage(mapName: null): void {
    gameState.currentWorldMap = mapName;
  }

  function _onIsScenePausedMessage(isScenePaused: boolean): void {
    gameState.isScenePaused = isScenePaused;
  }

  function _transitionToMainMenuScene(): void {
    if (isMainMenuScene(directorState.current)) {
      throw new Error("Already at the main menu.");
    }

    directorState.next = MainMenuScene(
      logger,
      effectComposer,
      domMessagePort,
      fontPreloadMessagePort,
      progressMessagePort
    );

    _actualGameState.currentLocationMap = null;
    _actualGameState.previousLocationMap = null;

    gameState.currentLocationMap = null;
    gameState.previousLocationMap = null;
  }

  function _transitionToLocationMapScene(targetMap: string): void {
    directorState.next = LocationMapScene(
      logger,
      userSettings,
      effectComposer,
      css2DRenderer,
      evaluator,
      eventBus,
      tickTimerState,
      dimensionsState,
      keyboardState,
      mouseState,
      touchState,
      gameState,
      uiState,
      domMessagePort,
      dynamicsMessagePort,
      gltfMessagePort,
      internationalizationMessagePort,
      progressMessagePort,
      quakeMapsMessagePort,
      texturesMessagePort,
      targetMap,
      `${__ASSETS_BASE_PATH}/maps/${targetMap}.map?${__CACHE_BUST}`
    );

    gameState.currentLocationMap = targetMap;
    gameState.previousLocationMap = _actualGameState.currentLocationMap;

    _actualGameState.currentLocationMap = gameState.currentLocationMap;
    _actualGameState.previousLocationMap = gameState.previousLocationMap;
  }

  function _transitionToWorldMapScene(targetMap: string): void {
    directorState.next = WorldMapScene(logger, targetMap);

    gameState.currentWorldMap = targetMap;
    gameState.previousWorldMap = _actualGameState.currentWorldMap;

    _actualGameState.currentWorldMap = gameState.currentWorldMap;
    _actualGameState.previousWorldMap = gameState.previousWorldMap;
  }

  function start() {
    gameMessagePort.onmessage = _gameMessageRouter;
  }

  function stop() {
    gameMessagePort.onmessage = null;
  }

  function update(): void {
    if (directorState.isTransitioning) {
      // Don't do any more transitioning while the Director is transitioning.
      return;
    }

    if (!gameState.currentLocationMap && !gameState.currentWorldMap && !isMainMenuScene(directorState.current)) {
      // Default to the main menu in any case.
      _transitionToMainMenuScene();
      return;
    }

    if (gameState.currentLocationMap && gameState.currentLocationMap !== _actualGameState.currentLocationMap) {
      _transitionToLocationMapScene(gameState.currentLocationMap);
      return;
    }

    if (gameState.currentWorldMap && gameState.currentWorldMap !== _actualGameState.currentWorldMap) {
      _transitionToWorldMapScene(gameState.currentWorldMap);
      return;
    }

    _currentScene = directorState.current;

    if (_actualGameState.isScenePaused !== gameState.isScenePaused) {
      _actualGameState.isScenePaused = gameState.isScenePaused;

      if (gameState.isScenePaused) {
        dynamicsMessagePort.postMessage({
          pause: null,
        });
      } else {
        dynamicsMessagePort.postMessage({
          unpause: null,
        });
      }
    }

    if (_currentScene && _currentScene.state.isPaused !== gameState.isScenePaused) {
      if (!gameState.isScenePaused) {
        unpause(logger, _currentScene);
      }
      if (gameState.isScenePaused) {
        pause(logger, _currentScene);
      }
    }
  }

  return Object.seal({
    id: generateUUID(),
    name: "GameStateController",
    state: state,
    gameState: gameState,

    start: start,
    stop: stop,
    update: update,
  });
}
