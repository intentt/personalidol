import { clearHTMLElement } from "@personalidol/dom/src/clearHTMLElement";
import { createRouter } from "@personalidol/framework/src/createRouter";
import { createSingleThreadMessageChannel } from "@personalidol/framework/src/createSingleThreadMessageChannel";
import { generateUUID } from "@personalidol/math/src/generateUUID";
import { isCustomEvent } from "@personalidol/framework/src/isCustomEvent";

import { Events } from "./Events.enum";
import { isDOMElementView } from "./isDOMElementView";
import { isDOMElementViewConstructor } from "./isDOMElementViewConstructor";
import { isHTMLElementConstructor } from "./isHTMLElementConstructor";

import type { i18n } from "i18next";
import type { Logger } from "loglevel";

import type { MainLoop } from "@personalidol/framework/src/MainLoop.interface";

import type { DOMElementProps } from "./DOMElementProps.type";
import type { DOMElementsLookup } from "./DOMElementsLookup.type";
import type { DOMElementView } from "./DOMElementView.interface";
import type { DOMElementViewBuilder } from "./DOMElementViewBuilder.interface";
import type { DOMElementViewContext } from "./DOMElementViewContext.type";
import type { DOMUIController as IDOMUIController } from "./DOMUIController.interface";
import type { DOMUIControllerState } from "./DOMUIControllerState.type";
import type { MessageDOMUIDispose } from "./MessageDOMUIDispose.type";
import type { MessageDOMUIRender } from "./MessageDOMUIRender.type";

const _definedCustomElements: Array<string> = [];
const _evtOnce = Object.freeze({
  once: true,
});

function _isCustomElementDefined<L extends DOMElementsLookup>(name: string & keyof L): boolean {
  return _definedCustomElements.includes(name);
}

