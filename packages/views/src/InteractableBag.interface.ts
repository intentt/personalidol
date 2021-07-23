import type { Interactable } from "./Interactable.interface";

export interface InteractableBag {
  readonly interactables: Set<Interactable>;
}
