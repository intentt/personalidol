import type { Interactable } from "./Interactable.interface";
import type { View } from "./View.interface";

export function isInteractable(view: View): view is View & Interactable {
  return true === (view as Interactable).isInteractable;
}
