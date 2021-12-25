import type { Vector3Simple } from "../../quakemaps/src/Vector3Simple.type";

import type { RigidBodyRemoteHandle as IRigidBodyRemoteHandle } from "./RigidBodyRemoteHandle.interface";

export function RigidBodyRemoteHandle(internalDynamicsMessagePort: MessagePort): IRigidBodyRemoteHandle {
  function applyCentralForce(vector3: Vector3Simple): void {
    internalDynamicsMessagePort.postMessage({
      applyCentralForce: {
        x: vector3.x,
        y: vector3.y,
        z: vector3.z,
      },
    });
  }

  function applyCentralImpulse(vector3: Vector3Simple): void {
    internalDynamicsMessagePort.postMessage({
      applyCentralImpulse: {
        x: vector3.x,
        y: vector3.y,
        z: vector3.z,
      },
    });
  }

  function setLinearVelocity(vector3: Vector3Simple): void {
    internalDynamicsMessagePort.postMessage({
      setLinearVelocity: {
        x: vector3.x,
        y: vector3.y,
        z: vector3.z,
      },
    });
  }

  return Object.freeze({
    applyCentralForce: applyCentralForce,
    applyCentralImpulse: applyCentralImpulse,
    setLinearVelocity: setLinearVelocity,
  });
}
