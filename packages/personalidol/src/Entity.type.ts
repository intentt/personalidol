import type { EntityProperties } from "../../quakemaps/src/EntityProperties.type";

export type Entity = {
  readonly id: string;
  readonly classname: string;
  readonly properties: EntityProperties;
  readonly transferables: Array<Transferable>;
};
