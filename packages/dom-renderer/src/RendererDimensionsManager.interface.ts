import type { MainLoopUpdatable } from "../../framework/src/MainLoopUpdatable.interface";

export interface RendererDimensionsManager extends MainLoopUpdatable {
  readonly isRendererDimensionsManager: true;
}
