import type { LoadingManager as ILoadingManager } from "./LoadingManager.interface";
import type { LoadingManagerItem } from "./LoadingManagerItem.type";
import type { LoadingManagerProgress } from "./LoadingManagerProgress.type";
import type { LoadingManagerState } from "./LoadingManagerState.type";

function sumWeights(items: Set<LoadingManagerItem>): number {
  let _sum = 0;

  for (let item of items) {
    _sum += item.weight;
  }

  return _sum;
}

export function LoadingManager(loadingManagerState: LoadingManagerState): ILoadingManager {
  const _previousProgress = Object.seal({
    comment: loadingManagerState.comment,
    progress: loadingManagerState.progress,
  });

  function getProgress(): LoadingManagerProgress {
    return _previousProgress;
  }

  function refreshProgress() {
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

    for (let itemToLoad of loadingManagerState.itemsToLoad) {
      if (!loadingManagerState.itemsLoaded.has(itemToLoad)) {
        loadingManagerState.comment = itemToLoad.comment;
        break;
      }
    }

    loadingManagerState.progress = Math.max(loadingManagerState.progress, itemsLoadedWeights / totalWeights);

    if (_previousProgress.comment === loadingManagerState.comment && _previousProgress.progress === loadingManagerState.progress) {
      return;
    }

    _previousProgress.comment = loadingManagerState.comment;
    _previousProgress.progress = loadingManagerState.progress;

    loadingManagerState.lastUpdate += 1;
  }

  function reset() {
    loadingManagerState.comment = "";
    loadingManagerState.expectsAtLeast = 0;
    loadingManagerState.itemsLoaded.clear();
    loadingManagerState.itemsToLoad.clear();
    loadingManagerState.lastUpdate += 1;
    loadingManagerState.progress = 0;

    _previousProgress.comment = "";
    _previousProgress.progress = 0;
  }

  function start() {}

  function stop() {}

  return Object.freeze({
    name: "LoadingManager",

    getProgress: getProgress,
    refreshProgress: refreshProgress,
    reset: reset,
    start: start,
    stop: stop,
    update: refreshProgress,
  });
}
