import type { MainLoopUpdatable } from "../../framework/src/MainLoopUpdatable.interface";

import type { MorphBlendMeshMixerState } from "./MorphBlendMeshMixerState.type";

export interface MorphBlendMeshMixer extends MainLoopUpdatable {
  readonly state: MorphBlendMeshMixerState;

  setAnimation(name: string): void;
}
