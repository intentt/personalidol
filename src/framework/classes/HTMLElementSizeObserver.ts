import ResizeObserver from "resize-observer-polyfill";

import ElementSize from "src/framework/classes/ElementSize";
import EventListenerSet from "src/framework/classes/EventListenerSet";
import Idempotence from "src/framework/classes/Exception/Idempotence";

import HasLoggerBreadcrumbs from "src/framework/interfaces/HasLoggerBreadcrumbs";
import LoggerBreadcrumbs from "src/framework/interfaces/LoggerBreadcrumbs";
import { default as IElementSize } from "src/framework/interfaces/ElementSize";
import { default as IEventListenerSet } from "src/framework/interfaces/EventListenerSet";
import { default as IHTMLElementSizeObserver } from "src/framework/interfaces/HTMLElementSizeObserver";

export default class HTMLElementSizeObserver implements HasLoggerBreadcrumbs, IHTMLElementSizeObserver {
  readonly element: HTMLElement;
  readonly eventDispatcher: IEventListenerSet<[IElementSize<"px">]>;
  readonly loggerBreadcrumbs: LoggerBreadcrumbs;
  readonly nativeResizeObserver: ResizeObserver;
  private _isObserving: boolean = false;

  constructor(loggerBreadcrumbs: LoggerBreadcrumbs, element: HTMLElement) {
    const eventDispatcher = new EventListenerSet(loggerBreadcrumbs.add("EventListenerSet"));

    this.element = element;
    this.eventDispatcher = eventDispatcher;
    this.loggerBreadcrumbs = loggerBreadcrumbs;
    this.nativeResizeObserver = new ResizeObserver(function(mutationList) {
      for (let mutation of mutationList) {
        const contentRect = mutation.contentRect;
        const elementSize = new ElementSize<"px">("px", contentRect.width, contentRect.height);

        eventDispatcher.notify([elementSize]);
      }
    });
  }

  disconnect(): void {
    if (!this._isObserving) {
      throw new Idempotence(this.loggerBreadcrumbs.add("disconnect"), "HTMLElementSizeObserver is not idempotent.");
    }

    this.nativeResizeObserver.disconnect();
    this._isObserving = false;
  }

  observe(): void {
    if (this._isObserving) {
      throw new Idempotence(this.loggerBreadcrumbs.add("observe"), "HTMLElementSizeObserver is not idempotent.");
    }

    this.nativeResizeObserver.observe(this.element);
    this._isObserving = true;
  }
}