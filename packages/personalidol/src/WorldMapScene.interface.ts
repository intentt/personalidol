import type { PollablePreloading } from "../../framework/src/PollablePreloading.interface";
import type { Scene } from "../../framework/src/Scene.interface";

export interface WorldMapScene extends PollablePreloading, Scene {
  readonly currentMap: string;
  readonly isLocationMapScene: true;
}
