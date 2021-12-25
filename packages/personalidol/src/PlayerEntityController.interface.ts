import type { PollablePreloading } from "../../framework/src/PollablePreloading.interface";

import type { EntityController } from "./EntityController.interface";
import type { EntityPlayer } from "./EntityPlayer.type";

export interface PlayerEntityController extends EntityController<EntityPlayer>, PollablePreloading {}
