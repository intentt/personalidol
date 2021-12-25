import type { Disposable } from "../../framework/src/Disposable.interface";
import type { MainLoopUpdatable } from "../../framework/src/MainLoopUpdatable.interface";
import type { Mountable } from "../../framework/src/Mountable.interface";
import type { Pauseable } from "../../framework/src/Pauseable.interface";
import type { PollablePreloading } from "../../framework/src/PollablePreloading.interface";
import type { Preloadable } from "../../framework/src/Preloadable.interface";

import type { AnyEntity } from "./AnyEntity.type";
import type { EntityController } from "./EntityController.interface";
import type { EntityControllerBagState } from "./EntityControllerBagState.type";

export interface EntityControllerBag
  extends Disposable,
    MainLoopUpdatable,
    Mountable,
    Pauseable,
    PollablePreloading,
    Preloadable {
  readonly entityControllers: Set<EntityController<AnyEntity>>;
  readonly state: EntityControllerBagState;
}
