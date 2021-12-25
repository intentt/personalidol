import { createViewBuildingPlan } from "./createViewBuildingPlan";

import type { AnyEntity } from "../../personalidol/src/AnyEntity.type";
import type { Vector3Simple } from "../../quakemaps/src/Vector3Simple.type";
// import type { TargetOrTargetedEntity } from "../../personalidol/TargetOrTargetedEntity.type";

import type { ViewBuildingStep } from "./ViewBuildingStep.type";

const _entityOrigin: Vector3Simple = {
  x: 0,
  y: 0,
  z: 0,
};

const _entitiesFixture: ReadonlyArray<AnyEntity> = [
  {
    classname: "target",
    id: "2",
    origin: _entityOrigin,
    properties: {
      target: "foo_target",
      targetname: "bar_target",
    },
    transferables: [],
  },
  {
    classname: "target",
    id: "1",
    origin: _entityOrigin,
    properties: {
      targetname: "foo_target",
    },
    transferables: [],
  },
  {
    classname: "target",
    id: "5",
    origin: _entityOrigin,
    properties: {},
    transferables: [],
  },
  {
    classname: "target",
    id: "4",
    origin: _entityOrigin,
    properties: {
      target: "bar_target",
    },
    transferables: [],
  },
  {
    classname: "target",
    id: "3",
    origin: _entityOrigin,
    properties: {
      target: "foo_target",
    },
    transferables: [],
  },
];

test("view building plan is created", function () {
  const plan: ReadonlyArray<ViewBuildingStep> = Array.from(createViewBuildingPlan(_entitiesFixture));

  // make sure that input array was not mutated

  expect(_entitiesFixture[0].id).toBe("2");
  expect(_entitiesFixture[1].id).toBe("1");
  expect(_entitiesFixture[2].id).toBe("5");
  expect(_entitiesFixture[3].id).toBe("4");
  expect(_entitiesFixture[4].id).toBe("3");

  // see if plan is created correctly

  expect(plan[0].entity).toBe(_entitiesFixture[1]);
  expect(plan[0].targetedEntities).toHaveLength(0);

  expect(plan[1].entity).toBe(_entitiesFixture[0]);
  expect(plan[1].targetedEntities).toHaveLength(1);
  expect(plan[1].targetedEntities[0]).toBe(_entitiesFixture[1]);

  expect(plan[2].entity).toBe(_entitiesFixture[2]);
  expect(plan[2].targetedEntities).toHaveLength(0);

  expect(plan[3].entity).toBe(_entitiesFixture[3]);
  expect(plan[3].targetedEntities).toHaveLength(1);
  expect(plan[3].targetedEntities[0]).toBe(_entitiesFixture[0]);

  expect(plan[4].entity).toBe(_entitiesFixture[4]);
});
