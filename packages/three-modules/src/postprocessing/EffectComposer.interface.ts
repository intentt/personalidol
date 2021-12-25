import type { DisposableGeneric } from "../../../framework/src/DisposableGeneric.interface";
import type { ResizeableRenderer } from "../../../framework/src/ResizeableRenderer.interface";

import type { Pass } from "./Pass.interface";

export interface EffectComposer extends DisposableGeneric, ResizeableRenderer {
  addPass(pass: Pass): void;

  isLastEnabledPass(passIndex: number): boolean;

  removePass(pass: Pass): void;

  render(deltaTime: number): void;

  setPixelRatio(pixelRatio: number): void;

  swapBuffers(): void;
}
