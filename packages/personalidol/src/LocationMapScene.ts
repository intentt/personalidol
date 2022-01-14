import { Color } from "three/src/math/Color";
import { Fog } from "three/src/scenes/Fog";
import { Scene } from "three/src/scenes/Scene";

import { createRouter } from "../../framework/src/createRouter";
import { createRPCLookupTable } from "../../framework/src/createRPCLookupTable";
import { createTextureReceiverMessagesRouter } from "../../texture-loader/src/createTextureReceiverMessagesRouter";
import { disposableGeneric } from "../../framework/src/disposableGeneric";
import { dispose as fDispose } from "../../framework/src/dispose";
import { disposeAll } from "../../framework/src/disposeAll";
import { generateUUID } from "../../math/src/generateUUID";
import { getI18NextKeyNamespace } from "../../i18n/src/getI18NextKeyNamespace";
import { handleRPCResponse } from "../../framework/src/handleRPCResponse";
import { imageDataBufferResponseToTexture } from "../../texture-loader/src/imageDataBufferResponseToTexture";
import { InteractableBag } from "../../views/src/InteractableBag";
import { mount as fMount } from "../../framework/src/mount";
import { pause as fPause } from "../../framework/src/pause";
import { preload as fPreload } from "../../framework/src/preload";
import { Raycaster } from "../../input/src/Raycaster";
import { RenderPass } from "../../three-modules/src/postprocessing/RenderPass";
import { sendRPCMessage } from "../../framework/src/sendRPCMessage";
import { unmount as fUnmount } from "../../framework/src/unmount";
import { unmountAll } from "../../framework/src/unmountAll";
import { unmountPass } from "../../three-modules/src/unmountPass";
import { unpause as fUnpause } from "../../framework/src/unpause";
import { ViewBag } from "../../views/src/ViewBag";

import { buildViews } from "./buildViews";
import { CameraController } from "./CameraController";
import { EntityControllerBag } from "./EntityControllerBag";
import { EntityControllerFactory } from "./EntityControllerFactory";
import { EntityViewFactory } from "./EntityViewFactory";
import { InstancedGLTFModelViewManager } from "./InstancedGLTFModelViewManager";
import { isEntityWithController } from "./isEntityWithController";
import { isEntityWithObjectLabel } from "./isEntityWithObjectLabel";
import { UserInputEventBusController } from "./UserInputEventBusController";
import { UserInputKeyboardController } from "./UserInputKeyboardController";
import { UserInputMouseController } from "./UserInputMouseController";
import { UserInputTouchController } from "./UserInputTouchController";

import type { Logger } from "loglevel";

import type { CameraController as ICameraController } from "../../framework/src/CameraController.interface";
import type { CSS2DRenderer } from "../../three-css2d-renderer/src/CSS2DRenderer.interface";
import type { DisposableCallback } from "../../framework/src/DisposableCallback.type";
import type { EffectComposer } from "../../three-modules/src/postprocessing/EffectComposer.interface";
import type { Evaluator } from "../../expression-language/src/Evaluator.interface";
import type { EventBus } from "../../framework/src/EventBus.interface";
import type { InteractableBag as IInteractableBag } from "../../views/src/InteractableBag.interface";
import type { Raycaster as IRaycaster } from "../../input/src/Raycaster.interface";
import type { RPCLookupTable } from "../../framework/src/RPCLookupTable.type";
import type { SceneState } from "../../framework/src/SceneState.type";
import type { TickTimerState } from "../../framework/src/TickTimerState.type";
import type { UnmountableCallback } from "../../framework/src/UnmountableCallback.type";
import type { UserInputController } from "../../input/src/UserInputController.interface";
import type { UserInputMouseController as IUserInputMouseController } from "../../input/src/UserInputMouseController.interface";
import type { ViewBag as IViewBag } from "../../views/src/ViewBag.interface";

