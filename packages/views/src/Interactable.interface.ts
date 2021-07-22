import type { Object3D } from "three/src/core/Object3D";

import type { InteractableState } from "./InteractableState.type";

export interface Interactable {
  readonly interactableObject3D: Object3D;
  readonly isInteractable: true;
  readonly state: InteractableState;
}
