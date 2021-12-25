import type { WebGLRenderer } from "three/src/renderers/WebGLRenderer";
import type { WebGLRenderTarget } from "three/src/renderers/WebGLRenderTarget";

import type { Pass as IPass } from "./Pass.interface";

export abstract class Pass implements IPass {
  readonly clearMask: boolean = false;
  readonly mask: boolean = false;
  readonly needsSwap: boolean = true;

  enabled: boolean = true;
  clear: boolean = false;

  abstract dispose(): void;

  abstract render(
    renderer: WebGLRenderer,
    renderToScreen: boolean,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget,
    deltaTime: number,
    maskActive: boolean
  ): void;

  setSize(width: number, height: number): void {}
}
