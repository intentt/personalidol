import { h } from "preact";

import { CSS2DObjectState } from "../../three-css2d-renderer/src/CSS2DObjectState";
import { CSS2DObjectStateIndices } from "../../three-css2d-renderer/src/CSS2DObjectStateIndices.enum";
import { damp } from "../../math/src/damp";
import { DOMElementView } from "../../dom-renderer/src/DOMElementView";
import { isSharedArrayBuffer } from "../../framework/src/isSharedArrayBuffer";

import type { DOMElementProps } from "../../dom-renderer/src/DOMElementProps.type";
import type { TickTimerState } from "../../framework/src/TickTimerState.type";

import type { DOMElementViewContext } from "./DOMElementViewContext.type";

const OPACITY_DAMP = 10;
const FADE_OUT_DISTANCE_SQUARED: number = 4000;

const _css = `
  :host {
    all: initial;
    pointer-events: none;
  }

  *, * * {
    box-sizing: border-box;
  }

  #label {
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    align-items: center;
    backface-visibility: hidden;
    background-color: rgba(0, 0, 0, 0.8);
    color: #eee;
    display: flex;
    font-family: Karla, sans-serif;
    font-size: 1rem;
    height: 2rem;
    justify-content: center;
    left: 0;
    line-height: 0.5rem;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    position: absolute;
    top: 0;
    will-change: opacity, transform, z-index;
  }
`;

type LabelProps = DOMElementProps & {
  label: string;
};

export class ObjectLabelDOMElementView extends DOMElementView<DOMElementViewContext> {
  public static css: string = _css;

  public _rendererState: Float32Array = CSS2DObjectState.createEmptyState(false);

  private _currentLabel: string = "";
  private _currentObjectPropsVersion: number = 0;
  private _currentOpacity: number = 1;
  private _lastRenderedState: number = -1;
  private _lastRenderedProps: number = -1;
  private _receivedSharedArrayBuffer: boolean = false;
  private _targetOpacity: number = 1;

  set objectProps(objectProps: LabelProps) {
    this._currentLabel = objectProps.label;
    this._currentObjectPropsVersion = objectProps.version;
    this.needsRender = this._lastRenderedProps < objectProps.version;
  }

  set rendererState(rendererState: Float32Array | SharedArrayBuffer) {
    if (isSharedArrayBuffer(rendererState)) {
      if (this._receivedSharedArrayBuffer) {
        throw new Error("ObjectLabelDOMElementView already received shared array buffer from CSS2DRenderer.");
      }

      this._receivedSharedArrayBuffer = true;
      this._rendererState = new Float32Array(rendererState);
    } else {
      this._rendererState = rendererState;
    }
  }

  beforeRender(delta: number, elapsedTime: number, tickTimerState: TickTimerState) {
    super.beforeRender(delta, elapsedTime, tickTimerState);

    if (this.needsRender) {
      return;
    }

    // Object state MAY use shared array for a state. Because of that this
    // needs to be checked every frame.
    this.needsRender = this._lastRenderedState < this._rendererState[CSS2DObjectStateIndices.VERSION];
  }

  getTargetOpacity(): number {
    const fadeOutDistance =
      this._rendererState[CSS2DObjectStateIndices.CAMERA_FAR] *
        this._rendererState[CSS2DObjectStateIndices.CAMERA_FAR] -
      FADE_OUT_DISTANCE_SQUARED;

    if (this._rendererState[CSS2DObjectStateIndices.DISTANCE_TO_CAMERA_SQUARED] < fadeOutDistance) {
      return 1;
    }

    return 0.3;
  }

  render(delta: number) {
    this._lastRenderedProps = this._currentObjectPropsVersion;
    this._lastRenderedState = this._rendererState[CSS2DObjectStateIndices.VERSION];

    if (!this._rendererState[CSS2DObjectStateIndices.VISIBLE]) {
      return null;
    }

    this._targetOpacity = this.getTargetOpacity();
    this._currentOpacity = damp(this._currentOpacity, this._targetOpacity, OPACITY_DAMP, delta);

    return (
      <div
        id="label"
        style={{
          opacity: this._currentOpacity,
          // Although those are pixels, rounding to the 1 decimal place
          // actually makes a difference (labels are not jittery) on displays
          // with high pixel ratio. It does not make sense to leave the exact
          // position as-is, because it will cause unnecessary redraws.
          transform: `
            translate3D(-50%, -100%, 0)
            translate3D(
              ${this._rendererState[CSS2DObjectStateIndices.TRANSLATE_X].toFixed(1)}px,
              ${this._rendererState[CSS2DObjectStateIndices.TRANSLATE_Y].toFixed(1)}px,
              0
            )
          `,
          "z-index": this._rendererState[CSS2DObjectStateIndices.Z_INDEX],
        }}
      >
        {this.t(this._currentLabel)}
      </div>
    );
  }
}
