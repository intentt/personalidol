import { Pass } from "./Pass";

import type { Camera } from "three/src/cameras/Camera";
import type { Scene } from "three/src/scenes/Scene";
import type { WebGLRenderer } from "three/src/renderers/WebGLRenderer";
import type { WebGLRenderTarget } from "three/src/renderers/WebGLRenderTarget";

export class MaskPass extends Pass {
  readonly clear: true = true;
  readonly mask: true = true;
  readonly needsSwap: false = false;

  camera: Camera;
  inverse: boolean = false;
  scene: Scene;

  constructor(scene: Scene, camera: Camera) {
    super();

    this.scene = scene;
    this.camera = camera;
  }

  dispose() {}

  render(
    renderer: WebGLRenderer,
    renderToScreen: boolean,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget
  ) {
    const context = renderer.getContext();
    const state = renderer.state;

    // don't update color or depth

    state.buffers.color.setMask(false);
    state.buffers.depth.setMask(false);

    // lock buffers

    state.buffers.color.setLocked(true);
    state.buffers.depth.setLocked(true);

    // set up stencil

    let writeValue, clearValue;

    if (this.inverse) {
      writeValue = 0;
      clearValue = 1;
    } else {
      writeValue = 1;
      clearValue = 0;
    }

    state.buffers.stencil.setTest(true);
    state.buffers.stencil.setOp(context.REPLACE, context.REPLACE, context.REPLACE);
    state.buffers.stencil.setFunc(context.ALWAYS, writeValue, 0xffffffff);
    state.buffers.stencil.setClear(clearValue);
    state.buffers.stencil.setLocked(true);

    // draw into the stencil buffer

    renderer.setRenderTarget(readBuffer);
    if (this.clear) renderer.clear();
    renderer.render(this.scene, this.camera);

    renderer.setRenderTarget(writeBuffer);
    if (this.clear) renderer.clear();
    renderer.render(this.scene, this.camera);

    // unlock color and depth buffer for subsequent rendering

    state.buffers.color.setLocked(false);
    state.buffers.depth.setLocked(false);

    // only render where stencil is set to 1

    state.buffers.stencil.setLocked(false);
    state.buffers.stencil.setFunc(context.EQUAL, 1, 0xffffffff); // draw if == 1
    state.buffers.stencil.setOp(context.KEEP, context.KEEP, context.KEEP);
    state.buffers.stencil.setLocked(true);
  }
}
