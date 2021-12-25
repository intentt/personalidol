import type { WebGLRenderer } from "three/src/renderers/WebGLRenderer";
import type { WebGLRenderTarget } from "three/src/renderers/WebGLRenderTarget";

import type { DisposableGeneric } from "../../../framework/src/DisposableGeneric.interface";

export interface Pass extends DisposableGeneric {
  // if set to true, the pass indicates to swap read and write buffer after
  // rendering
  readonly needsSwap: boolean;

  // if set to true, the pass clears its buffer before rendering
  readonly clear: boolean;

  readonly clearMask: boolean;

  readonly mask: boolean;

  // if set to true, the pass is processed by the composer
  enabled: boolean;

  render(
    renderer: WebGLRenderer,
    renderToScreen: boolean,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget,
    deltaTime: number,
    maskActive: boolean
  ): void;

  setSize(width: number, height: number): void;
}
