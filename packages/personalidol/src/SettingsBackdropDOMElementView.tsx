import clsx from "clsx";
import { h } from "preact";

import { DOMElementView } from "../../dom-renderer/src/DOMElementView";

import { DOMBreakpoints } from "./DOMBreakpoints.enum";
import { DOMZIndex } from "./DOMZIndex.enum";

import type { DOMElementViewContext } from "./DOMElementViewContext.type";

export interface Attributes {
  isloading?: boolean;
  onDirectClick(): void;
}

const _css = `
  :host {
    all: initial;
  }

  *, * * {
    box-sizing: border-box;
  }

  .overlay {
    bottom: 0;
    left: 0;
    line-height: 1.7;
    position: absolute;
    right: 0;
    top: 0;
    z-index: ${DOMZIndex.Settings};
  }

  .overlay__content {
    color: white;
    position: relative;
    z-index: 0;
  }

  .overlay__content.overlay__content--is-loading:before {
    background-color: rgba(0, 0, 0, 0.6);
    bottom: 0;
    content: "";
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
    z-index: 1;
  }

  @media (max-width: ${DOMBreakpoints.MobileMax}px) {
    .overlay {
      align-items: stretch;
      background-color: black;
      justify-content: stretch;
      display: grid;
      overflow-y: auto;
    }

    .overlay__content {
      left: 50%;
      max-width: 60ch;
      padding-bottom: 3.2rem;
      padding-left: 1.6rem;
      padding-right: 1.6rem;
      padding-top: 0rem;
      transform: translateX(-50%);
    }
  }

  @media (min-width: ${DOMBreakpoints.TabletMin}px) {
    .overlay {
      display: block;
    }

    .overlay__content {
      background-color: rgba(0, 0, 0, 0.8);
      bottom: 0;
      left: calc(400px + 3.2rem);
      overflow-y: auto;
      padding-bottom: 6.4rem;
      padding-left: 4.8rem;
      padding-right: 4.8rem;
      padding-top: 0;
      position: absolute;
      top: 0;
    }
  }

  @media (min-width: ${DOMBreakpoints.DesktopMin}px) {
    .overlay__content {
      max-width: 1024px;
    }
  }
`;

export class SettingsBackdropDOMElementView extends DOMElementView<DOMElementViewContext> {
  static get observedAttributes() {
    return ["isloading"];
  }

  public static css: string = _css;

  private _isLoading: boolean = false;

  constructor() {
    super();

    this.onClick = this.onClick.bind(this);
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    super.attributeChangedCallback(name, oldValue, newValue);

    this.needsRender = true;
    this._isLoading = "true" === newValue;
  }

  onClick(evt: MouseEvent) {
    const target = evt.target;

    if (!target || !(target instanceof HTMLElement) || target.id !== "overlay") {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("DirectClick", {
        bubbles: false,
        composed: false,
      })
    );
  }

  render(delta: number) {
    return (
      <div class="overlay" id="overlay" onClick={this.onClick}>
        <div
          class={clsx("overlay__content", {
            "overlay__content--is-loading": this._isLoading,
          })}
        >
          <slot />
        </div>
      </div>
    );
  }
}
