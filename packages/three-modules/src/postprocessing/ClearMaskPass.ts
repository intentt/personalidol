import { Pass } from "./Pass";

import type { WebGLRenderer } from "three/src/renderers/WebGLRenderer";

export class ClearMaskPass extends Pass {
  readonly clearMask: true = true;
  readonly needsSwap: false = false;

  dispose() {}

  render(renderer: WebGLRenderer) {
    renderer.state.buffers.stencil.setLocked(false);
    renderer.state.buffers.stencil.setTest(false);
  }
}
