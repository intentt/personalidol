import { Query } from "src/framework/interfaces/Query";

export interface QueryBuilder<T extends string, U extends Query<any>> {
  build(ref: T): Promise<U>;
}