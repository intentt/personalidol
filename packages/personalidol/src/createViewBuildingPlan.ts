import toposort from "toposort";

import { isTarget } from "./isTarget";
import { isTargetedBy } from "./isTargetedBy";
import { isTargeting } from "./isTargeting";

import type { AnyEntity } from "./AnyEntity.type";
import type { TargetedEntity } from "./TargetedEntity.type";
import type { TargetingEntity } from "./TargetingEntity.type";
import type { ViewBuildingStep } from "./ViewBuildingStep.type";

function _findTargetedEntitiesByEntity(
  targetedEntitiesCache: WeakMap<TargetingEntity, ReadonlyArray<TargetedEntity>>,
  targetedEntities: ReadonlyArray<TargetedEntity>,
  targeting: TargetingEntity
): ReadonlyArray<TargetedEntity> {
  const cached: undefined | ReadonlyArray<TargetedEntity> = targetedEntitiesCache.get(targeting);

  if (Array.isArray(cached)) {
    return cached;
  }

  const ret: Array<TargetedEntity> = [];

  for (let targetedEntity of targetedEntities) {
    if (isTargetedBy(targetedEntity, targeting)) {
      ret.push(targetedEntity);
    }
  }

  targetedEntitiesCache.set(targeting, ret);

  return ret;
}

export function* createViewBuildingPlan(entities: ReadonlyArray<AnyEntity>): Generator<ViewBuildingStep> {
  const targetedEntities: ReadonlyArray<TargetedEntity> = entities.filter(isTarget);
  const targetedEntitiesCache: WeakMap<TargetingEntity, ReadonlyArray<TargetedEntity>> = new WeakMap();
  const dependencies: Array<[TargetedEntity, TargetingEntity]> = [];

  for (let entity of entities) {
    if (isTargeting(entity)) {
      for (let targetedEntity of _findTargetedEntitiesByEntity(targetedEntitiesCache, targetedEntities, entity)) {
        dependencies.push([targetedEntity, entity]);
      }
    }
  }

  for (let entity of toposort.array<AnyEntity>(entities, dependencies)) {
    if (isTargeting(entity)) {
      yield {
        entity: entity,
        targetedEntities: _findTargetedEntitiesByEntity(targetedEntitiesCache, targetedEntities, entity),
      };
    } else {
      yield {
        entity: entity,
        targetedEntities: [],
      };
    }
  }
}
