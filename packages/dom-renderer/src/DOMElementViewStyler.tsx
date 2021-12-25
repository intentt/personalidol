import { h } from "preact";

import { createConstructableStylesheet } from "../../dom/src/createConstructableStylesheet";
import { isConstructableCSSStyleSheetSupported } from "../../framework/src/isConstructableCSSStyleSheetSupported";

import type { VNode } from "preact";

import type { DOMElementViewStyler as IDOMElementViewStyler } from "./DOMElementViewStyler.interface";

export function DOMElementViewStyler(style: string): IDOMElementViewStyler {
  const _isConstructableCSSStyleSheetSupported = isConstructableCSSStyleSheetSupported();

  let _wasConnected: boolean = false;

  function connectedCallback(shadow: ShadowRoot): void {
    if (_wasConnected || !style || !_isConstructableCSSStyleSheetSupported) {
      return;
    }

    _wasConnected = true;

    // @ts-ignore this is a chrome-only feature at this point and as such it
    // is not typed
    shadow.adoptedStyleSheets = [createConstructableStylesheet(style)];
  }

  function render(): null | VNode<any> {
    if (!style || _isConstructableCSSStyleSheetSupported) {
      return null;
    }

    return <style>{style}</style>;
  }

  return Object.freeze({
    isDOMElementViewStyler: true,

    connectedCallback: connectedCallback,
    render: render,
  });
}
