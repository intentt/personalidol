import { DimensionsIndices } from "../../framework/src/DimensionsIndices.enum";
import { generateUUID } from "../../math/src/generateUUID";

import type { MainLoopUpdatableState } from "../../framework/src/MainLoopUpdatableState.type";
import type { ResizeableRenderer } from "../../framework/src/ResizeableRenderer.interface";

import type { RendererDimensionsManager as IRendererDimensionsManager } from "./RendererDimensionsManager.interface";

export function RendererDimensionsManager(
  dimensionsState: Uint32Array,
  renderer: ResizeableRenderer,
  updateStyles: boolean
): IRendererDimensionsManager {
  const state: MainLoopUpdatableState = Object.seal({
    needsUpdates: true,
  });

  let _dimensionsLastUpdate: number = -1;
  let _rendererLastUpdate: number = 0;

  function update(delta: number): void {
    _dimensionsLastUpdate = dimensionsState[DimensionsIndices.LAST_UPDATE];

    if (_dimensionsLastUpdate > _rendererLastUpdate) {
      renderer.setSize(
        dimensionsState[DimensionsIndices.D_WIDTH],
        dimensionsState[DimensionsIndices.D_HEIGHT],
        updateStyles
      );
      _rendererLastUpdate = dimensionsState[DimensionsIndices.LAST_UPDATE];
    }
  }

  return Object.freeze({
    id: generateUUID(),
    isRendererDimensionsManager: true,
    name: "RendererDimensionsManager",
    state: state,

    update: update,
  });
}