import type { EntityControllerBag as IEntityControllerBag } from "./EntityControllerBag.interface";
import type { EntityControllerFactory as IEntityControllerFactory } from "./EntityControllerFactory.interface";
import type { EntityViewFactory as IEntityViewFactory } from "./EntityViewFactory.interface";
import type { GameState } from "./GameState.type";
import type { InstancedGLTFModelViewManager as IInstancedGLTFModelViewManager } from "./InstancedGLTFModelViewManager.interface";
import type { LocationMapScene as ILocationMapScene } from "./LocationMapScene.interface";
import type { UIState } from "./UIState.type";
import type { UserSettings } from "./UserSettings.type";

const _rpcLookupTable: RPCLookupTable = createRPCLookupTable();

const _internationalizationMessageRouter = createRouter({
  loadedNamespaces: handleRPCResponse(_rpcLookupTable),
});
const _gltfMessageRouter = createRouter({
  geometry: handleRPCResponse(_rpcLookupTable),
});
const _quakeMapsRouter = createRouter({
  map: handleRPCResponse(_rpcLookupTable),
});

const _textureReceiverMessageRouter = createTextureReceiverMessagesRouter(_rpcLookupTable);

export function LocationMapScene(
  logger: Logger,
  userSettings: UserSettings,
  effectComposer: EffectComposer,
  css2DRenderer: CSS2DRenderer,
  evaluator: Evaluator,
  eventBus: EventBus,
  tickTimerState: TickTimerState,
  dimensionsState: Uint32Array,
  keyboardState: Uint8Array,
  mouseState: Int32Array,
  touchState: Int32Array,
  gameState: GameState,
  uiState: UIState,
  domMessagePort: MessagePort,
  dynamicsMessagePort: MessagePort,
  gltfMessagePort: MessagePort,
  internationalizationMessagePort: MessagePort,
  progressMessagePort: MessagePort,
  quakeMapsMessagePort: MessagePort,
  texturesMessagePort: MessagePort,
  mapName: string,
  mapFilename: string
): ILocationMapScene {
  const state: SceneState = Object.seal({
    isDisposed: false,
    isMounted: false,
    isPaused: false,
    isPreloaded: false,
    isPreloading: false,
    needsUpdates: true,
  });

  let _isScenePreloaded: boolean = false;

  const _disposables: Set<DisposableCallback> = new Set();
  const _unmountables: Set<UnmountableCallback> = new Set();

  const _scene = new Scene();
  const _cameraController: ICameraController = CameraController(logger, userSettings, dimensionsState, keyboardState);
  const _entityControllerBag: IEntityControllerBag = EntityControllerBag(logger);
  const _raycaster: IRaycaster = Raycaster(_cameraController, dimensionsState, mouseState, touchState);
  const _userInputEventBusController: UserInputController = UserInputEventBusController(
    userSettings,
    eventBus,
    _cameraController,
    tickTimerState
  );
  const _userInputKeyboardController: UserInputController = UserInputKeyboardController(
    userSettings,
    keyboardState,
    _cameraController
  );
  const _userInputMouseController: IUserInputMouseController = UserInputMouseController(
    userSettings,
    dimensionsState,
    mouseState,
    _raycaster
  );
  const _userInputTouchController: UserInputController = UserInputTouchController(
    userSettings,
    dimensionsState,
    touchState
  );

  const _interactableBag: IInteractableBag = InteractableBag(logger);
  const _renderPass = new RenderPass(_scene, _cameraController.camera);
  const _viewBag: IViewBag = ViewBag(logger);

  _scene.background = new Color(0x000000);

  const _fog = new Fog(_scene.background, 0, 0);
  const _instancedGLTFModelViewManager: IInstancedGLTFModelViewManager = InstancedGLTFModelViewManager(
    logger,
    userSettings,
    _scene,
    gltfMessagePort,
    texturesMessagePort,
    _rpcLookupTable
  );

  const _entityControllerFactory: IEntityControllerFactory = EntityControllerFactory(
    logger,
    _cameraController,
    _interactableBag,
    _viewBag,
    evaluator,
    gameState,
    uiState,
    domMessagePort,
    dynamicsMessagePort,
    _userInputEventBusController,
    _userInputKeyboardController,
    _userInputMouseController,
    _userInputTouchController
  );
  const _entityViewFactory: IEntityViewFactory = EntityViewFactory(
    logger,
    userSettings,
    _instancedGLTFModelViewManager,
    _rpcLookupTable,
    _scene,
    domMessagePort,
    texturesMessagePort
  );

  function dispose(): void {
    state.isDisposed = true;

    fDispose(logger, _viewBag);
    fDispose(logger, _entityControllerBag);
    disposeAll(_disposables);

    // Render one more time to clean up stats etc.
    css2DRenderer.render(_scene, _cameraController.camera, false);
  }

  function mount(): void {
    state.isMounted = true;

    fMount(logger, _viewBag);
    fMount(logger, _entityControllerBag);
    fMount(logger, _userInputEventBusController);
    fMount(logger, _userInputKeyboardController);
    fMount(logger, _userInputMouseController);
    fMount(logger, _userInputTouchController);
    fMount(logger, _cameraController);

    progressMessagePort.postMessage({
      reset: true,
    });

    effectComposer.addPass(_renderPass);

    _unmountables.add(unmountPass(effectComposer, _renderPass));
    _disposables.add(disposableGeneric(_renderPass));

    uiState.isInGameMenuTriggerVisible = true;
    uiState.isMousePointerLayerVisible = true;
    uiState.isVirtualJoystickLayerVisible = true;
  }

  function pause(): void {
    state.isPaused = true;

    fPause(logger, _viewBag);
    fPause(logger, _entityControllerBag);
    fPause(logger, _userInputEventBusController);
    fPause(logger, _userInputKeyboardController);
    fPause(logger, _userInputMouseController);
    fPause(logger, _userInputTouchController);
    fPause(logger, _cameraController);
  }

  async function preload(): Promise<void> {
    state.isPreloading = true;

    gltfMessagePort.onmessage = _gltfMessageRouter;
    internationalizationMessagePort.onmessage = _internationalizationMessageRouter;
    quakeMapsMessagePort.onmessage = _quakeMapsRouter;
    texturesMessagePort.onmessage = _textureReceiverMessageRouter;

    progressMessagePort.postMessage({
      reset: true,
    });

    const {
      unmarshal: { entities, textureAtlas },
    } = await sendRPCMessage(_rpcLookupTable, quakeMapsMessagePort, {
      unmarshal: {
        filename: mapFilename,
        rpc: generateUUID(),
      },
    });

    const worldspawnTexture = imageDataBufferResponseToTexture(textureAtlas);

    _disposables.add(disposableGeneric(worldspawnTexture));

    const i18Namespaces: Set<string> = new Set();

    for (let entity of entities) {
      if (isEntityWithObjectLabel(entity)) {
        const namespace = getI18NextKeyNamespace(entity.properties.label);

        if (namespace) {
          i18Namespaces.add(namespace);
        }
      }
    }

    if (i18Namespaces.size > 0) {
      await sendRPCMessage(_rpcLookupTable, internationalizationMessagePort, {
        loadNamespaces: {
          namespaces: Array.from(i18Namespaces.values()),
          rpc: generateUUID(),
        },
      });
    }

    for await (let view of buildViews(logger, gameState, _entityViewFactory, evaluator, worldspawnTexture, entities)) {
      _viewBag.views.add(view);

      if (isEntityWithController(view.entity)) {
        for (let controller of _entityControllerFactory.create(view)) {
          _entityControllerBag.entityControllers.add(controller);
        }
      }

      if (view.state.needsRaycast) {
        _raycaster.raycastables.add(view);
      }
    }

    _viewBag.views.add(_instancedGLTFModelViewManager);

    _disposables.add(function () {
      gltfMessagePort.onmessage = null;
      internationalizationMessagePort.onmessage = null;
      quakeMapsMessagePort.onmessage = null;
      texturesMessagePort.onmessage = null;
    });

    fPreload(logger, _viewBag);
    fPreload(logger, _entityControllerBag);

    _isScenePreloaded = true;
  }

  function unmount(): void {
    state.isMounted = false;

    uiState.isInGameMenuTriggerVisible = false;
    uiState.isMousePointerLayerVisible = false;
    uiState.isVirtualJoystickLayerVisible = false;

    fUnmount(logger, _viewBag);
    fUnmount(logger, _entityControllerBag);
    fUnmount(logger, _userInputEventBusController);
    fUnmount(logger, _userInputKeyboardController);
    fUnmount(logger, _userInputMouseController);
    fUnmount(logger, _userInputTouchController);
    fUnmount(logger, _cameraController);
    unmountAll(_unmountables);
  }

  function unpause(): void {
    state.isPaused = false;

    fUnpause(logger, _viewBag);
    fUnpause(logger, _entityControllerBag);
    fUnpause(logger, _userInputEventBusController);
    fUnpause(logger, _userInputKeyboardController);
    fUnpause(logger, _userInputMouseController);
    fUnpause(logger, _userInputTouchController);
    fUnpause(logger, _cameraController);
  }

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    if ("PerspectiveCamera" === _cameraController.camera.type) {
      _scene.fog = _fog;
    } else {
      _scene.fog = null;
    }

    if (state.isPaused) {
      _raycaster.reset();
    } else {
      _raycaster.update(delta, elapsedTime, tickTimerState);
    }

    if (_userInputEventBusController.state.needsUpdates) {
      _userInputEventBusController.update(delta, elapsedTime, tickTimerState);
    }

    _userInputKeyboardController.update(delta, elapsedTime, tickTimerState);
    _userInputMouseController.update(delta, elapsedTime, tickTimerState);
    _userInputTouchController.update(delta, elapsedTime, tickTimerState);

    _cameraController.update(delta, elapsedTime, tickTimerState);
    _entityControllerBag.update(delta, elapsedTime, tickTimerState);
    _viewBag.update(delta, elapsedTime, tickTimerState);

    _renderPass.camera = _cameraController.camera;

    _fog.near = _cameraController.camera.far - 1000;
    _fog.far = _cameraController.camera.far;

    effectComposer.render(delta);
    css2DRenderer.render(_scene, _cameraController.camera, false);
  }

  function updatePreloadingState(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    if (_entityControllerBag.state.isPreloading && !_isScenePreloaded) {
      throw new Error("EntityControllerBag may only start preloading if scene is fully preloaded.");
    }

    if (_viewBag.state.isPreloading && !_isScenePreloaded) {
      throw new Error("ViewBag may only start preloading if scene is fully preloaded.");
    }

    if (_entityControllerBag.state.isPreloading) {
      _entityControllerBag.updatePreloadingState(delta, elapsedTime, tickTimerState);
    }

    if (_viewBag.state.isPreloading) {
      _viewBag.updatePreloadingState(delta, elapsedTime, tickTimerState);
    }

    state.isPreloaded = _isScenePreloaded && _entityControllerBag.state.isPreloaded && _viewBag.state.isPreloaded;
    state.isPreloading = !_isScenePreloaded || _entityControllerBag.state.isPreloading || _viewBag.state.isPreloading;
  }

  return Object.freeze({
    currentMap: mapName,
    id: generateUUID(),
    isDisposable: true,
    isLocationMapScene: true,
    isMountable: true,
    isPollablePreloading: true,
    isPreloadable: true,
    isScene: true,
    isViewBaggableScene: true,
    name: `LocationMapScene("${mapFilename}")`,
    state: state,

    dispose: dispose,
    mount: mount,
    pause: pause,
    preload: preload,
    unmount: unmount,
    unpause: unpause,
    update: update,
    updatePreloadingState: updatePreloadingState,
  });
}
