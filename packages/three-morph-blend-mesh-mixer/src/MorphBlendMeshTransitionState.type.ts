import type { MainLoopUpdatableState } from "../../framework/src/MainLoopUpdatableState.type";

export type MorphBlendMeshTransitionState = MainLoopUpdatableState & {
  currentAnimation: string;
  targetAnimation: string;
};
