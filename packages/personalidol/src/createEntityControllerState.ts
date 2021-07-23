import type { EntityControllerState } from "./EntityControllerState.type";

export function createEntityControllerState(
  entityControllerState: Partial<EntityControllerState> = {}
): EntityControllerState {
  return Object.seal(
    Object.assign(
      {
        isDisposed: false,
        isMounted: false,
        isPaused: false,
        isPreloaded: false,
        isPreloading: false,
        needsUpdates: false,
      },
      entityControllerState
    )
  );
}
