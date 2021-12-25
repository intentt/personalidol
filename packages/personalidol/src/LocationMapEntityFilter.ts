import type { Evaluator } from "../../expression-language/src/Evaluator.interface";

import type { AnyEntity } from "./AnyEntity.type";

export function LocationMapEntityFilter(evaluator: Evaluator) {
  async function filter(entities: ReadonlyArray<AnyEntity>): Promise<ReadonlyArray<AnyEntity>> {
    const filtered: Array<AnyEntity> = [];

    for (let entity of entities) {
      const expression: undefined | string = entity.properties.if;

      if ("string" !== typeof entity.properties.if) {
        filtered.push(entity);
        continue;
      }

      const result = await evaluator.evaluate(expression);

      if ("boolean" !== typeof result) {
        throw new Error(`Entity expression evaluated to ${typeof result} instead of boolean: "${expression}"`);
      }

      if (result) {
        filtered.push(entity);
      }
    }

    return filtered;
  }

  return Object.freeze({
    filter: filter,
  });
}
