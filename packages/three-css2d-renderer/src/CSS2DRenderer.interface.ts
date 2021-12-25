import type { Camera } from "three/src/cameras/Camera";
import type { Scene } from "three/src/scenes/Scene";

import type { ResizeableRenderer } from "../../framework/src/ResizeableRenderer.interface";

import type { CSS2DRendererInfo } from "./CSS2DRendererInfo.type";

export interface CSS2DRenderer extends ResizeableRenderer {
  readonly info: CSS2DRendererInfo;

  render(scene: Scene, camera: Camera, updateMatrices: boolean): void;
}
