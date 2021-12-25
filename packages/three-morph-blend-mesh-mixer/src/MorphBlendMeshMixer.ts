import { MorphBlendMeshTransition } from "./MorphBlendMeshTransition";

import type { MorphBlendMesh } from "../../three-modules/src/misc/MorphBlendMesh.interface";
import type { TickTimerState } from "../../framework/src/TickTimerState.type";

import type { MorphBlendMeshMixer as IMorphBlendMeshMixer } from "./MorphBlendMeshMixer.interface";
import type { MorphBlendMeshMixerState } from "./MorphBlendMeshMixerState.type";
import type { MorphBlendMeshTransition as IMorphBlendMeshTransition } from "./MorphBlendMeshTransition.interface";

export function MorphBlendMeshMixer(mesh: MorphBlendMesh): IMorphBlendMeshMixer {
  const state: MorphBlendMeshMixerState = Object.seal({
    needsUpdates: true,
  });

  let _transition: null | IMorphBlendMeshTransition = null;

  function setAnimation(animationName: string): void {
    if (!_transition) {
      _transition = MorphBlendMeshTransition(mesh, animationName, animationName);

      return;
    }

    _transition = _transition.transitionTo(animationName);
  }

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    if (!_transition) {
      return;
    }

    _transition.update(delta, elapsedTime, tickTimerState);
  }

  return Object.freeze({
    state: state,

    setAnimation: setAnimation,
    update: update,
  });
}
