import type { Brush } from "../../quakemaps/src/Brush.type";
import type { Geometry } from "../../quakemaps/src/Geometry.type";

export type BuildGeometryAttributesCallback = (brushes: Array<Brush>) => Geometry;
