import type { Vector3Simple } from "@personalidol/quakemaps/src/Vector3Simple.type";

import type { Entity } from "./Entity.type";

export type EntityFBXModel = Entity & {
  readonly angle: number;
  readonly classname: "model_fbx";
  readonly model_filename: string;
  readonly model_name: string;
  readonly model_texture: null | string;
  readonly origin: Vector3Simple;
  readonly scale: number;
};
