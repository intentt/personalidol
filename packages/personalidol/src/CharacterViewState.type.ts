import type { EntityViewState } from "./EntityViewState.type";

export type CharacterViewState = EntityViewState & {
  animation: "jump" | "run" | "stand";
};
