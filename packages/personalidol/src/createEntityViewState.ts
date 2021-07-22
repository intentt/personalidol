import { createViewState } from "@personalidol/views/src/createViewState";

import type { EntityViewState } from "./EntityViewState.type";

export function createEntityViewState(entityViewState: Partial<EntityViewState> = {}): EntityViewState {
  return Object.seal(
    Object.assign(
      {},
      createViewState(),
      {
        isObscuring: false,
      },
      entityViewState
    )
  );
}
