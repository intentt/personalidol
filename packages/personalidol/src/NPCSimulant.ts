/// <reference types="@types/ammo.js" />

import { createRouter } from "../../framework/src/createRouter";
import { disposableAmmo } from "../../ammo/src/disposableAmmo";
import { disposeAll } from "../../framework/src/disposeAll";

import type { DisposableCallback } from "../../framework/src/DisposableCallback.type";
import type { MessageFeedbackSimulantPreloaded } from "../../dynamics/src/MessageFeedbackSimulantPreloaded.type";
import type { Simulant } from "../../dynamics/src/Simulant.interface";
import type { SimulantState } from "../../dynamics/src/SimulantState.type";
import type { TickTimerState } from "../../framework/src/TickTimerState.type";
import type { UserDataHandle } from "../../dynamics/src/UserDataHandle.interface";
import type { UserDataRegistry } from "../../dynamics/src/UserDataRegistry.interface";
import type { Vector3Simple } from "../../quakemaps/src/Vector3Simple.type";

import type { NPCEntity } from "./NPCEntity.type";
import type { SimulantsLookup } from "./SimulantsLookup.type";

const NPC_DIMENSIONS_BASE: number = 14;
const NPC_DIMENSIONS_HEIGHT: number = 20;
const NPC_MASS: number = 80;

export function NPCSimulant(
  id: string,
  ammo: typeof Ammo,
  dynamicsWorld: Ammo.btDiscreteDynamicsWorld,
  userDataRegistry: UserDataRegistry,
  simulantFeedbackMessagePort: MessagePort
): Simulant {
  const state: SimulantState = Object.seal({
    isDisposed: false,
    isMounted: false,
    isPaused: false,
    isPreloaded: false,
    isPreloading: false,
    needsUpdates: true,
  });

  const _disposables: Set<DisposableCallback> = new Set();
  const _transform: Ammo.btTransform = new ammo.btTransform();

  _disposables.add(disposableAmmo(ammo, _transform));

  const _userDataHandle: UserDataHandle = userDataRegistry.createHandleById(id);
  const _vector: Ammo.btVector3 = new ammo.btVector3(0, 0, 0);

  _disposables.add(disposableAmmo(ammo, _vector));

  let _npcRigidBody: null | Ammo.btRigidBody = null;
  let _transformOrigin: null | Ammo.btVector3 = null;

  const _simulantFeedbackMessageRouter = createRouter({
    applyCentralForce(force: Vector3Simple) {
      if (!_npcRigidBody) {
        throw new Error("NPC rigid body is not ready but received a central force");
      }

      _vector.setValue(force.x, force.y, force.z);

      _npcRigidBody.activate(true);
      _npcRigidBody.applyCentralForce(_vector);
    },

    applyCentralImpulse(impulse: Vector3Simple) {
      if (!_npcRigidBody) {
        throw new Error("NPC rigid body is not ready but received a central impulse");
      }

      _vector.setValue(impulse.x, impulse.y, impulse.z);

      _npcRigidBody.activate(true);
      _npcRigidBody.applyCentralImpulse(_vector);
    },

    setLinearVelocity(velocity: Vector3Simple) {
      if (!_npcRigidBody) {
        throw new Error("NPC rigid body is not ready but received a velocity");
      }

      const currentVelocity: Ammo.btVector3 = _npcRigidBody.getLinearVelocity();

      _vector.setValue(velocity.x, currentVelocity.y(), velocity.z);

      _npcRigidBody.activate(true);
      _npcRigidBody.setLinearVelocity(_vector);
    },

    entity(entity: NPCEntity) {
      _userDataHandle.data.set("entity", entity);

      const npcLocalInertia = new ammo.btVector3(0, 0, 0);

      _disposables.add(disposableAmmo(ammo, npcLocalInertia));

      const npcShape = new ammo.btCapsuleShape(NPC_DIMENSIONS_BASE, NPC_DIMENSIONS_HEIGHT);

      _disposables.add(disposableAmmo(ammo, npcShape));

      npcShape.calculateLocalInertia(NPC_MASS, npcLocalInertia);

      const startTransform = new ammo.btTransform();

      _disposables.add(disposableAmmo(ammo, startTransform));

      startTransform.setIdentity();

      const npcMotionState = new ammo.btDefaultMotionState(startTransform);

      _disposables.add(disposableAmmo(ammo, npcMotionState));

      const rbInfo = new ammo.btRigidBodyConstructionInfo(NPC_MASS, npcMotionState, npcShape, npcLocalInertia);

      _disposables.add(disposableAmmo(ammo, rbInfo));

      _npcRigidBody = new ammo.btRigidBody(rbInfo);

      _disposables.add(disposableAmmo(ammo, _npcRigidBody));

      // Disable character rotation.
      const angularFactor = new ammo.btVector3(0, 0, 0);

      _disposables.add(disposableAmmo(ammo, angularFactor));

      _npcRigidBody.setAngularFactor(angularFactor);

      // User index could be a pointer when using cpp version of bullet, but
      // may as well be just an integer index otherwise.
      _npcRigidBody.setUserIndex(_userDataHandle.userIndex);

      const origin = _npcRigidBody.getWorldTransform().getOrigin();

      origin.setX(entity.origin.x);
      origin.setY(entity.origin.y);
      origin.setZ(entity.origin.z);

      const rotation = _npcRigidBody.getWorldTransform().getRotation();

      rotation.setX(1);
      rotation.setY(0);
      rotation.setZ(0);
      rotation.setW(1);

      _onPreloaded();
    },
  });

  function _onPreloaded(): void {
    simulantFeedbackMessagePort.postMessage({
      preloaded: <MessageFeedbackSimulantPreloaded<SimulantsLookup, "npc">>{
        id: id,
        simulant: "npc",
      },
    });

    state.isPreloading = false;
    state.isPreloaded = true;
  }

  function dispose(): void {
    state.isDisposed = true;

    disposeAll(_disposables);
    simulantFeedbackMessagePort.close();
    userDataRegistry.disposeHandleById(id);
  }

  function mount(): void {
    state.isMounted = true;

    if (!_npcRigidBody) {
      throw new Error("Rigid body is not ready and simulant can't be mounted.");
    }

    _npcRigidBody.activate();
    dynamicsWorld.addRigidBody(_npcRigidBody);
  }

  function pause(): void {
    state.isPaused = true;
  }

  function preload(): void {
    state.isPreloading = true;

    simulantFeedbackMessagePort.onmessage = _simulantFeedbackMessageRouter;
  }

  function unmount(): void {
    state.isMounted = false;

    if (!_npcRigidBody) {
      throw new Error("Rigid body is not ready and simulant can't be unmounted.");
    }

    dynamicsWorld.removeRigidBody(_npcRigidBody);
  }

  function unpause(): void {
    state.isPaused = false;
  }

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    if (!_npcRigidBody) {
      throw new Error("Rigid body is not ready but simulant was updated.");
    }

    _npcRigidBody.getMotionState().getWorldTransform(_transform);
    _transformOrigin = _transform.getOrigin();

    simulantFeedbackMessagePort.postMessage({
      origin: {
        x: _transformOrigin.x(),
        y: _transformOrigin.y(),
        z: _transformOrigin.z(),
      },
    });
  }

  return Object.freeze({
    id: id,
    isDisposable: true,
    isMountable: true,
    isPreloadable: true,
    isSimulant: true,
    name: "NPCSimulant",
    state: state,

    dispose: dispose,
    mount: mount,
    pause: pause,
    preload: preload,
    unmount: unmount,
    unpause: unpause,
    update: update,
  });
}
