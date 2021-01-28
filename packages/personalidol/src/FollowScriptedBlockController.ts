import { MathUtils } from "three/src/math/MathUtils";
import { Vector3 } from "three/src/math/Vector3";

import type { Vector3 as IVector3 } from "three/src/math/Vector3";

import type { View } from "@personalidol/framework/src/View.interface";

import type { ScriptedBlockController } from "./ScriptedBlockController.interface";
import type { WorldspawnGeometryView } from "./WorldspawnGeometryView.interface";

export function FollowScriptedBlockController(blockView: WorldspawnGeometryView, targetedViews: Set<View>): ScriptedBlockController {
  if (targetedViews.size > 1) {
    throw new Error(`Can follow more than one target. Got: "${targetedViews.size}"`);
  }

  const _direction: IVector3 = new Vector3();
  let _followed: null | View = null;
  let _velocity: number = 100;

  for (let view of targetedViews) {
    _followed = view;
  }

  function update(delta: number) {
    if (!_followed) {
      throw new Error("Target supposed to be followed does not exist.");
    }

    const _frameDistance: number = _velocity * delta;

    _direction.subVectors(_followed.object3D.position, blockView.object3D.position);

    if (_direction.length() > _frameDistance) {
      _direction.normalize().multiplyScalar(_frameDistance);
      blockView.object3D.position.add(_direction);
    } else {
      blockView.object3D.position.copy(_followed.object3D.position);
    }
  }

  return Object.freeze({
    id: MathUtils.generateUUID(),
    name: "FollowScriptedBlockController",
    isExpectingTargets: true,
    isScriptedBlockController: true,
    needsUpdates: true,

    update: update,
  });
}