import { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera";
import { Scene } from "three/src/scenes/Scene";

import { disposeAll } from "../../framework/src/disposeAll";
import { generateUUID } from "../../math/src/generateUUID";
import { unmountAll } from "../../framework/src/unmountAll";

import { createRouter } from "../../framework/src/createRouter";
import { createRPCLookupTable } from "../../framework/src/createRPCLookupTable";
import { handleRPCResponse } from "../../framework/src/handleRPCResponse";
import { RenderPass } from "../../three-modules/src/postprocessing/RenderPass";
import { sendRPCMessage } from "../../framework/src/sendRPCMessage";
import { unmountPass } from "../../three-modules/src/unmountPass";

import type { Logger } from "loglevel";

import type { DisposableCallback } from "../../framework/src/DisposableCallback.type";
import type { EffectComposer } from "../../three-modules/src/postprocessing/EffectComposer.interface";
import type { FontPreloadParameters } from "../../dom/src/FontPreloadParameters.type";
import type { MessageDOMUIDispose } from "../../dom-renderer/src/MessageDOMUIDispose.type";
import type { MessageDOMUIRender } from "../../dom-renderer/src/MessageDOMUIRender.type";
import type { MessageFontPreload } from "../../dom/src/MessageFontPreload.type";
import type { RPCLookupTable } from "../../framework/src/RPCLookupTable.type";
import type { SceneState } from "../../framework/src/SceneState.type";
import type { UnmountableCallback } from "../../framework/src/UnmountableCallback.type";

import type { DOMElementsLookup } from "./DOMElementsLookup.type";
import type { MainMenuScene as IMainMenuScene } from "./MainMenuScene.interface";

const _fonts: ReadonlyArray<FontPreloadParameters> = Object.freeze([
  {
    family: "Karla",
    source: `${__ASSETS_BASE_PATH}/fonts/font-karla-variablefont-wght.ttf?${__CACHE_BUST}`,
    descriptors: {
      weight: "125 950",
    },
  },
  {
    family: "Lora",
    source: `${__ASSETS_BASE_PATH}/fonts/font-lora-variablefont-wght.ttf?${__CACHE_BUST}`,
    descriptors: {
      weight: "125 950",
    },
  },
]);

const _disposables: Set<DisposableCallback> = new Set();
const _rpcLookupTable: RPCLookupTable = createRPCLookupTable();
const _unmountables: Set<UnmountableCallback> = new Set();

const _camera = new PerspectiveCamera();
const _scene = new Scene();

const _fontMessageRouter = createRouter({
  preloadedFont: handleRPCResponse(_rpcLookupTable),
});

let _fontsPreloaded: boolean = false;

export function MainMenuScene(
  logger: Logger,
  effectComposer: EffectComposer,
  domMessagePort: MessagePort,
  fontPreloadMessagePort: MessagePort,
  progressMessagePort: MessagePort
): IMainMenuScene {
  const state: SceneState = Object.seal({
    isDisposed: false,
    isMounted: false,
    isPaused: false,
    isPreloaded: false,
    isPreloading: false,
    needsUpdates: true,
  });

  const _domMainMenuElementId: string = generateUUID();

  function _onFontsPreloaded(): void {
    _fontsPreloaded = true;
    state.isPreloading = false;
    state.isPreloaded = true;
  }

  function dispose(): void {
    state.isDisposed = true;

    disposeAll(_disposables);
  }

  function mount(): void {
    state.isMounted = true;

    progressMessagePort.postMessage({
      reset: true,
    });

    const renderPass = new RenderPass(_scene, _camera);

    effectComposer.addPass(renderPass);
    _unmountables.add(unmountPass(effectComposer, renderPass));

    fontPreloadMessagePort.onmessage = _fontMessageRouter;

    domMessagePort.postMessage({
      render: <MessageDOMUIRender<DOMElementsLookup>>{
        id: _domMainMenuElementId,
        element: "pi-main-menu",
        props: {},
      },
    });

    _unmountables.add(function () {
      domMessagePort.postMessage({
        dispose: <MessageDOMUIDispose>[_domMainMenuElementId],
      });
    });
  }

  function pause(): void {
    state.isPaused = true;
  }

  function preload(): void {
    if (_fontsPreloaded) {
      _onFontsPreloaded();

      return;
    }

    state.isPreloading = true;

    fontPreloadMessagePort.onmessage = _fontMessageRouter;

    Promise.all(_fonts.map(_preloadFont)).then(_onFontsPreloaded);
  }

  function unmount(): void {
    state.isMounted = false;

    fontPreloadMessagePort.onmessage = null;

    unmountAll(_unmountables);
  }

  function unpause(): void {
    state.isPaused = false;
  }

  function update(delta: number): void {
    effectComposer.render(delta);
  }

  async function _preloadFont(fontParameters: FontPreloadParameters) {
    await sendRPCMessage(_rpcLookupTable, fontPreloadMessagePort, <MessageFontPreload>{
      preloadFont: {
        ...fontParameters,
        rpc: generateUUID(),
      },
    });
  }

  return Object.freeze({
    id: generateUUID(),
    isDisposable: true,
    isMainMenuScene: true,
    isMountable: true,
    isPreloadable: true,
    isScene: true,
    name: `MainMenu`,
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
