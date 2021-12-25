import type { Mesh } from "three/src/objects/Mesh";

import type { MainLoopUpdatable } from "../../../framework/src/MainLoopUpdatable.interface";

import type { MorphBlendMeshAnimation } from "./MorphBlendMeshAnimation.type";

export interface MorphBlendMesh extends MainLoopUpdatable, Mesh {
  animationsList: Array<MorphBlendMeshAnimation>;

  autoCreateAnimations(fps: number): void;

  playAnimation(name: string): void;

  setAnimationDirectionBackward(name: string): void;

  setAnimationDirectionForward(name: string): void;

  setAnimationWeight(name: string, weight: number): void;

  setAnimationTime(name: string, time: number): void;

  stopAnimation(name: string): void;
}
