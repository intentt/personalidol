import type { Vector3Simple } from "../../quakemaps/src/Vector3Simple.type";

import type { Entity } from "./Entity.type";

export type EntityLight = Entity & {
  readonly color: string;
  readonly decay: number;
  readonly intensity: number;
  readonly origin: Vector3Simple;
  readonly quality_map: number;
};
