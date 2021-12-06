import Loglevel from "loglevel";

import { createMultiThreadMessageChannel } from "@personalidol/framework/src/createMultiThreadMessageChannel";
import { createSingleThreadMessageChannel } from "@personalidol/framework/src/createSingleThreadMessageChannel";
import { DimensionsState } from "@personalidol/framework/src/DimensionsState";
import { domElementsLookup } from "@personalidol/personalidol/src/domElementsLookup";
import { DOMElementViewBuilder } from "@personalidol/personalidol/src/DOMElementViewBuilder";
import { DOMUIController } from "@personalidol/dom-renderer/src/DOMUIController";
import { EventBus } from "@personalidol/framework/src/EventBus";
import { FontPreloadService } from "@personalidol/dom/src/FontPreloadService";
import { getHTMLElementById } from "@personalidol/dom/src/getHTMLElementById";
import { HTMLElementSizeHandle } from "@personalidol/dom/src/HTMLElementSizeHandle";
import { InternationalizationService } from "@personalidol/i18n/src/InternationalizationService";
import { isCanvasTransferControlToOffscreenSupported } from "@personalidol/framework/src/isCanvasTransferControlToOffscreenSupported";
import { isSharedArrayBufferSupported } from "@personalidol/framework/src/isSharedArrayBufferSupported";
import { isUserSettingsValid } from "@personalidol/personalidol/src/isUserSettingsValid";
import { KeyboardObserver } from "@personalidol/input/src/KeyboardObserver";
import { KeyboardState } from "@personalidol/input/src/KeyboardState";
import { LanguageUserSettingsManager } from "@personalidol/personalidol/src/LanguageUserSettingsManager";
import { LocalStorageUserSettingsSync } from "@personalidol/framework/src/LocalStorageUserSettingsSync";
import { MainLoop } from "@personalidol/framework/src/MainLoop";
import { MainLoopStatsHook } from "@personalidol/framework/src/MainLoopStatsHook";
import { MouseObserver } from "@personalidol/input/src/MouseObserver";
import { MouseState } from "@personalidol/input/src/MouseState";
import { MouseWheelObserver } from "@personalidol/input/src/MouseWheelObserver";
import { MultiThreadUserSettingsSync } from "@personalidol/framework/src/MultiThreadUserSettingsSync";
import { PerformanceStatsHook } from "@personalidol/framework/src/PerformanceStatsHook";
import { prefetch } from "@personalidol/framework/src/prefetch";
import { preload } from "@personalidol/framework/src/preload";
import { Preloader } from "@personalidol/framework/src/Preloader";
import { RendererDimensionsManager } from "@personalidol/dom-renderer/src/RendererDimensionsManager";
import { RequestAnimationFrameScheduler } from "@personalidol/framework/src/RequestAnimationFrameScheduler";
import { ServiceManager } from "@personalidol/framework/src/ServiceManager";
import { ServiceWorkerManager } from "@personalidol/service-worker/src/ServiceWorkerManager";
import { StatsCollector } from "@personalidol/dom-renderer/src/StatsCollector";
import { StatsReporter } from "@personalidol/framework/src/StatsReporter";
import { TouchObserver } from "@personalidol/input/src/TouchObserver";
import { TouchState } from "@personalidol/input/src/TouchState";
import { UserSettings } from "@personalidol/personalidol/src/UserSettings";
import { WindowFocusObserver } from "@personalidol/dom/src/WindowFocusObserver";
import { WindowResizeObserver } from "@personalidol/dom/src/WindowResizeObserver";
import { WorkerServiceClient } from "@personalidol/framework/src/WorkerServiceClient";

import { workers } from "./workers";
import { createAtlasService } from "./createAtlasService";
import { createI18next } from "./createI18next";
import { createRenderingService } from "./createRenderingService";
import { createTexturesService } from "./createTexturesService";

const THREAD_DEBUG_NAME: string = "main_thread";

// Number of items expected to be loaded before the game engine is ready.
// 7 services + 3 fonts + 1 ammo.wasm.js + 1 ammo.wasm.wasm
const PROGRESS_EXPECT = 7 + 3 + 1 + 1;

