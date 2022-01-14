import { name } from "../../framework/src/name";

import { isTargeting } from "./isTargeting";
import { createViewBuildingPlan } from "./createViewBuildingPlan";
import { LocationMapEntityFilter } from "./LocationMapEntityFilter";

import type { Logger } from "loglevel";
import type { Texture as ITexture } from "three/src/textures/Texture";

import type { Evaluator } from "../../expression-language/src/Evaluator.interface";

import type { AnyEntity } from "./AnyEntity.type";
import type { EntityView } from "./EntityView.interface";
import type { EntityViewFactory } from "./EntityViewFactory.interface";
import type { GameState } from "./GameState.type";
import type { ViewBuildingStep } from "./ViewBuildingStep.type";

function _findTargetedViews(
  entityViews: WeakMap<AnyEntity, EntityView<AnyEntity>>,
  step: ViewBuildingStep
): Set<EntityView<AnyEntity>> {
  const entity: AnyEntity = step.entity;
  const targetedViews: Set<EntityView<AnyEntity>> = new Set();

  if (!isTargeting(entity)) {
    return targetedViews;
  }

  for (let targetedEntity of step.targetedEntities) {
    const targetedView: undefined | EntityView<AnyEntity> = entityViews.get(targetedEntity);

    if (!targetedView) {
      throw new Error(
        `Targeted entity view was expected to be ready before constructing "${entity.classname}": "${targetedEntity.classname}"`
      );
    }

    targetedViews.add(targetedView);
  }

  return targetedViews;
}

export async function* buildViews(
  logger: Logger,
  gameState: GameState,
  entityViewFactory: EntityViewFactory,
  evaluator: Evaluator,
  worldspawnTexture: ITexture,
  entities: ReadonlyArray<AnyEntity>
): AsyncGenerator<EntityView<AnyEntity>> {
  const entityViews: WeakMap<AnyEntity, EntityView<AnyEntity>> = new WeakMap();
  const filteredEntities: ReadonlyArray<AnyEntity> = await LocationMapEntityFilter(evaluator).filter(entities);

  for await (let step of createViewBuildingPlan(filteredEntities)) {
    const targetedViews = _findTargetedViews(entityViews, step);
    const entityView = entityViewFactory.create(step.entity, targetedViews, worldspawnTexture);

    // Some sanity checks for entity views.
    if (entityView.isExpectingTargets && targetedViews.size < 1) {
      throw new Error(`Entity view is expecting targets: "${name(entityView)}"`);
    }

    if (!entityView.isExpectingTargets && targetedViews.size > 0) {
      throw new Error(`Entity view is not expecting targets: "${name(entityView)}"`);
    }

    entityViews.set(step.entity, entityView);

    yield entityView;
  }
}
