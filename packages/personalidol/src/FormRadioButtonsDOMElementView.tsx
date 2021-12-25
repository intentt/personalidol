import clsx from "clsx";
import { h } from "preact";

import { DOMElementView } from "../../dom-renderer/src/DOMElementView";
import { must } from "../../framework/src/must";

import type { DOMElementViewContext } from "./DOMElementViewContext.type";

export interface Attributes<T> {
  currentValue: T;
  edgeLabels: [string, string];
  labels: ReadonlyArray<string>;
  values: ReadonlyArray<T>;
}

const _css = `
  :host {
    all: initial;
  }

  *, * * {
    box-sizing: border-box;
  }

  .pi-radio {
    align-items: center;
    display: grid;
    font-family: Karla, sans-serif;
    grid-row-gap: 0.4rem;
    grid-template-areas:
      "bullets bullets"
      "label-edge-low label-edge-high"
    ;
    padding-left: 1.6rem;
    padding-right: 1.6rem;
  }

  .pi-radio.pi-radio--disabled {
    opacity: 0.3;
  }

  .pi-radio-buttons {
    background-color: black;
    border: 1px solid white;
    border-radius: 1rem;
    display: grid;
    grid-area: bullets;
    padding: 2px;
  }

  .pi-radio-button {
    align-items: center;
    border-radius: 1rem;
    color: white;
    cursor: pointer;
    display: grid;
    height: 2rem;
    justify-content: center;
    line-height: 1px;
    padding: 0 1ch;
    text-align: center;
    vertical-align: center;
  }

  .pi-radio-button.pi-radio-button--disabled {
    cursor: not-allowed;
  }

  .pi-radio-button.pi-radio-button--active {
    background-color: white;
    color: black;
  }

  .pi-radio-edge-label {
    color: white;
  }

  .pi-radio-edge-label.pi-radio-edge-label--low {
    grid-area: label-edge-low;
  }

  .pi-radio-edge-label.pi-radio-edge-label--high {
    grid-area: label-edge-high;
    text-align: right;
  }
`;

export class FormRadioButtonsDOMElementView<T> extends DOMElementView<DOMElementViewContext> implements Attributes<T> {
  static get observedAttributes() {
    return ["disabled"];
  }

  public static css: string = _css;

  private _currentValue: null | T = null;
  private _edgeLabels: null | [string, string] = null;
  private _isDisabled: boolean = false;
  private _labels: null | ReadonlyArray<string> = null;
  private _values: null | ReadonlyArray<T> = null;

  constructor() {
    super();

    this.onToggle = this.onToggle.bind(this);
    this.renderBulletDisabled = this.renderBulletDisabled.bind(this);
    this.renderBulletEnabled = this.renderBulletEnabled.bind(this);
  }

  get currentValue(): T {
    return must(this._currentValue);
  }

  set currentValue(currentValue: T) {
    this.needsRender = true;
    this._currentValue = currentValue;
  }

  get edgeLabels(): [string, string] {
    return must(this._edgeLabels);
  }

  set edgeLabels(edgeLabels: [string, string]) {
    this.needsRender = true;
    this._edgeLabels = edgeLabels;
  }

  get labels(): ReadonlyArray<string> {
    return must(this._labels);
  }

  set labels(labels: ReadonlyArray<string>) {
    this.needsRender = true;
    this._labels = labels;
  }

  get values(): ReadonlyArray<T> {
    return must(this._values);
  }

  set values(values: ReadonlyArray<T>) {
    this.needsRender = true;
    this._values = values;
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    super.attributeChangedCallback(name, oldValue, newValue);

    this.needsRender = true;
    this._isDisabled = "string" === typeof newValue;
  }

  dispatchChange(value: T) {
    this.dispatchEvent(
      new CustomEvent("change", {
        bubbles: false,
        detail: value,
      })
    );
  }

  onToggle(evt: MouseEvent) {
    evt.preventDefault();

    if (this.currentValue === this.values[0]) {
      this.dispatchChange(this.values[1]);
    } else {
      this.dispatchChange(this.values[0]);
    }
  }

  renderBulletDisabled(value: T, index: number) {
    return (
      <div
        class={clsx("pi-radio-button pi-radio-button--disabled", {
          "pi-radio-button--active": value === this.currentValue,
          "pi-radio-button--inactive": value !== this.currentValue,
        })}
        draggable={false}
        key={String(value)}
      >
        {String(this.labels[index])}
      </div>
    );
  }

  renderBulletEnabled(value: T, index: number) {
    const self: this = this;

    return (
      <div
        class={clsx("pi-radio-button", {
          "pi-radio-button--active": value === this.currentValue,
          "pi-radio-button--inactive": value !== this.currentValue,
        })}
        draggable={false}
        key={String(value)}
        onClick={
          this.values.length > 2
            ? function (evt) {
                evt.preventDefault();
                self.dispatchChange(value);
              }
            : this.onToggle
        }
      >
        {String(this.labels[index])}
      </div>
    );
  }

  render(delta: number) {
    if (this.labels.length !== this.values.length) {
      throw new Error("Labels and values arrays need to have equal length.");
    }

    return (
      <div
        class={clsx("pi-radio", {
          "pi-radio--disabled": this._isDisabled,
        })}
      >
        <div class="pi-radio-edge-label pi-radio-edge-label--low">{this.edgeLabels[0]}</div>
        <div
          class="pi-radio-buttons"
          style={{
            "grid-template-columns": `repeat(${this.values.length}, 1fr)`,
          }}
        >
          {this.values.map(this._isDisabled ? this.renderBulletDisabled : this.renderBulletEnabled)}
        </div>
        <div class="pi-radio-edge-label pi-radio-edge-label--high">{this.edgeLabels[1]}</div>
      </div>
    );
  }
}
