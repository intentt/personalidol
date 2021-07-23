import { Fragment, h } from "preact";

import { CSS2DObjectState } from "@personalidol/three-css2d-renderer/src/CSS2DObjectState";
import { CSS2DObjectStateIndices } from "@personalidol/three-css2d-renderer/src/CSS2DObjectStateIndices.enum";
import { DOMElementView } from "@personalidol/dom-renderer/src/DOMElementView";
import { isSharedArrayBuffer } from "@personalidol/framework/src/isSharedArrayBuffer";

import type { DOMElementProps } from "@personalidol/dom-renderer/src/DOMElementProps.type";
import type { TickTimerState } from "@personalidol/framework/src/TickTimerState.type";

import type { DOMElementViewContext } from "./DOMElementViewContext.type";

const _css = `
  :host {
    all: initial;
  }

  *, * * {
    box-sizing: border-box;
  }

  #interactions {
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    backface-visibility: hidden;
    background-color: rgba(0, 0, 0, 0.8);
    color: #eee;
    cursor: pointer;
    display: grid;
    font-family: Karla, sans-serif;
    font-size: 1rem;
    grid-row-gap: 0.5rem;
    left: 0;
    margin: 0;
    min-width: 100px;
    padding: 0.5rem 1rem 0.5rem 1.5rem;
    position: absolute;
    top: 0;
    will-change: opacity, transform, z-index;
  }
`;

export class ObjectInteractionsDOMElementView extends DOMElementView<DOMElementViewContext> {
  public static css: string = _css;

  public _rendererState: Float32Array = CSS2DObjectState.createEmptyState(false);

  private _lastRenderedState: number = -1;
  private _lastRenderedProps: number = -1;
  private _receivedSharedArrayBuffer: boolean = false;

  set objectProps(objectProps: DOMElementProps) {
    this.needsRender = this._lastRenderedProps < objectProps.version;
  }

  set rendererState(rendererState: Float32Array | SharedArrayBuffer) {
    if (isSharedArrayBuffer(rendererState)) {
      if (this._receivedSharedArrayBuffer) {
        throw new Error("ObjectInteractionsDOMElementView already received shared array buffer from CSS2DRenderer.");
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

  render(delta: number) {
    this._lastRenderedState = this._rendererState[CSS2DObjectStateIndices.VERSION];

    if (!this._rendererState[CSS2DObjectStateIndices.VISIBLE]) {
      return null;
    }

    return (
      <Fragment>
        <ol
          id="interactions"
          style={{
            transform: `
              translate3D(50px, 0, 0)
              translate3D(
                ${this._rendererState[CSS2DObjectStateIndices.TRANSLATE_X].toFixed(1)}px,
                ${this._rendererState[CSS2DObjectStateIndices.TRANSLATE_Y].toFixed(1)}px,
                0
              )
            `,
            "z-index": this._rendererState[CSS2DObjectStateIndices.Z_INDEX],
          }}
        >
          <li>Talk</li>
          <li>Barter</li>
        </ol>
      </Fragment>
    );
  }
}
