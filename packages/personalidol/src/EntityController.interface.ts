import type { Disposable } from "../../framework/src/Disposable.interface";
import type { MainLoopUpdatable } from "../../framework/src/MainLoopUpdatable.interface";
import type { Mountable } from "../../framework/src/Mountable.interface";
import type { Pauseable } from "../../framework/src/Pauseable.interface";
import type { Preloadable } from "../../framework/src/Preloadable.interface";

import type { AnyEntity } from "./AnyEntity.type";
import type { EntityControllerState } from "./EntityControllerState.type";
import type { EntityView } from "./EntityView.interface";

export interface EntityController<E extends AnyEntity>
  extends Disposable,
    MainLoopUpdatable,
    Mountable,
    Pauseable,
    Preloadable {
  readonly state: EntityControllerState;
  readonly view: EntityView<E>;
  readonly isEntityController: true;
}
