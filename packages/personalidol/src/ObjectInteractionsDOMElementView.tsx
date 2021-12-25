import { Fragment, h } from "preact";

import { CSS2DObjectState } from "../../three-css2d-renderer/src/CSS2DObjectState";
import { CSS2DObjectStateIndices } from "../../three-css2d-renderer/src/CSS2DObjectStateIndices.enum";
import { DOMElementView } from "../../dom-renderer/src/DOMElementView";
import { isSharedArrayBuffer } from "../../framework/src/isSharedArrayBuffer";

import { DOMZIndex } from "./DOMZIndex.enum";

import type { DOMElementProps } from "../../dom-renderer/src/DOMElementProps.type";
import type { TickTimerState } from "../../framework/src/TickTimerState.type";

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
    background-color: rgba(255, 255, 255, 0.8);
    color: #111;
    cursor: pointer;
    display: grid;
    font-family: Karla, sans-serif;
    font-size: 1rem;
    left: 0;
    list-style-type: none;
    margin: 0;
    min-width: 100px;
    padding: 0;
    perspective: 1000px;
    perspective-origin: 50% 50%;
    position: absolute;
    top: 0;
    will-change: opacity, transform, z-index;
  }

  #interactions:before {
    content: "";
    width: 0;
    height: 0;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-right: 10px solid rgba(255, 255, 255, 0.8);
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateX(-100%) translateY(-50%);
  }

  .interaction {
    padding: 0.75rem 1.5rem;
  }

  .interaction:hover {
    background-color: white;
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
              translate3D(50px, -50%, 0)
              translate3D(
                ${this._rendererState[CSS2DObjectStateIndices.TRANSLATE_X].toFixed(1)}px,
                ${this._rendererState[CSS2DObjectStateIndices.TRANSLATE_Y].toFixed(1)}px,
                0
              )
              rotateX(15deg)
              rotateY(25deg)
            `,
            "z-index": DOMZIndex.InGameObjectLabel,
          }}
        >
          <li class="interaction">{this.t("interactions:talk")}</li>
          <li class="interaction">{this.t("interactions:barter")}</li>
        </ol>
      </Fragment>
    );
  }
}
