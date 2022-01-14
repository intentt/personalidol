import type { View } from "../../views/src/View.interface";

import type { AnyEntity } from "./AnyEntity.type";
import type { EntityView } from "./EntityView.interface";

export function isEntityView(view: View): view is EntityView<AnyEntity> {
  return (view as EntityView<AnyEntity>).isEntityView;
}
