import type { Vector3Simple } from "../../quakemaps/src/Vector3Simple.type";

import type { Entity } from "./Entity.type";

export type EntityTarget = Entity & {
  readonly classname: "target";
  readonly origin: Vector3Simple;
};
