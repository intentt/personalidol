import type { Vector3Simple } from "../../quakemaps/src/Vector3Simple.type";

export interface RigidBodyRemoteHandle {
  applyCentralForce(vector3: Vector3Simple): void;

  applyCentralImpulse(vector3: Vector3Simple): void;

  setLinearVelocity(vector3: Vector3Simple): void;
}
