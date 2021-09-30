import { WebGLRenderer } from "three/src/renderers/WebGLRenderer";

import { CSS2DRenderer } from "@personalidol/three-css2d-renderer/src/CSS2DRenderer";
import { CSS2DRendererStatsHook } from "@personalidol/three-css2d-renderer/src/CSS2DRendererStatsHook";
import { Director } from "@personalidol/framework/src/Director";
import { DirectorPollablePreloadingObserver } from "@personalidol/framework/src/DirectorPollablePreloadingObserver";
import { EffectComposer } from "@personalidol/three-modules/src/postprocessing/EffectComposer";
import { Evaluator } from "@personalidol/expression-language/src/Evaluator";
import { GameState } from "@personalidol/personalidol/src/GameState";
import { GameStateController } from "@personalidol/personalidol/src/GameStateController";
import { LoadingScreenScene } from "@personalidol/personalidol/src/LoadingScreenScene";
import { MultiThreadUserSettingsSync } from "@personalidol/framework/src/MultiThreadUserSettingsSync";
import { RendererDimensionsManager } from "@personalidol/dom-renderer/src/RendererDimensionsManager";
import { SceneTransition } from "@personalidol/framework/src/SceneTransition";
import { UIState } from "@personalidol/personalidol/src/UIState";
import { UIStateController } from "@personalidol/personalidol/src/UIStateController";
import { UIStateControllerStatsHook } from "@personalidol/personalidol/src/UIStateControllerStatsHook";
import { WebGLRendererStatsHook } from "@personalidol/framework/src/WebGLRendererStatsHook";
import { WebGLRendererUserSettingsManager } from "@personalidol/personalidol/src/WebGLRendererUserSettingsManager";

import type { Logger } from "loglevel";

import type { DOMElementsLookup } from "@personalidol/personalidol/src/DOMElementsLookup.type";
import type { EventBus } from "@personalidol/framework/src/EventBus.interface";
import type { GameState as IGameState } from "@personalidol/personalidol/src/GameState.type";
import type { MainLoop } from "@personalidol/framework/src/MainLoop.interface";
import type { ServiceManager } from "@personalidol/framework/src/ServiceManager.interface";
import type { StatsReporter } from "@personalidol/framework/src/StatsReporter.interface";
import type { UIState as IUIState } from "@personalidol/personalidol/src/UIState.type";
import type { UserSettings } from "@personalidol/personalidol/src/UserSettings.type";

