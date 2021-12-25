import { h } from "preact";

import { DOMElementView } from "../../dom-renderer/src/DOMElementView";
import { roundToNearestMultiple } from "../../math/src/roundToNearestMultiple";

import type { JSX } from "preact";

import type { DOMElementViewContext } from "./DOMElementViewContext.type";

export interface Attributes {
  max: number;
  min: number;
  step: number;
  value: number;
}

const CSS_THUMB_BACKGROUND_COLOR = "#ffffff";
const CSS_THUMB_BORDER_COLOR = "#000000";
const CSS_THUMB_HEIGHT = 26;
const CSS_TRACK_BACKGROUND_COLOR = "#000000";
const CSS_TRACK_BORDER_COLOR = "#ffffff";
const CSS_TRACK_HEIGHT = 10;

/**
 * There are duplicate CSS declaration block here, but they should be left
 * as-is dut to browser compatibility reasons. They can be replaced if the
 * better future comes and they won't be necessary anymore.
 */
const _css = `
  :host {
    all: initial;
  }

  *, * * {
    box-sizing: border-box;
  }

  .pi-range-slider {
    display: grid;
    grid-column-gap: 1.6rem;
    grid-template-columns: 1fr 5ch;
    padding-left: 1.6rem;
    padding-right: 1.6rem;
  }

  .pi-range-slider__value {
    color: white;
    font-family: Karla, sans-serif;
  }

  input[type=range] {
    width: 100%;
    background-color: transparent;
    -webkit-appearance: none;
  }

  input[type=range]:focus {
    outline: none;
  }

  input[type=range]::-webkit-slider-runnable-track {
    background: ${CSS_TRACK_BACKGROUND_COLOR};
    border: 1px solid ${CSS_TRACK_BORDER_COLOR};
    border-radius: ${CSS_TRACK_HEIGHT}px;
    width: 100%;
    height: ${CSS_TRACK_HEIGHT}px;
    cursor: pointer;
  }

  input[type=range]::-moz-range-track {
    background: ${CSS_TRACK_BACKGROUND_COLOR};
    border: 1px solid ${CSS_TRACK_BORDER_COLOR};
    border-radius: ${CSS_TRACK_HEIGHT}px;
    width: 100%;
    height: ${CSS_TRACK_HEIGHT}px;
    cursor: pointer;
  }

  input[type=range]::-webkit-slider-thumb {
    margin-top: ${-1 * (CSS_THUMB_HEIGHT / 2) + CSS_TRACK_HEIGHT / 2}px;
    width: ${CSS_THUMB_HEIGHT}px;
    height: ${CSS_THUMB_HEIGHT}px;
    background: ${CSS_THUMB_BACKGROUND_COLOR};
    border: 1px solid ${CSS_THUMB_BORDER_COLOR};
    border-radius: ${CSS_THUMB_HEIGHT}px;
    cursor: pointer;
    -webkit-appearance: none;
  }

  input[type=range]::-moz-range-thumb {
    width: ${CSS_THUMB_HEIGHT}px;
    height: ${CSS_THUMB_HEIGHT}px;
    background: ${CSS_THUMB_BACKGROUND_COLOR};
    border: 1px solid ${CSS_THUMB_BORDER_COLOR};
    border-radius: ${CSS_THUMB_HEIGHT}px;
    cursor: pointer;
  }

  input[type=range]:focus::-webkit-slider-runnable-track {
    background: ${CSS_TRACK_BACKGROUND_COLOR};
  }
`;

export class FormRangeSliderDOMElementView extends DOMElementView<DOMElementViewContext> {
  static get observedAttributes() {
    return ["max", "min", "step", "value"];
  }

  public static css: string = _css;

  private _max: number = 0;
  private _min: number = 0;
  private _step: number = 0;
  private _value: number = 0;

  constructor() {
    super();

    this.onRangeInput = this.onRangeInput.bind(this);
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    super.attributeChangedCallback(name, oldValue, newValue);

    this.needsRender = true;

    switch (name) {
      case "max":
        this._max = Number(newValue);
        break;
      case "min":
        this._min = Number(newValue);
        break;
      case "step":
        this._step = Number(newValue);
        break;
      case "value":
        this._value = Number(newValue);
        break;
    }
  }

  onRangeInput(evt: JSX.TargetedEvent<HTMLInputElement>) {
    this.dispatchEvent(
      new CustomEvent("change", {
        bubbles: false,
        detail: (evt.target as HTMLInputElement).value,
      })
    );
  }

  render(delta: number) {
    const value = roundToNearestMultiple(this._step, Number(this._value));

    return (
      <div class="pi-range-slider">
        <input
          max={this._max}
          min={this._min}
          onInput={this.onRangeInput}
          step={this._step}
          type="range"
          value={value}
        />
        <div class="pi-range-slider__value">{value}</div>
      </div>
    );
  }
}