export function DOMUIController<L extends DOMElementsLookup, C extends DOMElementViewContext>(
  logger: Logger,
  i18next: i18n,
  mainLoop: MainLoop<number | ReturnType<typeof setTimeout>>,
  uiRootElement: HTMLElement,
  domElementsLookup: L,
  domElementViewBuilder: DOMElementViewBuilder<C>
): IDOMUIController<L, C> {
  const state: DOMUIControllerState = Object.seal({
    isPreloaded: false,
    isPreloading: false,
  });
  const _internalDOMMessageChannel: MessageChannel = createSingleThreadMessageChannel();
  let _isRootElementCleared: boolean = false;

  const _domElementViews: Set<DOMElementView<C>> = new Set();
  const _managedDOMElementViewsLookup: Map<string, DOMElementView<C>> = new Map();
  const _uiMessageRouter = createRouter({
    dispose: dispose,
    render: render,
    renderBatch: renderBatch,
  });

  function _createDOMElementViewByRenderMessage(message: MessageDOMUIRender<L>): DOMElementView<C> {
    const DOMElementViewConstructor: undefined | CustomElementConstructor = customElements.get(message.element);

    if (!isDOMElementViewConstructor(DOMElementViewConstructor)) {
      throw new Error("Object is not a DOMElementView constructor.");
    }

    const domElementView = new DOMElementViewConstructor<C>();

    domElementViewBuilder.initialize(domElementView, _internalDOMMessageChannel.port2, i18next, logger);

    return domElementView;
  }

  async function _defineCustomElement(name: string & keyof L, element: typeof HTMLElement): Promise<void> {
    if (_isCustomElementDefined<L>(name)) {
      throw new Error(`Custom element is already defined: "${name}"`);
    }

    customElements.define(name, element);
    _definedCustomElements.push(name);

    await customElements.whenDefined(name);

    for (let element of uiRootElement.querySelectorAll(name)) {
      if (element instanceof HTMLElement) {
        customElements.upgrade(element);

        if (isDOMElementView<C>(element)) {
          logger.debug(`UPGRADE("${name}")`);
          domElementViewBuilder.initialize(element, _internalDOMMessageChannel.port2, i18next, logger);
          _registerDOMElementView(element);
          _updateRenderedElement(element);
        }
      }
    }

    logger.debug(`DEFINE("${name}")`);
  }

  function _defineCustomElementByName(elementName: string & keyof L): Promise<void> {
    const Constructor = domElementsLookup[elementName];

    if (!Constructor) {
      throw new Error(`Custom element is not available: "${elementName}"`);
    }

    if (!isHTMLElementConstructor(Constructor)) {
      throw new Error("Object is not a HTMLElement constructor.");
    }

    return _defineCustomElement(elementName, Constructor);
  }

  function _disposeElementById(id: string): void {
    let domElementView: undefined | DOMElementView<C> = _managedDOMElementViewsLookup.get(id);

    if (!domElementView) {
      throw new Error(`Element is not rendered and can't be disposed: "${id}"`);
    }

    uiRootElement.removeChild(domElementView);

    _domElementViews.delete(domElementView);
    _managedDOMElementViewsLookup.delete(id);
  }

  function _onElementConnected(evt: Event) {
    evt.stopPropagation();

    if (!isCustomEvent(evt)) {
      throw new Error(`Expected custom event for: "${Events.elementConnected}"`);
    }

    const target = evt.detail;

    if (!isDOMElementView<C>(target)) {
      throw new Error(
        `Received event, but element is not a DOMElementView: "${target.tagName}@${Events.elementConnected}"`
      );
    }

    if (_domElementViews.has(target)) {
      return;
    }

    // Pick up any element that was created by a view.

    domElementViewBuilder.initialize(target, _internalDOMMessageChannel.port2, i18next, logger);
    _registerDOMElementView(target);
    _updateRenderedElement(target);

    target.addEventListener(Events.elementDisconnected, _onElementDisconnected, _evtOnce);
  }

  function _onElementDisconnected(evt: Event) {
    evt.stopPropagation();

    if (!isCustomEvent(evt)) {
      throw new Error(`Expected custom event for: "${Events.elementDisconnected}"`);
    }

    const target = evt.detail;

    if (!isDOMElementView<C>(target)) {
      throw new Error(
        `Received event, but element is not a DOMElementView: "${target.tagName}@${Events.elementDisconnected}"`
      );
    }

    if (mainLoop.updatables.has(target)) {
      // Element may remove itself from the update loop, so it's fine if it is
      // no longer in the main loop.
      mainLoop.updatables.delete(target);
    }

    if (!_domElementViews.delete(target)) {
      throw new Error(`Element was disconnected, but has never been registered as connected: "${target.tagName}"`);
    }
  }

  function _registerDOMElementView(domElementView: DOMElementView<C>) {
    _domElementViews.add(domElementView);
    mainLoop.updatables.add(domElementView);
  }

  function _updateRenderedElement(domElementView: DOMElementView<C>) {
    if (domElementView.state.needsUpdates) {
      domElementView.update(
        mainLoop.ticker.tickTimerState.delta,
        mainLoop.ticker.tickTimerState.elapsedTime,
        mainLoop.ticker.tickTimerState
      );
    }
  }

  function _updateRenderedElementProps(domElementView: DOMElementView<C>, props: DOMElementProps) {
    if (domElementView.version >= props.version) {
      // Props did not change.
      return;
    }

    for (let prop in props) {
      if (props.hasOwnProperty(prop)) {
        if (prop in domElementView) {
          // @ts-ignore we know that element has this property
          domElementView[prop] = props[prop];
        } else {
          throw new Error(`Element does not have a property defined: "${domElementView.tagName}.${prop}"`);
        }
      }
    }

    domElementView.version = props.version;
  }

  function dispose(message: MessageDOMUIDispose): void {
    message.forEach(_disposeElementById);
  }

  async function preload() {
    state.isPreloading = true;

    for (let customElementName of Object.keys(domElementsLookup)) {
      if (!_isCustomElementDefined<L>(customElementName as string & keyof L)) {
        await _defineCustomElementByName(customElementName as string & keyof L);
      }
    }

    state.isPreloading = false;
    state.isPreloaded = true;
  }

  function render(message: MessageDOMUIRender<L>): void {
    if (!_isRootElementCleared) {
      clearHTMLElement(uiRootElement);
      _isRootElementCleared = true;
    }

    let domElementView: undefined | DOMElementView<C> = _managedDOMElementViewsLookup.get(message.id);

    if (!domElementView) {
      domElementView = _createDOMElementViewByRenderMessage(message);

      _registerDOMElementView(domElementView);
      _managedDOMElementViewsLookup.set(message.id, domElementView);
      uiRootElement.appendChild(domElementView);
    }

    _updateRenderedElementProps(domElementView, message.props);

    if (!domElementView.state.needsUpdates) {
      throw new Error(
        `DOMElementView requested no more updates, but render message was received: "${domElementView.tagName}"`
      );
    }

    _updateRenderedElement(domElementView);
  }

  function renderBatch(message: Array<MessageDOMUIRender<L>>): void {
    message.forEach(render);
  }

  function registerMessagePort(messagePort: MessagePort) {
    messagePort.onmessage = _uiMessageRouter;
  }

  function start() {
    _internalDOMMessageChannel.port1.onmessage = _uiMessageRouter;
    uiRootElement.addEventListener(Events.elementConnected, _onElementConnected);
  }

  function stop() {
    _internalDOMMessageChannel.port1.onmessage = null;
    uiRootElement.removeEventListener(Events.elementConnected, _onElementConnected);
  }

  return Object.freeze({
    id: generateUUID(),
    isPreloadable: true,
    name: "DOMUIController",
    state: state,

    dispose: dispose,
    preload: preload,
    registerMessagePort: registerMessagePort,
    render: render,
    start: start,
    stop: stop,
  });
}
