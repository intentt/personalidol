import type { Logger } from "loglevel";

import type { Interactable } from "./Interactable.interface";
import type { InteractableBag as IInteractableBag } from "./InteractableBag.interface";

export function InteractableBag(logger: Logger): IInteractableBag {
  const interactables: Set<Interactable> = new Set();

  return Object.freeze({
    interactables: interactables,
  });
}
