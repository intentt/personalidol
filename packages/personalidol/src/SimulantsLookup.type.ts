import type { Simulant } from "../../dynamics/src/Simulant.interface";
import type { SimulantsLookup as BaseSimulantsLookup } from "../../dynamics/src/SimulantsLookup.type";

export type SimulantsLookup = BaseSimulantsLookup & {
  npc: Simulant;
  "worldspawn-geoemetry": Simulant;
};
