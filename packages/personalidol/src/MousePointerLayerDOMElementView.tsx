import { h } from "preact";

import { DOMElementView } from "../../dom-renderer/src/DOMElementView";
import { MouseIndices } from "../../input/src/MouseIndices.enum";
import { TouchIndices } from "../../input/src/TouchIndices.enum";

import type { DOMElementViewContext } from "./DOMElementViewContext.type";

const _css = `
  :host {
    pointer-events: none;
  }

  :host {
    all: initial;
  }

  *, * * {
    box-sizing: border-box;
  }

  .mouse-pointer-decoration {
    // background-color: red;
    // display: block;
    // height: 10px;
    // left: 0;
    // pointer-events: none;
    // position: absolute;
    // top: 0;
    // transform:
    //   translate3D(-50%, -50%, 0)
    //   translate3D(var(--translate-x), var(--translate-y), 0)
    // ;
    // width: 10px;
  }
`;

export class MousePointerLayerDOMElementView extends DOMElementView<DOMElementViewContext> {
  public static css: string = _css;

  beforeRender(): void {
    this.needsRender = true;
  }

  render() {
    if (this.context.mouseState[MouseIndices.M_LAST_USED] < this.context.touchState[TouchIndices.T_LAST_USED]) {
      return null;
    }

    if (!this.context.mouseState[MouseIndices.M_IN_BOUNDS]) {
      return null;
    }

    return (
      <div
        class="mouse-pointer-decoration"
        style={{
          "--translate-x": `${this.context.mouseState[MouseIndices.M_RELATIVE_X]}px`,
          "--translate-y": `${this.context.mouseState[MouseIndices.M_RELATIVE_Y]}px`,
        }}
      ></div>
    );
  }
}
