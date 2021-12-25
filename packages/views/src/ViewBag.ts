import { dispose as fDispose } from "../../framework/src/dispose";
import { generateUUID } from "../../math/src/generateUUID";
import { mount as fMount } from "../../framework/src/mount";
import { pause as fPause } from "../../framework/src/pause";
import { preload as fPreload } from "../../framework/src/preload";
import { unmount as fUnmount } from "../../framework/src/unmount";
import { unpause as fUnpause } from "../../framework/src/unpause";

import type { Logger } from "loglevel";

import type { TickTimerState } from "../../framework/src/TickTimerState.type";

import type { View } from "./View.interface";
import type { ViewBag as IViewBag } from "./ViewBag.interface";
import type { ViewBagState } from "./ViewBagState.type";

export function ViewBag(logger: Logger): IViewBag {
  const state: ViewBagState = Object.seal({
    isDisposed: false,
    isMounted: false,
    isPaused: false,
    isPreloaded: false,
    isPreloading: false,
    needsUpdates: true,
  });

  const views: Set<View> = new Set();

  const _updatableViews: Set<View> = new Set();
  let _view: null | View = null;

  function dispose(): void {
    views.forEach(_disposeView);

    // Clear views references so they can be garbage collected.
    views.clear();
    _updatableViews.clear();

    state.isDisposed = true;
  }

  function mount(): void {
    views.forEach(_mountView);
    state.isMounted = true;
  }

  function pause(): void {
    state.isPaused = true;
    views.forEach(_pauseView);
  }

  function preload(): void {
    views.forEach(_preloadView);
    updatePreloadingState();
  }

  function unmount(): void {
    views.forEach(_unmountView);
    state.isMounted = false;
  }

  function unpause(): void {
    state.isPaused = false;
    views.forEach(_unpauseView);
  }

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    for (_view of _updatableViews) {
      if (_view.state.needsUpdates) {
        _view.update(delta, elapsedTime, tickTimerState);
      } else {
        _updatableViews.delete(_view);
      }
    }
  }

  function updatePreloadingState(): void {
    for (_view of views) {
      if (_view.state.isPreloading) {
        state.isPreloading = true;
        return;
      }

      if (!_view.state.isPreloaded) {
        return;
      }
    }

    state.isPreloading = false;
    state.isPreloaded = true;
  }

  function _disposeView(view: View): void {
    fDispose(logger, view);
  }

  function _mountView(view: View): void {
    fMount(logger, view);
  }

  function _pauseView(view: View): void {
    fPause(logger, view);
  }

  function _preloadView(view: View): void {
    fPreload(logger, view);

    if (view.state.needsUpdates) {
      _updatableViews.add(view);
    }
  }

  function _unmountView(view: View): void {
    fUnmount(logger, view);
  }

  function _unpauseView(view: View): void {
    fUnpause(logger, view);
  }

  return Object.freeze({
    id: generateUUID(),
    isDisposable: true,
    isMountable: true,
    isPollablePreloading: true,
    isPreloadable: true,
    name: "ViewBag",
    state: state,
    views: views,

    dispose: dispose,
    mount: mount,
    pause: pause,
    preload: preload,
    unmount: unmount,
    unpause: unpause,
    update: update,
    updatePreloadingState: updatePreloadingState,
  });
}
