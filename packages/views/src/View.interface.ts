import type { Object3D } from "three/src/core/Object3D";

import type { Disposable } from "@personalidol/framework/src/Disposable.interface";
import type { MainLoopUpdatable } from "@personalidol/framework/src/MainLoopUpdatable.interface";
import type { Mountable } from "@personalidol/framework/src/Mountable.interface";
import type { Pauseable } from "@personalidol/framework/src/Pauseable.interface";
import type { Preloadable } from "@personalidol/framework/src/Preloadable.interface";
import type { Raycastable } from "@personalidol/input/src/Raycastable.interface";

import type { Interactable } from "./Interactable.interface";
import type { ViewState } from "./ViewState.type";

export interface View
  extends Disposable,
    Interactable,
    MainLoopUpdatable,
    Mountable,
    Pauseable,
    Preloadable,
    Raycastable {
  readonly isView: true;
  readonly object3D: Object3D;
  readonly state: ViewState;
}
