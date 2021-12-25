import clsx from "clsx";
import { h } from "preact";

import { DOMElementView } from "../../dom-renderer/src/DOMElementView";

import type { DOMElementViewContext } from "./DOMElementViewContext.type";

export interface Attributes {
  active?: boolean;
}

export const css = `
  :host {
    all: initial;
  }

  *, * * {
    box-sizing: border-box;
  }

  .main-menu-button {
    background-color: transparent;
    border: 1px solid transparent;
    font-family: Karla, sans-serif;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1;
    padding: 0.8rem 1.6rem;
    position: relative;
    text-align: left;
    width: 100%;
  }

  .main-menu-button.main-menu-button--active:enabled {
    border-color: gray;
  }

  .main-menu-button:disabled {
    color: rgba(255, 255, 255, 0.4);
  }

  .main-menu-button:enabled {
    color: white;
    cursor: pointer;
  }

  .main-menu-button:enabled:hover {
    border-color: white;
  }

  .main-menu-button:focus {
    outline: none;
  }
`;

export class MainMenuButtonDOMElementView extends DOMElementView<DOMElementViewContext> {
  static get observedAttributes() {
    return ["active", "disabled"];
  }

  public static css: string = css;

  private _isActive: boolean = false;
  private _isDisabled: boolean = false;

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    super.attributeChangedCallback(name, oldValue, newValue);

    this.needsRender = true;

    switch (name) {
      case "active":
        this._isActive = "true" === newValue;
        break;
      case "disabled":
        this._isDisabled = "true" === newValue;
        break;
    }
  }

  render() {
    return (
      <button
        class={clsx("main-menu-button", {
          "main-menu-button--active": this._isActive,
        })}
        disabled={this._isDisabled}
      >
        <slot />
      </button>
    );
  }
}
