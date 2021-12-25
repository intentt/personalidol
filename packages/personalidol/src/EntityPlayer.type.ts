import type { Vector3Simple } from "../../quakemaps/src/Vector3Simple.type";

import type { Entity } from "./Entity.type";

export type EntityPlayer = Entity & {
  readonly classname: "player";
  readonly origin: Vector3Simple;
};
