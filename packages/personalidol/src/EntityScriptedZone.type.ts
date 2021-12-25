import type { Brush } from "../../quakemaps/src/Brush.type";
import type { Geometry } from "../../quakemaps/src/Geometry.type";

import type { Entity } from "./Entity.type";

export type EntityScriptedZone = Geometry &
  Entity & {
    readonly brushes: Array<Brush>;
    readonly classname: "scripted_zone";
  };
