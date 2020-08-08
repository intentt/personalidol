import type { LoadingManager as ILoadingManager } from "./LoadingManager.interface";
import type { LoadingManagerState } from "./LoadingManagerState.type";
import type { LoadinManagerItem } from "./LoadinManagerItem.type";

function sumWeights(items: Set<LoadinManagerItem>): number {
  let _sum = 0;

  for (let item of items) {
    _sum += item.weight;
  }

  return _sum;
}

export function LoadingManager(loadingManagerState: LoadingManagerState): ILoadingManager {
  function start() {}

  function stop() {}

  function update() {
    const itemsToLoadWeights = sumWeights(loadingManagerState.itemsToLoad);
    const totalWeights = Math.max(loadingManagerState.expectsAtLeast, itemsToLoadWeights);

    if (totalWeights < 1) {
      return;
    }

    const itemsLoadedWeights = sumWeights(loadingManagerState.itemsLoaded);

    if (itemsLoadedWeights > itemsToLoadWeights) {
      throw new Error("There are more items loaded than items that are pending to load.");
    }

    loadingManagerState.comment = "";

    const comments = [];

    for (let itemToLoad of loadingManagerState.itemsToLoad) {
      if (!loadingManagerState.itemsLoaded.has(itemToLoad)) {
        loadingManagerState.comment = itemToLoad.comment;
        break;
      }
    }

    loadingManagerState.progress = Math.max(loadingManagerState.progress, itemsLoadedWeights / totalWeights);
  }

  return Object.freeze({
    start: start,
    stop: stop,
    update: update,
  });
}