export function createScenes(
  threadDebugName: string,
  devicePixelRatio: number,
  isOffscreen: boolean,
  eventBus: EventBus,
  mainLoop: MainLoop<number | ReturnType<typeof setTimeout>>,
  serviceManager: ServiceManager,
  canvas: HTMLCanvasElement | OffscreenCanvas,
  dimensionsState: Uint32Array,
  keyboardState: Uint8Array,
  mouseState: Int32Array,
  touchState: Int32Array,
  logger: Logger,
  statsReporter: StatsReporter,
  userSettings: UserSettings,
  domMessagePort: MessagePort,
  dynamicsMessagePort: MessagePort,
  fbxMessagePort: MessagePort,
  fontPreloadMessagePort: MessagePort,
  gameMessagePort: MessagePort,
  gltfMessagePort: MessagePort,
  internationalizationMessagePort: MessagePort,
  md2MessagePort: MessagePort,
  progressMessagePort: MessagePort,
  quakeMapsMessagePort: MessagePort,
  statsMessagePort: MessagePort,
  texturesMessagePort: MessagePort,
  uiMessagePort: MessagePort,
  userSettingsMessagePort: MessagePort
): void {
  const multiThreadUserSettingsSync = MultiThreadUserSettingsSync(userSettings, userSettingsMessagePort, threadDebugName);
  const updateRendererCSS: boolean = !isOffscreen;

  const webGLRenderer = new WebGLRenderer({
    alpha: false,
    antialias: false,
    canvas: canvas,
  });

  // This should be enabled regardless of `userSettings.useShadows`. If shadows
  // are disabled, all individual shadows maps and shadow emitting lights
  // are turned off. Leaving this renderer option as enabled makes re-enabling
  // shadow maps much easier and does not perceivably affect performance.
  webGLRenderer.shadowMap.enabled = true;
  webGLRenderer.shadowMap.autoUpdate = true;

  const effectComposer = new EffectComposer(webGLRenderer);
  const css2DRenderer = CSS2DRenderer<DOMElementsLookup>(logger, domMessagePort);

  const webGLRendererUserSettingsManager = WebGLRendererUserSettingsManager(userSettings, webGLRenderer);

  const currentSceneDirector = Director(logger, mainLoop.ticker.tickTimerState, "Scene");
  const loadingSceneDirector = Director(logger, mainLoop.ticker.tickTimerState, "LoadingScreen");
  const sceneTransition = SceneTransition(logger, currentSceneDirector.state, loadingSceneDirector.state);

  const currentSceneDirectorPollablePreloadingObserver = DirectorPollablePreloadingObserver(currentSceneDirector);
  const loadingSceneDirectorPollablePreloadingObserver = DirectorPollablePreloadingObserver(loadingSceneDirector);

  const gameState: IGameState = GameState.createEmptyState();
  const uiState: IUIState = UIState.createEmptyState();

  const evaluator = Evaluator({
    gameState: gameState,
    uiState: uiState,
  });

  const gameStateController = GameStateController(
    logger,
    userSettings,
    effectComposer,
    css2DRenderer,
    currentSceneDirector.state,
    evaluator,
    eventBus,
    mainLoop.ticker.tickTimerState,
    dimensionsState,
    keyboardState,
    mouseState,
    touchState,
    domMessagePort,
    dynamicsMessagePort,
    fbxMessagePort,
    fontPreloadMessagePort,
    gameMessagePort,
    gltfMessagePort,
    internationalizationMessagePort,
    md2MessagePort,
    progressMessagePort,
    quakeMapsMessagePort,
    texturesMessagePort,
    gameState,
    uiState
  );

  const uiStateController = UIStateController(logger, mainLoop.ticker.tickTimerState, domMessagePort, uiMessagePort, uiState);

  statsReporter.hooks.add(CSS2DRendererStatsHook(css2DRenderer));
  statsReporter.hooks.add(UIStateControllerStatsHook(uiStateController));
  statsReporter.hooks.add(WebGLRendererStatsHook(webGLRenderer));

  loadingSceneDirector.state.next = LoadingScreenScene(logger, userSettings, effectComposer, dimensionsState, domMessagePort, progressMessagePort);

  serviceManager.services.add(currentSceneDirectorPollablePreloadingObserver);
  serviceManager.services.add(loadingSceneDirectorPollablePreloadingObserver);
  serviceManager.services.add(multiThreadUserSettingsSync);
  serviceManager.services.add(currentSceneDirector);
  serviceManager.services.add(gameStateController);
  serviceManager.services.add(uiStateController);
  serviceManager.services.add(loadingSceneDirector);
  serviceManager.services.add(sceneTransition);

  mainLoop.updatables.add(currentSceneDirectorPollablePreloadingObserver);
  mainLoop.updatables.add(loadingSceneDirectorPollablePreloadingObserver);
  mainLoop.updatables.add(RendererDimensionsManager(dimensionsState, css2DRenderer, updateRendererCSS));
  mainLoop.updatables.add(RendererDimensionsManager(dimensionsState, effectComposer, updateRendererCSS));
  mainLoop.updatables.add(RendererDimensionsManager(dimensionsState, webGLRenderer, updateRendererCSS));
  mainLoop.updatables.add(multiThreadUserSettingsSync);
  mainLoop.updatables.add(webGLRendererUserSettingsManager);
  mainLoop.updatables.add(serviceManager);
  mainLoop.updatables.add(currentSceneDirector);
  mainLoop.updatables.add(loadingSceneDirector);
  mainLoop.updatables.add(gameStateController);
  mainLoop.updatables.add(uiStateController);
  mainLoop.updatables.add(sceneTransition);
}
