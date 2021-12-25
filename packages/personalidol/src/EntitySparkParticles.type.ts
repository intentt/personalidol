import type { Vector3Simple } from "../../quakemaps/src/Vector3Simple.type";

import type { Entity } from "./Entity.type";

export type EntitySparkParticles = Entity & {
  readonly classname: "spark_particles";
  readonly origin: Vector3Simple;
};