const uiRoot = getHTMLElementById(window.document, "ui-root");

// The entire bootstrap code is wrapped to allow 'await'. Global await is not
// widely supported yet.
// Depending on browser feature support, some workers will be started or not.
// Checking for features is asynchronous.
async function bootstrap() {
  const canvas = getHTMLElementById(window.document, "canvas");

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Canvas is not an instance of HTMLCanvasElement");
  }

  const devicePixelRatio = window.devicePixelRatio;
  const logger = Loglevel.getLogger(THREAD_DEBUG_NAME);

  logger.setLevel(__LOG_LEVEL);
  logger.debug(`BUILD_ID("${__BUILD_ID}")`);

  // Services that need to stay in the main browser thread, because they need
  // access to the DOM API.

  const useSharedBuffers = isSharedArrayBufferSupported();
  const dimensionsState = DimensionsState.createEmptyState(useSharedBuffers);
  const keyboardState = KeyboardState.createEmptyState(useSharedBuffers);

  const mouseState = MouseState.createEmptyState(useSharedBuffers);
  const touchState = TouchState.createEmptyState(useSharedBuffers);

  const eventBus = EventBus();
  const statsReporterMessageChannel = createSingleThreadMessageChannel();

  const mainLoop = MainLoop(logger, RequestAnimationFrameScheduler());

  const windowResizeObserver = WindowResizeObserver(dimensionsState, mainLoop.ticker.tickTimerState);

  const windowFocusObserver = WindowFocusObserver(logger, mainLoop.ticker.tickTimerState);
  const keyboardObserver = KeyboardObserver(logger, canvas, keyboardState, windowFocusObserver.state, mainLoop.ticker.tickTimerState);
  const mouseObserver = MouseObserver(canvas, dimensionsState, mouseState, windowFocusObserver.state, mainLoop.ticker.tickTimerState);
  const touchObserver = TouchObserver(canvas, dimensionsState, touchState, windowFocusObserver.state, mainLoop.ticker.tickTimerState);

  const userSettings = UserSettings.createEmptyState(devicePixelRatio);
  const userSettingsMessageChannel = createMultiThreadMessageChannel();
  const localStorageUserSettingsSync = LocalStorageUserSettingsSync(userSettings, isUserSettingsValid, THREAD_DEBUG_NAME);
  const multiThreadUserSettingsSync = MultiThreadUserSettingsSync(userSettings, userSettingsMessageChannel.port1, THREAD_DEBUG_NAME);

  const statsReporter = StatsReporter(THREAD_DEBUG_NAME, statsReporterMessageChannel.port2, mainLoop.ticker.tickTimerState);

  statsReporter.hooks.add(MainLoopStatsHook(mainLoop));

  // This is an unofficial Chrome JS extension so it's not typed by default.
  if ((globalThis.performance as any).memory) {
    statsReporter.hooks.add(PerformanceStatsHook());
  }

  const serviceManager = ServiceManager(logger);

  serviceManager.services.add(windowResizeObserver);
  serviceManager.services.add(windowFocusObserver);
  serviceManager.services.add(keyboardObserver);
  serviceManager.services.add(mouseObserver);
  serviceManager.services.add(MouseWheelObserver(canvas, eventBus, dimensionsState, mouseState));
  serviceManager.services.add(touchObserver);
  serviceManager.services.add(localStorageUserSettingsSync);
  serviceManager.services.add(multiThreadUserSettingsSync);
  serviceManager.services.add(statsReporter);

  mainLoop.updatables.add(windowResizeObserver);
  mainLoop.updatables.add(RendererDimensionsManager(dimensionsState, HTMLElementSizeHandle(uiRoot), true));
  mainLoop.updatables.add(windowFocusObserver);
  mainLoop.updatables.add(keyboardObserver);
  mainLoop.updatables.add(mouseObserver);
  mainLoop.updatables.add(touchObserver);
  mainLoop.updatables.add(localStorageUserSettingsSync);
  mainLoop.updatables.add(multiThreadUserSettingsSync);
  mainLoop.updatables.add(statsReporter);
  mainLoop.updatables.add(serviceManager);

  mainLoop.start();
  serviceManager.start();

  // Register service worker for PWA, offline use and caching.

  if (!navigator.serviceWorker) {
    throw new Error("Service worker is not supported.");
  }

  await ServiceWorkerManager(logger, `${__SERVICE_WORKER_BASE_PATH}/service_worker.js?${__CACHE_BUST}`).install();

  // Preload translations and the internationalization service.

  const internationalizationToProgressMessageChannel = createMultiThreadMessageChannel();
  const i18next = createI18next(logger, internationalizationToProgressMessageChannel.port2);
  const internationalizationService = InternationalizationService(i18next, internationalizationToProgressMessageChannel.port2);
  const internationalizationMessageChannel = createMultiThreadMessageChannel();

  internationalizationService.registerMessagePort(internationalizationMessageChannel.port1);

  const internationalizationServicePreloader = Preloader(logger, internationalizationService);

  mainLoop.updatables.add(internationalizationServicePreloader);

  await internationalizationServicePreloader.wait();

  serviceManager.services.add(internationalizationService);

  // Listen to user settings to adjust the language.

  const languageUserSettingsManager = LanguageUserSettingsManager(userSettings, i18next);

  preload(logger, languageUserSettingsManager);

  mainLoop.updatables.add(languageUserSettingsManager);

  // Game message channel handles current game domain logic.

  const gameMessageChannel = createMultiThreadMessageChannel();

  // DOMUiController handles DOM rendering using reconciliated routes.

  const uiMessageChannel = createMultiThreadMessageChannel();

  const domElementViewBuilder = DOMElementViewBuilder({
    dimensionsState: dimensionsState,
    gameMessagePort: gameMessageChannel.port1,
    isDOMElementViewContext: true,
    keyboardState: keyboardState,
    mouseState: mouseState,
    touchState: touchState,
    uiMessagePort: uiMessageChannel.port1,
    userSettings: userSettings,
  });
  const domUIController = DOMUIController(logger, i18next, mainLoop, uiRoot, domElementsLookup, domElementViewBuilder);

  preload(logger, domUIController);

  serviceManager.services.add(domUIController);

  // Progress worker is used to gather information about assets and other
  // resources currently being loaded. It passess the summary information back,
  // so it's possible to render loading screen or do something else with that
  // information.

  const progressMessageChannel = createMultiThreadMessageChannel();
  const progressToDOMRendererMessageChannel = createMultiThreadMessageChannel();
  const progressWorker = new Worker(workers.progress.url, {
    credentials: "same-origin",
    name: workers.progress.name,
    type: "module",
  });

  const progressWorkerServiceClient = WorkerServiceClient(progressWorker, workers.progress.name);

  progressWorker.postMessage(
    {
      domMessagePort: progressToDOMRendererMessageChannel.port2,
    },
    [progressToDOMRendererMessageChannel.port2]
  );

  await progressWorkerServiceClient.ready();

  domUIController.registerMessagePort(progressToDOMRendererMessageChannel.port1);

  mainLoop.updatables.add(progressWorkerServiceClient);
  serviceManager.services.add(progressWorkerServiceClient);

  function addProgressMessagePort(messagePort: MessagePort, broadcastProgress: boolean) {
    progressWorker.postMessage(
      {
        progressMessagePort: {
          broadcastProgress: broadcastProgress,
          messagePort: messagePort,
        },
      },
      [messagePort]
    );
  }

  addProgressMessagePort(progressMessageChannel.port1, true);
  addProgressMessagePort(internationalizationToProgressMessageChannel.port1, false);

  // Notify about the loading progress of subsequent workers and other engine
  // components.

  const websiteToProgressMessageChannel = createMultiThreadMessageChannel();

  addProgressMessagePort(websiteToProgressMessageChannel.port1, false);

  websiteToProgressMessageChannel.port2.postMessage({
    expect: PROGRESS_EXPECT,
  });

  // Stats collector reports debug stats like FPS, memory usage, etc.

  const statsMessageChannel = createMultiThreadMessageChannel();
  const statsToDOMRendererMessageChannel = createSingleThreadMessageChannel();
  const statsCollector = StatsCollector(userSettings, statsToDOMRendererMessageChannel.port2);

  domUIController.registerMessagePort(statsToDOMRendererMessageChannel.port1);
  statsCollector.registerMessagePort(statsReporterMessageChannel.port1);
  statsCollector.registerMessagePort(statsMessageChannel.port1);

  serviceManager.services.add(statsCollector);
  mainLoop.updatables.add(statsCollector);

  // FontPreloadService does exactly what its name says. Thanks to this
  // service it is possible for worker threads to request font face to be
  // preloaded, display loading indicator and receive notification back when
  // it's ready. Thanks to that, there should be no UI twitching while fonts
  // are being loaded.

  const fontPreloadMessageChannel = createMultiThreadMessageChannel();
  const fontPreloadToProgressMessageChannel = createMultiThreadMessageChannel();

  addProgressMessagePort(fontPreloadToProgressMessageChannel.port1, false);

  const fontPreloadService = FontPreloadService(logger, fontPreloadMessageChannel.port1, fontPreloadToProgressMessageChannel.port2);

  serviceManager.services.add(fontPreloadService);

  // `createImageBitmap` has its quirks and surprisingly has no support in
  // safari and ios. Also, it has partial support in Firefox.
  // If it's not supported, then we have to use the main thread to
  // generate textures and potentially send them into other workers.

  const texturesMessageChannel = createMultiThreadMessageChannel();
  const texturesToProgressMessageChannel = createMultiThreadMessageChannel();

  addProgressMessagePort(texturesToProgressMessageChannel.port1, false);

  const texturesService = await createTexturesService(logger, mainLoop, serviceManager, texturesToProgressMessageChannel.port2, websiteToProgressMessageChannel.port2);

  texturesService.registerMessagePort(texturesMessageChannel.port1);

  // Atlas canvas is used to speed up texture atlas creation.

  const atlasMessageChannel = createMultiThreadMessageChannel();

  // Both services are going to land in the same thread in this scenario.
  const atlasToTextureMessageChannel =
    "main" === texturesService.thread && !isCanvasTransferControlToOffscreenSupported() ? createSingleThreadMessageChannel() : createMultiThreadMessageChannel();
  const atlasToProgressMessageChannel = createMultiThreadMessageChannel();
  const atlasToStatsMessageChannel =
    "main" === statsCollector.thread && !isCanvasTransferControlToOffscreenSupported() ? createSingleThreadMessageChannel() : createMultiThreadMessageChannel();

  addProgressMessagePort(atlasToProgressMessageChannel.port1, false);
  texturesService.registerMessagePort(atlasToTextureMessageChannel.port1);
  statsCollector.registerMessagePort(atlasToStatsMessageChannel.port1);

  const atlasService = await createAtlasService(
    logger,
    mainLoop,
    serviceManager,
    atlasToProgressMessageChannel.port2,
    atlasToStatsMessageChannel.port2,
    atlasToTextureMessageChannel.port2,
    websiteToProgressMessageChannel.port2
  );

  atlasService.registerMessagePort(atlasMessageChannel.port1);

  // Ammo worker handles game physics.

  const dynamicsMessageChannel = createMultiThreadMessageChannel();
  const dynamicsToProgressMessageChannel = createMultiThreadMessageChannel();
  const dynamicsToStatsMessageChannel = createMultiThreadMessageChannel();

  addProgressMessagePort(dynamicsToProgressMessageChannel.port1, false);
  statsCollector.registerMessagePort(dynamicsToStatsMessageChannel.port1);

  await prefetch(logger, websiteToProgressMessageChannel.port2, "worker", `${__STATIC_BASE_PATH}/lib/ammo.wasm.js?${__CACHE_BUST}`);
  await prefetch(logger, websiteToProgressMessageChannel.port2, "worker", workers.dynamics.url);

  const dynamicsWorker = new Worker(workers.dynamics.url, {
    credentials: "same-origin",
    name: workers.dynamics.name,
    // Ammo.js expects importScripts to be used.
    type: "classic",
  });

  const ammoWorkerServiceClient = WorkerServiceClient(dynamicsWorker, workers.dynamics.name);

  dynamicsWorker.postMessage(
    {
      dynamicsMessagePort: dynamicsMessageChannel.port1,
      progressMessagePort: dynamicsToProgressMessageChannel.port2,
      statsMessagePort: dynamicsToStatsMessageChannel.port2,
    },
    [dynamicsMessageChannel.port1, dynamicsToProgressMessageChannel.port2, dynamicsToStatsMessageChannel.port2]
  );

  await ammoWorkerServiceClient.ready();

  serviceManager.services.add(ammoWorkerServiceClient);

  // Workers can share a message channel if necessary. If there is no offscreen
  // worker then the message channel can be used in the main thread. It is an
  // overhead, but unifies how messages are handled in each case.

  const quakeMapsMessageChannel = createMultiThreadMessageChannel();
  const quakeMapsToProgressMessageChannel = createMultiThreadMessageChannel();

  addProgressMessagePort(quakeMapsToProgressMessageChannel.port1, false);

  await prefetch(logger, websiteToProgressMessageChannel.port2, "worker", workers.quakemaps.url);

  const quakeMapsWorker = new Worker(workers.quakemaps.url, {
    credentials: "same-origin",
    name: workers.quakemaps.name,
    type: "module",
  });

  const quakeMapsWorkerServiceClient = WorkerServiceClient(quakeMapsWorker, workers.quakemaps.name);
  await quakeMapsWorkerServiceClient.ready();

  quakeMapsWorker.postMessage(
    {
      atlasMessagePort: atlasMessageChannel.port2,
      progressMessagePort: quakeMapsToProgressMessageChannel.port2,
      quakeMapsMessagePort: quakeMapsMessageChannel.port1,
    },
    [atlasMessageChannel.port2, quakeMapsMessageChannel.port1, quakeMapsToProgressMessageChannel.port2]
  );

  // GLTF loader offloads model loading from the rendering thread.

  const gltfMessageChannel = createMultiThreadMessageChannel();
  const gltfToProgressMessageChannel = createMultiThreadMessageChannel();

  addProgressMessagePort(gltfToProgressMessageChannel.port1, false);

  await prefetch(logger, websiteToProgressMessageChannel.port2, "worker", workers.gltf.url);

  const gltfWorker = new Worker(workers.gltf.url, {
    credentials: "same-origin",
    name: workers.gltf.name,
    type: "module",
  });

  const gltfWorkerServiceClient = WorkerServiceClient(gltfWorker, workers.gltf.name);
  await gltfWorkerServiceClient.ready();

  gltfWorker.postMessage(
    {
      gltfMessagePort: gltfMessageChannel.port1,
      progressMessagePort: gltfToProgressMessageChannel.port2,
    },
    [gltfMessageChannel.port1, gltfToProgressMessageChannel.port2]
  );

  // If browser supports the offscreen canvas, then we can offload everything
  // there. If not, then we continue in the main thread.

  const createScenes = await createRenderingService(
    logger,
    mainLoop,
    serviceManager,
    canvas,
    devicePixelRatio,
    domUIController,
    dimensionsState,
    eventBus,
    keyboardObserver.state,
    keyboardState,
    mouseObserver.state,
    mouseState,
    touchState,
    statsReporter,
    THREAD_DEBUG_NAME,
    touchObserver.state,
    userSettings,
    websiteToProgressMessageChannel.port2
  );

  await createScenes(
    dynamicsMessageChannel.port2,
    fontPreloadMessageChannel.port2,
    gameMessageChannel.port2,
    gltfMessageChannel.port2,
    internationalizationMessageChannel.port2,
    progressMessageChannel.port2,
    quakeMapsMessageChannel.port2,
    statsMessageChannel.port2,
    texturesMessageChannel.port2,
    uiMessageChannel.port2,
    userSettingsMessageChannel.port2
  );
}

(async function () {
  try {
    await bootstrap();
  } catch (err) {
    uiRoot.dispatchEvent(
      new CustomEvent("error", {
        bubbles: true,
        detail: err,
      })
    );
  }
})();
