import type { ViewState } from "./ViewState.type";

export function createViewState(viewState: Partial<ViewState> = {}): ViewState {
  return Object.seal(
    Object.assign(
      {
        isDisposed: false,
        isInteracting: false,
        isMounted: false,
        isPaused: false,
        isPreloaded: false,
        isPreloading: false,
        isRayIntersecting: false,
        needsInteractions: false,
        needsRaycast: false,
        needsUpdates: false,
      },
      viewState
    )
  );
}
