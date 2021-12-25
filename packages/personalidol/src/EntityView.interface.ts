import type { View } from "../../views/src/View.interface";

import type { AnyEntity } from "./AnyEntity.type";
import type { EntityViewState } from "./EntityViewState.type";

export interface EntityView<E extends AnyEntity> extends View {
  readonly state: EntityViewState;

  entity: E;
  isEntityView: true;
  isExpectingTargets: boolean;
}
