import type { Interactable } from "./Interactable.interface";
import type { View } from "./View.interface";

export function isInteractable(view: View): view is Interactable {
  return true === (view as Interactable).isInteractable;
}
