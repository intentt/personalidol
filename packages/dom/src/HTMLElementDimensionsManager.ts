import { DimensionsIndices } from "../../framework/src/DimensionsIndices.enum";
import { generateUUID } from "../../math/src/generateUUID";

import type { ResizeableRenderer } from "../../three-modules/src/ResizeableRenderer.interface";

import type { HTMLElementDimensionsManager as IHTMLElementDimensionsManager } from "./HTMLElementDimensionsManager.interface";
import type { HTMLElementDimensionsManagerState } from "./HTMLElementDimensionsManagerState.type";

export function HTMLElementDimensionsManager(
  htmlElement: HTMLElement,
  dimensionsState: Uint32Array
): IHTMLElementDimensionsManager {
  const state: HTMLElementDimensionsManagerState = Object.seal({
    needsUpdates: true,
  });

  let _isStarted: boolean = false;
  let _dimensionsLastUpdate: number = -1;
  let _renderersLastUpdate: number = 0;

  function _updateRendererDimensions(renderer: ResizeableRenderer) {
    renderer.setSize(dimensionsState[DimensionsIndices.D_WIDTH], dimensionsState[DimensionsIndices.D_HEIGHT]);
  }

  function start(): void {
    if (_isStarted) {
      throw new Error("HTMLElementDimensionsManager is already started.");
    }

    _isStarted = true;
  }

  function stop(): void {
    if (!_isStarted) {
      throw new Error("HTMLElementDimensionsManager is already stopped.");
    }

    _isStarted = false;
  }

  function update(delta: number): void {
    if (!_isStarted) {
      return;
    }

    _dimensionsLastUpdate = dimensionsState[DimensionsIndices.LAST_UPDATE];

    if (_dimensionsLastUpdate > _renderersLastUpdate) {
      state.renderers.forEach(_updateRendererDimensions);
      _renderersLastUpdate = dimensionsState[DimensionsIndices.LAST_UPDATE];
    }
  }

  return Object.freeze({
    id: generateUUID(),
    name: "HTMLElementDimensionsManager",
    state: state,

    start: start,
    stop: stop,
    update: update,
  });
}
